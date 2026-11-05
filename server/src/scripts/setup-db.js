import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { migrationDatabaseUrl } from '../config.js';

const { Client } = pg;

if (!migrationDatabaseUrl) {
  console.error('DATABASE_URL belum diisi. Salin server/.env.example menjadi server/.env terlebih dahulu.');
  process.exit(1);
}

const schemaPath = fileURLToPath(new URL('../../../supabase/schema.sql', import.meta.url));
const sql = await readFile(schemaPath, 'utf8');

const client = new Client({
  connectionString: migrationDatabaseUrl,
  ssl: /localhost|127\.0\.0\.1/.test(migrationDatabaseUrl)
    ? undefined
    : { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log('Skema database AgriInsight berhasil diterapkan.');
} catch (error) {
  console.error('Gagal menerapkan skema database:', error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
