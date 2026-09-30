/**
 * src/sim/scenarios.ts
 * Scripted interactive edge cases & "What if...?" scenarios for AgriSense.
 *
 * Each scenario modifies simulation state deterministically to showcase
 * specific engineering capabilities (ET0 surge, rain postponement, dry-run trip,
 * pipe burst isolation, edge offline hysteresis, scarcity ranking, sensor drift).
 */

import { ScenarioDefinition, ScenarioId, SimulationSnapshot, WeatherState, PumpState, TankState, ZoneState, Esp32EdgeState } from './types';

export const SCENARIOS: Record<ScenarioId, ScenarioDefinition> = {
  none: {
    id: 'none',
    name: 'Normal Smart Irrigation',
    description: 'Autonomous ET₀ × Kc irrigation schedule with active sensor feedback loop.',
    expectedOutcome: 'Optimal soil moisture maintenance with dynamic energy & water conservation.',
    durationMinutes: 60,
  },
  heatwave: {
    id: 'heatwave',
    name: '1. Heatwave & Dry Spell',
    description: 'Ambient temperature spikes to 42°C with low humidity. ET₀ surges.',
    expectedOutcome: 'AI detects rapid soil depletion and schedules compensating irrigation cycles.',
    durationMinutes: 45,
  },
  rain_forecast: {
    id: 'rain_forecast',
    name: '2. Predictive Rain Conservation',
    description: 'Weather service forecasts 85% probability of 18mm monsoon rain in next 6 hours.',
    expectedOutcome: 'Cloud decision engine pauses scheduled irrigation, saving ~12,000 Litres of groundwater.',
    durationMinutes: 45,
  },
  pipe_leak: {
    id: 'pipe_leak',
    name: '3. Submain Pipe Burst / Leak',
    description: 'Physical rupture occurs on Zone 2 drip lateral pipe during active irrigation.',
    expectedOutcome: 'Inline flow sensor (YF-S201) registers +48% deviation. ESP32 isolates zone valve and notifies farmer.',
    durationMinutes: 30,
  },
  pump_dry_run: {
    id: 'pump_dry_run',
    name: '4. Borewell Dry-Run Protection',
    description: 'Water table dips below suction intake. Impeller spins in air, current drops to 2.8A.',
    expectedOutcome: 'ACS712 current sensor trips relay in 1.4s, preventing motor coil burnout. Critical SMS sent.',
    durationMinutes: 30,
  },
  internet_outage: {
    id: 'internet_outage',
    name: '5. Cellular & Cloud Outage',
    description: 'MQTT link severed. Cloud dashboard disconnected from field unit.',
    expectedOutcome: 'ESP32 activates local hysteresis rules, queues telemetry on SD card, and auto-syncs on reconnect.',
    durationMinutes: 45,
  },
  water_scarcity: {
    id: 'water_scarcity',
    name: '6. Water Scarcity Prioritisation',
    description: 'Farm reservoir level drops to 12% capacity during peak drought.',
    expectedOutcome: 'System ranks crops by drought sensitivity and channels remaining water to top priority zone.',
    durationMinutes: 40,
  },
  sensor_drift: {
    id: 'sensor_drift',
    name: '7. Soil Moisture Sensor Drift',
    description: 'Corrosion causes FC-28 sensor on Zone 3 to output false 85% saturation.',
    expectedOutcome: 'Anomaly detector cross-checks ETc vs soil reading, flags sensor fault, and alerts farmer.',
    durationMinutes: 35,
  },
  manual_override: {
    id: 'manual_override',
    name: '8. Mobile App Manual Override',
    description: 'Farmer manually forces Zone 1 valve ON from the mobile application.',
    expectedOutcome: 'Local edge hardware allows manual watering while maintaining active dry-run safety monitoring.',
    durationMinutes: 30,
  },
};

export function applyScenarioStep(
  scenarioId: ScenarioId,
  progress: number, // 0..1
  state: {
    weather: WeatherState;
    pump: PumpState;
    tank: TankState;
    zones: ZoneState[];
    esp32: Esp32EdgeState;
  }
) {
  switch (scenarioId) {
    case 'heatwave': {
      state.weather.tmax = 42;
      state.weather.tmin = 29;
      state.weather.tmean = 35.5;
      state.weather.humidity = 28;
      state.weather.solarRadiationMj = 26;
      state.weather.weatherCondition = 'heatwave';
      // Accelerated drying
      state.zones.forEach((z) => {
        z.soilMoisture = Math.max(z.wiltingPoint + 0.02, z.soilMoisture - 0.001);
      });
      break;
    }

    case 'rain_forecast': {
      state.weather.rainForecastProb24h = 0.88;
      state.weather.rainForecastAmountMm = 22;
      state.weather.weatherCondition = 'cloudy';
      // In second half, rain actually begins
      if (progress > 0.5) {
        state.weather.isRaining = true;
        state.weather.rainMmH = 12;
        state.weather.weatherCondition = 'rainy';
      }
      break;
    }

    case 'pipe_leak': {
      const z2 = state.zones.find((z) => z.id === 'z2');
      if (z2) {
        z2.valveOpen = true;
        state.pump.isOn = true;
        state.pump.commandedOn = true;
        z2.leakDetected = true;
        z2.sensors.flowSensor.flowRateLpm = 890; // Expected is ~600, +48% leak flow
        z2.leakSprayActive = true;
      }
      break;
    }

    case 'pump_dry_run': {
      state.pump.commandedOn = true;
      state.pump.isOn = true;
      state.pump.currentA = 2.8; // Low inductive current
      state.pump.flowRateLpm = 0;
      state.pump.dryRunDetected = true;
      break;
    }

    case 'internet_outage': {
      state.esp32.connectivity = 'offline';
      state.esp32.mode = 'local_fallback';
      break;
    }

    case 'water_scarcity': {
      state.tank.currentLevelL = 6000;
      state.tank.levelFraction = 0.12;
      state.tank.isScarcityMode = true;
      break;
    }

    case 'sensor_drift': {
      const z3 = state.zones.find((z) => z.id === 'z3');
      if (z3) {
        z3.sensors.soilMoistureSensor.isDrifting = true;
        z3.sensors.soilMoistureSensor.driftOffset = 0.45; // false high
        z3.sensors.soilMoistureSensor.isFaulty = true;
      }
      break;
    }

    case 'manual_override': {
      state.pump.mode = 'manual_override';
      state.pump.commandedOn = true;
      const z1 = state.zones.find((z) => z.id === 'z1');
      if (z1) {
        z1.valveOpen = true;
      }
      break;
    }

    case 'none':
    default:
      // Reset scenario-specific overrides
      state.pump.dryRunDetected = false;
      state.pump.mode = 'cloud_auto';
      state.tank.isScarcityMode = state.tank.levelFraction <= 0.2;
      state.zones.forEach((z) => {
        z.leakDetected = false;
        z.sensors.soilMoistureSensor.isDrifting = false;
        z.sensors.soilMoistureSensor.driftOffset = 0;
        z.sensors.soilMoistureSensor.isFaulty = false;
      });
      break;
  }
}
