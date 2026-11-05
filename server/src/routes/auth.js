import { Router } from 'express';
import { z } from 'zod';
import { hashPassword, signToken, verifyPassword } from '../auth.js';
import { query } from '../db.js';
import { requireUser } from '../middleware/auth.js';

const router = Router();

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email('Format email tidak valid.').max(254),
  password: z.string().min(6, 'Password minimal 6 karakter.').max(200),
});

const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.post(
  '/register',
  wrap(async (req, res) => {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.issues[0]?.message || 'Data tidak valid.' });
    }

    const { email, password } = parsed.data;
    try {
      const { rows } = await query(
        `insert into public.app_users (email, password_hash)
         values ($1, $2)
         returning id, email, created_at`,
        [email, hashPassword(password)]
      );
      const user = rows[0];
      return res.status(201).json({ token: signToken(user), user });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Email sudah terdaftar. Silakan masuk.' });
      }
      if (error.code === '42P01') {
        return res.status(503).json({ error: 'Skema database belum dibuat. Jalankan supabase/schema.sql.' });
      }
      throw error;
    }
  })
);

router.post(
  '/login',
  wrap(async (req, res) => {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.issues[0]?.message || 'Data tidak valid.' });
    }

    const { email, password } = parsed.data;
    const { rows } = await query(
      'select id, email, password_hash from public.app_users where email = $1 limit 1',
      [email]
    );
    const user = rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    return res.json({
      token: signToken(user),
      user: { id: user.id, email: user.email },
    });
  })
);

router.get(
  '/me',
  requireUser,
  wrap(async (req, res) => {
    const { rows } = await query('select id, email, created_at from public.app_users where id = $1', [
      req.user.id,
    ]);
    if (!rows[0]) return res.status(401).json({ error: 'Akun tidak ditemukan.' });
    return res.json({ user: rows[0] });
  })
);

export default router;
