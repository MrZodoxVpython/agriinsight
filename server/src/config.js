import dotenv from 'dotenv';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Muat server/.env saat dijalankan lokal. Di Vercel, nilai berasal dari Environment Variables.
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const SUPABASE_DB_HOST = /^db\.([a-z0-9]+)\.supabase\.co$/i;
const DEFAULT_POOLER_REGION = process.env.SUPABASE_POOLER_REGION || 'ap-northeast-1';

/**
 * Connection string langsung Supabase (db.<ref>.supabase.co) hanya punya record IPv6,
 * sehingga tidak dapat dijangkau dari Vercel/serverless. Fungsi ini mengubahnya menjadi
 * connection string Supabase Pooler (IPv4) secara otomatis.
 */
export function normalizeDatabaseUrl(value, { port } = {}) {
  if (!value) return '';
  let url;
  try {
    url = new URL(value);
  } catch {
    return value;
  }

  const match = url.hostname.match(SUPABASE_DB_HOST);
  if (match) {
    const ref = match[1];
    url.hostname = `aws-0-${DEFAULT_POOLER_REGION}.pooler.supabase.com`;
    url.username = `postgres.${ref}`;
    url.port = String(port || 6543);
  } else if (port && /pooler\.supabase\.com$/i.test(url.hostname)) {
    url.port = String(port);
  }

  // Konfigurasi SSL diberikan eksplisit pada opsi Pool/Client (lihat db.js), sehingga
  // parameter sslmode dihapus agar tidak memicu verifikasi sertifikat ganda di pg.
  url.searchParams.delete('sslmode');
  return url.toString();
}

const rawDatabaseUrl =
  process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL || '';

export const databaseUrl = normalizeDatabaseUrl(rawDatabaseUrl);
// Port 5432 (session mode) dipakai untuk migrasi/DDL; 6543 untuk runtime serverless.
export const migrationDatabaseUrl = normalizeDatabaseUrl(rawDatabaseUrl, { port: 5432 });

export const hasDatabase = Boolean(databaseUrl);

// JWT secret diturunkan dari DATABASE_URL bila JWT_SECRET tidak diisi, agar deployment
// tetap berjalan tanpa konfigurasi tambahan namun token tidak bisa dipalsukan publik.
export const jwtSecret =
  process.env.JWT_SECRET ||
  (databaseUrl
    ? createHash('sha256').update(`agriinsight-jwt:${databaseUrl}`).digest('hex')
    : 'agriinsight-local-development-only');

export const clientOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
