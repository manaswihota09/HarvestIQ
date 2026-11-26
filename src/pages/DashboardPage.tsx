import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, Plus } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { SectionCard } from '../components/ui/SectionCard';
import {
  DemoDisclaimerBanner,
  GrowthStageText,
  HealthStatusLabel,
} from '../components/ui/StatusBadge';
import { BatchFormModal } from '../components/batches/BatchFormModal';
import { useFarmData } from '../context/FarmDataContext';
import {
  aggregateYieldForecastByDate,
  calculateCropAgeDays,
  getLatestObservation,
} from '../utils/calculations';
import { formatDateShort, formatMonthDay, formatNumber, formatWeightKg } from '../utils/formatters';
import { BatchHealthStatus } from '../types/harvestiq';

export function DashboardPage() {
  const { state, activeBatches, predictions, acknowledgeAlert } = useFarmData();
  const navigate = useNavigate();

  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | BatchHealthStatus>('all');
  const [horizonDays, setHorizonDays] = useState<number>(30);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const filteredBatches = useMemo(() => {
    return activeBatches.filter((batch) => {
      if (zoneFilter !== 'all' && batch.zoneId !== zoneFilter) return false;
      if (statusFilter !== 'all' && batch.status !== statusFilter) return false;
      const pred = predictions[batch.id];
      if (horizonDays < 30 && pred && pred.daysRemaining > horizonDays) return false;
      return true;
    });
  }, [activeBatches, zoneFilter, statusFilter, horizonDays, predictions]);

  // KPI Metrics derived strictly from filtered batches
  const kpis = useMemo(() => {
    const approachingCount = filteredBatches.filter((b) => {
      const stage = predictions[b.id]?.growthStage;
      return stage === 'Approaching Maturity' || stage === 'Ready for Harvest';
    }).length;
    const totalYieldKg = filteredBatches.reduce(
      (sum, b) => sum + (predictions[b.id]?.estimatedYieldKg ?? 0),
      0,
    );
    const attentionCount = filteredBatches.filter(
      (b) => b.status === 'Attention' || b.status === 'Critical',
    ).length;
    const visibleZones = new Set(filteredBatches.map((b) => b.zoneId)).size;
    const totalPlants = filteredBatches.reduce((sum, b) => sum + b.plantCount, 0);

    return {
      activeCount: filteredBatches.length,
      totalPlants,
      zonesActive: zoneFilter === 'all' ? state.zones.length : visibleZones,
      approachingCount,
      totalYieldKg,
      attentionCount,
    };
  }, [filteredBatches, predictions, zoneFilter, state.zones.length]);

  // 1. Crop growth overview chart (current height & target benchmark per filtered batch)
  const growthOverviewData = useMemo(() => {
    return filteredBatches
      .map((b) => {
        const obs = getLatestObservation(b.id, state.observations);
        const age = calculateCropAgeDays(b.plantingDate, state.farmProfile.referenceDate);
        const expectedHeightAtAge = Number(
          (2.2 + 16.8 * Math.pow(Math.min(1, age / b.targetCycleDays), 1.15)).toFixed(1),
        );
        return {
          batchId: b.id,
          cultivar: b.cultivar.split(' ')[0],
          actualHeightCm: obs?.avgHeightCm ?? 2.2,
          targetHeightCm: expectedHeightAtAge,
          ageDays: age,
        };
      })
      .sort((a, b) => a.ageDays - b.ageDays);
  }, [filteredBatches, state.observations, state.farmProfile.referenceDate]);

  // 2. Yield forecast & predicted harvest timeline
  const yieldTimelineData = useMemo(() => {
    return aggregateYieldForecastByDate(filteredBatches, predictions);
  }, [filteredBatches, predictions]);

  // 3. Zone-wise distribution
  const zoneDistributionData = useMemo(() => {
    return state.zones
      .filter((z) => zoneFilter === 'all' || z.id === zoneFilter)
      .map((z) => {
        const zoneBatches = filteredBatches.filter((b) => b.zoneId === z.id);
        const plantCount = zoneBatches.reduce((sum, b) => sum + b.plantCount, 0);
        return {
          zone: z.code,
          name: z.name,
          batches: zoneBatches.length,
          plants: plantCount,
          utilizationPct: Math.round((plantCount / z.capacityPlants) * 100),
        };
      });
  }, [state.zones, filteredBatches, zoneFilter]);

  // 4. Environmental trends (last 10 days for selected zone or farm average)
  const envTrendData = useMemo(() => {
    const dates = Array.from(new Set(state.environmentalReadings.map((r) => r.date)))
      .sort()
      .slice(-10);
    return dates.map((date) => {
      const dayReadings = state.environmentalReadings.filter(
        (r) => r.date === date && (zoneFilter === 'all' || r.zoneId === zoneFilter),
      );
      const count = Math.max(1, dayReadings.length);
      const avgTemp = dayReadings.reduce((s, r) => s + r.temperatureC, 0) / count;
      const avgRh = dayReadings.reduce((s, r) => s + r.humidityPct, 0) / count;
      return {
        date: formatMonthDay(date),
        tempC: Number(avgTemp.toFixed(1)),
        humidityPct: Number(avgRh.toFixed(1)),
      };
    });
  }, [state.environmentalReadings, zoneFilter]);

  // Upcoming harvests sorted soonest first
  const upcomingBatches = useMemo(() => {
    return [...filteredBatches]
      .sort((a, b) => {
        const da = predictions[a.id]?.daysRemaining ?? 99;
        const db = predictions[b.id]?.daysRemaining ?? 99;
        return da - db;
      })
      .slice(0, 6);
  }, [filteredBatches, predictions]);

  const filteredAlerts = useMemo(() => {
    return state.alerts.filter((a) => zoneFilter === 'all' || a.zoneId === zoneFilter);
  }, [state.alerts, zoneFilter]);

  return (
    <AppShell
      title="Farm Operations Overview"
      breadcrumb="Overview"
      actions={
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#153F32] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0F2F25] whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span>Register Batch</span>
        </button>
      }
    >
      <div className="space-y-6">
        <DemoDisclaimerBanner text="DEMONSTRATION DATA — Stage 1 interactive farm overview powered by deterministic sample telemetry and rule-based estimates." />

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DFE6DD] bg-white px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="dash-zone" className="text-xs font-medium text-[#78847D]">
                Zone
              </label>
              <select
                id="dash-zone"
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="rounded-lg border border-[#DFE6DD] bg-[#F7F9F5] px-2.5 py-1.5 text-xs font-medium text-[#202923] focus:border-[#153F32] focus:outline-none"
              >
                <option value="all">All Zones (A–D)</option>
                {state.zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.code} — {z.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="dash-status" className="text-xs font-medium text-[#78847D]">
                Status
              </label>
              <select
                id="dash-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | BatchHealthStatus)}
                className="rounded-lg border border-[#DFE6DD] bg-[#F7F9F5] px-2.5 py-1.5 text-xs font-medium text-[#202923] focus:border-[#153F32] focus:outline-none"
              >
                <option value="all">All Active</option>
                <option value="Healthy">Healthy</option>
                <option value="Attention">Attention</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-[#F7F9F5] p-1">
            {[
              { label: 'Next 7d', days: 7 },
              { label: 'Next 14d', days: 14 },
              { label: 'Full Cycle', days: 30 },
            ].map((opt) => (
              <button
                key={opt.days}
                type="button"
                onClick={() => setHorizonDays(opt.days)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  horizonDays === opt.days
                    ? 'bg-white text-[#153F32] shadow-xs'
                    : 'text-[#78847D] hover:text-[#202923]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5 KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-[#DFE6DD] bg-white p-4">
            <p className="text-xs font-medium text-[#78847D]">Active Crop Batches</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-[#202923] tabular-nums">
              {kpis.activeCount}
            </p>
            <p className="mt-1 text-xs text-[#78847D] tabular-nums">
              {formatNumber(kpis.totalPlants)} lettuce heads
            </p>
          </div>

          <div className="rounded-xl border border-[#DFE6DD] bg-white p-4">
            <p className="text-xs font-medium text-[#78847D]">Growing Zones</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-[#202923] tabular-nums">
              {kpis.zonesActive}
            </p>
            <p className="mt-1 text-xs text-[#78847D]">Hydroponic NFT racks</p>
          </div>

          <div className="rounded-xl border border-[#DFE6DD] bg-white p-4">
            <p className="text-xs font-medium text-[#78847D]">Approaching Harvest</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-[#287A55] tabular-nums">
              {kpis.approachingCount}
            </p>
            <p className="mt-1 text-xs text-[#78847D]">Within 7-day window</p>
          </div>

          <div className="rounded-xl border border-[#DFE6DD] bg-white p-4">
            <p className="text-xs font-medium text-[#78847D]">Estimated Upcoming Yield</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-[#153F32] tabular-nums">
              {formatWeightKg(kpis.totalYieldKg, 1)}
            </p>
            <p className="mt-1 text-xs text-[#78847D]">Demonstration forecast</p>
          </div>

          <div className="rounded-xl border border-[#DFE6DD] bg-white p-4">
            <p className="text-xs font-medium text-[#78847D]">Batches Requiring Attention</p>
            <p
              className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${
                kpis.attentionCount > 0 ? 'text-[#B91C1C]' : 'text-[#287A55]'
              }`}
            >
              {kpis.attentionCount}
            </p>
            <p className="mt-1 text-xs text-[#78847D]">Attention or Critical</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard
            title="Predicted Harvest Yield Forecast"
            subtitle="Expected harvestable weight (kg) by predicted maturity date"
            action={
              <Link
                to="/predictions"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#153F32] hover:underline"
              >
                <span>Open Predictions</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          >
            {yieldTimelineData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-xs text-[#78847D]">
                No batches match the active filter horizon.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={yieldTimelineData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDF2EB" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#78847D' }} />
                    <YAxis
                      unit=" kg"
                      tick={{ fontSize: 11, fill: '#78847D' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#DFE6DD',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: unknown) => [`${value} kg`, 'Est. Yield']}
                    />
                    <Area
                      type="monotone"
                      dataKey="estimatedYieldKg"
                      stroke="#153F32"
                      strokeWidth={2}
                      fill="#E8F0E8"
                      name="Estimated Yield (kg)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Crop Growth Overview (Canopy Height)"
            subtitle="Latest observed height (cm) vs. cultivar day-age benchmark"
            action={
              <Link
                to="/batches"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#153F32] hover:underline"
              >
                <span>View Batches</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          >
            {growthOverviewData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-xs text-[#78847D]">
                No active batches match the current filters.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={growthOverviewData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDF2EB" />
                    <XAxis dataKey="batchId" tick={{ fontSize: 11, fill: '#78847D' }} />
                    <YAxis unit=" cm" tick={{ fontSize: 11, fill: '#78847D' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#DFE6DD',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="actualHeightCm" name="Observed Height (cm)" fill="#287A55" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="targetHeightCm" name="Target Curve (cm)" fill="#D7A65B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard
            title="Zone-Wise Crop Distribution"
            subtitle="Active plants and rack utilization across growing zones"
          >
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zoneDistributionData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDF2EB" />
                  <XAxis dataKey="zone" tick={{ fontSize: 11, fill: '#78847D' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#78847D' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#DFE6DD',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: unknown) => [`${value} plants`, 'Active Plants']}
                  />
                  <Bar dataKey="plants" name="Active Plants" radius={[4, 4, 0, 0]}>
                    {zoneDistributionData.map((entry, idx) => (
                      <Cell
                        key={entry.zone}
                        fill={idx % 2 === 0 ? '#153F32' : '#287A55'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard
            title="Environmental Trends (10-Day Climate)"
            subtitle="Simulated daily average temperature (°C) and relative humidity (%)"
            action={
              <Link
                to="/environment"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#153F32] hover:underline"
              >
                <span>Zone Telemetry</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          >
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={envTrendData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDF2EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#78847D' }} />
                  <YAxis yAxisId="left" domain={[15, 25]} unit="°C" tick={{ fontSize: 11, fill: '#78847D' }} />
                  <YAxis yAxisId="right" orientation="right" domain={[45, 80]} unit="%" tick={{ fontSize: 11, fill: '#78847D' }} />
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
                    dataKey="tempC"
                    name="Avg Temp (°C)"
                    stroke="#153F32"
                    strokeWidth={2}
                    dot={{ r: 2.5 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="humidityPct"
                    name="Avg RH (%)"
                    stroke="#D7A65B"
                    strokeWidth={2}
                    dot={{ r: 2.5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {/* Bottom Operational Row: Upcoming Harvest Schedule + Recent Alerts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <SectionCard
            title="Upcoming Harvest Schedule"
            subtitle="Click any batch card to inspect growth curve and prediction drivers"
            className="lg:col-span-7"
            action={
              <Link
                to="/harvest"
                className="text-xs font-medium text-[#153F32] hover:underline"
              >
                Manage Harvests
              </Link>
            }
          >
            {upcomingBatches.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#78847D]">
                No upcoming harvests match the active filters.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {upcomingBatches.map((batch) => {
                  const pred = predictions[batch.id];
                  const zone = state.zones.find((z) => z.id === batch.zoneId);
                  return (
                    <button
                      key={batch.id}
                      type="button"
                      onClick={() => navigate(`/batches/${batch.id}`)}
                      className="flex flex-col justify-between rounded-lg border border-[#DFE6DD] bg-[#F7F9F5]/60 p-4 text-left transition-colors hover:border-[#287A55] hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-xs font-semibold text-[#153F32]">
                            {batch.id} · {batch.rackNumber}
                          </p>
                          <p className="mt-0.5 text-sm font-semibold text-[#202923]">
                            {batch.cultivar}
                          </p>
                        </div>
                        <HealthStatusLabel status={batch.status} />
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-[#EDF2EB] pt-2.5 text-xs">
                        <div>
                          <span className="text-[#78847D]">{zone?.code} · </span>
                          <GrowthStageText stage={pred.growthStage} />
                        </div>
                        <span className="font-mono font-semibold text-[#202923] tabular-nums">
                          {pred.daysRemaining <= 0 ? 'Due now' : `${pred.daysRemaining}d`} ·{' '}
                          {formatWeightKg(pred.estimatedYieldKg)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#78847D]">
                        Est. Harvest: {formatDateShort(pred.predictedHarvestDate)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Recent Anomaly & Growth Alerts"
            subtitle="Active observations requiring grower verification"
            className="lg:col-span-5"
          >
            {filteredAlerts.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#78847D]">
                No alerts recorded for the selected zone.
              </p>
            ) : (
              <div className="divide-y divide-[#EDF2EB]">
                {filteredAlerts.map((alert) => (
                  <div key={alert.id} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <HealthStatusLabel status={alert.severity} />
                      <span className="font-mono text-[11px] text-[#78847D] tabular-nums">
                        {alert.detectedAt}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-[#202923]">{alert.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#78847D]">
                      {alert.description}
                    </p>
                    <div className="mt-2.5 flex items-center gap-3 text-xs">
                      {alert.batchId && (
                        <Link
                          to={`/batches/${alert.batchId}`}
                          className="font-medium text-[#153F32] hover:underline"
                        >
                          Inspect {alert.batchId}
                        </Link>
                      )}
                      {!alert.acknowledged ? (
                        <button
                          type="button"
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="font-medium text-[#78847D] hover:text-[#202923]"
                        >
                          Acknowledge
                        </button>
                      ) : (
                        <span className="text-[#78847D]">Acknowledged</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <BatchFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </AppShell>
  );
}
