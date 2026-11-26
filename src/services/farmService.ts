import {
  SEED_ALERTS,
  SEED_BATCHES,
  SEED_ENVIRONMENTAL_READINGS,
  SEED_FARM_PROFILE,
  SEED_GROWING_ZONES,
  SEED_HARVEST_RECORDS,
  SEED_OBSERVATIONS,
  SEED_PREDICTION_CRITERIA,
} from '../data/mockDataset';
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

const STORAGE_KEY = 'harvestiq_stage1_state_v1';

export interface HarvestIQStoreState {
  farmProfile: FarmProfile;
  zones: GrowingZone[];
  batches: CropBatch[];
  observations: GrowthObservation[];
  environmentalReadings: EnvironmentalReading[];
  alerts: AnomalyAlert[];
  harvestRecords: HarvestRecord[];
  predictionCriteria: PredictionCriteriaConfig;
}

function getSeedState(): HarvestIQStoreState {
  return {
    farmProfile: structuredClone(SEED_FARM_PROFILE),
    zones: structuredClone(SEED_GROWING_ZONES),
    batches: structuredClone(SEED_BATCHES),
    observations: structuredClone(SEED_OBSERVATIONS),
    environmentalReadings: structuredClone(SEED_ENVIRONMENTAL_READINGS),
    alerts: structuredClone(SEED_ALERTS),
    harvestRecords: structuredClone(SEED_HARVEST_RECORDS),
    predictionCriteria: structuredClone(SEED_PREDICTION_CRITERIA),
  };
}

export const farmService = {
  loadState(): HarvestIQStoreState {
    if (typeof window === 'undefined') {
      return getSeedState();
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const seed = getSeedState();
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
        return seed;
      }
      const parsed = JSON.parse(raw) as Partial<HarvestIQStoreState>;
      const seed = getSeedState();
      return {
        farmProfile: parsed.farmProfile ?? seed.farmProfile,
        zones: parsed.zones && parsed.zones.length > 0 ? parsed.zones : seed.zones,
        batches: parsed.batches ?? seed.batches,
        observations: parsed.observations ?? seed.observations,
        environmentalReadings: parsed.environmentalReadings ?? seed.environmentalReadings,
        alerts: parsed.alerts ?? seed.alerts,
        harvestRecords: parsed.harvestRecords ?? seed.harvestRecords,
        predictionCriteria: parsed.predictionCriteria ?? seed.predictionCriteria,
      };
    } catch {
      return getSeedState();
    }
  },

  saveState(state: HarvestIQStoreState): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors cleanly in demo mode
    }
  },

  resetToSeed(): HarvestIQStoreState {
    const seed = getSeedState();
    this.saveState(seed);
    return seed;
  },
};
