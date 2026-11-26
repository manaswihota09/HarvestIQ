import React, { useEffect, useState } from 'react';
import { useFarmData } from '../../context/FarmDataContext';
import { CropBatch } from '../../types/harvestiq';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

interface RecordHarvestModalProps {
  open: boolean;
  onClose: () => void;
  batch: CropBatch | null;
}

export function RecordHarvestModal({ open, onClose, batch }: RecordHarvestModalProps) {
  const { state, predictions, recordHarvest } = useFarmData();
  const { showToast } = useToast();

  const [actualHarvestDate, setActualHarvestDate] = useState(state.farmProfile.referenceDate);
  const [actualYieldKg, setActualYieldKg] = useState('');
  const [harvestedPlantCount, setHarvestedPlantCount] = useState('');
  const [qualityGrade, setQualityGrade] = useState<'Grade A' | 'Grade B'>('Grade A');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !batch) return;
    const pred = predictions[batch.id];
    setActualHarvestDate(state.farmProfile.referenceDate);
    setActualYieldKg(pred ? String(pred.estimatedYieldKg) : '75.0');
    setHarvestedPlantCount(String(Math.round(batch.plantCount * 0.98)));
    setQualityGrade('Grade A');
    setNotes('');
    setErrors({});
  }, [open, batch, predictions, state.farmProfile.referenceDate]);

  if (!batch) return null;

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!actualHarvestDate || actualHarvestDate < batch.plantingDate) {
      nextErrors.actualHarvestDate = 'Harvest date cannot precede planting date.';
    }
    const yieldNum = Number(actualYieldKg);
    if (Number.isNaN(yieldNum) || yieldNum <= 0 || yieldNum > 2500) {
      nextErrors.actualYieldKg = 'Enter a valid harvested weight in kg (> 0).';
    }
    const countNum = Number(harvestedPlantCount);
    if (!Number.isInteger(countNum) || countNum <= 0 || countNum > batch.plantCount) {
      nextErrors.harvestedPlantCount = `Harvested plants must be between 1 and ${batch.plantCount}.`;
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    recordHarvest({
      batchId: batch.id,
      actualHarvestDate,
      actualYieldKg: Number(Number(actualYieldKg).toFixed(1)),
      harvestedPlantCount: Number(harvestedPlantCount),
      qualityGrade,
      notes: notes.trim() || 'Recorded via Harvest Management.',
    });
    showToast(`Marked batch ${batch.id} as harvested (${actualYieldKg} kg).`);
    onClose();
  };

  const pred = predictions[batch.id];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Record Harvest · ${batch.id}`}
      subtitle={`${batch.cultivar} · Rack ${batch.rackNumber} · Expected ${pred?.estimatedYieldKg ?? 0} kg`}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-[#202923]" htmlFor="harvest-date">
              Actual Harvest Date
            </label>
            <input
              id="harvest-date"
              type="date"
              value={actualHarvestDate}
              min={batch.plantingDate}
              onChange={(e) => setActualHarvestDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#DFE6DD] bg-white px-3 py-2 font-mono text-sm text-[#202923] focus:border-[#153F32] focus:outline-none"
            />
            {errors.actualHarvestDate && (
              <p className="mt-1 text-xs text-[#B91C1C]">{errors.actualHarvestDate}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#202923]" htmlFor="harvest-grade">
              Quality Grade
            </label>
            <select
              id="harvest-grade"
              value={qualityGrade}
              onChange={(e) => setQualityGrade(e.target.value as 'Grade A' | 'Grade B')}
              className="mt-1 w-full rounded-lg border border-[#DFE6DD] bg-white px-3 py-2 text-sm text-[#202923] focus:border-[#153F32] focus:outline-none"
            >
              <option value="Grade A">Grade A (Retail Ready)</option>
              <option value="Grade B">Grade B (Trimmed / Foodservice)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-[#202923]" htmlFor="harvest-weight">
              Actual Harvested Weight (kg)
            </label>
            <input
              id="harvest-weight"
              type="number"
              step="0.1"
              value={actualYieldKg}
              onChange={(e) => setActualYieldKg(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#DFE6DD] bg-white px-3 py-2 font-mono text-sm text-[#202923] tabular-nums focus:border-[#153F32] focus:outline-none"
            />
            {errors.actualYieldKg && (
              <p className="mt-1 text-xs text-[#B91C1C]">{errors.actualYieldKg}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#202923]" htmlFor="harvest-plants">
              Harvested Plants (of {batch.plantCount})
            </label>
            <input
              id="harvest-plants"
              type="number"
              value={harvestedPlantCount}
              onChange={(e) => setHarvestedPlantCount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#DFE6DD] bg-white px-3 py-2 font-mono text-sm text-[#202923] tabular-nums focus:border-[#153F32] focus:outline-none"
            />
            {errors.harvestedPlantCount && (
              <p className="mt-1 text-xs text-[#B91C1C]">{errors.harvestedPlantCount}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#202923]" htmlFor="harvest-notes">
            Harvest Notes
          </label>
          <textarea
            id="harvest-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Head crispness, trim waste, cold-room transfer time..."
            className="mt-1 w-full rounded-lg border border-[#DFE6DD] bg-white px-3 py-2 text-sm text-[#202923] focus:border-[#153F32] focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#EDF2EB] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#DFE6DD] bg-white px-4 py-2 text-sm font-medium text-[#202923] hover:bg-[#F7F9F5]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#153F32] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F2F25]"
          >
            Confirm Harvest
          </button>
        </div>
      </form>
    </Modal>
  );
}
