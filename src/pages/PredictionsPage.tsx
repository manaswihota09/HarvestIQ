import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SlidersHorizontal, ArrowRight } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Modal } from '../components/ui/Modal';
import { SectionCard } from '../components/ui/SectionCard';
import { HealthStatusLabel } from '../components/ui/StatusBadge';
import { useFarmData } from '../context/FarmDataContext';
import { CropBatch, GrowthStage } from '../types/harvestiq';
import {
  aggregateYieldForecastByDate,
  calculateCropAgeDays,
  getLatestObservation,
} from '../utils/calculations';
import { formatDateShort, formatWeightKg } from '../utils/formatters';

const MATURITY_ORDER: GrowthStage[] = [
  'Ready for Harvest',
  'Approaching Maturity',
  'Vegetative Growth',
  'Early Growth',
];

const STAGE_COLORS: Record<GrowthStage, string> = {
  'Ready for Harvest': '#153F32',
  'Approaching Maturity': '#D7A65B',
  'Vegetative Growth': '#287A55',
  'Early Growth': '#78847D',
};

export function PredictionsPage() {
  const { state, activeBatches, predictions, updatePredictionCriteria } = useFarmData();

  const [zoneFilter, setZoneFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState<'all' | GrowthStage>('all');
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<CropBatch | null>(null);

  const filteredBatches = useMemo(() => {
    return activeBatches.filter((batch) => {
      if (zoneFilter !== 'all' && batch.zoneId !== zoneFilter) return false;
      const pred = predictions[batch.id];
      if (stageFilter !== 'all' && pred?.growthStage !== stageFilter) return false;
      return true;
    });
  }, [activeBatches, zoneFilter, stageFilter, predictions]);

  const readinessDistribution = useMemo(() => {
    return MATURITY_ORDER.map((stage) => {
      const stageBatches = filteredBatches.filter(
        (b) => predictions[b.id]?.growthStage === stage,
      );
      const totalYield = stageBatches.reduce(
        (sum, b) => sum + (predictions[b.id]?.estimatedYieldKg ?? 0),
        0,
      );
      return {
        stage,
        count: stageBatches.length,
        yieldKg: Number(totalYield.toFixed(1)),
        color: STAGE_COLORS[stage],
      };
    });
  }, [filteredBatches, predictions]);

  const yieldByDate = useMemo(() => {
    return aggregateYieldForecastByDate(filteredBatches, predictions);
  }, [filteredBatches, predictions]);

  // Maturity timeline data sorted by readinessPct descending
  const timelineBatches = useMemo(() => {
    return [...filteredBatches].sort(
      (a, b) =>
        (predictions[a.id]?.daysRemaining ?? 99) -
        (predictions[b.id]?.daysRemaining ?? 99),
    );
  }, [filteredBatches, predictions]);

  // Grouped by maturity status
  const groupedByStage = useMemo(() => {
    const groups: Record<GrowthStage, CropBatch[]> = {
      'Ready for Harvest': [],
      'Approaching Maturity': [],
      'Vegetative Growth': [],
      'Early Growth': [],
    };
    for (const batch of timelineBatches) {
      const stage = predictions[batch.id]?.growthStage;
      if (stage) groups[stage].push(batch);
    }
    return groups;
  }, [timelineBatches, predictions]);

  const criteria = state.predictionCriteria;

  return (
    <AppShell
      title="Harvest Readiness & Yield Predictions"
      breadcrumb="Harvest Predictions"
      actions={
        <button
          type="button"
          onClick={() => setCriteriaOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border border-[#DFE6DD] bg-white px-3.5 py-2 text-sm font-medium text-[#202923] transition-colors hover:bg-[#F7F9F5] whitespace-nowrap"
        >
          <SlidersHorizontal className="h-4 w-4 text-[#153F32]" />
          <span>{criteriaOpen ? 'Hide Criteria Config' : 'Configure Maturity Criteria'}</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Mandatory Non-ML Demonstration Label */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#D7A65B] bg-[#FDF6E9] px-4 py-3 text-[#7D5112]">
          <p className="text-xs font-bold tracking-wide">
            DEMONSTRATION MODEL – NOT VALIDATED WITH REAL FARM DATA
          </p>
          <p className="text-xs">
            Estimates derive from configurable Stage 1 agronomic rules (planting age, leaf count,
            height, and zone drift offsets).
          </p>
        </div>

        {/* Configurable Criteria Panel */}
        {criteriaOpen && (
          <SectionCard
            title="Configurable Maturity Classification Criteria"
            subtitle="Adjust threshold parameters below to immediately recompute maturity stage groupings across active batches"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="block text-xs font-medium text-[#202923]" htmlFor="crit-ready-days">
                  Ready Window (≤ days)
                </label>
                <input
                  id="crit-ready-days"
                  type="number"
                  min={0}
                  max={7}
                  value={criteria.readyDaysThreshold}
                  onChange={(e) =>
                    updatePredictionCriteria({ readyDaysThreshold: Number(e.target.value) || 0 })
                  }
                  className="mt-1 w-full rounded-lg border border-[#DFE6DD] px-3 py-1.5 font-mono text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#202923]" htmlFor="crit-approach-days">
                  Approaching (≤ days)
                </label>
                <input
                  id="crit-approach-days"
                  type="number"
                  min={3}
                  max={14}
                  value={criteria.approachingDaysThreshold}
                  onChange={(e) =>
                    updatePredictionCriteria({
                      approachingDaysThreshold: Number(e.target.value) || 3,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-[#DFE6DD] px-3 py-1.5 font-mono text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#202923]" htmlFor="crit-leaves">
                  Min Leaves for Ready
                </label>
                <input
                  id="crit-leaves"
                  type="number"
                  min={10}
                  max={28}
                  value={criteria.minLeafCountForReady}
                  onChange={(e) =>
                    updatePredictionCriteria({
                      minLeafCountForReady: Number(e.target.value) || 14,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-[#DFE6DD] px-3 py-1.5 font-mono text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#202923]" htmlFor="crit-height">
                  Min Height (cm)
                </label>
                <input
                  id="crit-height"
                  type="number"
                  step="0.5"
                  min={10}
                  max={25}
                  value={criteria.minHeightCmForReady}
                  onChange={(e) =>
                    updatePredictionCriteria({
                      minHeightCmForReady: Number(e.target.value) || 15,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-[#DFE6DD] px-3 py-1.5 font-mono text-sm tabular-nums"
                />
              </div>
              <div className="flex items-end">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#DFE6DD] bg-[#F7F9F5] px-3 py-2 text-xs font-medium text-[#202923]">
                  <input
                    type="checkbox"
                    checked={criteria.allowEnvironmentPenaltyAdjustment}
                    onChange={(e) =>
                      updatePredictionCriteria({
                        allowEnvironmentPenaltyAdjustment: e.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-[#153F32]"
                  />
                  <span>Zone Drift Delay Offset</span>
                </label>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DFE6DD] bg-white px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              aria-label="Filter predictions by zone"
              className="rounded-lg border border-[#DFE6DD] bg-[#F7F9F5] px-3 py-1.5 text-xs font-medium text-[#202923] focus:border-[#153F32] focus:outline-none"
            >
              <option value="all">All Growing Zones</option>
              {state.zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.code} — {z.name}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#F7F9F5] p-1">
              <button
                type="button"
                onClick={() => setStageFilter('all')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  stageFilter === 'all'
                    ? 'bg-white text-[#153F32] shadow-xs'
                    : 'text-[#78847D] hover:text-[#202923]'
                }`}
              >
                All Stages
              </button>
              {MATURITY_ORDER.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setStageFilter(stage)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    stageFilter === stage
                      ? 'bg-white text-[#153F32] shadow-xs'
                      : 'text-[#78847D] hover:text-[#202923]'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>
          <span className="font-mono text-xs text-[#78847D] tabular-nums">
            Showing {filteredBatches.length} active batches
          </span>
        </div>

        {/* Readiness Distribution + Expected Yield by Date */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <SectionCard
            title="Harvest Readiness Distribution"
            subtitle="Active batch count & yield grouped by configurable maturity stage"
            className="lg:col-span-5"
          >
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={readinessDistribution}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 24, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDF2EB" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#78847D' }} />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    width={130}
                    tick={{ fontSize: 11, fill: '#202923' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#DFE6DD',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: unknown) => [`${val} batches`, 'Batches']}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {readinessDistribution.map((entry) => (
                      <Cell key={entry.stage} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#EDF2EB] pt-3">
              {readinessDistribution.map((item) => (
                <div key={item.stage} className="flex items-center justify-between text-xs">
                  <span className="text-[#5B6660]">{item.stage}</span>
                  <span className="font-mono font-semibold text-[#202923] tabular-nums">
                    {formatWeightKg(item.yieldKg)}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Expected Yield by Predicted Harvest Date"
            subtitle="Projected harvest weight (kg) with ±6% demonstration confidence envelope"
            className="lg:col-span-7"
          >
            {yieldByDate.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-xs text-[#78847D]">
                No forecasts available for the selected filters.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={yieldByDate} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDF2EB" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#78847D' }} />
                    <YAxis unit=" kg" tick={{ fontSize: 11, fill: '#78847D' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#DFE6DD',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="upperBoundKg"
                      name="Upper Bound (kg)"
                      stroke="transparent"
                      fill="#E8F0E8"
                    />
                    <Area
                      type="monotone"
                      dataKey="estimatedYieldKg"
                      name="Expected Yield (kg)"
                      stroke="#153F32"
                      strokeWidth={2}
                      fill="#287A55"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Maturity Timeline & Predicted Harvest Calendar */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <SectionCard
            title="Batch Maturity Timeline"
            subtitle="Cycle progression toward target harvest readiness"
            className="lg:col-span-7"
          >
            <div className="space-y-3">
              {timelineBatches.map((batch) => {
                const pred = predictions[batch.id];
                const age = calculateCropAgeDays(batch.plantingDate, state.farmProfile.referenceDate);
                return (
                  <div
                    key={batch.id}
                    className="rounded-lg border border-[#EDF2EB] bg-[#F7F9F5]/60 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedBatch(batch)}
                          className="font-mono font-semibold text-[#153F32] hover:underline"
                        >
                          {batch.id}
                        </button>
                        <span className="font-medium text-[#202923]">{batch.cultivar}</span>
                        <span className="text-[#78847D]">· Day {age}</span>
                      </div>
                      <span className="font-mono text-[#202923] tabular-nums">
                        {pred.daysRemaining <= 0
                          ? 'Harvest Window Open'
                          : `${pred.daysRemaining}d left`}{' '}
                        · {formatDateShort(pred.predictedHarvestDate)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E8F0E8]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, pred.readinessPct)}%`,
                          backgroundColor: STAGE_COLORS[pred.growthStage],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            title="Predicted Harvest Calendar"
            subtitle="Grouped by target harvest date and confidence range"
            className="lg:col-span-5"
          >
            <div className="divide-y divide-[#EDF2EB]">
              {yieldByDate.map((slot) => (
                <div key={slot.date} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-[#153F32] tabular-nums">
                      {formatDateShort(slot.date)}
                    </span>
                    <span className="font-mono font-semibold text-[#202923] tabular-nums">
                      {formatWeightKg(slot.estimatedYieldKg)} ({slot.lowerBoundKg}–{slot.upperBoundKg} kg)
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {slot.batchIds.map((bId) => (
                      <button
                        key={bId}
                        type="button"
                        onClick={() => {
                          const found = state.batches.find((b) => b.id === bId);
                          if (found) setSelectedBatch(found);
                        }}
                        className="rounded border border-[#DFE6DD] bg-[#F7F9F5] px-2 py-0.5 font-mono text-[11px] font-medium text-[#153F32] hover:border-[#287A55]"
                      >
                        {bId}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Batch-wise Forecasts Grouped by Maturity Status */}
        <div className="space-y-5">
          {MATURITY_ORDER.map((stage) => {
            const list = groupedByStage[stage];
            if (stageFilter !== 'all' && stageFilter !== stage) return null;
            return (
              <SectionCard
                key={stage}
                title={`${stage} (${list.length})`}
                subtitle={
                  stage === 'Ready for Harvest'
                    ? 'Batches meeting maturity day and morphological thresholds'
                    : stage === 'Approaching Maturity'
                      ? `Within ${criteria.approachingDaysThreshold} days of predicted harvest`
                      : stage === 'Vegetative Growth'
                        ? 'Active canopy expansion phase'
                        : 'Early propagation & root establishment'
                }
              >
                {list.length === 0 ? (
                  <p className="text-xs text-[#78847D]">
                    No active batches currently classified under {stage}.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {list.map((batch) => {
                      const pred = predictions[batch.id];
                      const zone = state.zones.find((z) => z.id === batch.zoneId);
                      const obs = getLatestObservation(batch.id, state.observations);
                      return (
                        <div
                          key={batch.id}
                          className="flex flex-col justify-between rounded-lg border border-[#DFE6DD] bg-[#F7F9F5]/50 p-4"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-mono text-xs font-semibold text-[#153F32]">
                                  {batch.id} · {zone?.code} ({batch.rackNumber})
                                </p>
                                <p className="mt-0.5 text-sm font-semibold text-[#202923]">
                                  {batch.cultivar}
                                </p>
                              </div>
                              <HealthStatusLabel status={batch.status} />
                            </div>

                            <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-[#EDF2EB] pt-3 text-xs">
                              <div>
                                <dt className="text-[#78847D]">Pred. Harvest</dt>
                                <dd className="font-mono font-medium text-[#202923] tabular-nums">
                                  {formatDateShort(pred.predictedHarvestDate)}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-[#78847D]">Est. Yield</dt>
                                <dd className="font-mono font-semibold text-[#153F32] tabular-nums">
                                  {formatWeightKg(pred.estimatedYieldKg)}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-[#78847D]">Confidence Window</dt>
                                <dd className="font-mono text-[#5B6660] tabular-nums">
                                  -{pred.confidenceLowerDays}d / +{pred.confidenceUpperDays}d
                                </dd>
                              </div>
                              <div>
                                <dt className="text-[#78847D]">Latest Canopy</dt>
                                <dd className="font-mono text-[#5B6660] tabular-nums">
                                  {obs ? `${obs.avgHeightCm}cm · ${obs.avgLeafCount} lvs` : 'Pending'}
                                </dd>
                              </div>
                            </dl>
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-[#EDF2EB] pt-3 text-xs">
                            <button
                              type="button"
                              onClick={() => setSelectedBatch(batch)}
                              className="font-medium text-[#153F32] hover:underline"
                            >
                              Inspect Forecast Drivers
                            </button>
                            <Link
                              to={`/batches/${batch.id}`}
                              className="inline-flex items-center gap-1 font-medium text-[#5B6660] hover:text-[#153F32]"
                            >
                              <span>Batch Profile</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            );
          })}
        </div>
      </div>

      {/* Prediction Detail Inspection Modal */}
      <Modal
        open={Boolean(selectedBatch)}
        onClose={() => setSelectedBatch(null)}
        title={selectedBatch ? `Forecast Details · ${selectedBatch.id}` : ''}
        subtitle="DEMONSTRATION MODEL – NOT VALIDATED WITH REAL FARM DATA"
      >
        {selectedBatch && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-[#DFE6DD] bg-[#F7F9F5] p-3.5 text-xs">
              <div>
                <span className="text-[#78847D]">Estimated Harvest Date</span>
                <p className="mt-0.5 font-mono font-semibold text-[#153F32]">
                  {formatDateShort(predictions[selectedBatch.id].predictedHarvestDate)}
                </p>
              </div>
              <div>
                <span className="text-[#78847D]">Expected Window</span>
                <p className="mt-0.5 font-mono font-medium text-[#202923]">
                  {predictions[selectedBatch.id].harvestWindowStart} to{' '}
                  {predictions[selectedBatch.id].harvestWindowEnd}
                </p>
              </div>
              <div>
                <span className="text-[#78847D]">Yield Estimate Range</span>
                <p className="mt-0.5 font-mono font-semibold text-[#202923]">
                  {predictions[selectedBatch.id].yieldRangeKg[0]}–
                  {predictions[selectedBatch.id].yieldRangeKg[1]} kg
                </p>
              </div>
              <div>
                <span className="text-[#78847D]">Maturity Stage</span>
                <p className="mt-0.5 font-semibold text-[#153F32]">
                  {predictions[selectedBatch.id].growthStage}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-[#202923]">Key Drivers</h3>
              <ul className="mt-1.5 space-y-1 text-xs text-[#5B6660]">
                {predictions[selectedBatch.id].keyFactors.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-[#202923]">Prediction History</h3>
              <div className="mt-2 overflow-hidden rounded-lg border border-[#EDF2EB]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#F7F9F5] font-semibold text-[#5B6660]">
                      <th className="px-3 py-2">Snapshot</th>
                      <th className="px-3 py-2">Est. Date</th>
                      <th className="px-3 py-2 text-right">Est. Yield</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDF2EB]">
                    {predictions[selectedBatch.id].history.map((h) => (
                      <tr key={h.date}>
                        <td className="px-3 py-2 font-mono">{h.date}</td>
                        <td className="px-3 py-2 font-mono">{h.predictedHarvestDate}</td>
                        <td className="px-3 py-2 text-right font-mono font-medium text-[#153F32]">
                          {formatWeightKg(h.estimatedYieldKg)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBatch(null)}
                className="rounded-lg border border-[#DFE6DD] px-4 py-2 text-xs font-medium text-[#202923]"
              >
                Close
              </button>
              <Link
                to={`/batches/${selectedBatch.id}`}
                className="rounded-lg bg-[#153F32] px-4 py-2 text-xs font-medium text-white hover:bg-[#0F2F25]"
              >
                Open Full Batch Profile
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
