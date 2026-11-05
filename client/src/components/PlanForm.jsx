import { useMemo, useState } from 'react';
import { AlertCircle, Calculator, CalendarDays, MapPin, Sprout } from 'lucide-react';
import { COMMODITIES, PLAN_STATUSES } from '../lib/plans';
import { formatDateInput, number, rupiah } from '../lib/format';

function toFormState(plan) {
  return {
    commodity: plan?.commodity || 'Cabai',
    status: plan?.status || 'planned',
    location: plan?.location || '',
    planted_area_ha: plan?.planted_area_ha != null ? String(Number(plan.planted_area_ha)) : '',
    planting_date: formatDateInput(plan?.planting_date),
    expected_harvest_date: formatDateInput(plan?.expected_harvest_date),
    estimated_yield_kg: plan?.estimated_yield_kg != null ? String(Number(plan.estimated_yield_kg)) : '',
    production_cost: plan?.production_cost != null ? String(Number(plan.production_cost)) : '',
    expected_price: plan?.expected_price != null ? String(Number(plan.expected_price)) : '',
  };
}

export default function PlanForm({ initialPlan, onSubmit, onCancel, loading, serverError }) {
  const [form, setForm] = useState(() => toFormState(initialPlan));
  const [errors, setErrors] = useState({});

  const metrics = useMemo(() => {
    const yieldKg = Number(form.estimated_yield_kg) || 0;
    const price = Number(form.expected_price) || 0;
    const cost = Number(form.production_cost) || 0;
    const revenue = yieldKg * price;
    const margin = revenue - cost;
    return {
      revenue,
      margin,
      breakEven: yieldKg > 0 ? cost / yieldKg : 0,
      marginPercent: revenue > 0 ? (margin / revenue) * 100 : 0,
    };
  }, [form.estimated_yield_kg, form.expected_price, form.production_cost]);

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  function validate() {
    const next = {};
    if (!form.location.trim() || form.location.trim().length < 3) {
      next.location = 'Lokasi minimal 3 karakter.';
    }
    if (!(Number(form.planted_area_ha) > 0)) next.planted_area_ha = 'Luas lahan harus lebih dari 0.';
    if (!(Number(form.estimated_yield_kg) > 0)) next.estimated_yield_kg = 'Estimasi hasil harus lebih dari 0.';
    if (!(Number(form.expected_price) > 0)) next.expected_price = 'Target harga harus lebih dari 0.';
    if (!(Number(form.production_cost) >= 0) || form.production_cost === '') {
      next.production_cost = 'Biaya produksi tidak boleh negatif.';
    }
    if (form.planting_date && form.expected_harvest_date && form.expected_harvest_date < form.planting_date) {
      next.expected_harvest_date = 'Tanggal panen tidak boleh sebelum tanggal tanam.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;
    onSubmit({
      commodity: form.commodity,
      status: form.status,
      location: form.location.trim(),
      planted_area_ha: Number(form.planted_area_ha),
      planting_date: form.planting_date || null,
      expected_harvest_date: form.expected_harvest_date || null,
      estimated_yield_kg: Number(form.estimated_yield_kg),
      production_cost: Number(form.production_cost || 0),
      expected_price: Number(form.expected_price),
    });
  }

  return (
    <form className="plan-form" onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div className="form-error form-error-full">
          <AlertCircle size={16} />
          <span>{serverError}</span>
        </div>
      )}

      <fieldset className="form-section">
        <legend>
          <Sprout size={16} /> Informasi lahan
        </legend>
        <div className="form-grid">
          <label>
            Komoditas
            <select value={form.commodity} onChange={update('commodity')}>
              {COMMODITIES.map((commodity) => (
                <option key={commodity}>{commodity}</option>
              ))}
            </select>
          </label>
          <label>
            Status rencana
            <select value={form.status} onChange={update('status')}>
              {PLAN_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-span-2">
            <span>
              <MapPin size={13} /> Lokasi lahan
            </span>
            <input
              value={form.location}
              onChange={update('location')}
              placeholder="Contoh: Lembang, Bandung Barat"
              className={errors.location ? 'input-error' : ''}
            />
            {errors.location && <em className="field-error">{errors.location}</em>}
          </label>
          <label>
            Luas lahan (ha)
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.planted_area_ha}
              onChange={update('planted_area_ha')}
              placeholder="1.5"
              className={errors.planted_area_ha ? 'input-error' : ''}
            />
            {errors.planted_area_ha && <em className="field-error">{errors.planted_area_ha}</em>}
          </label>
          <label>
            <span>
              <CalendarDays size={13} /> Tanggal tanam
            </span>
            <input type="date" value={form.planting_date} onChange={update('planting_date')} />
          </label>
          <label>
            Estimasi panen
            <input
              type="date"
              value={form.expected_harvest_date}
              onChange={update('expected_harvest_date')}
              className={errors.expected_harvest_date ? 'input-error' : ''}
            />
            {errors.expected_harvest_date && <em className="field-error">{errors.expected_harvest_date}</em>}
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>
          <Calculator size={16} /> Produksi & keuangan
        </legend>
        <div className="form-grid">
          <label>
            Estimasi hasil (kg)
            <input
              type="number"
              min="1"
              value={form.estimated_yield_kg}
              onChange={update('estimated_yield_kg')}
              placeholder="12000"
              className={errors.estimated_yield_kg ? 'input-error' : ''}
            />
            {errors.estimated_yield_kg && <em className="field-error">{errors.estimated_yield_kg}</em>}
          </label>
          <label>
            Biaya produksi (Rp)
            <input
              type="number"
              min="0"
              value={form.production_cost}
              onChange={update('production_cost')}
              placeholder="25000000"
              className={errors.production_cost ? 'input-error' : ''}
            />
            {errors.production_cost && <em className="field-error">{errors.production_cost}</em>}
          </label>
          <label>
            Target harga jual (Rp/kg)
            <input
              type="number"
              min="1"
              value={form.expected_price}
              onChange={update('expected_price')}
              placeholder="35000"
              className={errors.expected_price ? 'input-error' : ''}
            />
            {errors.expected_price && <em className="field-error">{errors.expected_price}</em>}
          </label>
        </div>

        <div className="form-preview">
          <div>
            <span>Estimasi omzet</span>
            <strong>{rupiah(metrics.revenue)}</strong>
          </div>
          <div>
            <span>Estimasi margin</span>
            <strong className={metrics.margin >= 0 ? 'text-positive' : 'text-negative'}>
              {rupiah(metrics.margin)}
            </strong>
            <small>{number(metrics.marginPercent, 1)}% dari omzet</small>
          </div>
          <div>
            <span>Harga impas</span>
            <strong>{rupiah(metrics.breakEven)}<small>/kg</small></strong>
          </div>
        </div>
      </fieldset>

      <div className="form-actions">
        <button type="button" className="button button-ghost" onClick={onCancel} disabled={loading}>
          Batal
        </button>
        <button type="submit" className="button button-primary" disabled={loading}>
          {loading ? 'Menyimpan...' : initialPlan ? 'Simpan perubahan' : 'Simpan rencana'}
        </button>
      </div>
    </form>
  );
}
