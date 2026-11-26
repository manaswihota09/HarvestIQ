import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, Info } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { SectionCard } from '../components/ui/SectionCard';
import { useToast } from '../components/ui/Toast';
import { useFarmData } from '../context/FarmDataContext';
import {
  calculateCropAgeDays,
  computeYieldVariancePct,
  getLatestObservation,
} from '../utils/calculations';
import { diffDaysIso, exportToCsv, formatMonthDay, formatWeightKg } from '../utils/formatters';

export function AnalyticsPage() {
  const { state, activeBatches, predictions } = useFarmData();
  const { showToast } = useToast();

  // Cultivar growth comparison
  const growthComparisonData = useMemo(() => {
    const byCultivar = new Map<string, { heightSum: number; leafSum: number; count: number }>();
    for (const batch of activeBatches) {
      const obs = getLatestObservation(batch.id, state.observations);
      if (!obs) continue;
      const age = Math.max(1, calculateCropAgeDays(batch.plantingDate, state.farmProfile.referenceDate));
      const growthRateCmPerDay = obs.avgHeightCm / age;
      const leafRatePerDay = obs.avgLeafCount / age;
      const prev = byCultivar.get(batch.cultivar) ?? { heightSum: 0, leafSum: 0, count: 0 };
      byCultivar.set(batch.cultivar, {
        heightSum: prev.heightSum + growthRateCmPerDay,
        leafSum: prev.leafSum + leafRatePerDay,
        count: prev.count + 1,
      });
    }
    return Array.from(byCultivar.entries()).map(([cultivar, agg]) => ({
      cultivar: cultivar.split(' ')[0],
      avgHeightGainMmDay: Number(((agg.heightSum / agg.count) * 10).toFixed(1)),
      avgLeafRateWeek: Number(((agg.leafSum / agg.count) * 7).toFixed(1)),
    }));
  }, [activeBatches, state.observations, state.farmProfile.referenceDate]);

  // Zone performance summary
  const zonePerformance = useMemo(() => {
    return state.zones.map((zone) => {
      const zoneBatches = activeBatches.filter((b) => b.zoneId === zone.id);
      const plants = zoneBatches.reduce((sum, b) => sum + b.plantCount, 0);
      const utilizationPct = Math.round((plants / zone.capacityPlants) * 100);
      const estYieldKg = zoneBatches.reduce(
        (sum, b) => sum + (predictions[b.id]?.estimatedYieldKg ?? 0),
        0,
      );
      const avgUniformity =
        zoneBatches.length > 0
          ? Math.round(
              zoneBatches.reduce((sum, b) => {
                const obs = getLatestObservation(b.id, state.observations);
                return sum + (obs?.uniformityScorePct ?? 95);
              }, 0) / zoneBatches.length,
            )
          : 0;
      const activeAlerts = state.alerts.filter(
        (a) => a.zoneId === zone.id && !a.acknowledged,
      ).length;

      return {
        zone: zone.code,
        name: zone.name,
        batches: zoneBatches.length,
        utilizationPct,
        estYieldKg: Number(estYieldKg.toFixed(1)),
        avgUniformity,
        activeAlerts,
      };
    });
  }, [state.zones, activeBatches, predictions, state.observations, state.alerts]);

  // Predicted vs actual harvest dates & yield
  const harvestComparison = useMemo(() => {
    return [...state.harvestRecords].reverse().map((r) => ({
      batchId: r.batchId,
      expectedKg: r.expectedYieldKg,
      actualKg: r.actualYieldKg,
      dateDeltaDays: diffDaysIso(r.predictedHarvestDate, r.actualHarvestDate),
      variancePct: computeYieldVariancePct(r.expectedYieldKg, r.actualYieldKg),
    }));
  }, [state.harvestRecords]);

  // Environmental trend summary (farm-wide daily avg)
  const farmEnvTrend = useMemo(() => {
    const dates = Array.from(new Set(state.environmentalReadings.map((r) => r.date))).sort();
    return dates.map((date) => {
      const rows = state.environmentalReadings.filter((r) => r.date === date);
      const n = Math.max(1, rows.length);
      return {
        label: formatMonthDay(date),
        avgTempC: Number((rows.reduce((s, r) => s + r.temperatureC, 0) / n).toFixed(1)),
        avgEc: Number((rows.reduce((s, r) => s + r.ecMsCm, 0) / n).toFixed(2)),
      };
    });
  }, [state.environmentalReadings]);

  const handleExportAnalyticsCsv = () => {
    const headers = [
      'Zone',
      'Zone Name',
      'Active Batches',
      'Capacity Utilization (%)',
      'Estimated Yield (kg)',
      'Avg Uniformity (%)',
      'Unread Alerts',
    ];
    const rows = zonePerformance.map((z) => [
      z.zone,
      z.name,
      z.batches,
      z.utilizationPct,
      z.estYieldKg,
      z.avgUniformity,
      z.activeAlerts,
    ]);
    exportToCsv(`harvestiq-zone-analytics-${state.farmProfile.referenceDate}.csv`, headers, rows);
    showToast('Exported zone analytics report to CSV.');
  };

  return (
    <AppShell
      title="Farm Analytics & Reports"
      breadcrumb="Analytics"
      actions={
        <button
          type="button"
          onClick={handleExportAnalyticsCsv}
          className="inline-flex items-center gap-2 rounded-lg bg-[#153F32] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F2F25]"
        >
          <Download className="h-4 w-4" />
          <span>Export Zone Report CSV</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Growth Comparisons & Yield Forecasting Accuracy */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard
            title="Cultivar Growth Rate Comparison"
            subtitle="Average daily height gain (mm/day) and weekly leaf emergence across active batches"
          >
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={growthComparisonData}
                  margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDF2EB" />
                  <XAxis dataKey="cultivar" tick={{ fontSize: 11, fill: '#78847D' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#78847D' }} />
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
                    dataKey="avgHeightGainMmDay"
                    name="Height Gain (mm/day)"
                    fill="#153F32"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="avgLeafRateWeek"
                    name="Leaves / Week"
                    fill="#287A55"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard
            title="Predicted vs. Actual Yield (Historical)"
            subtitle="Comparison of expected vs. actual harvested weight (kg) from completed records"
          >
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={harvestComparison}
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
                    name="Predicted (kg)"
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
        </div>

        {/* Zone Performance Table & Predicted vs Actual Dates */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <SectionCard
            title="Zone Performance Breakdown"
            subtitle="Utilization, expected yield, and canopy uniformity per growing zone"
            className="lg:col-span-7"
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EDF2EB] bg-[#F7F9F5] font-semibold text-[#5B6660]">
                    <th className="px-4 py-3">Zone</th>
                    <th className="px-4 py-3 text-right">Batches</th>
                    <th className="px-4 py-3 text-right">Utilization</th>
                    <th className="px-4 py-3 text-right">Est. Yield</th>
                    <th className="px-4 py-3 text-right">Uniformity</th>
                    <th className="px-4 py-3 text-right">Alerts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF2EB]">
                  {zonePerformance.map((row) => (
                    <tr key={row.zone} className="hover:bg-[#F7F9F5]">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[#153F32]">{row.zone}</span>
                        <span className="block text-[11px] text-[#78847D]">{row.name}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{row.batches}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {row.utilizationPct}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-[#153F32] tabular-nums">
                        {formatWeightKg(row.estYieldKg)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {row.avgUniformity > 0 ? `${row.avgUniformity}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {row.activeAlerts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard
            title="Predicted vs. Actual Harvest Dates"
            subtitle="Harvest schedule variance across completed cycles"
            className="lg:col-span-5"
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EDF2EB] bg-[#F7F9F5] font-semibold text-[#5B6660]">
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3 text-right">Date Variance</th>
                    <th className="px-4 py-3 text-right">Yield Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF2EB]">
                  {harvestComparison.map((row) => (
                    <tr key={row.batchId} className="hover:bg-[#F7F9F5]">
                      <td className="px-4 py-3 font-mono font-semibold text-[#153F32]">
                        {row.batchId}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {row.dateDeltaDays === 0
                          ? 'On Target (0d)'
                          : `${row.dateDeltaDays > 0 ? '+' : ''}${row.dateDeltaDays}d`}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-semibold tabular-nums ${
                          row.variancePct >= 0 ? 'text-[#287A55]' : 'text-[#9E6816]'
                        }`}
                      >
                        {row.variancePct > 0 ? '+' : ''}
                        {row.variancePct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        {/* 14-day Facility Environmental Trend */}
        <SectionCard
          title="14-Day Facility Environmental Trend"
          subtitle="Mean daily temperature (°C) and nutrient conductivity (EC mS/cm) across all zones"
        >
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={farmEnvTrend} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF2EB" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#78847D' }} />
                <YAxis yAxisId="left" domain={[17, 23]} unit="°C" tick={{ fontSize: 11, fill: '#78847D' }} />
                <YAxis yAxisId="right" orientation="right" domain={[1.2, 1.9]} tick={{ fontSize: 11, fill: '#78847D' }} />
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
                  dataKey="avgTempC"
                  name="Facility Avg Temp (°C)"
                  stroke="#153F32"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgEc"
                  name="Facility Avg EC (mS/cm)"
                  stroke="#D7A65B"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Honest Model Evaluation Section (No fabricated accuracy) */}
        <SectionCard
          title="Model Evaluation & Validation Status"
          subtitle="Stage 3 ML validation readiness tracker"
        >
          <div className="flex items-start gap-3 rounded-lg border border-[#DFE6DD] bg-[#F7F9F5] p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#153F32]" />
            <div>
              <p className="text-sm font-semibold text-[#202923]">
                Model evaluation will become available after sufficient actual harvest records have
                been collected.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#5B6660]">
                Stage 1 displays deterministic demonstration schedules and historical sample
                records. Live MAE/RMSE error metrics and cultivar calibration curves will activate
                once Stage 2 persistence and Stage 3 ML validation pipelines are connected.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
