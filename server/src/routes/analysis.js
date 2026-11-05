import { Router } from 'express';
import { z } from 'zod';
import { requireUser } from '../middleware/auth.js';
import { query } from '../db.js';

const router = Router();

const PLAN_STATUSES = ['planned', 'planting', 'harvest', 'completed'];

const planSchema = z.object({
  commodity: z.string().trim().min(2).max(80),
  location: z.string().trim().min(3).max(180),
  planted_area_ha: z.number().positive().max(100000),
  planting_date: z.string().date().nullable().optional(),
  expected_harvest_date: z.string().date().nullable().optional(),
  estimated_yield_kg: z.number().positive(),
  production_cost: z.number().nonnegative(),
  expected_price: z.number().positive(),
  status: z.enum(PLAN_STATUSES).default('planned'),
});

const idSchema = z.string().uuid('ID rencana tidak valid.');

const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const num = (value) => Number(value) || 0;
const percent = (part, total) => (total > 0 ? (part / total) * 100 : 0);

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

function monthKey(row) {
  const raw = row.expected_harvest_date || row.planting_date || row.created_at;
  if (!raw) return null;
  if (raw instanceof Date) {
    return `${raw.getFullYear()}-${String(raw.getMonth() + 1).padStart(2, '0')}`;
  }
  const value = String(raw);
  if (/^\d{4}-\d{2}/.test(value)) return value.slice(0, 7);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
  const [year, month] = key.split('-');
  return `${MONTH_LABELS[Number(month) - 1] || month} ${year}`;
}

const QUALITY_FIELDS = [
  { key: 'location', label: 'Lokasi lahan', filled: (plan) => Boolean(plan.location) },
  { key: 'planted_area_ha', label: 'Luas lahan', filled: (plan) => Boolean(plan.planted_area_ha) },
  { key: 'planting_date', label: 'Tanggal tanam', filled: (plan) => Boolean(plan.planting_date) },
  {
    key: 'expected_harvest_date',
    label: 'Estimasi panen',
    filled: (plan) => Boolean(plan.expected_harvest_date),
  },
  {
    key: 'estimated_yield_kg',
    label: 'Estimasi hasil',
    filled: (plan) => Boolean(plan.estimated_yield_kg),
  },
  {
    key: 'production_cost',
    label: 'Biaya produksi',
    filled: (plan) => plan.production_cost !== null && plan.production_cost !== undefined,
  },
  {
    key: 'expected_price',
    label: 'Target harga jual',
    filled: (plan) => Boolean(plan.expected_price),
  },
  { key: 'status', label: 'Status rencana', filled: (plan) => Boolean(plan.status) },
];

function metricsFor(rows) {
  const area = rows.reduce((sum, row) => sum + num(row.planted_area_ha), 0);
  const yieldKg = rows.reduce((sum, row) => sum + num(row.estimated_yield_kg), 0);
  const revenue = rows.reduce(
    (sum, row) => sum + num(row.estimated_yield_kg) * num(row.expected_price),
    0
  );
  const cost = rows.reduce((sum, row) => sum + num(row.production_cost), 0);
  const margin = revenue - cost;
  return {
    plan_count: rows.length,
    total_area_ha: area,
    estimated_yield_kg: yieldKg,
    estimated_revenue: revenue,
    estimated_cost: cost,
    estimated_gross_margin: margin,
    margin_percent: percent(margin, revenue),
    roi_percent: cost > 0 ? (margin / cost) * 100 : null,
    average_price: yieldKg > 0 ? revenue / yieldKg : 0,
    break_even_price: yieldKg > 0 ? cost / yieldKg : 0,
  };
}

router.get(
  '/plans',
  requireUser,
  wrap(async (req, res) => {
    const { rows } = await query(
      `select id, user_id, commodity, location, planted_area_ha,
              to_char(planting_date, 'YYYY-MM-DD') as planting_date,
              to_char(expected_harvest_date, 'YYYY-MM-DD') as expected_harvest_date,
              estimated_yield_kg, production_cost, expected_price,
              status, created_at, updated_at
         from public.farm_plans
        where user_id = $1
        order by created_at desc`,
      [req.user.id]
    );
    res.json({ data: rows });
  })
);

router.post(
  '/plans',
  requireUser,
  wrap(async (req, res) => {
    const parsed = planSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: 'Validasi gagal.', details: parsed.error.flatten() });
    }

    const plan = parsed.data;
    const { rows } = await query(
      `insert into public.farm_plans
         (user_id, commodity, location, planted_area_ha, planting_date, expected_harvest_date,
          estimated_yield_kg, production_cost, expected_price, status)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       returning *`,
      [
        req.user.id,
        plan.commodity,
        plan.location,
        plan.planted_area_ha,
        plan.planting_date || null,
        plan.expected_harvest_date || null,
        plan.estimated_yield_kg,
        plan.production_cost,
        plan.expected_price,
        plan.status,
      ]
    );

    res.status(201).json({ data: rows[0] });
  })
);

router.patch(
  '/plans',
  requireUser,
  wrap(async (req, res) => {
    const parsedId = idSchema.safeParse(req.body?.id);
    if (!parsedId.success) return res.status(422).json({ error: parsedId.error.issues[0].message });

    const parsed = planSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: 'Validasi gagal.', details: parsed.error.flatten() });
    }

    const plan = parsed.data;
    const { rows } = await query(
      `update public.farm_plans
          set commodity = $1, location = $2, planted_area_ha = $3, planting_date = $4,
              expected_harvest_date = $5, estimated_yield_kg = $6, production_cost = $7,
              expected_price = $8, status = $9
        where id = $10 and user_id = $11
        returning *`,
      [
        plan.commodity,
        plan.location,
        plan.planted_area_ha,
        plan.planting_date || null,
        plan.expected_harvest_date || null,
        plan.estimated_yield_kg,
        plan.production_cost,
        plan.expected_price,
        plan.status,
        parsedId.data,
        req.user.id,
      ]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Rencana tanam tidak ditemukan.' });
    res.json({ data: rows[0] });
  })
);

router.delete(
  '/plans',
  requireUser,
  wrap(async (req, res) => {
    const parsedId = idSchema.safeParse(req.query.id);
    if (!parsedId.success) return res.status(422).json({ error: parsedId.error.issues[0].message });

    const { rows } = await query(
      'delete from public.farm_plans where id = $1 and user_id = $2 returning id',
      [parsedId.data, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Rencana tanam tidak ditemukan.' });
    res.json({ data: { id: rows[0].id } });
  })
);

router.get(
  '/summary',
  requireUser,
  wrap(async (req, res) => {
    const { rows } = await query(
      `select id, commodity, location, planted_area_ha,
              to_char(planting_date, 'YYYY-MM-DD') as planting_date,
              to_char(expected_harvest_date, 'YYYY-MM-DD') as expected_harvest_date,
              estimated_yield_kg, production_cost, expected_price, status, created_at
         from public.farm_plans
        where user_id = $1`,
      [req.user.id]
    );

    const totals = metricsFor(rows);

    const commodityMap = new Map();
    const monthMap = new Map();
    for (const row of rows) {
      if (!commodityMap.has(row.commodity)) commodityMap.set(row.commodity, []);
      commodityMap.get(row.commodity).push(row);

      const key = monthKey(row);
      if (key) {
        if (!monthMap.has(key)) monthMap.set(key, []);
        monthMap.get(key).push(row);
      }
    }

    const byCommodity = [...commodityMap.entries()]
      .map(([commodity, items]) => ({
        commodity,
        plan_count: items.length,
        total_area_ha: items.reduce((sum, row) => sum + num(row.planted_area_ha), 0),
        estimated_yield_kg: items.reduce((sum, row) => sum + num(row.estimated_yield_kg), 0),
        ...metricsFor(items),
      }))
      .sort((a, b) => b.estimated_gross_margin - a.estimated_gross_margin);

    const byMonth = [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, items]) => {
        const metrics = metricsFor(items);
        return {
          key,
          label: monthLabel(key),
          estimated_revenue: metrics.estimated_revenue,
          estimated_cost: metrics.estimated_cost,
          estimated_gross_margin: metrics.estimated_gross_margin,
          plan_count: metrics.plan_count,
        };
      });

    const totalFields = rows.length * QUALITY_FIELDS.length;
    const filledFields = rows.reduce(
      (sum, row) => sum + QUALITY_FIELDS.filter((field) => field.filled(row)).length,
      0
    );

    const qualityPlans = rows.map((row) => {
      const missing = QUALITY_FIELDS.filter((field) => !field.filled(row)).map((field) => field.label);
      return {
        id: row.id,
        commodity: row.commodity,
        status: row.status,
        score: Math.round(percent(QUALITY_FIELDS.length - missing.length, QUALITY_FIELDS.length)),
        missing,
      };
    });

    res.json({
      data: {
        ...totals,
        by_commodity: byCommodity,
        by_month: byMonth,
        quality: {
          score: totalFields > 0 ? Math.round(percent(filledFields, totalFields)) : 0,
          filled_fields: filledFields,
          total_fields: totalFields,
          field_completion: QUALITY_FIELDS.map((field) => ({
            key: field.key,
            label: field.label,
            filled: rows.filter((row) => field.filled(row)).length,
            total: rows.length,
            percent: rows.length > 0 ? Math.round(percent(rows.filter((row) => field.filled(row)).length, rows.length)) : 0,
          })),
          plans: qualityPlans.sort((a, b) => a.score - b.score),
        },
      },
      note: 'Estimasi berdasarkan input pengguna, bukan prediksi hasil aktual.',
    });
  })
);

export default router;
