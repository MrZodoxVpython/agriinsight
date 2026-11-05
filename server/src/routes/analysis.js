import { Router } from 'express';
import { z } from 'zod';
import { requireUser } from '../middleware/auth.js';
import { supabaseAdmin } from '../supabase.js';

const router = Router();
const planSchema = z.object({
  commodity: z.string().min(2).max(80), location: z.string().min(3).max(180),
  planted_area_ha: z.number().positive().max(100000), planting_date: z.string().date().nullable().optional(),
  expected_harvest_date: z.string().date().nullable().optional(), estimated_yield_kg: z.number().positive(),
  production_cost: z.number().nonnegative(), expected_price: z.number().positive()
});

router.get('/plans', requireUser, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database belum dikonfigurasi.' });
  const { data, error } = await supabaseAdmin.from('farm_plans').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

router.post('/plans', requireUser, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database belum dikonfigurasi.' });
  const parsed = planSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Validasi gagal.', details: parsed.error.flatten() });
  const { data, error } = await supabaseAdmin.from('farm_plans').insert({ ...parsed.data, user_id: req.user.id }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ data });
});

router.get('/summary', requireUser, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database belum dikonfigurasi.' });
  const { data, error } = await supabaseAdmin.from('farm_plans').select('commodity, planted_area_ha, estimated_yield_kg, production_cost, expected_price').eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  const summary = (data || []).reduce((acc, row) => {
    acc.plan_count += 1; acc.total_area_ha += Number(row.planted_area_ha);
    acc.estimated_yield_kg += Number(row.estimated_yield_kg);
    acc.estimated_revenue += Number(row.estimated_yield_kg) * Number(row.expected_price);
    acc.estimated_cost += Number(row.production_cost); return acc;
  }, { plan_count: 0, total_area_ha: 0, estimated_yield_kg: 0, estimated_revenue: 0, estimated_cost: 0 });
  summary.estimated_gross_margin = summary.estimated_revenue - summary.estimated_cost;
  res.json({ data: summary, note: 'Estimasi berdasarkan input pengguna, bukan prediksi hasil aktual.' });
});

export default router;
