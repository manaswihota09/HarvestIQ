import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { farmService, HarvestIQStoreState } from '../services/farmService';
import {
  AnomalyAlert,
  CropBatch,
  FarmProfile,
  GrowthObservation,
  HarvestPrediction,
  HarvestRecord,
  PredictionCriteriaConfig,
} from '../types/harvestiq';
import { computeDemoHarvestPrediction } from '../utils/calculations';

interface FarmDataContextValue {
  state: HarvestIQStoreState;
  predictions: Record<string, HarvestPrediction>;
  activeBatches: CropBatch[];
  unreadAlertsCount: number;
  createBatch: (batch: Omit<CropBatch, 'crop'>) => void;
  updateBatch: (id: string, updates: Partial<Omit<CropBatch, 'id' | 'crop'>>) => void;
  deleteBatch: (id: string) => void;
  addObservation: (observation: Omit<GrowthObservation, 'id'>) => void;
  recordHarvest: (payload: {
    batchId: string;
    actualHarvestDate: string;
    actualYieldKg: number;
    harvestedPlantCount: number;
    qualityGrade: 'Grade A' | 'Grade B';
    notes: string;
  }) => void;
  acknowledgeAlert: (alertId: string) => void;
  acknowledgeAllAlerts: () => void;
  updatePredictionCriteria: (updates: Partial<PredictionCriteriaConfig>) => void;
  updateFarmProfile: (updates: Partial<FarmProfile>) => void;
  resetDemoData: () => void;
}

const FarmDataContext = createContext<FarmDataContextValue | null>(null);

export function FarmDataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<HarvestIQStoreState>(() => farmService.loadState());

  const persistUpdate = useCallback(
    (updater: (prev: HarvestIQStoreState) => HarvestIQStoreState) => {
      setState((prev) => {
        const next = updater(prev);
        farmService.saveState(next);
        return next;
      });
    },
    [],
  );

  const createBatch = useCallback(
    (batchInput: Omit<CropBatch, 'crop'>) => {
      const newBatch: CropBatch = {
        ...batchInput,
        crop: 'Lettuce',
      };
      const initialObs: GrowthObservation = {
        id: `obs-${newBatch.id}-init`,
        batchId: newBatch.id,
        date: state.farmProfile.referenceDate,
        dayNumber: Math.max(
          1,
          Math.round(
            (Date.parse(state.farmProfile.referenceDate) - Date.parse(newBatch.plantingDate)) /
              86400000,
          ),
        ),
        avgHeightCm: 2.5,
        avgLeafCount: 3,
        canopyCoveragePct: 14,
        uniformityScorePct: 96,
        observerNote: newBatch.notes || 'Registered in demonstration workspace.',
      };
      persistUpdate((prev) => ({
        ...prev,
        batches: [newBatch, ...prev.batches],
        observations: [...prev.observations, initialObs],
      }));
    },
    [persistUpdate, state.farmProfile.referenceDate],
  );

  const updateBatch = useCallback(
    (id: string, updates: Partial<Omit<CropBatch, 'id' | 'crop'>>) => {
      persistUpdate((prev) => ({
        ...prev,
        batches: prev.batches.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      }));
    },
    [persistUpdate],
  );

  const deleteBatch = useCallback(
    (id: string) => {
      persistUpdate((prev) => ({
        ...prev,
        batches: prev.batches.filter((b) => b.id !== id),
        observations: prev.observations.filter((o) => o.batchId !== id),
        alerts: prev.alerts.filter((a) => a.batchId !== id),
      }));
    },
    [persistUpdate],
  );

  const addObservation = useCallback(
    (obsInput: Omit<GrowthObservation, 'id'>) => {
      const obs: GrowthObservation = {
        ...obsInput,
        id: `obs-${obsInput.batchId}-${Date.now()}`,
      };
      persistUpdate((prev) => ({
        ...prev,
        observations: [...prev.observations, obs],
      }));
    },
    [persistUpdate],
  );

  const recordHarvest = useCallback(
    (payload: {
      batchId: string;
      actualHarvestDate: string;
      actualYieldKg: number;
      harvestedPlantCount: number;
      qualityGrade: 'Grade A' | 'Grade B';
      notes: string;
    }) => {
      persistUpdate((prev) => {
        const batch = prev.batches.find((b) => b.id === payload.batchId);
        if (!batch) return prev;
        const pred = computeDemoHarvestPrediction(
          batch,
          prev.observations,
          prev.environmentalReadings,
          prev.zones,
          prev.predictionCriteria,
          prev.farmProfile.referenceDate,
        );
        const newRecord: HarvestRecord = {
          id: `hr-${Date.now()}`,
          batchId: batch.id,
          cultivar: batch.cultivar,
          zoneId: batch.zoneId,
          rackNumber: batch.rackNumber,
          plantingDate: batch.plantingDate,
          predictedHarvestDate: pred.predictedHarvestDate,
          actualHarvestDate: payload.actualHarvestDate,
          expectedYieldKg: pred.estimatedYieldKg,
          actualYieldKg: payload.actualYieldKg,
          plantedCount: batch.plantCount,
          harvestedPlantCount: payload.harvestedPlantCount,
          qualityGrade: payload.qualityGrade,
          notes: payload.notes,
        };
        return {
          ...prev,
          batches: prev.batches.map((b) =>
            b.id === batch.id ? { ...b, status: 'Harvested' } : b,
          ),
          harvestRecords: [newRecord, ...prev.harvestRecords],
          alerts: prev.alerts.map((a) =>
            a.batchId === batch.id ? { ...a, acknowledged: true } : a,
          ),
        };
      });
    },
    [persistUpdate],
  );

  const acknowledgeAlert = useCallback(
    (alertId: string) => {
      persistUpdate((prev) => ({
        ...prev,
        alerts: prev.alerts.map((a) =>
          a.id === alertId ? { ...a, acknowledged: true } : a,
        ),
      }));
    },
    [persistUpdate],
  );

  const acknowledgeAllAlerts = useCallback(() => {
    persistUpdate((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a: AnomalyAlert) => ({ ...a, acknowledged: true })),
    }));
  }, [persistUpdate]);

  const updatePredictionCriteria = useCallback(
    (updates: Partial<PredictionCriteriaConfig>) => {
      persistUpdate((prev) => ({
        ...prev,
        predictionCriteria: { ...prev.predictionCriteria, ...updates },
      }));
    },
    [persistUpdate],
  );

  const updateFarmProfile = useCallback(
    (updates: Partial<FarmProfile>) => {
      persistUpdate((prev) => ({
        ...prev,
        farmProfile: { ...prev.farmProfile, ...updates },
      }));
    },
    [persistUpdate],
  );

  const resetDemoData = useCallback(() => {
    const seed = farmService.resetToSeed();
    setState(seed);
  }, []);

  const predictions = useMemo(() => {
    const map: Record<string, HarvestPrediction> = {};
    for (const batch of state.batches) {
      map[batch.id] = computeDemoHarvestPrediction(
        batch,
        state.observations,
        state.environmentalReadings,
        state.zones,
        state.predictionCriteria,
        state.farmProfile.referenceDate,
      );
    }
    return map;
  }, [
    state.batches,
    state.observations,
    state.environmentalReadings,
    state.zones,
    state.predictionCriteria,
    state.farmProfile.referenceDate,
  ]);

  const activeBatches = useMemo(
    () => state.batches.filter((b) => b.status !== 'Harvested'),
    [state.batches],
  );

  const unreadAlertsCount = useMemo(
    () => state.alerts.filter((a) => !a.acknowledged).length,
    [state.alerts],
  );

  const value: FarmDataContextValue = {
    state,
    predictions,
    activeBatches,
    unreadAlertsCount,
    createBatch,
    updateBatch,
    deleteBatch,
    addObservation,
    recordHarvest,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    updatePredictionCriteria,
    updateFarmProfile,
    resetDemoData,
  };

  return <FarmDataContext.Provider value={value}>{children}</FarmDataContext.Provider>;
}

export function useFarmData(): FarmDataContextValue {
  const ctx = useContext(FarmDataContext);
  if (!ctx) {
    throw new Error('useFarmData must be used within a FarmDataProvider');
  }
  return ctx;
}
