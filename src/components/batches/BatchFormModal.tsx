import React, { useEffect, useState } from 'react';
import { useFarmData } from '../../context/FarmDataContext';
import { BatchHealthStatus, CropBatch, LettuceCultivar } from '../../types/harvestiq';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

const CULTIVARS: LettuceCultivar[] = [
  'Butterhead Rex',
  'Romaine Parris Island',
  'Crisphead Muir',
  'Oakleaf Panisse',
  'Lollo Rossa',
];

const DEFAULT_WEIGHTS: Record<LettuceCultivar, number> = {
  'Butterhead Rex': 165,
  'Romaine Parris Island': 210,
  'Crisphead Muir': 185,
  'Oakleaf Panisse': 150,
  'Lollo Rossa': 155,
};

const DEFAULT_CYCLES: Record<LettuceCultivar, number> = {
  'Butterhead Rex': 34,
  'Romaine Parris Island': 36,
  'Crisphead Muir': 35,
  'Oakleaf Panisse': 32,
  'Lollo Rossa': 35,
};

interface BatchFormModalProps {
  open: boolean;
  onClose: () => void;
  editingBatch?: CropBatch | null;
}

export function BatchFormModal({ open, onClose, editingBatch }: BatchFormModalProps) {
  const { state, createBatch, updateBatch } = useFarmData();
  const { showToast } = useToast();

  const [batchId, setBatchId] = useState('');
  const [cultivar, setCultivar] = useState<LettuceCultivar>('Butterhead Rex');
  const [zoneId, setZoneId] = useState('zone-a');
  const [rackNumber, setRackNumber] = useState('A-02');
  const [plantingDate, setPlantingDate] = useState(state.farmProfile.referenceDate);
  const [plantCount, setPlantCount] = useState('480');
  const [targetCycleDays, setTargetCycleDays] = useState('34');
  const [expectedHeadWeightG, setExpectedHeadWeightG] = useState('165');
  const [status, setStatus] = useState<BatchHealthStatus>('Healthy');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (editingBatch) {
      setBatchId(editingBatch.id);
      setCultivar(editingBatch.cultivar);
      setZoneId(editingBatch.zoneId);
      setRackNumber(editingBatch.rackNumber);
      setPlantingDate(editingBatch.plantingDate);
      setPlantCount(String(editingBatch.plantCount));
      setTargetCycleDays(String(editingBatch.targetCycleDays));
      setExpectedHeadWeightG(String(editingBatch.expectedHeadWeightG));
      setStatus(editingBatch.status);
      setNotes(editingBatch.notes || '');
    } else {
      const nextNum =
        state.batches.reduce((max, b) => {
          const match = b.id.match(/(\d+)$/);
          return match ? Math.max(max, Number(match[1])) : max;
        }, 2610) + 1;
      setBatchId(`BT-${nextNum}`);
      setCultivar('Butterhead Rex');
      setZoneId('zone-a');
      setRackNumber('A-02');
      setPlantingDate(state.farmProfile.referenceDate);
      setPlantCount('480');
      setTargetCycleDays('34');
      setExpectedHeadWeightG('165');
      setStatus('Healthy');
      setNotes('');
    }
    setErrors({});
  }, [open, editingBatch, state.batches, state.farmProfile.referenceDate]);

  const handleCultivarChange = (next: LettuceCultivar) => {
    setCultivar(next);
    if (!editingBatch) {
      setExpectedHeadWeightG(String(DEFAULT_WEIGHTS[next]));
      setTargetCycleDays(String(DEFAULT_CYCLES[next]));
    }
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    const trimmedId = batchId.trim().toUpperCase();
    if (!trimmedId || !/^[A-Z0-9-]+$/.test(trimmedId)) {
      nextErrors.batchId = 'Enter an alphanumeric batch ID (e.g. BT-2611).';
    } else if (!editingBatch && state.batches.some((b) => b.id === trimmedId)) {
      nextErrors.batchId = 'A batch with this ID already exists.';
    }

    if (!rackNumber.trim()) {
      nextErrors.rackNumber = 'Rack identifier is required.';
    }
    if (!plantingDate || plantingDate > state.farmProfile.referenceDate) {
      nextErrors.plantingDate = 'Planting date cannot be in the future.';
    }
    const countNum = Number(plantCount);
    if (!Number.isInteger(countNum) || countNum < 10 || countNum > 5000) {
      nextErrors.plantCount = 'Plant count must be between 10 and 5,000.';
    }
    const cycleNum = Number(targetCycleDays);
    if (!Number.isInteger(cycleNum) || cycleNum < 20 || cycleNum > 65) {
      nextErrors.targetCycleDays = 'Cycle days must be between 20 and 65 days.';
    }
    const weightNum = Number(expectedHeadWeightG);
    if (Number.isNaN(weightNum) || weightNum < 50 || weightNum > 600) {
      nextErrors.expectedHeadWeightG = 'Expected head weight must be 50–600 g.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      id: batchId.trim().toUpperCase(),
      cultivar,
      zoneId,
      rackNumber: rackNumber.trim().toUpperCase(),
      plantingDate,
      plantCount: Number(plantCount),
      targetCycleDays: Number(targetCycleDays),
      expectedHeadWeightG: Number(expectedHeadWeightG),
      status,
      notes: notes.trim(),
    };

    if (editingBatch) {
      updateBatch(editingBatch.id, payload);
      showToast(`Updated batch ${editingBatch.id}.`);
    } else {
      createBatch(payload);
      showToast(`Registered new lettuce batch ${payload.id}.`);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingBatch ? `Edit Batch ${editingBatch.id}` : 'Register New Lettuce Batch'}
      subtitle="Hydroponic vertical farm batch tracking record"
      maxWidthClass="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-[#202923]" htmlFor="batch-id-input">
              Batch ID
            </label>
            <input
              id="batch-id-input"
              type="text"
              value={batchId}
              disabled={Boolean(editingBatch)}
              onChange={(e) => setBatchId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#DFE6DD] bg-white px-3 py-2 font-mono text-sm text-[#202923] disabled:bg-[#F7F9F5] disabled:text-[#78847D] focus:border-[#153F32] focus:outline-none"
            />
            {errors.batchId && <p className="mt-1 text-xs text-[#B91C1C]">{errors.batchId}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#202923]" htmlFor="cultivar-select">
              Lettuce Cultivar
            </label>
            <select
              id="cultivar-select"
              value={cultivar}
              onChange={(e) => handleCultivarChange(e.target.value as LettuceCultivar)}
              className="mt-1 w-full rounded-lg border border-[#DFE6DD] bg-white px-3 py-2 text-sm text-[#202923] focus:border-[#153F32] focus:outline-none"
            >
              {CULTIVARS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-[#202923]" htmlFor="zone-select">
              Growing Zone
            </label>
            <select
              id="zone-select"
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#DFE6DD] bg-white px-3 py-2 text-sm text-[#202923] focus:border-[#153F32] focus:outline-none"
            >
              {state.zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.code} — {z.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#202923]" htmlFor="rack-input">
              Rack Number
            </label>
            <input
              id="rack-input"
              type="text"
              value={rackNumber}
              onChange={(e) => setRackNumber(e.target.value)}
              placeholder="e.g. B-03"
              className="mt-1 w-full rounded-lg border border-[#DFE6DD] bg-white px-3 py-2 font-mono text-sm text-[#202923] focus:border-[#153F32] focus:outline-none"
            />
            {errors.rackNumber && (
              <p className="mt-1 text-xs text-[#B91C1C]">{errors.rackNumber}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-[#202923]" htmlFor="planting-date">
              Planting Date
            </label>
            <input
              id="planting-date"
              type="date"
              value={plantingDate}
              max={state.farmProfile.referenceDate}
              onChange={(e) => setPlantingDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#DFE6DD] bg-white px-3 py-2 font-mono text-sm text-[#202923] focus:border-[#153F32] focus:outline-none"
            />
            {errors.plantingDate && (
              <p className="mt-1 text-xs text-[#B91C1C]">{errors.plantingDate}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#202923]" htmlFor="plant-count">
              Plant Count
            </label>
            <input
              id="plant-count"
              type="number"
              min={10}
              max={5000}
              value={plantCount}
              onChange={(e) => setPlantCount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#DFE6DD] bg-white px-3 py-2 font-mono text-sm text-[#202923] tabular-nums focus:border-[#153F32] focus:outline-none"
            />
            {errors.plantCount && (
              <p className="mt-1 text-xs text-[#B91C1C]">{errors.plantCount}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#202923]" htmlFor="cycle-days">
              Target Cycle (days)
            </label>
            <input
              id="cycle-days"
              type="number"
              min={20}
              max={65}
              value={targetCycleDays}
              onChange={(e) => setTargetCycleDays(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#DFE6DD] bg-white px-3 py-2 font-mono text-sm text-[#202923] tabular-nums focus:border-[#153F32] focus:outline-none"
            />
            {errors.targetCycleDays && (
              <p className="mt-1 text-xs text-[#B91C1C]">{errors.targetCycleDays}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-[#202923]" htmlFor="head-weight">
              Target Head Weight (g)
            </label>
            <input
              id="head-weight"
              type="number"
              min={50}
              max={600}
              value={expectedHeadWeightG}
              onChange={(e) => setExpectedHeadWeightG(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#DFE6DD] bg-white px-3 py-2 font-mono text-sm text-[#202923] tabular-nums focus:border-[#153F32] focus:outline-none"
            />
            {errors.expectedHeadWeightG && (
              <p className="mt-1 text-xs text-[#B91C1C]">{errors.expectedHeadWeightG}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#202923]" htmlFor="health-status">
              Current Status
            </label>
            <select
              id="health-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as BatchHealthStatus)}
              className="mt-1 w-full rounded-lg border border-[#DFE6DD] bg-white px-3 py-2 text-sm text-[#202923] focus:border-[#153F32] focus:outline-none"
            >
              <option value="Healthy">Healthy</option>
              <option value="Attention">Attention</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#202923]" htmlFor="batch-notes">
            Grower Notes (Optional)
          </label>
          <textarea
            id="batch-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Canopy uniformity, nutrient schedule, or inspection notes..."
            className="mt-1 w-full rounded-lg border border-[#DFE6DD] bg-white px-3 py-2 text-sm text-[#202923] focus:border-[#153F32] focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#EDF2EB] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#DFE6DD] bg-white px-4 py-2 text-sm font-medium text-[#202923] transition-colors hover:bg-[#F7F9F5]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#153F32] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0F2F25]"
          >
            {editingBatch ? 'Save Changes' : 'Register Batch'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
