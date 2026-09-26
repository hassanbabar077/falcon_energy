import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createPool, ensureSeedState, executeWithRetry, initializeDatabase, readState, verifyUser, writeState } from './db.js';

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
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Authentication required.' });
  }
};

app.get('/api/health', async (_req, res) => {
  try {
    await executeWithRetry(() => pool.query('SELECT 1'));
    res.json({ status: 'ok', success: true });
  } catch (error) {
    console.error('[Health Check Failed]:', error);
    res.status(500).json({ status: 'error', success: false, message: error.message, code: error.code });
  }
});

app.get('/api/state', authenticate, async (_req, res) => {
  try {
    const state = await executeWithRetry(() => readState(pool));
    res.json({ success: true, state });
  } catch (error) {
    console.error('[GET /api/state Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch database state.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await executeWithRetry(() => verifyUser(pool, req.body.username || '', req.body.password || ''));
    if (!user) return res.status(401).json({ success: false, error: 'Invalid username or password, or account is inactive.' });
    const token = jwt.sign({ id: user.id, role: user.role, permissions: user.permissions }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, user, token });
  } catch (error) {
    console.error('[POST /api/auth/login Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Authentication error.' });
  }
});

app.put('/api/state', authenticate, async (req, res) => {
  try {
    if (!req.body?.state || typeof req.body.state !== 'object') {
      return res.status(400).json({ success: false, error: 'A valid state object is required.' });
    }
    await executeWithRetry(() => writeState(pool, req.body.state));
    console.log(`[Database Write Confirmed] State successfully persisted to MySQL.`);
    res.json({ success: true, message: 'Database state updated successfully.' });
  } catch (error) {
    console.error('[PUT /api/state Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to persist state in database.' });
  }
});

app.use((error, _req, res, _next) => {
  console.error('Unhandled API Error:', error);
  res.status(500).json({ success: false, error: error.message || 'The server could not complete the request.' });
});

app.listen(port, () => {
  console.log(`Falcon Energy API listening on ${port}`);
});

(async () => {
  try {
    await executeWithRetry(() => initializeDatabase(pool));
    await executeWithRetry(() => ensureSeedState(pool));
  } catch (err) {
    console.error('Database startup note:', err.message);
  }
})();
