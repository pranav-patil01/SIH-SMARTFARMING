/**
 * src/sim/types.ts
 * Core type definitions across the AgriSense 3D Simulation
 */

import { CropType, CropStage } from './crops';

export type ConnectivityMode = 'online' | 'degraded' | 'offline';

export interface WeatherState {
  tmax: number;            // °C
  tmin: number;            // °C
  tmean: number;           // °C
  humidity: number;        // %
  windKmh: number;         // km/h
  solarRadiationMj: number;// MJ/m²/day
  rainMmH: number;         // mm/h active precipitation
  rainForecastProb24h: number; // 0..1 probability of rain in 24h
  rainForecastAmountMm: number;// mm expected in 24h
  hourOfDay: number;       // 0..24
  dayOfYear: number;       // 1..365
  isRaining: boolean;
  weatherCondition: 'sunny' | 'cloudy' | 'rainy' | 'heatwave' | 'storm';
}

export interface ZoneSensorState {
  soilMoistureSensor: {
    rawValue: number;     // 0..1 (volumetric or scaled mV)
    calibratedValue: number; // % moisture
    isFaulty: boolean;
    isDrifting: boolean;
    driftOffset: number;
    health: number;       // 0..1
  };
  temperatureHumiditySensor: {
    temperature: number;  // °C
    humidity: number;     // %
    isFaulty: boolean;
  };
  flowSensor: {
    flowRateLpm: number;  // L/min
    totalVolumeL: number; // cumulative Litres
    isFaulty: boolean;
  };
}

export interface ZoneState {
  id: string;
  name: string;
  crop: CropType;
  cropStage: CropStage;
  areaM2: number;
  position: [number, number, number];
  color: string;

  // Water & Soil state
  soilMoisture: number;         // actual volumetric fraction (e.g. 0.28)
  soilMoisturePct: number;      // 0..100%
  fieldCapacity: number;        // e.g. 0.35
  wiltingPoint: number;         // e.g. 0.10
  waterAppliedTodayMm: number;  // mm
  waterAppliedTodayL: number;   // Litres
  stressIndex: number;          // 0 (healthy) .. 1 (wilted)
  plantHealth: number;          // 0..1 (1.2 = overwatered)
  
  // Actuator & Valve
  valveOpen: boolean;
  targetMoisture: number;
  requiredDepthMm: number;
  remainingIrrigationMin: number;
  priorityRank: number;         // 1 (highest) .. N (for scarcity mode)

  // Physical/Sensors
  sensors: ZoneSensorState;
  
  // Diagnostics
  leakDetected: boolean;
  leakSeverity: 'none' | 'minor' | 'severe';
  leakSprayActive: boolean;
}

export interface PumpState {
  isOn: boolean;
  commandedOn: boolean;
  flowRateLpm: number;
  currentA: number;             // Amperes
  powerKw: number;              // kW
  dryRunDetected: boolean;
  overCurrentDetected: boolean;
  pumpFault: boolean;
  runningMinutesToday: number;
  totalEnergyKwh: number;
  mode: 'cloud_auto' | 'local_edge' | 'manual_override' | 'emergency_stop';
}

export interface TankState {
  currentLevelL: number;        // Litres
  capacityL: number;            // Litres (e.g. 50,000)
  levelFraction: number;        // 0..1
  isScarcityMode: boolean;
  inflowLpm: number;            // replenish from borewell/source
}

export interface Esp32EdgeState {
  isPowered: boolean;
  mode: 'cloud_synced' | 'local_fallback';
  connectivity: ConnectivityMode;
  sdBufferCount: number;        // number of telemetry frames queued offline
  sdBufferCapacity: number;
  batteryPct: number;           // % battery backup
  lastSyncTimestamp: number;
  hysteresisLowThreshold: number;  // trigger on if moisture < this
  hysteresisHighThreshold: number; // trigger off if moisture > this
  localRulesActive: boolean;
  dryRunTripCount: number;
  leakTripCount: number;
}

export interface DataPacket {
  id: string;
  type: 'uplink' | 'downlink' | 'alert' | 'sms' | 'feedback';
  color: string;
  source: 'sensors' | 'esp32' | 'cloud' | 'farmer_phone';
  target: 'esp32' | 'cloud' | 'pump' | 'farmer_phone';
  payload: Record<string, any>;
  progress: number;            // 0..1 along path
  speed: number;
  pathId: string;              // spline or path identifier
  active: boolean;
}

export interface AlertItem {
  id: string;
  timestamp: string;
  simMinute: number;
  type: 'info' | 'warning' | 'critical' | 'sms' | 'scarcity';
  category: 'dry_run' | 'leak' | 'pump_fault' | 'sensor_drift' | 'offline' | 'rain_skip' | 'scarcity' | 'schedule';
  title: string;
  message: string;
  zoneId?: string;
  acknowledged: boolean;
}

export interface DecisionResult {
  timestamp: number;
  simMinute: number;
  zoneDecisions: {
    zoneId: string;
    shouldIrrigate: boolean;
    reason: string;
    requiredDepthMm: number;
    estimatedDurationMin: number;
    et0Mm: number;
    etcMm: number;
    effectiveRainMm: number;
    deficitMm: number;
    rainForecastProb: number;
    scarcityPriority: number;
    mlConfidence: number;
    whyBullets: string[];
  }[];
  pumpCommand: boolean;
  activeZoneId: string | null;
  overallReason: string;
}

export interface BaselineComparison {
  baselineWaterUsedL: number;   // Traditional fixed schedule
  agriSenseWaterUsedL: number;  // Smart ET0 + ML schedule
  waterSavedL: number;
  waterSavedPct: number;
  
  baselineEnergyKwh: number;
  agriSenseEnergyKwh: number;
  energySavedKwh: number;
  energySavedPct: number;
}

export type ScenarioId = 
  | 'none'
  | 'heatwave'
  | 'rain_forecast'
  | 'pipe_leak'
  | 'pump_dry_run'
  | 'internet_outage'
  | 'water_scarcity'
  | 'sensor_drift'
  | 'manual_override';

export interface ScenarioDefinition {
  id: ScenarioId;
  name: string;
  description: string;
  expectedOutcome: string;
  durationMinutes: number;
}

export interface SimulationSnapshot {
  tick: number;
  simMinute: number;
  simDay: number;
  timeOfDayFormatted: string;
  speed: number;
  isPaused: boolean;
  
  weather: WeatherState;
  zones: ZoneState[];
  pump: PumpState;
  tank: TankState;
  esp32: Esp32EdgeState;
  packets: DataPacket[];
  alerts: AlertItem[];
  latestDecision: DecisionResult | null;
  baseline: BaselineComparison;
  activeScenario: ScenarioId;
  scenarioProgress: number; // 0..1
  
  // High level metrics
  et0TodayMm: number;
  totalWaterAppliedTodayL: number;
  cloudStepIndex: number; // 1..7 for the data/control flow step tracker
}
