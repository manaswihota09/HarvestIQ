import {
  AnomalyAlert,
  CropBatch,
  EnvironmentalReading,
  FarmProfile,
  GrowthObservation,
  GrowingZone,
  HarvestRecord,
  PredictionCriteriaConfig,
} from '../types/harvestiq';
import { addDaysIso } from '../utils/formatters';

export const REFERENCE_DATE = '2026-11-26';

export const SEED_FARM_PROFILE: FarmProfile = {
  id: 'farm-01',
  name: 'Verdant Valley Vertical Farm',
  location: 'Facility 01 — Willamette Valley',
  facilityAreaSqm: 2400,
  farmingMethod: 'Hydroponic NFT & Vertical Rack',
  primaryCrop: 'Lettuce',
  managerName: 'Clara Lindqvist',
  managerRole: 'Lead Grower & Operations Manager',
  managerEmail: 'clara.lindqvist@verdantvalley.ag',
  timezone: 'America/Los_Angeles',
  referenceDate: REFERENCE_DATE,
};

export const SEED_GROWING_ZONES: GrowingZone[] = [
  {
    id: 'zone-a',
    code: 'Zone A',
    name: 'Propagation & Early Leaf',
    focusStage: 'Seedling to Day 12',
    rackCount: 6,
    capacityPlants: 3600,
    targetTempC: [20.0, 22.5],
    targetHumidityPct: [65, 75],
    targetLightPpfd: [180, 230],
    targetPh: [5.6, 6.0],
    targetEcMsCm: [1.1, 1.4],
  },
  {
    id: 'zone-b',
    code: 'Zone B',
    name: 'NFT Vegetative Bay',
    focusStage: 'Day 13 to Day 24',
    rackCount: 8,
    capacityPlants: 4200,
    targetTempC: [19.0, 21.5],
    targetHumidityPct: [58, 68],
    targetLightPpfd: [240, 290],
    targetPh: [5.7, 6.1],
    targetEcMsCm: [1.4, 1.7],
  },
  {
    id: 'zone-c',
    code: 'Zone C',
    name: 'High-Density Canopy',
    focusStage: 'Day 25 to Day 31',
    rackCount: 8,
    capacityPlants: 3800,
    targetTempC: [18.0, 20.5],
    targetHumidityPct: [55, 65],
    targetLightPpfd: [280, 330],
    targetPh: [5.8, 6.2],
    targetEcMsCm: [1.5, 1.85],
  },
  {
    id: 'zone-d',
    code: 'Zone D',
    name: 'Finishing & Pre-Harvest',
    focusStage: 'Day 32 to Harvest',
    rackCount: 6,
    capacityPlants: 2800,
    targetTempC: [17.0, 19.5],
    targetHumidityPct: [50, 62],
    targetLightPpfd: [260, 310],
    targetPh: [5.8, 6.2],
    targetEcMsCm: [1.4, 1.75],
  },
];

export const SEED_PREDICTION_CRITERIA: PredictionCriteriaConfig = {
  earlyMaxAgePct: 35,
  vegetativeMaxAgePct: 72,
  approachingDaysThreshold: 7,
  readyDaysThreshold: 2,
  minLeafCountForReady: 18,
  minHeightCmForReady: 16.0,
  allowEnvironmentPenaltyAdjustment: true,
};

export const SEED_BATCHES: CropBatch[] = [
  {
    id: 'BT-2601',
    crop: 'Lettuce',
    cultivar: 'Butterhead Rex',
    zoneId: 'zone-d',
    rackNumber: 'D-01',
    plantingDate: '2026-10-24',
    plantCount: 480,
    targetCycleDays: 34,
    expectedHeadWeightG: 165,
    status: 'Healthy',
    notes: 'Uniform head closure across all four tiers; ready for cold-chain harvest.',
  },
  {
    id: 'BT-2602',
    crop: 'Lettuce',
    cultivar: 'Romaine Parris Island',
    zoneId: 'zone-d',
    rackNumber: 'D-03',
    plantingDate: '2026-10-22',
    plantCount: 420,
    targetCycleDays: 36,
    expectedHeadWeightG: 210,
    status: 'Healthy',
    notes: 'Crisp upright ribs; scheduled for morning cut tomorrow.',
  },
  {
    id: 'BT-2603',
    crop: 'Lettuce',
    cultivar: 'Crisphead Muir',
    zoneId: 'zone-c',
    rackNumber: 'C-02',
    plantingDate: '2026-10-28',
    plantCount: 460,
    targetCycleDays: 35,
    expectedHeadWeightG: 185,
    status: 'Healthy',
    notes: 'Strong leaf cupping; transitioning into finishing zone schedule.',
  },
  {
    id: 'BT-2604',
    crop: 'Lettuce',
    cultivar: 'Butterhead Rex',
    zoneId: 'zone-c',
    rackNumber: 'C-04',
    plantingDate: '2026-10-30',
    plantCount: 480,
    targetCycleDays: 34,
    expectedHeadWeightG: 165,
    status: 'Attention',
    notes: 'Mild EC elevation observed in manifold C-04; leaf area index 5% behind baseline.',
  },
  {
    id: 'BT-2605',
    crop: 'Lettuce',
    cultivar: 'Oakleaf Panisse',
    zoneId: 'zone-b',
    rackNumber: 'B-01',
    plantingDate: '2026-11-04',
    plantCount: 520,
    targetCycleDays: 32,
    expectedHeadWeightG: 150,
    status: 'Healthy',
    notes: 'Active vegetative expansion; balanced root oxygenation.',
  },
  {
    id: 'BT-2606',
    crop: 'Lettuce',
    cultivar: 'Lollo Rossa',
    zoneId: 'zone-b',
    rackNumber: 'B-04',
    plantingDate: '2026-11-07',
    plantCount: 440,
    targetCycleDays: 35,
    expectedHeadWeightG: 155,
    status: 'Critical',
    notes: 'Early tipburn markers on tier 3 after overnight humidity spike above 73% RH.',
  },
  {
    id: 'BT-2607',
    crop: 'Lettuce',
    cultivar: 'Romaine Parris Island',
    zoneId: 'zone-b',
    rackNumber: 'B-02',
    plantingDate: '2026-11-10',
    plantCount: 420,
    targetCycleDays: 36,
    expectedHeadWeightG: 205,
    status: 'Healthy',
    notes: 'Steady node spacing under 265 PPFD LED recipe.',
  },
  {
    id: 'BT-2608',
    crop: 'Lettuce',
    cultivar: 'Butterhead Rex',
    zoneId: 'zone-a',
    rackNumber: 'A-01',
    plantingDate: '2026-11-17',
    plantCount: 560,
    targetCycleDays: 34,
    expectedHeadWeightG: 165,
    status: 'Healthy',
    notes: 'True leaf emergence complete; ready for transplant to Zone B in 3 days.',
  },
  {
    id: 'BT-2609',
    crop: 'Lettuce',
    cultivar: 'Crisphead Muir',
    zoneId: 'zone-a',
    rackNumber: 'A-03',
    plantingDate: '2026-11-20',
    plantCount: 540,
    targetCycleDays: 35,
    expectedHeadWeightG: 185,
    status: 'Healthy',
    notes: '99.1% germination rate in rockwool plugs.',
  },
  {
    id: 'BT-2610',
    crop: 'Lettuce',
    cultivar: 'Oakleaf Panisse',
    zoneId: 'zone-a',
    rackNumber: 'A-05',
    plantingDate: '2026-11-23',
    plantCount: 560,
    targetCycleDays: 32,
    expectedHeadWeightG: 150,
    status: 'Healthy',
    notes: 'Cotyledon expansion on schedule under propagation dome.',
  },
  // Historical harvested batches
  {
    id: 'BT-2595',
    crop: 'Lettuce',
    cultivar: 'Butterhead Rex',
    zoneId: 'zone-d',
    rackNumber: 'D-02',
    plantingDate: '2026-10-08',
    plantCount: 480,
    targetCycleDays: 34,
    expectedHeadWeightG: 165,
    status: 'Harvested',
    notes: 'Completed Cycle 41 harvest.',
  },
  {
    id: 'BT-2596',
    crop: 'Lettuce',
    cultivar: 'Romaine Parris Island',
    zoneId: 'zone-d',
    rackNumber: 'D-04',
    plantingDate: '2026-10-10',
    plantCount: 420,
    targetCycleDays: 36,
    expectedHeadWeightG: 210,
    status: 'Harvested',
    notes: 'Completed Cycle 41 harvest.',
  },
  {
    id: 'BT-2597',
    crop: 'Lettuce',
    cultivar: 'Crisphead Muir',
    zoneId: 'zone-d',
    rackNumber: 'D-01',
    plantingDate: '2026-10-14',
    plantCount: 460,
    targetCycleDays: 35,
    expectedHeadWeightG: 185,
    status: 'Harvested',
    notes: 'Completed Cycle 42 harvest.',
  },
  {
    id: 'BT-2598',
    crop: 'Lettuce',
    cultivar: 'Oakleaf Panisse',
    zoneId: 'zone-d',
    rackNumber: 'D-03',
    plantingDate: '2026-10-19',
    plantCount: 500,
    targetCycleDays: 32,
    expectedHeadWeightG: 150,
    status: 'Harvested',
    notes: 'Completed Cycle 42 harvest.',
  },
];

// Deterministic growth curves per active batch
function buildBatchObservations(batch: CropBatch): GrowthObservation[] {
  const checkpoints = [4, 9, 14, 19, 24, 29, 33];
  const age = Math.max(1, Math.round((Date.parse(REFERENCE_DATE) - Date.parse(batch.plantingDate)) / 86400000));
  const statusMultiplier = batch.status === 'Critical' ? 0.86 : batch.status === 'Attention' ? 0.92 : 1.0;

  const points: GrowthObservation[] = [];
  for (const day of checkpoints) {
    if (day <= age) {
      const progress = Math.min(1, day / batch.targetCycleDays);
      const height = Number((2.2 + 16.8 * Math.pow(progress, 1.15) * statusMultiplier).toFixed(1));
      const leaves = Math.max(2, Math.round((2 + 20 * Math.pow(progress, 1.08)) * statusMultiplier));
      const canopy = Math.min(98, Math.round(12 + 84 * Math.pow(progress, 1.1) * statusMultiplier));
      const uniformity = batch.status === 'Critical' ? 83 : batch.status === 'Attention' ? 89 : 95;
      points.push({
        id: `obs-${batch.id}-d${day}`,
        batchId: batch.id,
        date: addDaysIso(batch.plantingDate, day),
        dayNumber: day,
        avgHeightCm: height,
        avgLeafCount: leaves,
        canopyCoveragePct: canopy,
        uniformityScorePct: uniformity,
        observerNote:
          day === checkpoints.filter((d) => d <= age).slice(-1)[0]
            ? batch.notes
            : undefined,
      });
    }
  }

  // Ensure even a 3-day-old batch has an observation
  if (points.length === 0) {
    points.push({
      id: `obs-${batch.id}-d${age}`,
      batchId: batch.id,
      date: REFERENCE_DATE,
      dayNumber: age,
      avgHeightCm: 2.1,
      avgLeafCount: 2,
      canopyCoveragePct: 11,
      uniformityScorePct: 97,
      observerNote: batch.notes,
    });
  }

  return points;
}

export const SEED_OBSERVATIONS: GrowthObservation[] = SEED_BATCHES.filter(
  (b) => b.status !== 'Harvested',
).flatMap(buildBatchObservations);

// Deterministic 14-day environmental readings across all 4 zones
function buildZoneReadings(): EnvironmentalReading[] {
  const readings: EnvironmentalReading[] = [];
  const baseProfiles: Record<
    string,
    { temp: number; rh: number; ppfd: number; ph: number; ec: number }
  > = {
    'zone-a': { temp: 21.2, rh: 70.0, ppfd: 205, ph: 5.8, ec: 1.25 },
    'zone-b': { temp: 20.4, rh: 64.5, ppfd: 268, ph: 5.9, ec: 1.56 },
    'zone-c': { temp: 19.3, rh: 60.0, ppfd: 305, ph: 5.95, ec: 1.68 },
    'zone-d': { temp: 18.2, rh: 56.0, ppfd: 285, ph: 6.0, ec: 1.58 },
  };

  for (let offset = -13; offset <= 0; offset++) {
    const date = addDaysIso(REFERENCE_DATE, offset);
    const wave = Math.sin((offset + 14) * 0.65);
    const wave2 = Math.cos((offset + 14) * 0.45);

    for (const zone of SEED_GROWING_ZONES) {
      const base = baseProfiles[zone.id];
      let temp = Number((base.temp + wave * 0.4).toFixed(1));
      let rh = Number((base.rh + wave2 * 2.2).toFixed(1));
      const ppfd = Math.round(base.ppfd + wave * 6);
      const ph = Number((base.ph + wave2 * 0.06).toFixed(2));
      let ec = Number((base.ec + wave * 0.05).toFixed(2));

      // Inject realistic deterministic anomalies matching active alerts
      if (zone.id === 'zone-b' && offset >= -2) {
        rh = offset === 0 ? 73.4 : 71.8;
      }
      if (zone.id === 'zone-c' && offset >= -1) {
        ec = offset === 0 ? 1.94 : 1.89;
      }

      readings.push({
        id: `env-${zone.id}-${date}`,
        zoneId: zone.id,
        timestamp: `${date} 08:00`,
        date,
        temperatureC: temp,
        humidityPct: rh,
        lightPpfd: ppfd,
        ph,
        ecMsCm: ec,
      });
    }
  }

  return readings;
}

export const SEED_ENVIRONMENTAL_READINGS: EnvironmentalReading[] = buildZoneReadings();

export const SEED_ALERTS: AnomalyAlert[] = [
  {
    id: 'alt-01',
    batchId: 'BT-2606',
    zoneId: 'zone-b',
    severity: 'Critical',
    category: 'Environmental Drift',
    title: 'Elevated Relative Humidity & Early Tipburn Risk',
    description:
      'Zone B reached 73.4% RH during dark-cycle transition, reducing calcium transpiration in Lollo Rossa rack B-04.',
    detectedAt: '2026-11-26 04:40',
    acknowledged: false,
  },
  {
    id: 'alt-02',
    batchId: 'BT-2604',
    zoneId: 'zone-c',
    severity: 'Attention',
    category: 'Growth Anomaly',
    title: 'EC Drift & Moderate Canopy Lag (-5% LAI)',
    description:
      'Zone C nutrient conductivity drifted to 1.94 mS/cm; BT-2604 Butterhead Rex leaf count is 1.5 leaves behind target curve.',
    detectedAt: '2026-11-25 18:15',
    acknowledged: false,
  },
  {
    id: 'alt-03',
    batchId: 'BT-2602',
    zoneId: 'zone-d',
    severity: 'Attention',
    category: 'Harvest Window',
    title: 'Optimal Harvest Window Opening Within 24 Hours',
    description:
      'Romaine Parris Island batch BT-2602 has reached 21 leaves and 18.4 cm average height; schedule crew harvest.',
    detectedAt: '2026-11-26 05:00',
    acknowledged: false,
  },
];

export const SEED_HARVEST_RECORDS: HarvestRecord[] = [
  {
    id: 'hr-01',
    batchId: 'BT-2595',
    cultivar: 'Butterhead Rex',
    zoneId: 'zone-d',
    rackNumber: 'D-02',
    plantingDate: '2026-10-08',
    predictedHarvestDate: '2026-11-11',
    actualHarvestDate: '2026-11-11',
    expectedYieldKg: 77.6,
    actualYieldKg: 79.2,
    plantedCount: 480,
    harvestedPlantCount: 472,
    qualityGrade: 'Grade A',
    notes: 'Uniform head density; zero tipburn defects.',
  },
  {
    id: 'hr-02',
    batchId: 'BT-2596',
    cultivar: 'Romaine Parris Island',
    zoneId: 'zone-d',
    rackNumber: 'D-04',
    plantingDate: '2026-10-10',
    predictedHarvestDate: '2026-11-15',
    actualHarvestDate: '2026-11-16',
    expectedYieldKg: 86.4,
    actualYieldKg: 84.1,
    plantedCount: 420,
    harvestedPlantCount: 408,
    qualityGrade: 'Grade A',
    notes: 'Harvested one day later to hit 205g target head weight.',
  },
  {
    id: 'hr-03',
    batchId: 'BT-2597',
    cultivar: 'Crisphead Muir',
    zoneId: 'zone-d',
    rackNumber: 'D-01',
    plantingDate: '2026-10-14',
    predictedHarvestDate: '2026-11-18',
    actualHarvestDate: '2026-11-18',
    expectedYieldKg: 83.4,
    actualYieldKg: 85.0,
    plantedCount: 460,
    harvestedPlantCount: 454,
    qualityGrade: 'Grade A',
    notes: 'Strong crisp heart formation under 290 PPFD.',
  },
  {
    id: 'hr-04',
    batchId: 'BT-2598',
    cultivar: 'Oakleaf Panisse',
    zoneId: 'zone-d',
    rackNumber: 'D-03',
    plantingDate: '2026-10-19',
    predictedHarvestDate: '2026-11-20',
    actualHarvestDate: '2026-11-21',
    expectedYieldKg: 73.5,
    actualYieldKg: 71.8,
    plantedCount: 500,
    harvestedPlantCount: 486,
    qualityGrade: 'Grade B',
    notes: 'Minor outer leaf trimming required on bottom tier.',
  },
];
