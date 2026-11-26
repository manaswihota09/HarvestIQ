import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { AppShell } from '../components/layout/AppShell';
import { SectionCard } from '../components/ui/SectionCard';
import { DemoDisclaimerBanner, HealthStatusLabel } from '../components/ui/StatusBadge';
import { useFarmData } from '../context/FarmDataContext';
import {
  getLatestObservation,
  getLatestZoneReading,
  isReadingOutOfRange,
} from '../utils/calculations';
import { formatMonthDay } from '../utils/formatters';

export function EnvironmentPage() {
  const { state, activeBatches, acknowledgeAlert } = useFarmData();
  const [selectedZoneId, setSelectedZoneId] = useState<string>(state.zones[0]?.id ?? 'zone-a');
  const [metricTab, setMetricTab] = useState<'climate' | 'nutrient' | 'light'>('climate');

  const selectedZone = state.zones.find((z) => z.id === selectedZoneId) ?? state.zones[0];
  const latestReading = getLatestZoneReading(selectedZone.id, state.environmentalReadings);
  const readingCheck = latestReading
    ? isReadingOutOfRange(latestReading, selectedZone)
    : { outOfRangeCount: 0, issues: [] };

  const zoneHistory = useMemo(() => {
    return state.environmentalReadings
      .filter((r) => r.zoneId === selectedZone.id)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => ({
        ...r,
        label: formatMonthDay(r.date),
      }));
  }, [state.environmentalReadings, selectedZone.id]);

  const zoneComparison = useMemo(() => {
    return state.zones.map((z) => {
      const latest = getLatestZoneReading(z.id, state.environmentalReadings);
      const check = latest
        ? isReadingOutOfRange(latest, z)
        : { outOfRangeCount: 0, issues: [] };
      const zoneBatches = activeBatches.filter((b) => b.zoneId === z.id);
      const avgUniformity =
        zoneBatches.length > 0
          ? Math.round(
              zoneBatches.reduce((sum, b) => {
                const obs = getLatestObservation(b.id, state.observations);
                return sum + (obs?.uniformityScorePct ?? 94);
              }, 0) / zoneBatches.length,
            )
          : 0;

      return {
        zoneId: z.id,
        code: z.code,
        name: z.name,
        tempC: latest?.temperatureC ?? 0,
        humidityPct: latest?.humidityPct ?? 0,
        lightPpfd: latest?.lightPpfd ?? 0,
        ph: latest?.ph ?? 0,
        ecMsCm: latest?.ecMsCm ?? 0,
        issues: check.issues,
        avgUniformity,
        batchCount: zoneBatches.length,
      };
    });
  }, [state.zones, state.environmentalReadings, activeBatches, state.observations]);

  const correlationRows = useMemo(() => {
    return activeBatches.map((batch) => {
      const zone = state.zones.find((z) => z.id === batch.zoneId);
      const obs = getLatestObservation(batch.id, state.observations);
      const latest = getLatestZoneReading(batch.zoneId, state.environmentalReadings);
      const check =
        zone && latest ? isReadingOutOfRange(latest, zone) : { outOfRangeCount: 0, issues: [] };
      return {
        batchId: batch.id,
        cultivar: batch.cultivar,
        zoneCode: zone?.code ?? batch.zoneId,
        ec: latest?.ecMsCm ?? 0,
        rh: latest?.humidityPct ?? 0,
        leafCount: obs?.avgLeafCount ?? 0,
        uniformity: obs?.uniformityScorePct ?? 0,
        driftNote: check.issues[0] ?? 'Within target band',
      };
    });
  }, [activeBatches, state.zones, state.observations, state.environmentalReadings]);

  const envAlerts = useMemo(
    () => state.alerts.filter((a) => a.category === 'Environmental Drift' || a.zoneId === selectedZone.id),
    [state.alerts, selectedZone.id],
  );

  return (
    <AppShell title="Environmental Monitoring" breadcrumb="Environment">
      <div className="space-y-6">
        <DemoDisclaimerBanner text="SIMULATED SENSOR READINGS — Initial environmental telemetry is deterministic demonstration data. Live hardware integrations are excluded in Stage 1." />

        {/* Zone Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DFE6DD] bg-white px-4 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {state.zones.map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => setSelectedZoneId(zone.id)}
                className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedZone.id === zone.id
                    ? 'bg-[#153F32] text-white'
                    : 'bg-[#F7F9F5] text-[#5B6660] hover:text-[#202923]'
                }`}
              >
                {zone.code} · {zone.name}
              </button>
            ))}
          </div>
          <span className="text-xs text-[#78847D]">{selectedZone.focusStage}</span>
        </div>

        {/* Current Readings for Selected Zone */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              label: 'Temperature',
              value: latestReading ? `${latestReading.temperatureC.toFixed(1)} °C` : '—',
              target: `${selectedZone.targetTempC[0]}–${selectedZone.targetTempC[1]} °C`,
              inRange:
                latestReading &&
                latestReading.temperatureC >= selectedZone.targetTempC[0] &&
                latestReading.temperatureC <= selectedZone.targetTempC[1],
            },
            {
              label: 'Relative Humidity',
              value: latestReading ? `${latestReading.humidityPct.toFixed(1)} %` : '—',
              target: `${selectedZone.targetHumidityPct[0]}–${selectedZone.targetHumidityPct[1]} %`,
              inRange:
                latestReading &&
                latestReading.humidityPct >= selectedZone.targetHumidityPct[0] &&
                latestReading.humidityPct <= selectedZone.targetHumidityPct[1],
            },
            {
              label: 'Light Intensity',
              value: latestReading ? `${latestReading.lightPpfd} µmol/m²/s` : '—',
              target: `${selectedZone.targetLightPpfd[0]}–${selectedZone.targetLightPpfd[1]} PPFD`,
              inRange:
                latestReading &&
                latestReading.lightPpfd >= selectedZone.targetLightPpfd[0] &&
                latestReading.lightPpfd <= selectedZone.targetLightPpfd[1],
            },
            {
              label: 'Solution pH',
              value: latestReading ? latestReading.ph.toFixed(2) : '—',
              target: `${selectedZone.targetPh[0]}–${selectedZone.targetPh[1]} pH`,
              inRange:
                latestReading &&
                latestReading.ph >= selectedZone.targetPh[0] &&
                latestReading.ph <= selectedZone.targetPh[1],
            },
            {
              label: 'Nutrient EC',
              value: latestReading ? `${latestReading.ecMsCm.toFixed(2)} mS/cm` : '—',
              target: `${selectedZone.targetEcMsCm[0]}–${selectedZone.targetEcMsCm[1]} mS/cm`,
              inRange:
                latestReading &&
                latestReading.ecMsCm >= selectedZone.targetEcMsCm[0] &&
                latestReading.ecMsCm <= selectedZone.targetEcMsCm[1],
            },
          ].map((m) => (
            <div
              key={m.label}
              className={`rounded-xl border p-4 ${
                m.inRange === false
                  ? 'border-[#EBD5A9] bg-[#FDF8EE]'
                  : 'border-[#DFE6DD] bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-[#78847D]">{m.label}</p>
                <span
                  className={`text-[11px] font-medium ${
                    m.inRange === false ? 'text-[#9E6816]' : 'text-[#287A55]'
                  }`}
                >
                  {m.inRange === false ? 'Out of Band' : 'Nominal'}
                </span>
              </div>
              <p className="mt-2 font-mono text-xl font-semibold text-[#202923] tabular-nums">
                {m.value}
              </p>
              <p className="mt-1 font-mono text-[11px] text-[#78847D] tabular-nums">
                Target: {m.target}
              </p>
            </div>
          ))}
        </div>

        {readingCheck.outOfRangeCount > 0 && (
          <div className="rounded-xl border border-[#F5C2C2] bg-[#FEF2F2] px-4 py-3 text-xs text-[#991B1B]">
            <span className="font-semibold">{selectedZone.code} Drift Detected: </span>
            {readingCheck.issues.join(' · ')}
          </div>
        )}

        {/* Historical Trends Chart */}
        <SectionCard
          title={`14-Day Telemetry Trends · ${selectedZone.code}`}
          subtitle="Simulated daily readings across climate, fertigation, and lighting"
          action={
            <div className="flex items-center gap-1 rounded-lg bg-[#F7F9F5] p-1">
              {[
                { key: 'climate', label: 'Temp & RH' },
                { key: 'nutrient', label: 'pH & EC' },
                { key: 'light', label: 'Light PPFD' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setMetricTab(t.key as 'climate' | 'nutrient' | 'light')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    metricTab === t.key
                      ? 'bg-white text-[#153F32] shadow-xs'
                      : 'text-[#78847D] hover:text-[#202923]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          }
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {metricTab === 'climate' ? (
                <LineChart data={zoneHistory} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDF2EB" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#78847D' }} />
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
                    dataKey="temperatureC"
                    name="Temperature (°C)"
                    stroke="#153F32"
                    strokeWidth={2}
                    dot={{ r: 2.5 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="humidityPct"
                    name="Relative Humidity (%)"
                    stroke="#D7A65B"
                    strokeWidth={2}
                    dot={{ r: 2.5 }}
                  />
                </LineChart>
              ) : metricTab === 'nutrient' ? (
                <LineChart data={zoneHistory} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDF2EB" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#78847D' }} />
                  <YAxis yAxisId="left" domain={[5.2, 6.6]} tick={{ fontSize: 11, fill: '#78847D' }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0.9, 2.2]} tick={{ fontSize: 11, fill: '#78847D' }} />
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
                    dataKey="ph"
                    name="Solution pH"
                    stroke="#287A55"
                    strokeWidth={2}
                    dot={{ r: 2.5 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="ecMsCm"
                    name="EC (mS/cm)"
                    stroke="#153F32"
                    strokeWidth={2}
                    dot={{ r: 2.5 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={zoneHistory} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDF2EB" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#78847D' }} />
                  <YAxis domain={[150, 350]} unit=" PPFD" tick={{ fontSize: 11, fill: '#78847D' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#DFE6DD',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="lightPpfd"
                    name="Light Intensity (µmol/m²/s)"
                    fill="#287A55"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Zone-wise Comparison + Alerts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <SectionCard
            title="Zone-Wise Current Comparison"
            subtitle="Latest snapshot across Zones A through D"
            className="lg:col-span-7"
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EDF2EB] bg-[#F7F9F5] font-semibold text-[#5B6660]">
                    <th className="px-4 py-3">Zone</th>
                    <th className="px-4 py-3 text-right">Temp</th>
                    <th className="px-4 py-3 text-right">RH</th>
                    <th className="px-4 py-3 text-right">PPFD</th>
                    <th className="px-4 py-3 text-right">pH</th>
                    <th className="px-4 py-3 text-right">EC</th>
                    <th className="px-4 py-3 text-right">Uniformity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF2EB]">
                  {zoneComparison.map((row) => (
                    <tr
                      key={row.zoneId}
                      onClick={() => setSelectedZoneId(row.zoneId)}
                      className={`cursor-pointer transition-colors hover:bg-[#F7F9F5] ${
                        row.zoneId === selectedZone.id ? 'bg-[#E8F0E8]/40' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[#153F32]">{row.code}</span>
                        <span className="block text-[11px] text-[#78847D]">{row.name}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {row.tempC.toFixed(1)}°C
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {row.humidityPct.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {row.lightPpfd}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {row.ph.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {row.ecMsCm.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-[#287A55] tabular-nums">
                        {row.avgUniformity}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard
            title="Environmental Alerts"
            subtitle="Telemetry deviations affecting active racks"
            className="lg:col-span-5"
          >
            {envAlerts.length === 0 ? (
              <p className="py-6 text-xs text-[#78847D]">No environmental alerts logged.</p>
            ) : (
              <div className="divide-y divide-[#EDF2EB]">
                {envAlerts.map((alert) => (
                  <div key={alert.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <HealthStatusLabel status={alert.severity} />
                      <span className="font-mono text-[11px] text-[#78847D]">
                        {alert.detectedAt}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-[#202923]">{alert.title}</p>
                    <p className="mt-1 text-xs text-[#5B6660]">{alert.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      {alert.batchId && (
                        <Link
                          to={`/batches/${alert.batchId}`}
                          className="font-medium text-[#153F32] hover:underline"
                        >
                          Inspect {alert.batchId}
                        </Link>
                      )}
                      {!alert.acknowledged && (
                        <button
                          type="button"
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="text-[#78847D] hover:text-[#202923]"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Correlation with Crop Growth Observations */}
        <SectionCard
          title="Environmental Conditions vs. Observed Crop Uniformity"
          subtitle="Cross-reference zone EC and humidity against latest batch leaf count and uniformity scores"
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EDF2EB] bg-[#F7F9F5] font-semibold text-[#5B6660]">
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3">Zone</th>
                  <th className="px-4 py-3 text-right">Zone EC</th>
                  <th className="px-4 py-3 text-right">Zone RH</th>
                  <th className="px-4 py-3 text-right">Leaf Count</th>
                  <th className="px-4 py-3 text-right">Uniformity</th>
                  <th className="px-4 py-3">Condition Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF2EB]">
                {correlationRows.map((row) => (
                  <tr key={row.batchId} className="hover:bg-[#F7F9F5]">
                    <td className="px-4 py-3 font-mono font-semibold text-[#153F32]">
                      <Link to={`/batches/${row.batchId}`} className="hover:underline">
                        {row.batchId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#202923]">{row.zoneCode}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {row.ec.toFixed(2)} mS/cm
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {row.rh.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {row.leafCount}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-[#202923] tabular-nums">
                      {row.uniformity}%
                    </td>
                    <td className="px-4 py-3 text-[#5B6660]">{row.driftNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
