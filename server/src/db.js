import pg from 'pg';
import { databaseUrl, hasDatabase } from './config.js';

const { Pool } = pg;

const isLocalHost = (() => {
  try {
    const host = new URL(databaseUrl).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return true;
  }
})();

export const pool = hasDatabase
  ? new Pool({
      connectionString: databaseUrl,
      // Supabase memakai sertifikat valid; nonaktifkan verifikasi hanya untuk host non-lokal
      // yang berada di balik pooler agar kompatibel di banyak lingkungan.
      ssl: isLocalHost ? undefined : { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 15_000,
    })
  : null;

pool?.on('error', (error) => {
  console.error('Unexpected database pool error:', error.message);
});

export async function query(text, params = []) {
  if (!pool) {
    const error = new Error('Database belum dikonfigurasi. Isi DATABASE_URL pada environment.');
    error.status = 503;
    throw error;
  }
  return pool.query(text, params);
}

export async function checkDatabase() {
  if (!pool) return false;
  try {
    await pool.query('select 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error.message);
    return false;
  }
}
