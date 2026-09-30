/**
 * src/config/project.ts
 * Central configuration — ALL magic numbers live here.
 * Change values here to recalibrate the simulation without touching logic.
 */

export const SIM_CONFIG = {
  // ── Simulation timing ─────────────────────────────────────────────────────
  TICK_INTERVAL_MS: 200,          // real-ms between sim ticks at 1× speed
  SIM_MINUTES_PER_TICK: 1,        // simulated minutes per tick at 1×

  // ── Farm geometry ──────────────────────────────────────────────────────────
  FARM_SIZE: 60,                  // metres, farm is FARM_SIZE × FARM_SIZE
  TERRAIN_SEGMENTS: 64,           // plane segments for noise displacement
  TERRAIN_AMPLITUDE: 0.8,         // metres of terrain height variation

  // ── Location (Pune, Maharashtra) ──────────────────────────────────────────
  LATITUDE_DEG: 18.5,             // degrees N; used for Ra calculation
  DEFAULT_DOY: 180,               // default day-of-year (mid-June, kharif)

  // ── ET₀ Hargreaves constants ───────────────────────────────────────────────
  // Formula: ET0 = 0.0023 * (Tmean + 17.8) * sqrt(Tmax - Tmin) * Ra
  // NOTE: Production system uses FAO-56 Penman–Monteith with real weather API data
  HARGREAVES_C: 0.0023,

  // ── Default weather (Pune, June baseline) ─────────────────────────────────
  DEFAULT_TMAX: 34,               // °C
  DEFAULT_TMIN: 24,               // °C
  DEFAULT_HUMIDITY: 65,           // %
  DEFAULT_WIND_KMH: 12,           // km/h
  DEFAULT_SOLAR_MJ: 18,           // MJ/m²/day (extraterrestrial Ra approximated)
  DEFAULT_RAIN_MM_H: 0,           // mm/h

  // ── Soil parameters ────────────────────────────────────────────────────────
  SATURATION: 0.50,               // volumetric water content at saturation (m³/m³)
  FIELD_CAPACITY: 0.35,           // field capacity
  WILTING_POINT: 0.10,            // permanent wilting point
  ROOT_DEPTH_M: 0.40,             // effective root zone depth, metres
  DRAINAGE_RATE: 0.005,           // fraction of (θ - FC) that drains per tick

  // ── Effective rainfall ─────────────────────────────────────────────────────
  // Pe = 0.8 * rain for rain < 25 mm/day, else Pe = 20 + 0.15*(rain-25)
  RAINFALL_EFFICIENCY: 0.8,
  RAINFALL_THRESHOLD_MM: 25,

  // ── Decision thresholds ────────────────────────────────────────────────────
  RAIN_FORECAST_SKIP_PROB: 0.60,  // skip irrigation if P(rain) >= 60%
  RAIN_FORECAST_SKIP_MM: 5,       // or if forecast rain >= 5 mm
  TANK_SCARCITY_FRACTION: 0.20,   // tank < 20% = scarcity mode
  TANK_CAPACITY_LITRES: 50000,    // total tank capacity
  TANK_INITIAL_FRACTION: 0.8,     // start at 80% full

  // ── Flow & pump ───────────────────────────────────────────────────────────
  PUMP_FLOW_LPM: 600,             // litres per minute at pump outlet
  PUMP_POWER_KW: 3.7,             // pump power draw at full load
  PUMP_CURRENT_NORMAL_A: 16,      // expected current at normal load
  DRY_RUN_CURRENT_THRESHOLD: 5,   // A — below this = dry-run suspected
  DRY_RUN_FLOW_THRESHOLD: 10,     // L/min — below this = no flow
  LEAK_FLOW_DEVIATION_PCT: 0.25,  // ±25% deviation = potential leak/blockage
  LEAK_DURATION_TICKS: 5,         // must persist for N ticks to trigger alert

  // ── Baseline irrigation (traditional fixed-schedule for comparison) ────────
  BASELINE_DURATION_MIN_PER_DAY: 120, // minutes irrigated daily regardless
  BASELINE_FLOW_LPM: 600,

  // ── Zones (default 3, up to 6) ────────────────────────────────────────────
  ZONES: [
    {
      id: 'z1',
      name: 'Zone 1 – Wheat',
      crop: 'wheat',
      area: 1200,           // m²
      initialMoisture: 0.28,
      position: [-20, 0, -10] as [number, number, number],
      color: '#C8A86B',
    },
    {
      id: 'z2',
      name: 'Zone 2 – Sugarcane',
      crop: 'sugarcane',
      area: 800,
      initialMoisture: 0.32,
      position: [5, 0, -15] as [number, number, number],
      color: '#4CAF50',
    },
    {
      id: 'z3',
      name: 'Zone 3 – Vegetables',
      crop: 'vegetables',
      area: 600,
      initialMoisture: 0.25,
      position: [22, 0, 5] as [number, number, number],
      color: '#8BC34A',
    },
  ],

  // ── Network ────────────────────────────────────────────────────────────────
  MQTT_INTERVAL_TICKS: 5,         // send MQTT every N ticks
  OFFLINE_BUFFER_MAX: 200,        // max buffered messages on SD card
  SMS_ALERT_TYPES: ['dry_run', 'leak_severe', 'pump_fault', 'offline_critical'],

  // ── Performance ────────────────────────────────────────────────────────────
  TARGET_FPS: 60,
  LOW_FPS_THRESHOLD: 40,
  LOW_FPS_DOWNGRADE_DELAY_MS: 3000,
  MAX_INSTANCES_HIGH: 3000,
  MAX_INSTANCES_MED: 1500,
  MAX_INSTANCES_LOW: 500,
} as const;

export type ZoneConfig = (typeof SIM_CONFIG.ZONES)[number];
