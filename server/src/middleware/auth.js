import { createClient } from '@supabase/supabase-js';

const supabaseAuth = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

export async function requireUser(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Token autentikasi diperlukan.' });
  if (!supabaseAuth) return res.status(503).json({ error: 'Autentikasi server belum dikonfigurasi.' });
  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'Token tidak valid atau kedaluwarsa.' });
  req.user = data.user;
  next();
}
