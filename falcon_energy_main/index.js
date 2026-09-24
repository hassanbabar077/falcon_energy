import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createPool, ensureSeedState, initializeDatabase, readState, verifyUser, writeState } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, './.env'), override: true });

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_NAME = process.env.DB_NAME || 'falconen_falcon_energy';
const DB_USER = process.env.DB_USER || 'falconen_falconuser';
const DB_PASSWORD = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'Hamza123@shahab';
const JWT_SECRET = process.env.JWT_SECRET || 'falcon_energy_secure_jwt_secret_2026';

const app = express();
const pool = createPool({ DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD });
const port = process.env.PORT || 3001;
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Authentication required.' }); }
};

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message, code: error.code });
  }
});
app.get('/api/state', authenticate, async (_req, res, next) => { try { res.json({ state: await readState(pool) }); } catch (error) { next(error); } });
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const user = await verifyUser(pool, req.body.username || '', req.body.password || '');
    if (!user) return res.status(401).json({ error: 'Invalid username or password, or account is inactive.' });
    const token = jwt.sign({ id: user.id, role: user.role, permissions: user.permissions }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ user, token });
  } catch (error) { next(error); }
});
app.put('/api/state', authenticate, async (req, res, next) => {
  try {
    if (!req.body?.state || typeof req.body.state !== 'object') return res.status(400).json({ error: 'A valid state object is required.' });
    await writeState(pool, req.body.state);
    res.json({ ok: true });
  } catch (error) { next(error); }
});
app.use((error, _req, res, _next) => { console.error('API Error:', error); res.status(500).json({ error: error.message || 'The server could not complete the request.' }); });

try {
  await initializeDatabase(pool);
  await ensureSeedState(pool);
} catch (err) {
  console.error('Database startup note:', err.message);
}

app.listen(port, () => console.log(`Noor Transport API listening on ${port}`));

