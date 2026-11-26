import React, { useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { SectionCard } from '../components/ui/SectionCard';
import { useToast } from '../components/ui/Toast';
import { useFarmData } from '../context/FarmDataContext';

export function SettingsPage() {
  const { state, updateFarmProfile, updatePredictionCriteria, resetDemoData } = useFarmData();
  const { showToast } = useToast();

  const [farmName, setFarmName] = useState(state.farmProfile.name);
  const [location, setLocation] = useState(state.farmProfile.location);
  const [managerName, setManagerName] = useState(state.farmProfile.managerName);
  const [managerEmail, setManagerEmail] = useState(state.farmProfile.managerEmail);
  const [areaSqm, setAreaSqm] = useState(String(state.farmProfile.facilityAreaSqm));
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const [readyDays, setReadyDays] = useState(String(state.predictionCriteria.readyDaysThreshold));
  const [approachingDays, setApproachingDays] = useState(
    String(state.predictionCriteria.approachingDaysThreshold),
  );
  const [minLeaves, setMinLeaves] = useState(
    String(state.predictionCriteria.minLeafCountForReady),
  );
  const [minHeight, setMinHeight] = useState(
    String(state.predictionCriteria.minHeightCmForReady),
  );

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmName.trim() || !managerName.trim()) {
      showToast('Farm name and manager name cannot be empty.', 'error');
      return;
    }
    updateFarmProfile({
      name: farmName.trim(),
      location: location.trim(),
      managerName: managerName.trim(),
      managerEmail: managerEmail.trim(),
      facilityAreaSqm: Number(areaSqm) || state.farmProfile.facilityAreaSqm,
    });
    showToast('Saved farm profile settings.');
  };

  const handleSaveCriteria = (e: React.FormEvent) => {
    e.preventDefault();
    updatePredictionCriteria({
      readyDaysThreshold: Number(readyDays) || 2,
      approachingDaysThreshold: Number(approachingDays) || 7,
      minLeafCountForReady: Number(minLeaves) || 18,
      minHeightCmForReady: Number(minHeight) || 16.0,
    });
    showToast('Updated maturity classification criteria.');
  };

  return (
    <AppShell title="Farm & Application Settings" breadcrumb="Settings">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Farm Profile Form */}
          <SectionCard
            title="Facility Profile"
            subtitle="Primary hydroponic vertical farm details persisted locally for Stage 1"
            className="lg:col-span-6"
          >
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#202923]" htmlFor="set-farm-name">
                  Farm Name
                </label>
                <input
                  id="set-farm-name"
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#DFE6DD] px-3 py-2 text-sm focus:border-[#153F32] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#202923]" htmlFor="set-location">
                    Location / Facility Code
                  </label>
                  <input
                    id="set-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#DFE6DD] px-3 py-2 text-sm focus:border-[#153F32] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#202923]" htmlFor="set-area">
                    Canopy Area (m²)
                  </label>
                  <input
                    id="set-area"
                    type="number"
                    value={areaSqm}
                    onChange={(e) => setAreaSqm(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#DFE6DD] px-3 py-2 font-mono text-sm tabular-nums focus:border-[#153F32] focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#202923]" htmlFor="set-manager">
                    Farm Manager Name
                  </label>
                  <input
                    id="set-manager"
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#DFE6DD] px-3 py-2 text-sm focus:border-[#153F32] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#202923]" htmlFor="set-email">
                    Contact Email
                  </label>
                  <input
                    id="set-email"
                    type="email"
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#DFE6DD] px-3 py-2 text-sm focus:border-[#153F32] focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#153F32] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F2F25]"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Farm Profile</span>
                </button>
              </div>
            </form>
          </SectionCard>

          {/* Maturity Criteria Settings */}
          <SectionCard
            title="Demonstration Maturity Rules"
            subtitle="Configurable thresholds used by Stage 1 harvest readiness grouping"
            className="lg:col-span-6"
          >
            <form onSubmit={handleSaveCriteria} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#202923]" htmlFor="set-ready-d">
                    Ready Window (days remaining ≤)
                  </label>
                  <input
                    id="set-ready-d"
                    type="number"
                    min={0}
                    max={7}
                    value={readyDays}
                    onChange={(e) => setReadyDays(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#DFE6DD] px-3 py-2 font-mono text-sm tabular-nums focus:border-[#153F32] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#202923]" htmlFor="set-app-d">
                    Approaching Maturity (days ≤)
                  </label>
                  <input
                    id="set-app-d"
                    type="number"
                    min={3}
                    max={14}
                    value={approachingDays}
                    onChange={(e) => setApproachingDays(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#DFE6DD] px-3 py-2 font-mono text-sm tabular-nums focus:border-[#153F32] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#202923]" htmlFor="set-min-leaf">
                    Minimum Leaves for Ready
                  </label>
                  <input
                    id="set-min-leaf"
                    type="number"
                    min={10}
                    max={28}
                    value={minLeaves}
                    onChange={(e) => setMinLeaves(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#DFE6DD] px-3 py-2 font-mono text-sm tabular-nums focus:border-[#153F32] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#202923]" htmlFor="set-min-h">
                    Minimum Height (cm)
                  </label>
                  <input
                    id="set-min-h"
                    type="number"
                    step="0.5"
                    min={10}
                    max={25}
                    value={minHeight}
                    onChange={(e) => setMinHeight(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#DFE6DD] px-3 py-2 font-mono text-sm tabular-nums focus:border-[#153F32] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#153F32] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F2F25]"
                >
                  <Save className="h-4 w-4" />
                  <span>Update Criteria</span>
                </button>
              </div>
            </form>
          </SectionCard>
        </div>

        {/* Growing Zone Target Specifications */}
        <SectionCard
          title="Configured Growing Zones (Lettuce Facility)"
          subtitle="Target agronomic parameters per vertical farming zone"
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EDF2EB] bg-[#F7F9F5] font-semibold text-[#5B6660]">
                  <th className="px-4 py-3">Zone</th>
                  <th className="px-4 py-3">Stage Focus</th>
                  <th className="px-4 py-3 text-right">Racks</th>
                  <th className="px-4 py-3 text-right">Temp Band</th>
                  <th className="px-4 py-3 text-right">RH Band</th>
                  <th className="px-4 py-3 text-right">PPFD Band</th>
                  <th className="px-4 py-3 text-right">pH / EC Band</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF2EB]">
                {state.zones.map((z) => (
                  <tr key={z.id}>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-[#153F32]">{z.code}</span>
                      <span className="block text-[11px] text-[#78847D]">{z.name}</span>
                    </td>
                    <td className="px-4 py-3 text-[#5B6660]">{z.focusStage}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{z.rackCount}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {z.targetTempC[0]}–{z.targetTempC[1]} °C
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {z.targetHumidityPct[0]}–{z.targetHumidityPct[1]} %
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {z.targetLightPpfd[0]}–{z.targetLightPpfd[1]}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {z.targetPh[0]}–{z.targetPh[1]} / {z.targetEcMsCm[0]}–{z.targetEcMsCm[1]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Demonstration Workspace Reset */}
        <SectionCard
          title="Stage 1 Demonstration Workspace"
          subtitle="All changes made in Stage 1 are stored locally in browser storage"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-xl text-xs leading-relaxed text-[#5B6660]">
              Resetting restores the seeded lettuce batches, growth observations, alerts, and
              harvest records back to their initial demonstration baseline.
            </p>
            <button
              type="button"
              onClick={() => setResetConfirmOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#F5C2C2] bg-[#FEF2F2] px-4 py-2 text-xs font-semibold text-[#991B1B] hover:bg-[#FEE2E2]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Demonstration Data</span>
            </button>
          </div>
        </SectionCard>
      </div>

      <ConfirmDialog
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={() => {
          resetDemoData();
          setFarmName('Verdant Valley Vertical Farm');
          setLocation('Facility 01 — Willamette Valley');
          setManagerName('Clara Lindqvist');
          setManagerEmail('clara.lindqvist@verdantvalley.ag');
          setAreaSqm('2400');
          setReadyDays('2');
          setApproachingDays('7');
          setMinLeaves('18');
          setMinHeight('16');
          showToast('Demonstration workspace restored to initial seed data.');
        }}
        title="Reset Demonstration Data"
        message="This will discard any newly registered batches, observations, and logged harvests in local storage and restore the default Stage 1 dataset."
        confirmLabel="Restore Seed Data"
        destructive
      />
    </AppShell>
  );
}
