import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import analysisRoutes from './routes/analysis.js';

const app = express();
const port = Number(process.env.PORT || 4000);
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'AgriInsight API' }));
app.use('/api', analysisRoutes);
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Terjadi kesalahan pada server.' }); });
app.listen(port, () => console.log(`AgriInsight API berjalan di http://localhost:${port}`));
