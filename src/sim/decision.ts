/**
 * src/sim/decision.ts
 * Cloud Decision Engine for AgriSense.
 *
 * Implements zone-wise irrigation calculation:
 * 1. Computes Reference ET₀ (Hargreaves) and crop-specific ETc (ET₀ × Kc).
 * 2. Deducts effective rainfall (Pe) and evaluates 24-h rain forecast risk.
 * 3. Assesses soil moisture deficit against dynamic stage thresholds.
 * 4. Checks water scarcity & tank availability (prioritises zones if tank is low).
 * 5. Consults ML layer for short-term prediction and anomaly detection.
 * 6. Generates an explainable recommendation ("Why this decision?").
 */

import { SIM_CONFIG } from '@/config/project';
import { computeET0 } from './et0';
import { computeETc, getKc, IRRIGATION_THRESHOLD, MOISTURE_TARGET, STRESS_SENSITIVITY } from './crops';
import { irrigationRequiredMm, mmToLitres, irrigationDurationMin, effectiveRainfall } from './soil';
import { predictMoisture } from './ml';
import { ZoneState, WeatherState, TankState, DecisionResult } from './types';

export interface DecisionInputs {
  simMinute: number;
  weather: WeatherState;
  zones: ZoneState[];
  tank: TankState;
  isOnline: boolean;
}

export function evaluateIrrigationDecisions(inputs: DecisionInputs): DecisionResult {
  const { simMinute, weather, zones, tank, isOnline } = inputs;
  
  // 1. Calculate Reference Evapotranspiration ET0
  const et0 = computeET0(weather.tmax, weather.tmin, SIM_CONFIG.LATITUDE_DEG, weather.dayOfYear);
  
  // 2. Weather & Forecast checks
  const rainForecastProb = weather.rainForecastProb24h;
  const rainForecastExpected = weather.rainForecastAmountMm;
  const isHighRainForecast = rainForecastProb >= SIM_CONFIG.RAIN_FORECAST_SKIP_PROB || 
                             rainForecastExpected >= SIM_CONFIG.RAIN_FORECAST_SKIP_MM;
  
  const isTankCritical = tank.levelFraction <= 0.05;
  const isTankScarcity = tank.levelFraction <= SIM_CONFIG.TANK_SCARCITY_FRACTION;

  // 3. Zone-wise assessment & priority ranking
  const zoneCalculations = zones.map((zone) => {
    const kc = getKc(zone.crop, zone.cropStage);
    const etc = computeETc(et0, zone.crop, zone.cropStage);
    const peToday = effectiveRainfall(weather.rainMmH * 24);
    
    const thresholdFraction = IRRIGATION_THRESHOLD[zone.cropStage];
    const thresholdMoisture = zone.fieldCapacity * thresholdFraction;
    const targetMoisture = zone.fieldCapacity * MOISTURE_TARGET[zone.cropStage];
    
    // Soil moisture deficit
    const currentMoisture = zone.soilMoisture;
    const isBelowThreshold = currentMoisture < thresholdMoisture;
    
    // Water depth needed (mm)
    const requiredDepth = isBelowThreshold
      ? irrigationRequiredMm(currentMoisture, targetMoisture, etc, peToday)
      : 0;
    
    const requiredLitres = mmToLitres(requiredDepth, zone.areaM2);
    const estimatedDuration = irrigationDurationMin(requiredLitres, SIM_CONFIG.PUMP_FLOW_LPM / zones.length);

    // Scarcity Priority Metric: Deficit × Crop Stage Sensitivity
    const moistureDeficitRatio = Math.max(0, (thresholdMoisture - currentMoisture) / thresholdMoisture);
    const stageSensitivity = STRESS_SENSITIVITY[zone.cropStage];
    const scarcityPriorityScore = moistureDeficitRatio * stageSensitivity;

    // ML Consultation
    const mlPrediction = predictMoisture({
      soilMoisture: currentMoisture,
      et0,
      kc,
      temperatureMean: weather.tmean,
      humidity: weather.humidity,
      wind: weather.windKmh,
      flowRate: zone.sensors.flowSensor.flowRateLpm,
      irrigationToday: zone.waterAppliedTodayMm,
      dayOfYear: weather.dayOfYear,
      hourOfDay: weather.hourOfDay,
      raining: weather.isRaining,
    });

    return {
      zone,
      kc,
      etc,
      peToday,
      thresholdMoisture,
      targetMoisture,
      isBelowThreshold,
      requiredDepth,
      requiredLitres,
      estimatedDuration,
      scarcityPriorityScore,
      mlPrediction,
    };
  });

  // Rank zones by urgency for scarcity mode
  const sortedZones = [...zoneCalculations].sort((a, b) => b.scarcityPriorityScore - a.scarcityPriorityScore);
  const priorityRankMap = new Map<string, number>();
  sortedZones.forEach((item, index) => {
    priorityRankMap.set(item.zone.id, index + 1);
  });

  // 4. Final decisions per zone
  const zoneDecisions = zoneCalculations.map((calc) => {
    const { zone, etc, peToday, isBelowThreshold, requiredDepth, estimatedDuration, mlPrediction } = calc;
    const rank = priorityRankMap.get(zone.id) || 1;
    
    let shouldIrrigate = false;
    let reason = '';
    const whyBullets: string[] = [];

    whyBullets.push(`Crop: ${zone.name} (${zone.cropStage} stage, Kc = ${calc.kc.toFixed(2)})`);
    whyBullets.push(`Current Moisture: ${(zone.soilMoisture * 100).toFixed(1)}% | Threshold: ${(calc.thresholdMoisture * 100).toFixed(1)}%`);
    whyBullets.push(`Daily ETc: ${etc.toFixed(2)} mm/day | Forecast rain: ${rainForecastExpected.toFixed(1)} mm (${(rainForecastProb * 100).toFixed(0)}% prob)`);

    if (isTankCritical) {
      shouldIrrigate = false;
      reason = 'Tank depleted (<5% capacity). Emergency water lockout.';
      whyBullets.push('❌ Tank reserve critically depleted — all irrigation suspended.');
    } else if (!isBelowThreshold) {
      shouldIrrigate = false;
      reason = `Soil moisture (${(zone.soilMoisture * 100).toFixed(1)}%) is adequate (above threshold ${(calc.thresholdMoisture * 100).toFixed(1)}%).`;
      whyBullets.push('✅ Soil moisture is in the optimal growth buffer.');
    } else if (isHighRainForecast) {
      shouldIrrigate = false;
      reason = `Rain forecast imminent (${(rainForecastProb * 100).toFixed(0)}% prob, ${rainForecastExpected.toFixed(1)}mm). Irrigation postponed to save water.`;
      whyBullets.push(`💧 Postponing irrigation: rain expected will supply ${peToday.toFixed(1)}mm effective water.`);
    } else if (isTankScarcity && rank > 1) {
      shouldIrrigate = false;
      reason = `Water scarcity mode active (Tank ${(tank.levelFraction * 100).toFixed(0)}%). Prioritising Zone 1 (${sortedZones[0].zone.name}, Rank #1).`;
      whyBullets.push(`⚖ Scarcity mode: Zone rank #${rank} deferred to protect highest-vulnerability crop.`);
    } else {
      shouldIrrigate = requiredDepth > 0;
      reason = `Irrigate ${requiredDepth.toFixed(1)}mm (~${Math.round(calc.requiredLitres)} L, ~${Math.ceil(estimatedDuration)} min) to restore field capacity.`;
      whyBullets.push(`⚡ Recommendation: Apply ${requiredDepth.toFixed(1)}mm depth to replenish root zone.`);
      whyBullets.push(`🤖 ML Confidence: ${(mlPrediction.confidence * 100).toFixed(0)}% | Predicted 6h moisture: ${(mlPrediction.predictedMoisture6h * 100).toFixed(1)}%`);
    }

    return {
      zoneId: zone.id,
      shouldIrrigate,
      reason,
      requiredDepthMm: requiredDepth,
      estimatedDurationMin: estimatedDuration,
      et0Mm: et0,
      etcMm: etc,
      effectiveRainMm: peToday,
      deficitMm: requiredDepth,
      rainForecastProb,
      scarcityPriority: rank,
      mlConfidence: mlPrediction.confidence,
      whyBullets,
    };
  });

  // Determine which zone receives water (sequential zone irrigation)
  const activeZoneDecision = zoneDecisions.find((d) => d.shouldIrrigate);
  const pumpCommand = !!activeZoneDecision && isOnline;
  const activeZoneId = activeZoneDecision ? activeZoneDecision.zoneId : null;

  let overallReason = 'Nominal state: all zones moisture-balanced or awaiting next cycle.';
  if (pumpCommand && activeZoneDecision) {
    overallReason = `Cloud Decision: Irrigating ${activeZoneDecision.zoneId} — ${activeZoneDecision.reason}`;
  } else if (isHighRainForecast) {
    overallReason = 'Cloud Decision: Rain forecast detected — all zones paused to conserve reservoir.';
  } else if (isTankCritical) {
    overallReason = 'Emergency: Tank below critical safety reserve. Valves locked.';
  }

  return {
    timestamp: Date.now(),
    simMinute,
    zoneDecisions,
    pumpCommand,
    activeZoneId,
    overallReason,
  };
}
