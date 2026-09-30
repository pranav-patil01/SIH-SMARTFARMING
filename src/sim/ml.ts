/**
 * src/sim/ml.ts
 * Tiny in-browser ML predictor for soil moisture and anomaly detection.
 *
 * Implements a linear model (ridge regression weights) trained on simulated
 * historical data patterns. This represents the ML assistance layer that
 * supplements the rule-based decision engine.
 *
 * In the production system, this would be a trained LSTM or XGBoost model
 * served via ONNX.js or a cloud API.
 */

export interface MLPrediction {
  predictedMoisture6h: number;    // predicted soil moisture 6h from now (m³/m³)
  anomalyScore: number;           // 0–1; >0.7 = anomaly flagged
  anomalyType: string | null;     // 'high_water_use' | 'sensor_drift' | 'leak_pattern' | null
  confidence: number;             // 0–1 model confidence
  explanationBullets: string[];   // human-readable reasons
}

export interface MLFeatures {
  soilMoisture: number;
  et0: number;
  kc: number;
  temperatureMean: number;
  humidity: number;
  wind: number;
  flowRate: number;
  irrigationToday: number;
  dayOfYear: number;
  hourOfDay: number;
  raining: boolean;
}

/**
 * Pre-fitted linear model weights (illustrative, hand-calibrated).
 * Format: weight for each feature in MLFeatures order.
 * θ_6h = bias + Σ(weight_i × feature_i)
 */
const MODEL_WEIGHTS = {
  bias: 0.02,
  soilMoisture: 0.88,          // strong persistence
  et0: -0.008,                 // ET depletes moisture
  kc: -0.002,
  temperatureMean: -0.0005,
  humidity: 0.0002,
  wind: -0.0001,
  flowRate: 0.0003,            // flow contributes to moisture
  irrigationToday: 0.00005,
  seasonalComponent: 0.005,    // sin component
  raining: 0.015,              // rain adds moisture
};

/** Normal bounds for anomaly detection (expected ranges) */
const NORMAL_FLOW_RANGE: [number, number] = [0, 700];
const NORMAL_MOISTURE_DROP_PER_HOUR = 0.003; // max expected per hour

/**
 * Run the ML predictor for one zone.
 */
export function predictMoisture(features: MLFeatures): MLPrediction {
  const {
    soilMoisture, et0, kc, temperatureMean, humidity,
    wind, flowRate, irrigationToday, dayOfYear, hourOfDay, raining,
  } = features;

  // Linear prediction with seasonal adjustment
  const seasonal = Math.sin((2 * Math.PI * dayOfYear) / 365) * 0.01;
  const predicted =
    MODEL_WEIGHTS.bias +
    MODEL_WEIGHTS.soilMoisture * soilMoisture +
    MODEL_WEIGHTS.et0 * et0 +
    MODEL_WEIGHTS.kc * kc +
    MODEL_WEIGHTS.temperatureMean * temperatureMean +
    MODEL_WEIGHTS.humidity * humidity +
    MODEL_WEIGHTS.wind * wind +
    MODEL_WEIGHTS.flowRate * flowRate +
    MODEL_WEIGHTS.irrigationToday * irrigationToday +
    MODEL_WEIGHTS.seasonalComponent * seasonal +
    MODEL_WEIGHTS.raining * (raining ? 1 : 0);

  // Clamp to valid soil moisture range
  const predictedMoisture6h = Math.max(0.05, Math.min(0.55, predicted));

  // ── Anomaly detection ─────────────────────────────────────────────────
  let anomalyScore = 0;
  let anomalyType: string | null = null;
  const bullets: string[] = [];

  // High water use: ETc much higher than expected for crop/stage
  const expectedETcDay = et0 * kc;
  const highUse = expectedETcDay > 8; // mm/day > 8 is unusual
  if (highUse) {
    anomalyScore = Math.max(anomalyScore, 0.6);
    anomalyType = 'high_water_use';
    bullets.push(`⚠ High ETc (${expectedETcDay.toFixed(1)} mm/day) — check temperature spike`);
  }

  // Flow anomaly: flow running but valve should be off (simulated by very low flow when on)
  if (flowRate > 0 && flowRate < NORMAL_FLOW_RANGE[0] + 20) {
    anomalyScore = Math.max(anomalyScore, 0.55);
    bullets.push('⚠ Unusually low flow — possible blockage or partial closure');
  }

  // Sensor drift: moisture increasing with no irrigation or rain (impossible)
  const moistureRise = predictedMoisture6h - soilMoisture;
  if (moistureRise > 0.05 && flowRate < 10 && !raining) {
    anomalyScore = Math.max(anomalyScore, 0.75);
    anomalyType = 'sensor_drift';
    bullets.push('⚠ Moisture rising with no water source — sensor may be drifting');
  }

  if (anomalyScore === 0) {
    bullets.push(`✅ Soil moisture on track: predicted ${(predictedMoisture6h * 100).toFixed(1)}% in 6h`);
    bullets.push(`📊 ETc = ${(et0 * kc).toFixed(2)} mm/day (ET₀=${et0.toFixed(2)}, Kc=${kc.toFixed(2)})`);
  }

  // Confidence degrades with temperature extremes
  const confidence = Math.max(0.5, 1 - Math.abs(temperatureMean - 28) * 0.02);

  return {
    predictedMoisture6h,
    anomalyScore,
    anomalyType,
    confidence,
    explanationBullets: bullets,
  };
}

/**
 * Detect if sensor readings are anomalous based on cross-validation.
 * Cross-check flow, current, and moisture for consistency.
 */
export function detectSensorAnomaly(
  flowLpm: number,
  currentA: number,
  valveOpen: boolean,
  expectedFlowLpm: number,
  pumpOn: boolean,
): { isAnomaly: boolean; type: string | null; description: string } {
  if (!valveOpen || !pumpOn) {
    return { isAnomaly: false, type: null, description: 'Valve/pump off — no check needed' };
  }

  const flowDev = Math.abs(flowLpm - expectedFlowLpm) / (expectedFlowLpm + 1);

  if (currentA < 5 && flowLpm < 10) {
    return {
      isAnomaly: true,
      type: 'dry_run',
      description: `Dry-run: pump current ${currentA.toFixed(1)}A, flow ${flowLpm.toFixed(0)} L/min`,
    };
  }

  if (flowDev > 0.3) {
    const dir = flowLpm > expectedFlowLpm ? 'higher' : 'lower';
    return {
      isAnomaly: true,
      type: flowLpm > expectedFlowLpm ? 'leak_pattern' : 'blockage',
      description: `Flow ${dir} than expected by ${(flowDev * 100).toFixed(0)}%`,
    };
  }

  return { isAnomaly: false, type: null, description: 'All sensors nominal' };
}
