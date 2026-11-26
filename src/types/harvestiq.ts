export type CropSpecies = 'Lettuce';

export type LettuceCultivar =
  | 'Butterhead Rex'
  | 'Romaine Parris Island'
  | 'Crisphead Muir'
  | 'Oakleaf Panisse'
  | 'Lollo Rossa';

export type GrowthStage =
  | 'Early Growth'
  | 'Vegetative Growth'
  | 'Approaching Maturity'
  | 'Ready for Harvest';

export type BatchHealthStatus = 'Healthy' | 'Attention' | 'Critical' | 'Harvested';

export type AlertSeverity = 'Attention' | 'Critical';

export type AlertCategory = 'Growth Anomaly' | 'Environmental Drift' | 'Harvest Window';

export interface FarmProfile {
  id: string;
  name: string;
  location: string;
  facilityAreaSqm: number;
  farmingMethod: 'Hydroponic NFT & Vertical Rack';
  primaryCrop: CropSpecies;
  managerName: string;
  managerRole: string;
  managerEmail: string;
  timezone: string;
  referenceDate: string; // ISO YYYY-MM-DD for deterministic demonstration state
}

export interface GrowingZone {
  id: string;
  code: string;
  name: string;
  focusStage: string;
  rackCount: number;
  capacityPlants: number;
  targetTempC: [number, number];
  targetHumidityPct: [number, number];
  targetLightPpfd: [number, number];
  targetPh: [number, number];
  targetEcMsCm: [number, number];
}

export interface CropBatch {
  id: string;
  crop: CropSpecies;
  cultivar: LettuceCultivar;
  zoneId: string;
  rackNumber: string;
  plantingDate: string; // ISO YYYY-MM-DD
  plantCount: number;
  targetCycleDays: number;
  expectedHeadWeightG: number;
  status: BatchHealthStatus;
  notes?: string;
}

export interface GrowthObservation {
  id: string;
  batchId: string;
  date: string; // ISO YYYY-MM-DD
  dayNumber: number;
  avgHeightCm: number;
  avgLeafCount: number;
  canopyCoveragePct: number;
  uniformityScorePct: number;
  observerNote?: string;
}

export interface EnvironmentalReading {
  id: string;
  zoneId: string;
  timestamp: string; // ISO datetime or YYYY-MM-DD HH:mm
  date: string; // YYYY-MM-DD
  temperatureC: number;
  humidityPct: number;
  lightPpfd: number;
  ph: number;
  ecMsCm: number;
}

export interface PredictionHistoryEntry {
  date: string;
  predictedHarvestDate: string;
  estimatedYieldKg: number;
  confidenceRangeDays: number;
}

export interface HarvestPrediction {
  batchId: string;
  predictedHarvestDate: string;
  harvestWindowStart: string;
  harvestWindowEnd: string;
  daysRemaining: number;
  growthStage: GrowthStage;
  confidenceLowerDays: number;
  confidenceUpperDays: number;
  estimatedYieldKg: number;
  yieldRangeKg: [number, number];
  readinessPct: number;
  keyFactors: string[];
  isDemonstration: true;
  history: PredictionHistoryEntry[];
}

export interface YieldForecastPoint {
  date: string;
  label: string;
  estimatedYieldKg: number;
  lowerBoundKg: number;
  upperBoundKg: number;
  batchCount: number;
  batchIds: string[];
}

export interface AnomalyAlert {
  id: string;
  batchId?: string;
  zoneId: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  detectedAt: string;
  acknowledged: boolean;
}

export interface HarvestRecord {
  id: string;
  batchId: string;
  cultivar: LettuceCultivar;
  zoneId: string;
  rackNumber: string;
  plantingDate: string;
  predictedHarvestDate: string;
  actualHarvestDate: string;
  expectedYieldKg: number;
  actualYieldKg: number;
  plantedCount: number;
  harvestedPlantCount: number;
  qualityGrade: 'Grade A' | 'Grade B';
  notes: string;
}

export interface PredictionCriteriaConfig {
  earlyMaxAgePct: number; // % of cycle e.g. 30
  vegetativeMaxAgePct: number; // e.g. 70
  approachingDaysThreshold: number; // days remaining <= e.g. 7
  readyDaysThreshold: number; // days remaining <= e.g. 2
  minLeafCountForReady: number; // e.g. 18
  minHeightCmForReady: number; // e.g. 16.5
  allowEnvironmentPenaltyAdjustment: boolean;
}
