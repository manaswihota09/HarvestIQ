import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ClipboardCheck, Download } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { RecordHarvestModal } from '../components/harvest/RecordHarvestModal';
import { SectionCard } from '../components/ui/SectionCard';
import { GrowthStageText, HealthStatusLabel } from '../components/ui/StatusBadge';
import { useToast } from '../components/ui/Toast';
import { useFarmData } from '../context/FarmDataContext';
import { CropBatch } from '../types/harvestiq';
import { computeYieldVariancePct } from '../utils/calculations';
import {
  exportToCsv,
  formatDateShort,
  formatNumber,
  formatSignedDelta,
  formatWeightKg,
} from '../utils/formatters';

export function HarvestPage() {
  const { state, activeBatches, predictions } = useFarmData();
  const { showToast } = useToast();
  const [harvestModalBatch, setHarvestModalBatch] = useState<CropBatch | null>(null);

  const upcomingSorted = useMemo(() => {
    return [...activeBatches].sort(
      (a, b) =>
        (predictions[a.id]?.daysRemaining ?? 99) -
        (predictions[b.id]?.daysRemaining ?? 99),
    );
  }, [activeBatches, predictions]);

  const harvestCalendarGroups = useMemo(() => {
    const groups = new Map<string, CropBatch[]>();
    for (const batch of upcomingSorted) {
      const date = predictions[batch.id]?.predictedHarvestDate;
      if (!date) continue;
      const arr = groups.get(date) ?? [];
      arr.push(batch);
      groups.set(date, arr);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [upcomingSorted, predictions]);

  const expectedVsActualChart = useMemo(() => {
    return [...state.harvestRecords]
      .reverse()
      .map((r) => ({
        batchId: r.batchId,
        expectedKg: r.expectedYieldKg,
        actualKg: r.actualYieldKg,
      }));
  }, [state.harvestRecords]);

  const totals = useMemo(() => {
    const readySoon = activeBatches.filter(
      (b) => (predictions[b.id]?.daysRemaining ?? 99) <= 7,
    );
    const upcomingKg = readySoon.reduce(
      (sum, b) => sum + (predictions[b.id]?.estimatedYieldKg ?? 0),
      0,
    );
    const completedKg = state.harvestRecords.reduce((sum, r) => sum + r.actualYieldKg, 0);
    return {
      readySoonCount: readySoon.length,
      upcomingKg,
      completedCount: state.harvestRecords.length,
      completedKg,
    };
  }, [activeBatches, predictions, state.harvestRecords]);

  const handleExportHarvestCsv = () => {
    const headers = [
      'Batch ID',
      'Cultivar',
      'Zone',
      'Rack',
      'Planting Date',
      'Predicted Harvest',
      'Actual Harvest',
      'Expected Yield (kg)',
      'Actual Yield (kg)',
      'Variance (%)',
      'Harvested Plants',
      'Quality Grade',
      'Notes',
    ];
    const rows = state.harvestRecords.map((r) => {
      const zone = state.zones.find((z) => z.id === r.zoneId);
      return [
        r.batchId,
        r.cultivar,
        zone?.code ?? r.zoneId,
        r.rackNumber,
        r.plantingDate,
        r.predictedHarvestDate,
        r.actualHarvestDate,
        r.expectedYieldKg,
        r.actualYieldKg,
        computeYieldVariancePct(r.expectedYieldKg, r.actualYieldKg),
        r.harvestedPlantCount,
        r.qualityGrade,
        r.notes,
      ];
    });
    exportToCsv(`harvestiq-harvest-history-${state.farmProfile.referenceDate}.csv`, headers, rows);
    showToast(`Exported ${state.harvestRecords.length} completed harvest records.`);
  };

  return (
    <AppShell
      title="Harvest Scheduling & Management"
      breadcrumb="Harvest Management"
      actions={
        <button
          type="button"
          onClick={handleExportHarvestCsv}
          className="inline-flex items-center gap-2 rounded-lg border border-[#DFE6DD] bg-white px-3.5 py-2 text-sm font-medium text-[#202923] hover:bg-[#F7F9F5]"
        >
          <Download className="h-4 w-4" />
          <span>Export History CSV</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Summary KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#DFE6DD] bg-white p-4">
            <p className="text-xs font-medium text-[#78847D]">Upcoming (≤ 7 Days)</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-[#153F32] tabular-nums">
              {totals.readySoonCount} batches
            </p>
            <p className="mt-1 text-xs text-[#78847D]">Ready or approaching maturity</p>
          </div>
          <div className="rounded-xl border border-[#DFE6DD] bg-white p-4">
            <p className="text-xs font-medium text-[#78847D]">7-Day Scheduled Volume</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-[#287A55] tabular-nums">
              {formatWeightKg(totals.upcomingKg)}
            </p>
            <p className="mt-1 text-xs text-[#78847D]">Estimated demonstration yield</p>
          </div>
          <div className="rounded-xl border border-[#DFE6DD] bg-white p-4">
            <p className="text-xs font-medium text-[#78847D]">Completed Harvests</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-[#202923] tabular-nums">
              {totals.completedCount} batches
            </p>
            <p className="mt-1 text-xs text-[#78847D]">Logged with actual weights</p>
          </div>
          <div className="rounded-xl border border-[#DFE6DD] bg-white p-4">
            <p className="text-xs font-medium text-[#78847D]">Cumulative Actual Yield</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-[#202923] tabular-nums">
              {formatWeightKg(totals.completedKg)}
            </p>
            <p className="mt-1 text-xs text-[#78847D]">Verified harvest weights</p>
          </div>
        </div>

        {/* Upcoming Harvest Queue + Harvest Calendar */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <SectionCard
            title="Upcoming Harvest Queue"
            subtitle="Log completed harvests to update active inventory and yield variance logs"
            className="lg:col-span-8"
            noPadding
          >
            {upcomingSorted.length === 0 ? (
              <p className="p-6 text-xs text-[#78847D]">All registered batches have been harvested.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#EDF2EB] bg-[#F7F9F5] font-semibold text-[#5B6660]">
                      <th className="px-4 py-3">Batch</th>
                      <th className="px-4 py-3">Zone / Rack</th>
                      <th className="px-4 py-3">Stage</th>
                      <th className="px-4 py-3">Est. Date</th>
                      <th className="px-4 py-3 text-right">Est. Yield</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDF2EB]">
                    {upcomingSorted.map((batch) => {
                      const pred = predictions[batch.id];
                      const zone = state.zones.find((z) => z.id === batch.zoneId);
                      return (
                        <tr key={batch.id} className="hover:bg-[#F7F9F5]">
                          <td className="px-4 py-3">
                            <Link
                              to={`/batches/${batch.id}`}
                              className="font-mono font-semibold text-[#153F32] hover:underline"
                            >
                              {batch.id}
                            </Link>
                            <span className="block text-[11px] text-[#78847D]">
                              {batch.cultivar}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-[#202923]">{zone?.code}</span>
                            <span className="ml-1.5 font-mono text-[11px] text-[#78847D]">
                              {batch.rackNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <GrowthStageText stage={pred.growthStage} />
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums">
                            {formatDateShort(pred.predictedHarvestDate)}
                            <span className="block text-[11px] text-[#78847D]">
                              {pred.daysRemaining <= 0 ? 'Due now' : `in ${pred.daysRemaining}d`}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-[#153F32] tabular-nums">
                            {formatWeightKg(pred.estimatedYieldKg)}
                          </td>
                          <td className="px-4 py-3">
                            <HealthStatusLabel status={batch.status} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setHarvestModalBatch(batch)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#153F32] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0F2F25] whitespace-nowrap"
                            >
                              <ClipboardCheck className="h-3.5 w-3.5" />
                              <span>Mark Harvested</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Harvest Calendar"
            subtitle="Scheduled cut dates across active racks"
            className="lg:col-span-4"
          >
            <div className="divide-y divide-[#EDF2EB]">
              {harvestCalendarGroups.map(([date, list]) => {
                const totalDayKg = list.reduce(
                  (sum, b) => sum + (predictions[b.id]?.estimatedYieldKg ?? 0),
                  0,
                );
                return (
                  <div key={date} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-[#153F32]">
                        {formatDateShort(date)}
                      </span>
                      <span className="font-mono font-semibold text-[#202923] tabular-nums">
                        {formatWeightKg(totalDayKg)}
                      </span>
                    </div>
                    <ul className="mt-1.5 space-y-1">
                      {list.map((b) => (
                        <li
                          key={b.id}
                          className="flex items-center justify-between text-xs text-[#5B6660]"
                        >
                          <span>
                            {b.id} · {b.cultivar} ({b.rackNumber})
                          </span>
                          <span className="font-mono tabular-nums">
                            {formatNumber(b.plantCount)} hds
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        {/* Expected vs Actual Yield Chart + Completed Harvest History */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <SectionCard
            title="Expected vs. Actual Yield"
            subtitle="Comparison of predicted vs. weighed harvest output (kg)"
            className="lg:col-span-5"
          >
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={expectedVsActualChart}
                  margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDF2EB" />
                  <XAxis dataKey="batchId" tick={{ fontSize: 11, fill: '#78847D' }} />
                  <YAxis unit=" kg" tick={{ fontSize: 11, fill: '#78847D' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#DFE6DD',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar
                    dataKey="expectedKg"
                    name="Expected (kg)"
                    fill="#D7A65B"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="actualKg"
                    name="Actual (kg)"
                    fill="#153F32"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard
            title="Completed Harvest History"
            subtitle="Batch-wise harvest records with yield variance and notes"
            className="lg:col-span-7"
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EDF2EB] bg-[#F7F9F5] font-semibold text-[#5B6660]">
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3">Actual Date</th>
                    <th className="px-4 py-3 text-right">Expected</th>
                    <th className="px-4 py-3 text-right">Actual</th>
                    <th className="px-4 py-3 text-right">Variance</th>
                    <th className="px-4 py-3">Grade & Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF2EB]">
                  {state.harvestRecords.map((rec) => {
                    const variance = computeYieldVariancePct(
                      rec.expectedYieldKg,
                      rec.actualYieldKg,
                    );
                    return (
                      <tr key={rec.id} className="hover:bg-[#F7F9F5]">
                        <td className="px-4 py-3">
                          <Link
                            to={`/batches/${rec.batchId}`}
                            className="font-mono font-semibold text-[#153F32] hover:underline"
                          >
                            {rec.batchId}
                          </Link>
                          <span className="block text-[11px] text-[#78847D]">{rec.cultivar}</span>
                        </td>
                        <td className="px-4 py-3 font-mono tabular-nums">
                          {rec.actualHarvestDate}
                          <span className="block text-[11px] text-[#78847D]">
                            Pred: {rec.predictedHarvestDate}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {formatWeightKg(rec.expectedYieldKg)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-[#153F32] tabular-nums">
                          {formatWeightKg(rec.actualYieldKg)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono font-semibold tabular-nums ${
                            variance >= 0 ? 'text-[#287A55]' : 'text-[#9E6816]'
                          }`}
                        >
                          {formatSignedDelta(variance, '%')}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-[#202923]">{rec.qualityGrade}</span>
                          <span className="block text-[11px] text-[#78847D]">{rec.notes}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      </div>

      <RecordHarvestModal
        open={Boolean(harvestModalBatch)}
        onClose={() => setHarvestModalBatch(null)}
        batch={harvestModalBatch}
      />
    </AppShell>
  );
}
