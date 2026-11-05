import { Router } from 'express';
import { z } from 'zod';
import { requireUser } from '../middleware/auth.js';
import { query } from '../db.js';

const router = Router();

const planSchema = z.object({
  commodity: z.string().min(2).max(80),
  location: z.string().min(3).max(180),
  planted_area_ha: z.number().positive().max(100000),
  planting_date: z.string().date().nullable().optional(),
  expected_harvest_date: z.string().date().nullable().optional(),
  estimated_yield_kg: z.number().positive(),
  production_cost: z.number().nonnegative(),
  expected_price: z.number().positive(),
});

const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.get(
  '/plans',
  requireUser,
  wrap(async (req, res) => {
    const { rows } = await query(
      `select id, user_id, commodity, location, planted_area_ha, planting_date,
              expected_harvest_date, estimated_yield_kg, production_cost, expected_price,
              created_at, updated_at
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
          estimated_yield_kg, production_cost, expected_price)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
      ]
    );

    res.status(201).json({ data: rows[0] });
  })
);

router.get(
  '/summary',
  requireUser,
  wrap(async (req, res) => {
    const { rows } = await query(
      `select commodity, planted_area_ha, estimated_yield_kg, production_cost, expected_price
         from public.farm_plans
        where user_id = $1`,
      [req.user.id]
    );

    const summary = rows.reduce(
      (acc, row) => {
        acc.plan_count += 1;
        acc.total_area_ha += Number(row.planted_area_ha);
        acc.estimated_yield_kg += Number(row.estimated_yield_kg);
        acc.estimated_revenue += Number(row.estimated_yield_kg) * Number(row.expected_price);
        acc.estimated_cost += Number(row.production_cost);
        return acc;
      },
      { plan_count: 0, total_area_ha: 0, estimated_yield_kg: 0, estimated_revenue: 0, estimated_cost: 0 }
    );
    summary.estimated_gross_margin = summary.estimated_revenue - summary.estimated_cost;

    res.json({
      data: summary,
      note: 'Estimasi berdasarkan input pengguna, bukan prediksi hasil aktual.',
    });
  })
);

export default router;
