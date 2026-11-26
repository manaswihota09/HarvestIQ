import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  Download,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { BatchFormModal } from '../components/batches/BatchFormModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { SectionCard } from '../components/ui/SectionCard';
import { GrowthStageText, HealthStatusLabel } from '../components/ui/StatusBadge';
import { useToast } from '../components/ui/Toast';
import { useFarmData } from '../context/FarmDataContext';
import { BatchHealthStatus, CropBatch, GrowthStage } from '../types/harvestiq';
import { calculateCropAgeDays } from '../utils/calculations';
import {
  exportToCsv,
  formatDateShort,
  formatNumber,
  formatWeightKg,
} from '../utils/formatters';

type SortField = 'id' | 'plantingDate' | 'age' | 'plantCount' | 'predictedDate' | 'yield';
type SortDirection = 'asc' | 'desc';

export function BatchesPage() {
  const { state, predictions, deleteBatch } = useFarmData();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState<'all' | GrowthStage>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | BatchHealthStatus>('all');
  const [sortField, setSortField] = useState<SortField>('predictedDate');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<CropBatch | null>(null);
  const [deletingBatch, setDeletingBatch] = useState<CropBatch | null>(null);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filteredBatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = state.batches.filter((batch) => {
      if (zoneFilter !== 'all' && batch.zoneId !== zoneFilter) return false;
      if (statusFilter !== 'all' && batch.status !== statusFilter) return false;
      const pred = predictions[batch.id];
      if (stageFilter !== 'all' && pred?.growthStage !== stageFilter) return false;
      if (q) {
        const hay = `${batch.id} ${batch.cultivar} ${batch.rackNumber}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      const predA = predictions[a.id];
      const predB = predictions[b.id];
      let cmp = 0;
      switch (sortField) {
        case 'id':
          cmp = a.id.localeCompare(b.id);
          break;
        case 'plantingDate':
          cmp = a.plantingDate.localeCompare(b.plantingDate);
          break;
        case 'age':
          cmp =
            calculateCropAgeDays(a.plantingDate, state.farmProfile.referenceDate) -
            calculateCropAgeDays(b.plantingDate, state.farmProfile.referenceDate);
          break;
        case 'plantCount':
          cmp = a.plantCount - b.plantCount;
          break;
        case 'predictedDate':
          cmp = (predA?.predictedHarvestDate ?? '').localeCompare(
            predB?.predictedHarvestDate ?? '',
          );
          break;
        case 'yield':
          cmp = (predA?.estimatedYieldKg ?? 0) - (predB?.estimatedYieldKg ?? 0);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [
    state.batches,
    state.farmProfile.referenceDate,
    predictions,
    search,
    zoneFilter,
    stageFilter,
    statusFilter,
    sortField,
    sortDir,
  ]);

  const handleExportCsv = () => {
    const headers = [
      'Batch ID',
      'Crop',
      'Cultivar',
      'Zone',
      'Rack',
      'Planting Date',
      'Crop Age (Days)',
      'Plant Count',
      'Growth Stage',
      'Predicted Harvest Date',
      'Estimated Yield (kg)',
      'Status',
    ];
    const rows = filteredBatches.map((b) => {
      const zone = state.zones.find((z) => z.id === b.zoneId);
      const pred = predictions[b.id];
      const age = calculateCropAgeDays(b.plantingDate, state.farmProfile.referenceDate);
      return [
        b.id,
        b.crop,
        b.cultivar,
        zone?.code ?? b.zoneId,
        b.rackNumber,
        b.plantingDate,
        age,
        b.plantCount,
        b.status === 'Harvested' ? 'Harvested' : pred?.growthStage ?? '—',
        pred?.predictedHarvestDate ?? '—',
        pred?.estimatedYieldKg ?? 0,
        b.status,
      ];
    });
    exportToCsv(`harvestiq-batches-${state.farmProfile.referenceDate}.csv`, headers, rows);
    showToast(`Exported ${filteredBatches.length} batch records to CSV.`);
  };

  return (
    <AppShell
      title="Crop Batch Management"
      breadcrumb="Crop Batches"
      actions={
        <>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-[#DFE6DD] bg-white px-3.5 py-2 text-sm font-medium text-[#202923] transition-colors hover:bg-[#F7F9F5] whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingBatch(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#153F32] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0F2F25] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>New Batch</span>
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Search & Filter Controls */}
        <SectionCard>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#78847D]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Batch ID, cultivar, rack..."
                aria-label="Search crop batches"
                className="w-full rounded-lg border border-[#DFE6DD] bg-[#F7F9F5] py-2 pl-9 pr-3 text-sm text-[#202923] placeholder:text-[#78847D] focus:border-[#153F32] focus:bg-white focus:outline-none"
              />
            </div>

            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              aria-label="Filter by growing zone"
              className="rounded-lg border border-[#DFE6DD] bg-[#F7F9F5] px-3 py-2 text-sm text-[#202923] focus:border-[#153F32] focus:bg-white focus:outline-none"
            >
              <option value="all">All Growing Zones</option>
              {state.zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.code} — {z.name}
                </option>
              ))}
            </select>

            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as 'all' | GrowthStage)}
              aria-label="Filter by growth stage"
              className="rounded-lg border border-[#DFE6DD] bg-[#F7F9F5] px-3 py-2 text-sm text-[#202923] focus:border-[#153F32] focus:bg-white focus:outline-none"
            >
              <option value="all">All Growth Stages</option>
              <option value="Early Growth">Early Growth</option>
              <option value="Vegetative Growth">Vegetative Growth</option>
              <option value="Approaching Maturity">Approaching Maturity</option>
              <option value="Ready for Harvest">Ready for Harvest</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | BatchHealthStatus)}
              aria-label="Filter by status"
              className="rounded-lg border border-[#DFE6DD] bg-[#F7F9F5] px-3 py-2 text-sm text-[#202923] focus:border-[#153F32] focus:bg-white focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Healthy">Healthy</option>
              <option value="Attention">Attention</option>
              <option value="Critical">Critical</option>
              <option value="Harvested">Harvested</option>
            </select>
          </div>
        </SectionCard>

        {/* Batch Data Table */}
        <SectionCard
          title={`Lettuce Batches (${filteredBatches.length})`}
          subtitle="Click a column header to sort or select a batch to open full growth & prediction history"
          noPadding
        >
          {filteredBatches.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-[#202923]">No crop batches match your filters.</p>
              <p className="mt-1 text-xs text-[#78847D]">
                Clear search filters or register a new hydroponic lettuce batch.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setZoneFilter('all');
                  setStageFilter('all');
                  setStatusFilter('all');
                }}
                className="mt-4 rounded-lg border border-[#DFE6DD] bg-white px-4 py-2 text-xs font-medium text-[#153F32] hover:bg-[#F7F9F5]"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#EDF2EB] bg-[#F7F9F5] text-xs font-semibold text-[#5B6660]">
                      <th className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleSort('id')}
                          className="inline-flex items-center gap-1 hover:text-[#153F32]"
                        >
                          <span>Batch ID</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3">Cultivar</th>
                      <th className="px-4 py-3">Zone / Rack</th>
                      <th className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleSort('plantingDate')}
                          className="inline-flex items-center gap-1 hover:text-[#153F32]"
                        >
                          <span>Planted</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleSort('age')}
                          className="inline-flex items-center gap-1 hover:text-[#153F32]"
                        >
                          <span>Age</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleSort('plantCount')}
                          className="inline-flex items-center gap-1 hover:text-[#153F32]"
                        >
                          <span>Plants</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3">Growth Stage</th>
                      <th className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleSort('predictedDate')}
                          className="inline-flex items-center gap-1 hover:text-[#153F32]"
                        >
                          <span>Pred. Harvest</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleSort('yield')}
                          className="inline-flex items-center gap-1 hover:text-[#153F32]"
                        >
                          <span>Est. Yield</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDF2EB]">
                    {filteredBatches.map((batch) => {
                      const zone = state.zones.find((z) => z.id === batch.zoneId);
                      const pred = predictions[batch.id];
                      const age = calculateCropAgeDays(
                        batch.plantingDate,
                        state.farmProfile.referenceDate,
                      );
                      return (
                        <tr
                          key={batch.id}
                          className="transition-colors hover:bg-[#F7F9F5]/80"
                        >
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-[#153F32]">
                            <Link to={`/batches/${batch.id}`} className="hover:underline">
                              {batch.id}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-xs font-medium text-[#202923]">
                            <span>{batch.cultivar}</span>
                            <span className="block text-[11px] text-[#78847D]">{batch.crop}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-[#5B6660]">
                            <span className="font-medium text-[#202923]">{zone?.code}</span>
                            <span className="ml-1.5 font-mono text-[11px] text-[#78847D]">
                              {batch.rackNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-[#5B6660] tabular-nums">
                            {batch.plantingDate}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-[#202923] tabular-nums">
                            {age}d
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-[#202923] tabular-nums">
                            {formatNumber(batch.plantCount)}
                          </td>
                          <td className="px-4 py-3">
                            {batch.status === 'Harvested' ? (
                              <span className="text-xs text-[#78847D]">Completed</span>
                            ) : (
                              <GrowthStageText stage={pred.growthStage} />
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-[#202923] tabular-nums">
                            {batch.status === 'Harvested'
                              ? '—'
                              : formatDateShort(pred.predictedHarvestDate)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-[#153F32] tabular-nums">
                            {formatWeightKg(pred.estimatedYieldKg)}
                          </td>
                          <td className="px-4 py-3">
                            <HealthStatusLabel status={batch.status} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => navigate(`/batches/${batch.id}`)}
                                title="View batch details"
                                className="rounded p-1.5 text-[#5B6660] hover:bg-[#E8F0E8] hover:text-[#153F32]"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBatch(batch);
                                  setModalOpen(true);
                                }}
                                title="Edit batch"
                                className="rounded p-1.5 text-[#5B6660] hover:bg-[#E8F0E8] hover:text-[#153F32]"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingBatch(batch)}
                                title="Delete batch"
                                className="rounded p-1.5 text-[#5B6660] hover:bg-[#FEF2F2] hover:text-[#B91C1C]"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="divide-y divide-[#EDF2EB] md:hidden">
                {filteredBatches.map((batch) => {
                  const zone = state.zones.find((z) => z.id === batch.zoneId);
                  const pred = predictions[batch.id];
                  const age = calculateCropAgeDays(
                    batch.plantingDate,
                    state.farmProfile.referenceDate,
                  );
                  return (
                    <div key={batch.id} className="space-y-2.5 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            to={`/batches/${batch.id}`}
                            className="font-mono text-sm font-semibold text-[#153F32] hover:underline"
                          >
                            {batch.id} · {batch.rackNumber}
                          </Link>
                          <p className="text-sm font-medium text-[#202923]">{batch.cultivar}</p>
                        </div>
                        <HealthStatusLabel status={batch.status} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-[#5B6660]">
                        <span>Zone: {zone?.code}</span>
                        <span className="font-mono tabular-nums">Age: {age} days</span>
                        <span className="font-mono tabular-nums">
                          Plants: {formatNumber(batch.plantCount)}
                        </span>
                        <span className="font-mono font-semibold text-[#153F32] tabular-nums">
                          Est: {formatWeightKg(pred.estimatedYieldKg)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-[#EDF2EB] pt-2.5 text-xs">
                        <GrowthStageText stage={pred.growthStage} />
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/batches/${batch.id}`}
                            className="font-medium text-[#153F32] hover:underline"
                          >
                            Details
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBatch(batch);
                              setModalOpen(true);
                            }}
                            className="font-medium text-[#5B6660] hover:text-[#202923]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingBatch(batch)}
                            className="font-medium text-[#B91C1C]"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </SectionCard>
      </div>

      <BatchFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingBatch={editingBatch}
      />

      <ConfirmDialog
        open={Boolean(deletingBatch)}
        onClose={() => setDeletingBatch(null)}
        onConfirm={() => {
          if (deletingBatch) {
            deleteBatch(deletingBatch.id);
            showToast(`Deleted batch ${deletingBatch.id}.`);
          }
        }}
        title="Delete Crop Batch"
        message={`Are you sure you want to delete batch ${deletingBatch?.id} (${deletingBatch?.cultivar})? This removes its growth observations and alerts from your local demonstration workspace.`}
        confirmLabel="Delete Batch"
        destructive
      />
    </AppShell>
  );
}
