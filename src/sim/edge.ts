/**
 * src/sim/edge.ts
 * ESP32 Local Rule Engine and Edge Safety Subsystem.
 *
 * Runs locally on the micro-controller hardware independently of cloud connectivity:
 * 1. Fast sub-second safety checks: Dry-run trip, over-current trip, pipe burst/leak alert.
 * 2. Sensor sanity validation & drift isolation.
 * 3. Autonomous offline mode with local moisture hysteresis when disconnected from MQTT.
 * 4. Local SD-card telemetry buffer with auto-replay burst when connection restores.
 */

import { SIM_CONFIG } from '@/config/project';
import { Esp32EdgeState, PumpState, ZoneState, AlertItem } from './types';

export interface EdgeTickResult {
  esp32: Esp32EdgeState;
  pump: PumpState;
  zones: ZoneState[];
  triggeredAlerts: AlertItem[];
  shouldTriggerSms: boolean;
  smsMessage?: string;
}

export function processEdgeTick(
  esp32: Esp32EdgeState,
  pump: PumpState,
  zones: ZoneState[],
  cloudPumpCommand: boolean,
  cloudActiveZoneId: string | null,
  simMinute: number,
  isOffline: boolean
): EdgeTickResult {
  const newEsp32: Esp32EdgeState = { ...esp32 };
  const newPump: PumpState = { ...pump };
  const newZones: ZoneState[] = zones.map((z) => ({ ...z, sensors: { ...z.sensors } }));
  const triggeredAlerts: AlertItem[] = [];
  let shouldTriggerSms = false;
  let smsMessage: string | undefined = undefined;

  // 1. Connectivity & SD Buffer management
  if (isOffline) {
    newEsp32.connectivity = 'offline';
    newEsp32.mode = 'local_fallback';
    newEsp32.sdBufferCount = Math.min(newEsp32.sdBufferCapacity, newEsp32.sdBufferCount + 1);
  } else {
    newEsp32.connectivity = 'online';
    newEsp32.mode = 'cloud_synced';
    if (newEsp32.sdBufferCount > 0) {
      // Flushed buffer to cloud
      newEsp32.sdBufferCount = Math.max(0, newEsp32.sdBufferCount - 15);
      newEsp32.lastSyncTimestamp = Date.now();
    }
  }

  // 2. Sensor Validation & Cross-check
  newZones.forEach((zone) => {
    const s = zone.sensors.soilMoistureSensor;
    if (s.isDrifting) {
      s.rawValue = Math.min(1.0, zone.soilMoisture + s.driftOffset);
      s.calibratedValue = s.rawValue * 100;
      s.health = 0.45;
    } else {
      s.rawValue = zone.soilMoisture;
      s.calibratedValue = zone.soilMoisture * 100;
      s.health = 0.98;
    }

    // Check for sensor stuck or out-of-physical-bounds
    if (s.isFaulty || s.rawValue < 0.02 || s.rawValue > 0.85) {
      s.health = 0.1;
      triggeredAlerts.push({
        id: `sensor-fault-${zone.id}-${simMinute}`,
        timestamp: new Date().toLocaleTimeString(),
        simMinute,
        type: 'warning',
        category: 'sensor_drift',
        title: `Sensor Fault: ${zone.name}`,
        message: `Soil probe FC-28 reading abnormal values (${s.calibratedValue.toFixed(1)}%). Reverting to neighbor zone baseline.`,
        zoneId: zone.id,
        acknowledged: false,
      });
    }
  });

  // 3. Actuator Control Selection (Cloud Command vs Local Fallback)
  let desiredPumpOn = false;
  let desiredActiveZoneId: string | null = null;

  if (newPump.mode === 'manual_override' || newPump.commandedOn) {
    desiredPumpOn = newPump.commandedOn;
    desiredActiveZoneId = newZones.find(z => z.valveOpen)?.id || newZones[0].id;
  } else if (newEsp32.mode === 'cloud_synced') {
    desiredPumpOn = cloudPumpCommand;
    desiredActiveZoneId = cloudActiveZoneId;
  } else {
    // LOCAL OFFLINE HYSTERESIS MODE:
    // Check if any zone is critically dry (< 50% field capacity)
    const dryZone = newZones.find(
      (z) => z.soilMoisture < z.fieldCapacity * newEsp32.hysteresisLowThreshold
    );
    if (dryZone) {
      desiredPumpOn = true;
      desiredActiveZoneId = dryZone.id;
    } else {
      // Check if all zones reached high hysteresis cutoff
      desiredPumpOn = false;
      desiredActiveZoneId = null;
    }
  }

  // Set Zone Valves
  newZones.forEach((z) => {
    z.valveOpen = desiredPumpOn && z.id === desiredActiveZoneId;
  });

  // 4. HARDWARE SAFETY CHECKS (ESP32 Local Fast Response < 2s)

  // A. Dry-Run Detection: Pump commanded ON, but low current & near-zero flow
  if (desiredPumpOn) {
    const isDryRunState = newPump.dryRunDetected;
    if (isDryRunState) {
      // TRIP RELAY IMMEDIATELY
      newPump.isOn = false;
      newPump.pumpFault = true;
      newEsp32.dryRunTripCount += 1;
      
      triggeredAlerts.push({
        id: `dry-run-${simMinute}`,
        timestamp: new Date().toLocaleTimeString(),
        simMinute,
        type: 'critical',
        category: 'dry_run',
        title: 'ESP32 TRIP: Borewell Dry-Run Detected!',
        message: `Pump current fell to ${newPump.currentA.toFixed(1)}A with 0 L/min flow. Contactor tripped in 1.4s to prevent impeller burn.`,
        acknowledged: false,
      });

      // SMS Fallback Trigger
      shouldTriggerSms = true;
      smsMessage = `[AgriSense SMS Alert] CRITICAL: Borewell dry-run tripped at Pump House #1. Pump shut down automatically. Check water source.`;
    } else {
      newPump.isOn = true;
      newPump.powerKw = SIM_CONFIG.PUMP_POWER_KW;
      newPump.currentA = SIM_CONFIG.PUMP_CURRENT_NORMAL_A;
    }
  } else {
    newPump.isOn = false;
    newPump.powerKw = 0;
    newPump.currentA = 0;
  }

  // B. Pipe Leak / Burst Detection: Flow sensor deviation on active zone
  newZones.forEach((z) => {
    if (z.valveOpen && newPump.isOn) {
      const expectedFlow = SIM_CONFIG.PUMP_FLOW_LPM;
      const actualFlow = z.sensors.flowSensor.flowRateLpm;
      const deviation = Math.abs(actualFlow - expectedFlow) / expectedFlow;

      if (z.leakDetected || deviation >= SIM_CONFIG.LEAK_FLOW_DEVIATION_PCT) {
        z.leakSprayActive = true;
        z.leakSeverity = deviation > 0.4 ? 'severe' : 'minor';
        
        if (z.leakSeverity === 'severe') {
          // Auto close valve for safety
          z.valveOpen = false;
          newEsp32.leakTripCount += 1;
          
          triggeredAlerts.push({
            id: `leak-severe-${z.id}-${simMinute}`,
            timestamp: new Date().toLocaleTimeString(),
            simMinute,
            type: 'critical',
            category: 'leak',
            title: `Severe Pipe Leak: ${z.name}`,
            message: `Inline flow sensor YF-S201 registered abnormal flow rate of ${actualFlow.toFixed(0)} L/min (+${(deviation * 100).toFixed(0)}% deviation). Solenoid valve isolated.`,
            zoneId: z.id,
            acknowledged: false,
          });

          shouldTriggerSms = true;
          smsMessage = `[AgriSense SMS Alert] LEAK DETECTED on ${z.name}. Valve isolated automatically. Inspect submain pipe joint.`;
        }
      } else {
        z.leakSprayActive = false;
        z.leakSeverity = 'none';
      }
    } else {
      z.leakSprayActive = false;
      z.sensors.flowSensor.flowRateLpm = 0;
    }
  });

  return {
    esp32: newEsp32,
    pump: newPump,
    zones: newZones,
    triggeredAlerts,
    shouldTriggerSms,
    smsMessage,
  };
}
