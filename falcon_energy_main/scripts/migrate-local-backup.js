import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { createPool, initializeDatabase, readState, writeState } from '../db.js';

const file = process.argv[2];
if (!file) throw new Error('Usage: npm run db:migrate-local -- path/to/NoorLPG_Backup.json');
const state = JSON.parse(await readFile(file, 'utf8'));
const pool = createPool(process.env);
await initializeDatabase(pool);
if (await readState(pool)) throw new Error('Database already has data. Refusing to overwrite it.');
await writeState(pool, state);
console.log('Backup migrated successfully.');
await pool.end();
