import {
  CropBatch,
  EnvironmentalReading,
  GrowthObservation,
  GrowthStage,
  GrowingZone,
  HarvestPrediction,
  PredictionCriteriaConfig,
  YieldForecastPoint,
} from '../types/harvestiq';
import { addDaysIso, diffDaysIso, formatMonthDay } from './formatters';

export function calculateCropAgeDays(plantingDate: string, referenceDate: string): number {
  const diff = diffDaysIso(plantingDate, referenceDate);
  return Math.max(0, diff);
}

export function getLatestObservation(
  batchId: string,
  observations: GrowthObservation[],
): GrowthObservation | undefined {
  const filtered = observations
    .filter((o) => o.batchId === batchId)
    .sort((a, b) => a.date.localeCompare(b.date));
  return filtered[filtered.length - 1];
}

export function getLatestZoneReading(
  zoneId: string,
  readings: EnvironmentalReading[],
): EnvironmentalReading | undefined {
  const filtered = readings
    .filter((r) => r.zoneId === zoneId)
    .sort((a, b) => a.date.localeCompare(b.date));
  return filtered[filtered.length - 1];
}

export function isReadingOutOfRange(
  reading: EnvironmentalReading,
  zone: GrowingZone,
): { outOfRangeCount: number; issues: string[] } {
  const issues: string[] = [];
  if (reading.temperatureC < zone.targetTempC[0] || reading.temperatureC > zone.targetTempC[1]) {
    issues.push(`Temp ${reading.temperatureC.toFixed(1)}°C outside ${zone.targetTempC[0]}–${zone.targetTempC[1]}°C`);
  }
  if (reading.humidityPct < zone.targetHumidityPct[0] || reading.humidityPct > zone.targetHumidityPct[1]) {
    issues.push(`RH ${reading.humidityPct.toFixed(0)}% outside ${zone.targetHumidityPct[0]}–${zone.targetHumidityPct[1]}%`);
  }
  if (reading.ph < zone.targetPh[0] || reading.ph > zone.targetPh[1]) {
    issues.push(`pH ${reading.ph.toFixed(2)} outside ${zone.targetPh[0]}–${zone.targetPh[1]}`);
  }
  if (reading.ecMsCm < zone.targetEcMsCm[0] || reading.ecMsCm > zone.targetEcMsCm[1]) {
    issues.push(`EC ${reading.ecMsCm.toFixed(2)} mS/cm outside ${zone.targetEcMsCm[0]}–${zone.targetEcMsCm[1]}`);
  }
  return { outOfRangeCount: issues.length, issues };
}

/**
 * Transparent Stage 1 rule-based demonstration estimator.
 * Calculates harvest window and maturity classification from configurable criteria,
 * crop age, latest morphological measurements, and optional environmental offset.
 * Explicitly marked as DEMONSTRATION DATA — not a validated ML model.
 */
export function computeDemoHarvestPrediction(
  batch: CropBatch,
  observations: GrowthObservation[],
  readings: EnvironmentalReading[],
  zones: GrowingZone[],
  criteria: PredictionCriteriaConfig,
  referenceDate: string,
): HarvestPrediction {
  const ageDays = calculateCropAgeDays(batch.plantingDate, referenceDate);
  const latestObs = getLatestObservation(batch.id, observations);
  const zone = zones.find((z) => z.id === batch.zoneId);
  const latestReading = getLatestZoneReading(batch.zoneId, readings);

  let envDelayDays = 0;
  let envNote = 'Nominal zone climate and fertigation within target band';
  if (criteria.allowEnvironmentPenaltyAdjustment && zone && latestReading) {
    const check = isReadingOutOfRange(latestReading, zone);
    if (check.outOfRangeCount >= 2) {
      envDelayDays = 2;
      envNote = `Minor cycle delay (+2d) due to ${check.issues[0]}`;
    } else if (check.outOfRangeCount === 1) {
      envDelayDays = 1;
      envNote = `Slight variance (+1d) tracked from ${check.issues[0]}`;
    }
  }

  let statusOffsetDays = 0;
  if (batch.status === 'Attention') {
    statusOffsetDays = 1;
  } else if (batch.status === 'Critical') {
    statusOffsetDays = 2;
  }

  const adjustedCycleDays = batch.targetCycleDays + envDelayDays + statusOffsetDays;
  const predictedHarvestDate = addDaysIso(batch.plantingDate, adjustedCycleDays);
  const daysRemaining = diffDaysIso(referenceDate, predictedHarvestDate);

  const cycleProgressPct = Math.min(100, Math.round((ageDays / adjustedCycleDays) * 100));

  const meetsMorphologicalReady = latestObs
    ? latestObs.avgLeafCount >= criteria.minLeafCountForReady &&
      latestObs.avgHeightCm >= criteria.minHeightCmForReady
    : true;

  let growthStage: GrowthStage = 'Early Growth';
  if (daysRemaining <= criteria.readyDaysThreshold && meetsMorphologicalReady) {
    growthStage = 'Ready for Harvest';
  } else if (daysRemaining <= criteria.approachingDaysThreshold) {
    growthStage = 'Approaching Maturity';
  } else if (cycleProgressPct <= criteria.earlyMaxAgePct) {
    growthStage = 'Early Growth';
  } else {
    growthStage = 'Vegetative Growth';
  }

  const confidenceSpan = Math.max(1, Math.min(4, Math.ceil(Math.max(daysRemaining, 2) / 9)));
  const harvestWindowStart = addDaysIso(predictedHarvestDate, -1);
  const harvestWindowEnd = addDaysIso(predictedHarvestDate, confidenceSpan);

  const survivalFactor =
    batch.status === 'Critical' ? 0.91 : batch.status === 'Attention' ? 0.95 : 0.98;
  const estimatedYieldKg = Number(
    ((batch.plantCount * batch.expectedHeadWeightG * survivalFactor) / 1000).toFixed(1),
  );
  const yieldMargin = Number((estimatedYieldKg * 0.06).toFixed(1));

  const keyFactors: string[] = [
    `Cultivar baseline cycle: ${batch.targetCycleDays} days (${batch.cultivar})`,
    latestObs
      ? `Latest canopy check: ${latestObs.avgHeightCm.toFixed(1)} cm height, ${latestObs.avgLeafCount} leaves`
      : 'Awaiting initial morphological leaf count log',
    envNote,
  ];

  // Deterministic historical snapshot trail for chart transparency
  const history = [
    {
      date: addDaysIso(referenceDate, -14),
      predictedHarvestDate: addDaysIso(batch.plantingDate, batch.targetCycleDays),
      estimatedYieldKg: Number(((batch.plantCount * batch.expectedHeadWeightG * 0.98) / 1000).toFixed(1)),
      confidenceRangeDays: 3,
    },
    {
      date: addDaysIso(referenceDate, -7),
      predictedHarvestDate: addDaysIso(batch.plantingDate, batch.targetCycleDays + envDelayDays),
      estimatedYieldKg: Number(((batch.plantCount * batch.expectedHeadWeightG * 0.97) / 1000).toFixed(1)),
      confidenceRangeDays: 2,
    },
    {
      date: referenceDate,
      predictedHarvestDate,
      estimatedYieldKg,
      confidenceRangeDays: confidenceSpan,
    },
  ].filter((entry) => entry.date >= batch.plantingDate);

  return {
    batchId: batch.id,
    predictedHarvestDate,
    harvestWindowStart,
    harvestWindowEnd,
    daysRemaining,
    growthStage,
    confidenceLowerDays: 1,
    confidenceUpperDays: confidenceSpan,
    estimatedYieldKg,
    yieldRangeKg: [
      Number((estimatedYieldKg - yieldMargin).toFixed(1)),
      Number((estimatedYieldKg + yieldMargin).toFixed(1)),
    ],
    readinessPct: cycleProgressPct,
    keyFactors,
    isDemonstration: true,
    history,
  };
}

export function aggregateYieldForecastByDate(
  batches: CropBatch[],
  predictions: Record<string, HarvestPrediction>,
): YieldForecastPoint[] {
  const byDate = new Map<string, { yieldKg: number; lowerKg: number; upperKg: number; batchIds: string[] }>();

  for (const batch of batches) {
    if (batch.status === 'Harvested') continue;
    const pred = predictions[batch.id];
    if (!pred) continue;

    const existing = byDate.get(pred.predictedHarvestDate) ?? {
      yieldKg: 0,
      lowerKg: 0,
      upperKg: 0,
      batchIds: [],
    };
    existing.yieldKg += pred.estimatedYieldKg;
    existing.lowerKg += pred.yieldRangeKg[0];
    existing.upperKg += pred.yieldRangeKg[1];
    existing.batchIds.push(batch.id);
    byDate.set(pred.predictedHarvestDate, existing);
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, agg]) => ({
      date,
      label: formatMonthDay(date),
      estimatedYieldKg: Number(agg.yieldKg.toFixed(1)),
      lowerBoundKg: Number(agg.lowerKg.toFixed(1)),
      upperBoundKg: Number(agg.upperKg.toFixed(1)),
      batchCount: agg.batchIds.length,
      batchIds: agg.batchIds,
    }));
}

export function computeYieldVariancePct(expectedKg: number, actualKg: number): number {
  if (expectedKg <= 0) return 0;
  return Number((((actualKg - expectedKg) / expectedKg) * 100).toFixed(1));
}
