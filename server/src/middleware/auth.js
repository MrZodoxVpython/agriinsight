import { verifyToken } from '../auth.js';

export function requireUser(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Token autentikasi diperlukan.' });
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ error: 'Sesi tidak valid atau kedaluwarsa. Silakan masuk kembali.' });
  }
}
