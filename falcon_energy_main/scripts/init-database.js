import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPool, ensureSeedState, resetDatabase } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = createPool(process.env);
await resetDatabase(pool);
await ensureSeedState(pool);
console.log('MySQL schema with 33 separate tables is ready and seeded.');
await pool.end();
