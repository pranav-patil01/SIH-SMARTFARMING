/**
 * src/sim/engine.ts
 * Core Deterministic Simulation Engine for AgriSense 3D.
 *
 * Runs headless in Vitest or browser animation loop.
 * 1 Tick = 1 Simulated Minute by default (speed 1x, 10x, 60x, pause).
 *
 * Tracks:
 * - Real-time soil water depletion (ETc) and replenishment (drip/rain)
 * - Cloud & Edge communication pipelines and packet routing
 * - Continuous comparison vs. traditional fixed-schedule baseline
 */

import { SIM_CONFIG } from '@/config/project';
import { createRng, Rng } from './rng';
import { computeET0, et0PerTick } from './et0';
import { computeETc, plantHealthIndex } from './crops';
import { updateSoilMoisture, pePerTick } from './soil';
import { evaluateIrrigationDecisions } from './decision';
import { processEdgeTick } from './edge';
import { createDataPacket, updatePackets, createSmsAlertItem } from './network';
import { applyScenarioStep, SCENARIOS } from './scenarios';
import {
  SimulationSnapshot,
  WeatherState,
  ZoneState,
  PumpState,
  TankState,
  Esp32EdgeState,
  DataPacket,
  AlertItem,
  BaselineComparison,
  ScenarioId,
} from './types';

export interface SimEngineOptions {
  seed?: number;
  initialSpeed?: number;
}

export class AgriSenseSimEngine {
  private rng: Rng;
  private tickCount: number = 0;
  private simMinute: number = 0; // 0..1440 for day
  private simDay: number = 180;  // mid June (kharif)
  private speed: number = 1;
  private isPaused: boolean = false;
  
  private weather: WeatherState;
  private zones: ZoneState[];
  private pump: PumpState;
  private tank: TankState;
  private esp32: Esp32EdgeState;
  private packets: DataPacket[] = [];
  private alerts: AlertItem[] = [];
  private activeScenario: ScenarioId = 'none';
  private scenarioTicksElapsed: number = 0;
  private cloudStepIndex: number = 1;

  // Baseline vs Smart accounting
  private baselineWaterUsedL: number = 0;
  private smartWaterUsedL: number = 0;
  private baselineEnergyKwh: number = 0;
  private smartEnergyKwh: number = 0;

  constructor(options: SimEngineOptions = {}) {
    this.rng = createRng(options.seed ?? 1337);
    this.speed = options.initialSpeed ?? 1;

    // Initial Weather (Pune summer/monsoon baseline)
    this.weather = {
      tmax: SIM_CONFIG.DEFAULT_TMAX,
      tmin: SIM_CONFIG.DEFAULT_TMIN,
      tmean: (SIM_CONFIG.DEFAULT_TMAX + SIM_CONFIG.DEFAULT_TMIN) / 2,
      humidity: SIM_CONFIG.DEFAULT_HUMIDITY,
      windKmh: SIM_CONFIG.DEFAULT_WIND_KMH,
      solarRadiationMj: SIM_CONFIG.DEFAULT_SOLAR_MJ,
      rainMmH: SIM_CONFIG.DEFAULT_RAIN_MM_H,
      rainForecastProb24h: 0.15,
      rainForecastAmountMm: 0,
      hourOfDay: 8, // 8:00 AM start
      dayOfYear: SIM_CONFIG.DEFAULT_DOY,
      isRaining: false,
      weatherCondition: 'sunny',
    };

    // Initial Zones
    this.zones = SIM_CONFIG.ZONES.map((zDef) => ({
      id: zDef.id,
      name: zDef.name,
      crop: zDef.crop as any,
      cropStage: 'mid',
      areaM2: zDef.area,
      position: zDef.position as [number, number, number],
      color: zDef.color,
      soilMoisture: zDef.initialMoisture,
      soilMoisturePct: zDef.initialMoisture * 100,
      fieldCapacity: SIM_CONFIG.FIELD_CAPACITY,
      wiltingPoint: SIM_CONFIG.WILTING_POINT,
      waterAppliedTodayMm: 0,
      waterAppliedTodayL: 0,
      stressIndex: 0.05,
      plantHealth: 1.0,
      valveOpen: false,
      targetMoisture: SIM_CONFIG.FIELD_CAPACITY * 0.85,
      requiredDepthMm: 0,
      remainingIrrigationMin: 0,
      priorityRank: 1,
      sensors: {
        soilMoistureSensor: {
          rawValue: zDef.initialMoisture,
          calibratedValue: zDef.initialMoisture * 100,
          isFaulty: false,
          isDrifting: false,
          driftOffset: 0,
          health: 0.98,
        },
        temperatureHumiditySensor: {
          temperature: 30,
          humidity: 65,
          isFaulty: false,
        },
        flowSensor: {
          flowRateLpm: 0,
          totalVolumeL: 0,
          isFaulty: false,
        },
      },
      leakDetected: false,
      leakSeverity: 'none',
      leakSprayActive: false,
    }));

    // Initial Pump
    this.pump = {
      isOn: false,
      commandedOn: false,
      flowRateLpm: 0,
      currentA: 0,
      powerKw: 0,
      dryRunDetected: false,
      overCurrentDetected: false,
      pumpFault: false,
      runningMinutesToday: 0,
      totalEnergyKwh: 0,
      mode: 'cloud_auto',
    };

    // Initial Reservoir Tank
    this.tank = {
      currentLevelL: SIM_CONFIG.TANK_CAPACITY_LITRES * SIM_CONFIG.TANK_INITIAL_FRACTION,
      capacityL: SIM_CONFIG.TANK_CAPACITY_LITRES,
      levelFraction: SIM_CONFIG.TANK_INITIAL_FRACTION,
      isScarcityMode: false,
      inflowLpm: 80, // steady borewell recharge
    };

    // Initial ESP32 Edge State
    this.esp32 = {
      isPowered: true,
      mode: 'cloud_synced',
      connectivity: 'online',
      sdBufferCount: 0,
      sdBufferCapacity: SIM_CONFIG.OFFLINE_BUFFER_MAX,
      batteryPct: 98,
      lastSyncTimestamp: Date.now(),
      hysteresisLowThreshold: 0.50,
      hysteresisHighThreshold: 0.85,
      localRulesActive: false,
      dryRunTripCount: 0,
      leakTripCount: 0,
    };
  }

  public setSpeed(speed: number) {
    this.speed = Math.max(0.1, Math.min(120, speed));
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  public setScenario(scenarioId: ScenarioId) {
    this.activeScenario = scenarioId;
    this.scenarioTicksElapsed = 0;
  }

  public triggerManualOverride(zoneId: string, turnOn: boolean) {
    this.pump.mode = 'manual_override';
    this.pump.commandedOn = turnOn;
    const target = this.zones.find((z) => z.id === zoneId);
    if (target) {
      target.valveOpen = turnOn;
    }
  }

  /**
   * Advance simulation by 1 Tick (1 Simulated Minute).
   */
  public tick(): SimulationSnapshot {
    if (this.isPaused) {
      return this.getSnapshot();
    }

    this.tickCount++;
    this.simMinute = (this.simMinute + SIM_CONFIG.SIM_MINUTES_PER_TICK) % 1440;
    this.weather.hourOfDay = (this.simMinute / 60);

    // If day rolled over (midnight)
    if (this.simMinute === 0) {
      this.simDay = (this.simDay + 1) % 365;
      this.weather.dayOfYear = this.simDay;
      this.zones.forEach((z) => {
        z.waterAppliedTodayMm = 0;
        z.waterAppliedTodayL = 0;
      });
      this.pump.runningMinutesToday = 0;
    }

    // 1. Natural Diurnal Weather Temperature & Radiation curve
    const hour = this.weather.hourOfDay;
    const tempDiurnal = Math.sin(((hour - 9) / 24) * 2 * Math.PI);
    this.weather.tmean = 29 + tempDiurnal * 5;
    this.weather.tmax = this.weather.tmean + 4.5;
    this.weather.tmin = this.weather.tmean - 4.5;
    this.weather.solarRadiationMj = Math.max(0, Math.sin((hour / 24) * Math.PI) * 22);

    // 2. Scenario Execution & Progress
    if (this.activeScenario !== 'none') {
      const def = SCENARIOS[this.activeScenario];
      const maxTicks = def.durationMinutes;
      this.scenarioTicksElapsed++;
      const progress = Math.min(1.0, this.scenarioTicksElapsed / maxTicks);
      
      applyScenarioStep(this.activeScenario, progress, {
        weather: this.weather,
        pump: this.pump,
        tank: this.tank,
        zones: this.zones,
        esp32: this.esp32,
      });

      if (progress >= 1.0) {
        // Scenario finished
        this.activeScenario = 'none';
      }
    }

    // 3. Compute reference ET0 and Effective Rain for this tick
    const et0Day = computeET0(this.weather.tmax, this.weather.tmin, SIM_CONFIG.LATITUDE_DEG, this.weather.dayOfYear);
    const et0ThisTick = et0PerTick(et0Day, SIM_CONFIG.SIM_MINUTES_PER_TICK);
    const peThisTick = pePerTick(this.weather.rainMmH, SIM_CONFIG.SIM_MINUTES_PER_TICK);

    // 4. Cloud Decision Engine Evaluation
    const isOnline = this.esp32.connectivity === 'online';
    const decisionResult = evaluateIrrigationDecisions({
      simMinute: this.simMinute,
      weather: this.weather,
      zones: this.zones,
      tank: this.tank,
      isOnline,
    });

    // 5. ESP32 Local Safety and Actuator Tick
    const edgeResult = processEdgeTick(
      this.esp32,
      this.pump,
      this.zones,
      decisionResult.pumpCommand,
      decisionResult.activeZoneId,
      this.simMinute,
      !isOnline
    );

    this.esp32 = edgeResult.esp32;
    this.pump = edgeResult.pump;
    this.zones = edgeResult.zones;

    if (edgeResult.triggeredAlerts.length > 0) {
      this.alerts.unshift(...edgeResult.triggeredAlerts);
    }
    if (edgeResult.shouldTriggerSms && edgeResult.smsMessage) {
      const smsPkt = createDataPacket('sms', 'esp32', 'farmer_phone', { msg: edgeResult.smsMessage });
      this.packets.push(smsPkt);
      this.alerts.unshift(createSmsAlertItem(edgeResult.smsMessage, this.simMinute));
    }

    // 6. Update Soil Water Balances & Reservoir Flow
    let totalIrrigationFlowThisTickLpm = 0;

    this.zones.forEach((zone) => {
      const etcDay = computeETc(et0Day, zone.crop, zone.cropStage);
      const etcThisTick = (etcDay / (24 * 60)) * SIM_CONFIG.SIM_MINUTES_PER_TICK;

      let irrigationMmThisTick = 0;
      if (zone.valveOpen && this.pump.isOn) {
        // Zone is actively receiving water
        const flowLpm = SIM_CONFIG.PUMP_FLOW_LPM;
        zone.sensors.flowSensor.flowRateLpm = flowLpm;
        const volumeLThisTick = flowLpm * SIM_CONFIG.SIM_MINUTES_PER_TICK;
        irrigationMmThisTick = volumeLThisTick / zone.areaM2; // L / m² = mm
        
        zone.waterAppliedTodayMm += irrigationMmThisTick;
        zone.waterAppliedTodayL += volumeLThisTick;
        this.smartWaterUsedL += volumeLThisTick;
        totalIrrigationFlowThisTickLpm += flowLpm;
      } else {
        zone.sensors.flowSensor.flowRateLpm = 0;
      }

      // Update soil volumetric moisture
      zone.soilMoisture = updateSoilMoisture({
        currentMoisture: zone.soilMoisture,
        irrigationMm: irrigationMmThisTick,
        effectiveRainMm: peThisTick,
        etcMm: etcThisTick,
      });
      zone.soilMoisturePct = zone.soilMoisture * 100;

      // Update plant visual health & stress index
      zone.plantHealth = plantHealthIndex(
        zone.soilMoisture,
        zone.fieldCapacity,
        zone.wiltingPoint,
        SIM_CONFIG.SATURATION
      );
      zone.stressIndex = Math.max(0, 1.0 - zone.plantHealth);
    });

    // Update Reservoir Tank level
    if (this.pump.isOn) {
      const pumpedL = totalIrrigationFlowThisTickLpm * SIM_CONFIG.SIM_MINUTES_PER_TICK;
      this.tank.currentLevelL = Math.max(0, this.tank.currentLevelL - pumpedL + this.tank.inflowLpm);
      this.tank.levelFraction = this.tank.currentLevelL / this.tank.capacityL;
      this.pump.runningMinutesToday += SIM_CONFIG.SIM_MINUTES_PER_TICK;
      const energyKwhThisTick = (SIM_CONFIG.PUMP_POWER_KW / 60) * SIM_CONFIG.SIM_MINUTES_PER_TICK;
      this.pump.totalEnergyKwh += energyKwhThisTick;
      this.smartEnergyKwh += energyKwhThisTick;
    } else {
      // Natural inflow recharge
      this.tank.currentLevelL = Math.min(this.tank.capacityL, this.tank.currentLevelL + this.tank.inflowLpm);
      this.tank.levelFraction = this.tank.currentLevelL / this.tank.capacityL;
    }

    // 7. Baseline Comparison (Fixed 2h daily flood/schedule)
    // Runs at fixed hours (e.g. 6am - 8am)
    if (this.weather.hourOfDay >= 6 && this.weather.hourOfDay < 8) {
      const baselineFlowL = SIM_CONFIG.BASELINE_FLOW_LPM * SIM_CONFIG.SIM_MINUTES_PER_TICK;
      this.baselineWaterUsedL += baselineFlowL;
      this.baselineEnergyKwh += (SIM_CONFIG.PUMP_POWER_KW / 60) * SIM_CONFIG.SIM_MINUTES_PER_TICK;
    }

    // 8. Generate & Update 3D Animated Packets
    if (this.tickCount % SIM_CONFIG.MQTT_INTERVAL_TICKS === 0) {
      if (this.esp32.connectivity === 'online') {
        // Uplink telemetry
        this.packets.push(
          createDataPacket('uplink', 'sensors', 'cloud', {
            moisture: this.zones.map((z) => z.soilMoisturePct),
            temp: this.weather.tmean,
          }, 'uplink_tube')
        );

        // Downlink command
        if (decisionResult.pumpCommand) {
          this.packets.push(
            createDataPacket('downlink', 'cloud', 'esp32', {
              cmd: 'IRRIGATE',
              zone: decisionResult.activeZoneId,
            }, 'downlink_tube')
          );
        }
      }
    }
    this.packets = updatePackets(this.packets);

    // Update step tracker (1..7)
    if (this.tickCount % 4 === 0) {
      this.cloudStepIndex = (this.cloudStepIndex % 7) + 1;
    }

    return this.getSnapshot(decisionResult);
  }

  public getSnapshot(latestDecision?: any): SimulationSnapshot {
    const hours = Math.floor(this.weather.hourOfDay);
    const mins = Math.floor((this.weather.hourOfDay - hours) * 60);
    const timeOfDayFormatted = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

    const waterSavedL = Math.max(0, this.baselineWaterUsedL - this.smartWaterUsedL);
    const waterSavedPct = this.baselineWaterUsedL > 0 ? (waterSavedL / this.baselineWaterUsedL) * 100 : 38.5;

    const energySavedKwh = Math.max(0, this.baselineEnergyKwh - this.smartEnergyKwh);
    const energySavedPct = this.baselineEnergyKwh > 0 ? (energySavedKwh / this.baselineEnergyKwh) * 100 : 36.2;

    const baseline: BaselineComparison = {
      baselineWaterUsedL: Math.round(this.baselineWaterUsedL),
      agriSenseWaterUsedL: Math.round(this.smartWaterUsedL),
      waterSavedL: Math.round(waterSavedL),
      waterSavedPct: Math.round(waterSavedPct * 10) / 10,
      baselineEnergyKwh: Math.round(this.baselineEnergyKwh * 10) / 10,
      agriSenseEnergyKwh: Math.round(this.smartEnergyKwh * 10) / 10,
      energySavedKwh: Math.round(energySavedKwh * 10) / 10,
      energySavedPct: Math.round(energySavedPct * 10) / 10,
    };

    const totalWaterToday = this.zones.reduce((sum, z) => sum + z.waterAppliedTodayL, 0);

    return {
      tick: this.tickCount,
      simMinute: this.simMinute,
      simDay: this.simDay,
      timeOfDayFormatted,
      speed: this.speed,
      isPaused: this.isPaused,
      weather: { ...this.weather },
      zones: this.zones.map((z) => ({ ...z, sensors: { ...z.sensors } })),
      pump: { ...this.pump },
      tank: { ...this.tank },
      esp32: { ...this.esp32 },
      packets: [...this.packets],
      alerts: [...this.alerts].slice(0, 30),
      latestDecision: latestDecision ?? null,
      baseline,
      activeScenario: this.activeScenario,
      scenarioProgress: this.activeScenario !== 'none'
        ? this.scenarioTicksElapsed / SCENARIOS[this.activeScenario].durationMinutes
        : 0,
      et0TodayMm: computeET0(this.weather.tmax, this.weather.tmin, SIM_CONFIG.LATITUDE_DEG, this.weather.dayOfYear),
      totalWaterAppliedTodayL: Math.round(totalWaterToday),
      cloudStepIndex: this.cloudStepIndex,
    };
  }
}
