/**
 * tests/sim.test.ts
 * Vitest headless unit tests for AgriSense Simulation Engine.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { computeET0, computeRa } from '../src/sim/et0';
import { computeETc, getKc, plantHealthIndex } from '../src/sim/crops';
import { updateSoilMoisture, effectiveRainfall, irrigationRequiredMm } from '../src/sim/soil';
import { evaluateIrrigationDecisions } from '../src/sim/decision';
import { AgriSenseSimEngine } from '../src/sim/engine';
import { SIM_CONFIG } from '../src/config/project';

describe('1. Reference ET0 (Hargreaves-Samani)', () => {
  it('computes positive extraterrestrial radiation Ra for Pune (18.5 deg N)', () => {
    const ra = computeRa(18.5, 180);
    expect(ra).toBeGreaterThan(25);
    expect(ra).toBeLessThan(45);
  });

  it('computes realistic ET0 values for summer weather', () => {
    // 35°C max, 24°C min in Pune June
    const et0 = computeET0(35, 24, 18.5, 180);
    expect(et0).toBeGreaterThan(4.0);
    expect(et0).toBeLessThan(9.0);
  });

  it('handles inverted temperature gracefully', () => {
    const et0 = computeET0(20, 25, 18.5, 180);
    expect(et0).toBe(0);
  });
});

describe('2. Crop Coefficients & Water Needs', () => {
  it('returns correct Kc for wheat across growth stages', () => {
    expect(getKc('wheat', 'initial')).toBe(0.30);
    expect(getKc('wheat', 'mid')).toBe(1.15);
    expect(getKc('wheat', 'late')).toBe(0.40);
  });

  it('computes ETc as product of ET0 and Kc', () => {
    const etc = computeETc(6.0, 'wheat', 'mid');
    expect(etc).toBeCloseTo(6.0 * 1.15, 2);
  });

  it('correctly models plant health based on soil moisture bounds', () => {
    // healthy within bounds
    expect(plantHealthIndex(0.30, 0.35, 0.10, 0.50)).toBe(1.0);
    // wilted below wilting point
    expect(plantHealthIndex(0.08, 0.35, 0.10, 0.50)).toBe(0);
  });
});

describe('3. Soil Water Balance', () => {
  it('calculates effective rainfall Pe correctly', () => {
    expect(effectiveRainfall(0)).toBe(0);
    expect(effectiveRainfall(20)).toBeCloseTo(16, 1); // 80%
    expect(effectiveRainfall(40)).toBeGreaterThan(20);
  });

  it('updates soil moisture when water is applied', () => {
    const initialMoisture = 0.20;
    const newMoisture = updateSoilMoisture({
      currentMoisture: initialMoisture,
      irrigationMm: 10,
      effectiveRainMm: 0,
      etcMm: 2,
    });
    expect(newMoisture).toBeGreaterThan(initialMoisture);
  });

  it('calculates non-zero irrigation required when moisture is deficient', () => {
    const req = irrigationRequiredMm(0.18, 0.30, 4.0, 0);
    expect(req).toBeGreaterThan(0);
  });
});

describe('4. AgriSense Master Simulation Engine', () => {
  let engine: AgriSenseSimEngine;

  beforeEach(() => {
    engine = new AgriSenseSimEngine({ seed: 42 });
  });

  it('initializes with nominal state and 3 zones', () => {
    const snap = engine.getSnapshot();
    expect(snap.zones.length).toBe(3);
    expect(snap.esp32.connectivity).toBe('online');
    expect(snap.pump.isOn).toBe(false);
  });

  it('advances simulation deterministic ticks', () => {
    const snap1 = engine.tick();
    expect(snap1.tick).toBe(1);
    const snap2 = engine.tick();
    expect(snap2.tick).toBe(2);
  });

  it('executes dry-run protection scenario and trips pump', () => {
    engine.setScenario('pump_dry_run');
    // Run several ticks
    for (let i = 0; i < 5; i++) {
      engine.tick();
    }
    const snap = engine.getSnapshot();
    expect(snap.pump.dryRunDetected).toBe(true);
    expect(snap.esp32.dryRunTripCount).toBeGreaterThanOrEqual(1);
    expect(snap.alerts.some((a) => a.category === 'dry_run')).toBe(true);
  });

  it('handles offline mode with local fallback rules', () => {
    engine.setScenario('internet_outage');
    engine.tick();
    const snap = engine.getSnapshot();
    expect(snap.esp32.connectivity).toBe('offline');
    expect(snap.esp32.mode).toBe('local_fallback');
  });
});
