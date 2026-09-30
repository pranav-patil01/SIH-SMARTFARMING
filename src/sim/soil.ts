/**
 * src/sim/soil.ts
 * Soil water balance per irrigation zone.
 *
 * Water balance per tick:
 *   θ_new = θ + (irrigation_mm + Pe_mm − ETc_mm − drainage_mm) / rootDepth_m
 *
 * where:
 *   irrigation_mm = water applied this tick (mm over zone area)
 *   Pe_mm         = effective rainfall this tick
 *   ETc_mm        = crop water use this tick
 *   drainage_mm   = gravitational drainage when θ > FC
 *   rootDepth_m   = effective root zone depth (m)
 *   θ             = volumetric water content (m³/m³), clamped [WP, SAT]
 */

import { SIM_CONFIG } from '@/config/project';

const { SATURATION, FIELD_CAPACITY, WILTING_POINT, ROOT_DEPTH_M, DRAINAGE_RATE } = SIM_CONFIG;

export interface SoilUpdateParams {
  currentMoisture: number;    // θ current (m³/m³)
  irrigationMm: number;       // water applied this tick (mm)
  effectiveRainMm: number;    // Pe this tick (mm)
  etcMm: number;              // ETc this tick (mm)
  rootDepthM?: number;        // root depth (m), defaults to config
  saturation?: number;
  fieldCapacity?: number;
  wiltingPoint?: number;
}

/**
 * Compute effective rainfall Pe.
 * Pe = 0.8 × rain for rain < 25 mm/day; beyond that diminishing returns.
 * (USDA method, simplified)
 */
export function effectiveRainfall(rainMmDay: number): number {
  if (rainMmDay <= 0) return 0;
  if (rainMmDay < SIM_CONFIG.RAINFALL_THRESHOLD_MM) {
    return SIM_CONFIG.RAINFALL_EFFICIENCY * rainMmDay;
  }
  // Capped: diminishing returns above threshold
  const base = SIM_CONFIG.RAINFALL_EFFICIENCY * SIM_CONFIG.RAINFALL_THRESHOLD_MM;
  const excess = rainMmDay - SIM_CONFIG.RAINFALL_THRESHOLD_MM;
  return base + 0.15 * excess;
}

/**
 * Per-tick rainfall Pe (mm/tick) from hourly rain rate.
 */
export function pePerTick(rainMmH: number, simMinutesPerTick: number): number {
  const rainDay = rainMmH * 24; // convert hourly rate to daily total
  const peDayMm = effectiveRainfall(rainDay);
  return (peDayMm / (24 * 60)) * simMinutesPerTick;
}

/**
 * Update soil moisture for one tick.
 * Returns new θ clamped to [wiltingPoint, saturation].
 */
export function updateSoilMoisture(params: SoilUpdateParams): number {
  const {
    currentMoisture,
    irrigationMm,
    effectiveRainMm,
    etcMm,
    rootDepthM = ROOT_DEPTH_M,
    saturation = SATURATION,
    fieldCapacity = FIELD_CAPACITY,
    wiltingPoint = WILTING_POINT,
  } = params;

  // Drainage: excess water above FC drains at DRAINAGE_RATE fraction per tick
  const drainageMm =
    currentMoisture > fieldCapacity
      ? DRAINAGE_RATE * (currentMoisture - fieldCapacity) * rootDepthM * 1000
      : 0;

  // Net water balance (mm) → convert to volumetric fraction change
  // Δθ = net_mm / (rootDepth_m * 1000)  [mm → m, then divide by depth]
  const netMm = irrigationMm + effectiveRainMm - etcMm - drainageMm;
  const deltaTheta = netMm / (rootDepthM * 1000);

  const newMoisture = currentMoisture + deltaTheta;
  return Math.min(saturation, Math.max(wiltingPoint, newMoisture));
}

/**
 * Compute irrigation required to bring θ up to target.
 * Returns required depth in mm (0 if no irrigation needed).
 *
 * Required depth = max(0, ETc_accum + (θ_target − θ) × rootDepth × 1000 − Pe)
 */
export function irrigationRequiredMm(
  currentMoisture: number,
  targetMoisture: number,
  etcAccumMm: number,
  peMm: number,
  rootDepthM = ROOT_DEPTH_M,
): number {
  const deficit = (targetMoisture - currentMoisture) * rootDepthM * 1000;
  return Math.max(0, etcAccumMm + deficit - peMm);
}

/**
 * Convert mm of water depth to litres for a given zone area.
 * volume_L = depth_mm × area_m² × 1000 (mm→m) = depth_mm × area
 */
export function mmToLitres(depthMm: number, areaM2: number): number {
  return depthMm * areaM2; // 1 mm over 1 m² = 1 litre
}

/**
 * Irrigation duration in minutes given required litres and flow rate.
 */
export function irrigationDurationMin(requiredLitres: number, flowLpm: number): number {
  if (flowLpm <= 0) return 0;
  return requiredLitres / flowLpm;
}
