/**
 * src/sim/et0.ts
 * ET₀ calculation using the Hargreaves–Samani equation.
 *
 * Formula:
 *   ET₀ (mm/day) = 0.0023 * (Tmean + 17.8) * sqrt(Tmax - Tmin) * Ra
 *
 * Ra = extraterrestrial radiation (MJ/m²/day), approximated from
 * latitude and day-of-year per FAO-56 Annex 2.
 *
 * NOTE: The production AgriSense system uses FAO-56 Penman–Monteith
 * with real-time weather API (humidity, wind, solar radiation). The
 * Hargreaves equation is used here for its simplicity in offline/edge
 * contexts and for the simulation demo.
 */

import { SIM_CONFIG } from '@/config/project';

const DEG_TO_RAD = Math.PI / 180;

/**
 * Compute extraterrestrial solar radiation Ra (MJ/m²/day)
 * from latitude (degrees N) and day-of-year.
 * Based on FAO-56 Annex 2, Eq 21.
 */
export function computeRa(latitudeDeg: number, doy: number): number {
  const phi = latitudeDeg * DEG_TO_RAD;
  // Solar declination (radians)
  const delta = 0.409 * Math.sin((2 * Math.PI * doy) / 365 - 1.39);
  // Inverse relative distance Earth-Sun
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI * doy) / 365);
  // Sunset hour angle
  const ws = Math.acos(-Math.tan(phi) * Math.tan(delta));
  // Ra in MJ/m²/day (Gsc = 0.0820 MJ/m²/min)
  const Ra =
    (24 * 60) / Math.PI *
    0.082 *
    dr *
    (ws * Math.sin(phi) * Math.sin(delta) +
      Math.cos(phi) * Math.cos(delta) * Math.sin(ws));
  return Ra;
}

/**
 * Hargreaves–Samani ET₀ estimate.
 * @param tmax - Max daily temperature (°C)
 * @param tmin - Min daily temperature (°C)
 * @param latitudeDeg - Site latitude (degrees N); defaults to Pune
 * @param doy - Day of year (1–365)
 * @returns ET₀ in mm/day
 */
export function computeET0(
  tmax: number,
  tmin: number,
  latitudeDeg: number = SIM_CONFIG.LATITUDE_DEG,
  doy: number = SIM_CONFIG.DEFAULT_DOY,
): number {
  const tmean = (tmax + tmin) / 2;
  const raMj = computeRa(latitudeDeg, doy);
  // Convert extraterrestrial solar radiation (MJ/m²/day) to equivalent evaporation (mm/day)
  // Latent heat of vaporization λ ≈ 2.45 MJ/kg -> factor = 1/2.45 ≈ 0.408
  const raMm = 0.408 * raMj;
  const tdiff = Math.max(0, tmax - tmin); // guard against inverted input
  // Hargreaves eq: C * (Tmean + 17.8) * sqrt(ΔT) * Ra_mm
  const et0 = SIM_CONFIG.HARGREAVES_C * (tmean + 17.8) * Math.sqrt(tdiff) * raMm;
  return Math.max(0, et0); // ET₀ cannot be negative
}

/**
 * Per-tick ET₀ given mm/day value and simulated minutes per tick.
 * Converts mm/day → mm/tick.
 */
export function et0PerTick(et0Day: number, simMinutesPerTick: number): number {
  return (et0Day / (24 * 60)) * simMinutesPerTick;
}
