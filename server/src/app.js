import './config.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import analysisRoutes from './routes/analysis.js';
import { checkDatabase } from './db.js';
import { clientOrigins, hasDatabase } from './config.js';

const app = express();

if (!hasDatabase) {
  console.warn(
    'DATABASE_URL belum diisi. Endpoint database tidak akan berfungsi sampai environment tersebut dikonfigurasi.'
  );
}

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || clientOrigins.length === 0 || clientOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_req, res) => {
  const database = await checkDatabase();
  res.json({
    status: 'ok',
    service: 'AgriInsight API',
    database: database ? 'connected' : 'unavailable',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', analysisRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = Number(error.status) || 500;
  res
    .status(status)
    .json({ error: status >= 500 ? 'Terjadi kesalahan pada server.' : error.message });
});

export default app;
