/**
 * src/sim/crops.ts
 * Crop coefficient (Kc) tables, growth stage definitions, and stress indices.
 *
 * Kc values are from FAO-56 Table 12 (illustrative; labelled as simulated).
 * Crop stage thresholds guide both irrigation decisions and visual rendering.
 */

export type CropType = 'wheat' | 'sugarcane' | 'vegetables' | 'rice' | 'cotton';

export type CropStage = 'initial' | 'development' | 'mid' | 'late';

export interface KcEntry {
  initial: number;
  development: number; // interpolated linearly from initial → mid
  mid: number;
  late: number;
}

/** Kc values per crop type per stage (FAO-56 Table 12, illustrative) */
export const KC_TABLE: Record<CropType, KcEntry> = {
  wheat: {
    initial: 0.30,
    development: 0.75, // midpoint for display
    mid: 1.15,
    late: 0.40,
  },
  sugarcane: {
    initial: 0.40,
    development: 0.90,
    mid: 1.25,
    late: 0.75,
  },
  vegetables: {
    initial: 0.35,
    development: 0.70,
    mid: 1.05,
    late: 0.80,
  },
  rice: {
    initial: 1.05,
    development: 1.15,
    mid: 1.20,
    late: 0.90,
  },
  cotton: {
    initial: 0.35,
    development: 0.70,
    mid: 1.15,
    late: 0.50,
  },
};

/**
 * Soil moisture thresholds below which irrigation is triggered,
 * expressed as fraction of field capacity (illustrative values).
 * Higher Kc crops need wetter soil.
 */
export const IRRIGATION_THRESHOLD: Record<CropStage, number> = {
  initial: 0.55,    // irrigate when soil < 55% of FC
  development: 0.60,
  mid: 0.65,
  late: 0.50,
};

/**
 * Target soil moisture fraction of field capacity after irrigation.
 */
export const MOISTURE_TARGET: Record<CropStage, number> = {
  initial: 0.80,
  development: 0.85,
  mid: 0.90,
  late: 0.75,
};

/**
 * Stage duration fractions of total crop season (total = 1.0).
 * Used to advance stage as simulated time progresses.
 */
export const STAGE_FRACTIONS: Record<CropType, Record<CropStage, number>> = {
  wheat:      { initial: 0.15, development: 0.25, mid: 0.40, late: 0.20 },
  sugarcane:  { initial: 0.10, development: 0.30, mid: 0.45, late: 0.15 },
  vegetables: { initial: 0.20, development: 0.25, mid: 0.35, late: 0.20 },
  rice:       { initial: 0.15, development: 0.25, mid: 0.40, late: 0.20 },
  cotton:     { initial: 0.10, development: 0.25, mid: 0.45, late: 0.20 },
};

/** Crop season length in simulated days */
export const SEASON_DAYS: Record<CropType, number> = {
  wheat: 120,
  sugarcane: 300,
  vegetables: 90,
  rice: 130,
  cotton: 150,
};

/**
 * Sensitivity of yield to water stress by stage.
 * Higher = more critical to irrigate during this stage.
 */
export const STRESS_SENSITIVITY: Record<CropStage, number> = {
  initial: 0.5,
  development: 0.8,
  mid: 1.0,
  late: 0.6,
};

/**
 * Get Kc for a given crop and stage.
 */
export function getKc(crop: CropType, stage: CropStage): number {
  return KC_TABLE[crop][stage];
}

/**
 * Compute crop water need ETc (mm/day).
 * ETc = ET₀ × Kc
 */
export function computeETc(et0: number, crop: CropType, stage: CropStage): number {
  return et0 * getKc(crop, stage);
}

/**
 * Advance crop stage based on elapsed fraction of season.
 */
export function getStageFromFraction(
  crop: CropType,
  elapsedDays: number,
): CropStage {
  const total = SEASON_DAYS[crop];
  const fracs = STAGE_FRACTIONS[crop];
  const f = Math.min(elapsedDays / total, 1);

  if (f < fracs.initial) return 'initial';
  if (f < fracs.initial + fracs.development) return 'development';
  if (f < fracs.initial + fracs.development + fracs.mid) return 'mid';
  return 'late';
}

/**
 * Plant visual health: 0 = dead/stressed, 1 = healthy, >1 = slight over-water.
 * Based on soil moisture relative to field capacity and wilting point.
 */
export function plantHealthIndex(
  soilMoisture: number,
  fieldCapacity: number,
  wiltingPoint: number,
  saturation: number,
): number {
  if (soilMoisture <= wiltingPoint) return 0;
  if (soilMoisture >= saturation) return 1.2; // over-watered
  if (soilMoisture >= fieldCapacity * 0.6 && soilMoisture <= fieldCapacity * 1.1) return 1;
  // Linearly interpolate stress
  const range = fieldCapacity - wiltingPoint;
  return Math.max(0, (soilMoisture - wiltingPoint) / range);
}
