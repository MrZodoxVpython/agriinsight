import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  MapPin,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Sprout,
  Trash2,
  X,
} from 'lucide-react';
import PlanForm from '../components/PlanForm';
import { ConfirmDialog, EmptyState, Modal, StatusBadge } from '../components/ui';
import { formatDate, number, percent, rupiah } from '../lib/format';
import { COMMODITIES, PLAN_STATUSES, exportPlansToCsv, planMetrics } from '../lib/plans';

const SORTS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'margin', label: 'Margin tertinggi' },
  { value: 'area', label: 'Luas terbesar' },
  { value: 'harvest', label: 'Panen terdekat' },
];

export default function PlansPage({
  plans,
  loading,
  onCreate,
  onUpdate,
  onDelete,
  notify,
  pendingCreate,
  onPendingConsumed,
}) {
  const [query, setQuery] = useState('');
  const [commodity, setCommodity] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (!pendingCreate) return;
    setServerError('');
    setEditing('new');
    onPendingConsumed();
  }, [pendingCreate, onPendingConsumed]);

  const commodityOptions = useMemo(() => {
    const values = new Set([...COMMODITIES, ...plans.map((plan) => plan.commodity)]);
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [plans]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = plans.filter((plan) => {
      const matchesQuery =
        !needle ||
        plan.commodity.toLowerCase().includes(needle) ||
        plan.location.toLowerCase().includes(needle);
      const matchesCommodity = commodity === 'all' || plan.commodity === commodity;
      const matchesStatus = status === 'all' || plan.status === status;
      return matchesQuery && matchesCommodity && matchesStatus;
    });

    return result.sort((a, b) => {
      if (sort === 'margin') return planMetrics(b).margin - planMetrics(a).margin;
      if (sort === 'area') return Number(b.planted_area_ha) - Number(a.planted_area_ha);
      if (sort === 'harvest') {
        const aDate = a.expected_harvest_date ? new Date(a.expected_harvest_date).getTime() : Infinity;
        const bDate = b.expected_harvest_date ? new Date(b.expected_harvest_date).getTime() : Infinity;
        return aDate - bDate;
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [plans, query, commodity, status, sort]);

  const hasFilters = query || commodity !== 'all' || status !== 'all';
  const filteredMetrics = filtered.reduce(
    (acc, plan) => {
      const metrics = planMetrics(plan);
      acc.area += metrics.area;
      acc.revenue += metrics.revenue;
      acc.margin += metrics.margin;
      return acc;
    },
    { area: 0, revenue: 0, margin: 0 }
  );

  function openCreate() {
    setServerError('');
    setEditing('new');
  }

  function openEdit(plan) {
    setServerError('');
    setEditing(plan);
  }

  function closeForm() {
    if (submitting) return;
    setEditing(null);
    setServerError('');
  }

  async function handleSave(payload) {
    setSubmitting(true);
    setServerError('');
    try {
      if (editing === 'new') await onCreate(payload);
      else await onUpdate(editing.id, payload);
      setEditing(null);
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeletingLoading(true);
    try {
      await onDelete(deleting.id);
      setDeleting(null);
    } catch (error) {
      notify('error', error.message);
    } finally {
      setDeletingLoading(false);
    }
  }

  function handleExport() {
    if (filtered.length === 0) {
      notify('info', 'Tidak ada data untuk diekspor.');
      return;
    }
    exportPlansToCsv(filtered);
    notify('success', `${filtered.length} rencana berhasil diekspor ke CSV.`);
  }

  function resetFilters() {
    setQuery('');
    setCommodity('all');
    setStatus('all');
    setSort('newest');
  }

  return (
    <div className="page-stack">
      <section className="toolbar-card">
        <div className="toolbar-main">
          <div className="search-field">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari komoditas atau lokasi..."
              aria-label="Cari rencana tanam"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Hapus pencarian">
                <X size={14} />
              </button>
            )}
          </div>

          <label className="filter-select">
            <span>Komoditas</span>
            <select value={commodity} onChange={(event) => setCommodity(event.target.value)}>
              <option value="all">Semua komoditas</option>
              {commodityOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="filter-select">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">Semua status</option>
              {PLAN_STATUSES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="filter-select">
            <span>Urutkan</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              {SORTS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="toolbar-footer">
          <div className="toolbar-summary">
            <span className="toolbar-count">
              <SlidersHorizontal size={14} />
              {filtered.length} dari {plans.length} rencana
            </span>
            <span>{number(filteredMetrics.area, 2)} ha</span>
            <span>{rupiah(filteredMetrics.revenue)} omzet</span>
            <span>{rupiah(filteredMetrics.margin)} margin</span>
            {hasFilters && (
              <button type="button" className="text-button" onClick={resetFilters}>
                Reset filter
              </button>
            )}
          </div>
          <div className="toolbar-actions">
            <button type="button" className="button button-ghost" onClick={handleExport}>
              <Download size={15} /> Ekspor CSV
            </button>
            <button type="button" className="button button-primary" onClick={openCreate}>
              <Plus size={15} /> Tambah rencana
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="skeleton skeleton-table" />
      ) : plans.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={Sprout}
            title="Belum ada rencana tanam"
            description="Mulai dengan mencatat komoditas, luas lahan, biaya produksi, dan target harga. Analisis akan dihitung otomatis."
            action={
              <button type="button" className="button button-primary" onClick={openCreate}>
                <Plus size={15} /> Buat rencana pertama
              </button>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={Search}
            title="Tidak ada rencana yang cocok"
            description="Coba ubah kata kunci pencarian atau reset filter."
            action={
              <button type="button" className="button button-ghost" onClick={resetFilters}>
                Reset filter
              </button>
            }
          />
        </div>
      ) : (
        <>
          <section className="panel table-panel">
            <div className="table-wrap">
              <table className="plans-table">
                <thead>
                  <tr>
                    <th>Komoditas</th>
                    <th>Lokasi</th>
                    <th>Luas</th>
                    <th>Tanam / Panen</th>
                    <th>Estimasi hasil</th>
                    <th>Omzet</th>
                    <th>Margin</th>
                    <th>Status</th>
                    <th aria-label="Aksi" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((plan) => {
                    const metrics = planMetrics(plan);
                    return (
                      <tr key={plan.id}>
                        <td>
                          <strong>{plan.commodity}</strong>
                          <small>{rupiah(metrics.price)}/kg</small>
                        </td>
                        <td>
                          <span className="cell-location">
                            <MapPin size={13} /> {plan.location}
                          </span>
                        </td>
                        <td>{number(metrics.area, 2)} ha</td>
                        <td>
                          <span className="date-stack">
                            <span>{formatDate(plan.planting_date)}</span>
                            <small>{formatDate(plan.expected_harvest_date)}</small>
                          </span>
                        </td>
                        <td>{number(metrics.yieldKg)} kg</td>
                        <td>{rupiah(metrics.revenue)}</td>
                        <td>
                          <span className={metrics.margin >= 0 ? 'text-positive' : 'text-negative'}>
                            {rupiah(metrics.margin)}
                          </span>
                          <small>{percent(metrics.marginPercent)}</small>
                        </td>
                        <td><StatusBadge status={plan.status} /></td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => openEdit(plan)}
                              title="Edit rencana"
                              aria-label={`Edit ${plan.commodity}`}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              className="icon-button icon-button-danger"
                              onClick={() => setDeleting(plan)}
                              title="Hapus rencana"
                              aria-label={`Hapus ${plan.commodity}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="plan-mobile-list">
            {filtered.map((plan) => {
              const metrics = planMetrics(plan);
              return (
                <article key={plan.id} className="plan-mobile-card">
                  <div className="plan-mobile-head">
                    <div>
                      <strong>{plan.commodity}</strong>
                      <span><MapPin size={12} /> {plan.location}</span>
                    </div>
                    <StatusBadge status={plan.status} />
                  </div>
                  <div className="plan-mobile-grid">
                    <div><span>Luas</span><strong>{number(metrics.area, 2)} ha</strong></div>
                    <div><span>Hasil</span><strong>{number(metrics.yieldKg)} kg</strong></div>
                    <div><span>Panen</span><strong>{formatDate(plan.expected_harvest_date)}</strong></div>
                    <div><span>Omzet</span><strong>{rupiah(metrics.revenue)}</strong></div>
                    <div><span>Margin</span><strong className={metrics.margin >= 0 ? 'text-positive' : 'text-negative'}>{rupiah(metrics.margin)}</strong></div>
                    <div><span>Harga impas</span><strong>{rupiah(metrics.breakEvenPrice)}/kg</strong></div>
                  </div>
                  <div className="plan-mobile-actions">
                    <button type="button" className="button button-ghost" onClick={() => openEdit(plan)}>
                      <Pencil size={14} /> Edit
                    </button>
                    <button type="button" className="button button-ghost danger-text" onClick={() => setDeleting(plan)}>
                      <Trash2 size={14} /> Hapus
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}

      {editing && (
        <Modal
          title={editing === 'new' ? 'Tambah rencana tanam' : 'Edit rencana tanam'}
          subtitle="Isi data lahan, produksi, dan target keuangan. Estimasi dihitung otomatis."
          onClose={closeForm}
          size="large"
        >
          <PlanForm
            initialPlan={editing === 'new' ? null : editing}
            onSubmit={handleSave}
            onCancel={closeForm}
            loading={submitting}
            serverError={serverError}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Hapus rencana tanam?"
          description={`${deleting.commodity} di ${deleting.location} akan dihapus permanen.`}
          confirmLabel="Hapus rencana"
          onConfirm={handleDelete}
          onClose={() => !deletingLoading && setDeleting(null)}
          loading={deletingLoading}
        />
      )}
    </div>
  );
}
