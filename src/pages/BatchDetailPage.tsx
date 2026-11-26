import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowLeft, ClipboardCheck, Plus } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { RecordHarvestModal } from '../components/harvest/RecordHarvestModal';
import { Modal } from '../components/ui/Modal';
import { SectionCard } from '../components/ui/SectionCard';
import {
  DemoDisclaimerBanner,
  GrowthStageText,
  HealthStatusLabel,
} from '../components/ui/StatusBadge';
import { useToast } from '../components/ui/Toast';
import { useFarmData } from '../context/FarmDataContext';
import { calculateCropAgeDays } from '../utils/calculations';
import { formatDateShort, formatMonthDay, formatNumber, formatWeightKg } from '../utils/formatters';

export function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, predictions, addObservation, acknowledgeAlert } = useFarmData();
  const { showToast } = useToast();

  const batch = state.batches.find((b) => b.id === id);

  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [harvestModalOpen, setHarvestModalOpen] = useState(false);

  const [obsDate, setObsDate] = useState(state.farmProfile.referenceDate);
  const [avgHeightCm, setAvgHeightCm] = useState('15.5');
  const [avgLeafCount, setAvgLeafCount] = useState('16');
  const [canopyCoveragePct, setCanopyCoveragePct] = useState('78');
  const [observerNote, setObserverNote] = useState('');
  const [obsError, setObsError] = useState('');

  const batchObservations = useMemo(() => {
    if (!batch) return [];
    return state.observations
      .filter((o) => o.batchId === batch.id)
      .sort((a, b) => a.dayNumber - b.dayNumber);
  }, [batch, state.observations]);

  const zoneReadings = useMemo(() => {
    if (!batch) return [];
    return state.environmentalReadings
      .filter((r) => r.zoneId === batch.zoneId)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10)
      .map((r) => ({
        ...r,
        label: formatMonthDay(r.date),
      }));
  }, [batch, state.environmentalReadings]);

  const batchAlerts = useMemo(() => {
    if (!batch) return [];
    return state.alerts.filter((a) => a.batchId === batch.id);
  }, [batch, state.alerts]);

  const harvestRecord = useMemo(() => {
    if (!batch) return undefined;
    return state.harvestRecords.find((r) => r.batchId === batch.id);
  }, [batch, state.harvestRecords]);

  if (!batch) {
    return (
      <AppShell title="Batch Not Found" breadcrumb="Crop Batches / Missing">
        <SectionCard>
          <p className="text-sm text-[#5B6660]">
            No crop batch with ID <span className="font-mono font-semibold">{id}</span> was found.
          </p>
          <button
            type="button"
            onClick={() => navigate('/batches')}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#153F32] px-4 py-2 text-sm font-medium text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Batches</span>
          </button>
        </SectionCard>
      </AppShell>
    );
  }

  const zone = state.zones.find((z) => z.id === batch.zoneId);
  const prediction = predictions[batch.id];
  const ageDays = calculateCropAgeDays(batch.plantingDate, state.farmProfile.referenceDate);

  const handleLogObservation = (e: React.FormEvent) => {
    e.preventDefault();
    const h = Number(avgHeightCm);
    const l = Number(avgLeafCount);
    const c = Number(canopyCoveragePct);
    if (Number.isNaN(h) || h < 0.5 || h > 50) {
      setObsError('Average height must be between 0.5 and 50 cm.');
      return;
    }
    if (!Number.isInteger(l) || l < 1 || l > 60) {
      setObsError('Average leaf count must be between 1 and 60.');
      return;
    }
    if (Number.isNaN(c) || c < 1 || c > 100) {
      setObsError('Canopy coverage must be 1–100%.');
      return;
    }

    const dayNumber = Math.max(1, calculateCropAgeDays(batch.plantingDate, obsDate));
    addObservation({
      batchId: batch.id,
      date: obsDate,
      dayNumber,
      avgHeightCm: Number(h.toFixed(1)),
      avgLeafCount: l,
      canopyCoveragePct: Math.round(c),
      uniformityScorePct: 94,
      observerNote: observerNote.trim() || undefined,
    });
    showToast(`Logged growth checkpoint for ${batch.id}.`);
    setObsModalOpen(false);
    setObsError('');
    setObserverNote('');
  };

  return (
    <AppShell
      title={`${batch.id} · ${batch.cultivar}`}
      breadcrumb={`Crop Batches / ${batch.id}`}
      actions={
        <>
          <Link
            to="/batches"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#DFE6DD] bg-white px-3.5 py-2 text-sm font-medium text-[#202923] hover:bg-[#F7F9F5]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>All Batches</span>
          </Link>
          {batch.status !== 'Harvested' && (
            <>
              <button
                type="button"
                onClick={() => setObsModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DFE6DD] bg-white px-3.5 py-2 text-sm font-medium text-[#202923] hover:bg-[#F7F9F5]"
              >
                <Plus className="h-4 w-4" />
                <span>Log Observation</span>
              </button>
              <button
                type="button"
                onClick={() => setHarvestModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#153F32] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F2F25]"
              >
                <ClipboardCheck className="h-4 w-4" />
                <span>Mark Harvested</span>
              </button>
            </>
          )}
        </>
      }
    >
      <div className="space-y-6">
        <DemoDisclaimerBanner text="DEMONSTRATION DATA — Batch growth progression and harvest window figures are Stage 1 demonstration estimates." />

        {/* Top Split: Batch Info + Prominent Harvest Prediction Card */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <SectionCard
            title="Batch Specification"
            subtitle={`Registered in ${zone?.code} (${zone?.name})`}
            className="lg:col-span-5"
            action={<HealthStatusLabel status={batch.status} />}
          >
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-xs">
              <div>
                <dt className="text-[#78847D]">Crop Species</dt>
                <dd className="mt-0.5 font-medium text-[#202923]">{batch.crop}</dd>
              </div>
              <div>
                <dt className="text-[#78847D]">Cultivar</dt>
                <dd className="mt-0.5 font-medium text-[#202923]">{batch.cultivar}</dd>
              </div>
              <div>
                <dt className="text-[#78847D]">Growing Zone & Rack</dt>
                <dd className="mt-0.5 font-mono font-medium text-[#202923]">
                  {zone?.code} · Rack {batch.rackNumber}
                </dd>
              </div>
              <div>
                <dt className="text-[#78847D]">Planting Date</dt>
                <dd className="mt-0.5 font-mono font-medium text-[#202923] tabular-nums">
                  {formatDateShort(batch.plantingDate)}
                </dd>
              </div>
              <div>
                <dt className="text-[#78847D]">Current Crop Age</dt>
                <dd className="mt-0.5 font-mono font-semibold text-[#153F32] tabular-nums">
                  {ageDays} days (target {batch.targetCycleDays}d)
                </dd>
              </div>
              <div>
                <dt className="text-[#78847D]">Plant Count</dt>
                <dd className="mt-0.5 font-mono font-medium text-[#202923] tabular-nums">
                  {formatNumber(batch.plantCount)} heads
                </dd>
              </div>
            </dl>
            {batch.notes && (
              <div className="mt-4 border-t border-[#EDF2EB] pt-3">
                <p className="text-[11px] font-medium text-[#78847D]">Grower Notes</p>
                <p className="mt-1 text-xs leading-relaxed text-[#5B6660]">{batch.notes}</p>
              </div>
            )}
          </SectionCard>

          {/* Prominent Harvest Prediction Card */}
          <section className="rounded-xl border border-[#153F32] bg-[#153F32] p-6 text-white lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-4">
              <div>
                <p className="text-xs font-medium text-[#A6C4B5]">Harvest Prediction Summary</p>
                <h2 className="mt-0.5 text-lg font-semibold text-white">
                  {batch.status === 'Harvested'
                    ? 'Harvest Cycle Completed'
                    : `Estimated Harvest: ${formatDateShort(prediction.predictedHarvestDate)}`}
                </h2>
              </div>
              <span className="rounded-md border border-[#D7A65B]/50 bg-[#D7A65B]/15 px-2.5 py-1 font-mono text-[11px] font-medium text-[#F5D69D]">
                DEMONSTRATION DATA
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-[#A6C4B5]">Days Remaining</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                  {batch.status === 'Harvested'
                    ? '0d'
                    : prediction.daysRemaining <= 0
                      ? 'Due'
                      : `${prediction.daysRemaining}d`}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#A6C4B5]">Estimated Yield</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                  {formatWeightKg(prediction.estimatedYieldKg)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#A6C4B5]">Expected Window</p>
                <p className="mt-1 font-mono text-xs font-medium tabular-nums">
                  {formatMonthDay(prediction.harvestWindowStart)} –{' '}
                  {formatMonthDay(prediction.harvestWindowEnd)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#A6C4B5]">Uncertainty Range</p>
                <p className="mt-1 font-mono text-xs font-medium tabular-nums">
                  -{prediction.confidenceLowerDays}d / +{prediction.confidenceUpperDays}d
                </p>
                <p className="mt-0.5 text-[11px] text-[#CFE2D4]">
                  {prediction.yieldRangeKg[0]}–{prediction.yieldRangeKg[1]} kg
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-white/15 pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A6C4B5]">Current Growth Stage</span>
                <span className="font-semibold text-white">{prediction.growthStage}</span>
              </div>
              <p className="mt-3 text-xs font-medium text-[#A6C4B5]">
                Key Factors Influencing Demonstration Estimate
              </p>
              <ul className="mt-1.5 space-y-1 text-xs text-[#E8F0E8]">
                {prediction.keyFactors.map((factor) => (
                  <li key={factor}>· {factor}</li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* Plant Height & Leaf Count Progression Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard
            title="Plant Height Progression"
            subtitle="Measured average canopy height (cm) by day since planting"
          >
            {batchObservations.length === 0 ? (
              <p className="py-10 text-center text-xs text-[#78847D]">
                No height observations logged yet.
              </p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={batchObservations}
                    margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDF2EB" />
                    <XAxis
                      dataKey="dayNumber"
                      tickFormatter={(v) => `Day ${v}`}
                      tick={{ fontSize: 11, fill: '#78847D' }}
                    />
                    <YAxis unit=" cm" tick={{ fontSize: 11, fill: '#78847D' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#DFE6DD',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(val: unknown) => [`${val} cm`, 'Avg Height']}
                      labelFormatter={(label) => `Day ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgHeightCm"
                      stroke="#153F32"
                      strokeWidth={2}
                      dot={{ r: 3.5, fill: '#153F32' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Leaf Count & Canopy Coverage"
            subtitle="Average true leaf count and canopy cover (%) across checkpoints"
          >
            {batchObservations.length === 0 ? (
              <p className="py-10 text-center text-xs text-[#78847D]">
                No leaf count observations logged yet.
              </p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={batchObservations}
                    margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDF2EB" />
                    <XAxis
                      dataKey="dayNumber"
                      tickFormatter={(v) => `Day ${v}`}
                      tick={{ fontSize: 11, fill: '#78847D' }}
                    />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#78847D' }} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 100]}
                      unit="%"
                      tick={{ fontSize: 11, fill: '#78847D' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#DFE6DD',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="avgLeafCount"
                      name="Leaf Count"
                      stroke="#287A55"
                      strokeWidth={2}
                      dot={{ r: 3.5 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="canopyCoveragePct"
                      name="Canopy Cover (%)"
                      stroke="#D7A65B"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Growth Timeline Log + Zone Environmental History */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <SectionCard
            title="Growth Observation Timeline"
            subtitle="Chronological field measurements for this batch"
            className="lg:col-span-6"
            noPadding
          >
            {batchObservations.length === 0 ? (
              <p className="p-6 text-xs text-[#78847D]">No checkpoints recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#EDF2EB] bg-[#F7F9F5] font-semibold text-[#5B6660]">
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5 text-right">Day</th>
                      <th className="px-4 py-2.5 text-right">Height</th>
                      <th className="px-4 py-2.5 text-right">Leaves</th>
                      <th className="px-4 py-2.5 text-right">Canopy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDF2EB]">
                    {batchObservations.map((obs) => (
                      <tr key={obs.id}>
                        <td className="px-4 py-2.5 font-mono text-[#202923] tabular-nums">
                          {obs.date}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-[#78847D] tabular-nums">
                          D{obs.dayNumber}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-medium text-[#202923] tabular-nums">
                          {obs.avgHeightCm.toFixed(1)} cm
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-[#202923] tabular-nums">
                          {obs.avgLeafCount}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-[#202923] tabular-nums">
                          {obs.canopyCoveragePct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title={`Zone Climate History (${zone?.code})`}
            subtitle="Simulated daily environmental readings for the assigned growing zone"
            className="lg:col-span-6"
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EDF2EB] bg-[#F7F9F5] font-semibold text-[#5B6660]">
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5 text-right">Temp</th>
                    <th className="px-4 py-2.5 text-right">RH</th>
                    <th className="px-4 py-2.5 text-right">PPFD</th>
                    <th className="px-4 py-2.5 text-right">pH</th>
                    <th className="px-4 py-2.5 text-right">EC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF2EB]">
                  {zoneReadings.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2.5 font-mono text-[#202923] tabular-nums">
                        {r.date}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        {r.temperatureC.toFixed(1)}°C
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        {r.humidityPct.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        {r.lightPpfd}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        {r.ph.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        {r.ecMsCm.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        {/* Prediction History, Alerts, & Actual Harvest Record */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <SectionCard
            title="Prediction History (Demonstration)"
            subtitle="Snapshot progression of estimated harvest dates and yield"
            className="lg:col-span-6"
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EDF2EB] bg-[#F7F9F5] font-semibold text-[#5B6660]">
                    <th className="px-4 py-2.5">Snapshot Date</th>
                    <th className="px-4 py-2.5">Predicted Harvest</th>
                    <th className="px-4 py-2.5 text-right">Est. Yield</th>
                    <th className="px-4 py-2.5 text-right">Window (±)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF2EB]">
                  {prediction.history.map((h) => (
                    <tr key={h.date}>
                      <td className="px-4 py-2.5 font-mono text-[#202923] tabular-nums">
                        {h.date}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[#202923] tabular-nums">
                        {h.predictedHarvestDate}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-medium text-[#153F32] tabular-nums">
                        {formatWeightKg(h.estimatedYieldKg)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[#78847D] tabular-nums">
                        +{h.confidenceRangeDays}d
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard
            title="Alerts & Actual Harvest Records"
            subtitle="Linked anomalies and completed harvest logs"
            className="lg:col-span-6"
          >
            {harvestRecord && (
              <div className="mb-4 rounded-lg border border-[#C6DBC8] bg-[#E8F0E8]/60 p-4">
                <p className="text-xs font-semibold text-[#153F32]">
                  Completed Harvest Record · {harvestRecord.actualHarvestDate}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[#78847D]">Actual Yield</span>
                    <p className="font-mono font-semibold text-[#202923]">
                      {formatWeightKg(harvestRecord.actualYieldKg)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#78847D]">Harvested Heads</span>
                    <p className="font-mono font-semibold text-[#202923]">
                      {harvestRecord.harvestedPlantCount} / {harvestRecord.plantedCount}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#78847D]">Grade</span>
                    <p className="font-semibold text-[#153F32]">{harvestRecord.qualityGrade}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-[#5B6660]">{harvestRecord.notes}</p>
              </div>
            )}

            {batchAlerts.length === 0 ? (
              <div className="py-4 text-xs text-[#78847D]">
                No anomaly alerts logged for {batch.id}. Growth stage:{' '}
                <GrowthStageText stage={prediction.growthStage} />.
              </div>
            ) : (
              <div className="space-y-3">
                {batchAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-lg border border-[#DFE6DD] bg-[#F7F9F5] p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <HealthStatusLabel status={alert.severity} />
                      <span className="font-mono text-[11px] text-[#78847D]">
                        {alert.detectedAt}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-[#202923]">{alert.title}</p>
                    <p className="mt-1 text-xs text-[#5B6660]">{alert.description}</p>
                    {!alert.acknowledged && (
                      <button
                        type="button"
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="mt-2 text-xs font-medium text-[#153F32] hover:underline"
                      >
                        Acknowledge Alert
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <Modal
        open={obsModalOpen}
        onClose={() => setObsModalOpen(false)}
        title={`Log Growth Checkpoint · ${batch.id}`}
        subtitle="Record manual morphological sample from rack inspection"
      >
        <form onSubmit={handleLogObservation} className="space-y-4">
          {obsError && (
            <p className="rounded-lg border border-[#F5C2C2] bg-[#FEF2F2] px-3 py-2 text-xs text-[#991B1B]">
              {obsError}
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#202923]" htmlFor="obs-date">
                Observation Date
              </label>
              <input
                id="obs-date"
                type="date"
                value={obsDate}
                min={batch.plantingDate}
                max={state.farmProfile.referenceDate}
                onChange={(e) => setObsDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#DFE6DD] px-3 py-2 font-mono text-sm focus:border-[#153F32] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#202923]" htmlFor="obs-height">
                Avg Height (cm)
              </label>
              <input
                id="obs-height"
                type="number"
                step="0.1"
                value={avgHeightCm}
                onChange={(e) => setAvgHeightCm(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#DFE6DD] px-3 py-2 font-mono text-sm tabular-nums focus:border-[#153F32] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#202923]" htmlFor="obs-leaves">
                Avg True Leaf Count
              </label>
              <input
                id="obs-leaves"
                type="number"
                value={avgLeafCount}
                onChange={(e) => setAvgLeafCount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#DFE6DD] px-3 py-2 font-mono text-sm tabular-nums focus:border-[#153F32] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#202923]" htmlFor="obs-canopy">
                Canopy Cover (%)
              </label>
              <input
                id="obs-canopy"
                type="number"
                value={canopyCoveragePct}
                onChange={(e) => setCanopyCoveragePct(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#DFE6DD] px-3 py-2 font-mono text-sm tabular-nums focus:border-[#153F32] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#202923]" htmlFor="obs-note">
              Inspection Note
            </label>
            <input
              id="obs-note"
              type="text"
              value={observerNote}
              onChange={(e) => setObserverNote(e.target.value)}
              placeholder="Leaf turgor, root color, tipburn check..."
              className="mt-1 w-full rounded-lg border border-[#DFE6DD] px-3 py-2 text-sm focus:border-[#153F32] focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-[#EDF2EB] pt-4">
            <button
              type="button"
              onClick={() => setObsModalOpen(false)}
              className="rounded-lg border border-[#DFE6DD] px-4 py-2 text-sm font-medium text-[#202923] hover:bg-[#F7F9F5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#153F32] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F2F25]"
            >
              Save Checkpoint
            </button>
          </div>
        </form>
      </Modal>

      <RecordHarvestModal
        open={harvestModalOpen}
        onClose={() => setHarvestModalOpen(false)}
        batch={batch}
      />
    </AppShell>
  );
}
