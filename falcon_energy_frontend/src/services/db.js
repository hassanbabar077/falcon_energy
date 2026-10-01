// SQLite / Local Persistence Data Store Engine for Falcon Energy Transport System
// Handles full offline persistence, 28 relational tables, and default seed data
import bcrypt from 'bcryptjs';

const STORAGE_KEY = 'NOOR_TRANSPORT_DB_V14';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const AUTH_TOKEN_KEY = 'noorTransport.apiToken';
// Tables added after the first API release. An older API on the server does not
// know them and would drop them, so their records are carried inside
// `lookup_tables` (a table every API version stores) until the server is updated.
const NEWER_TABLES = ['suppliers'];
const PACKED_CATEGORY = '__packed_table_record__';

// ── Shared helpers ───────────────────────────────────────────────
export const normText = (v) => String(v ?? '').trim().toLowerCase();
export const toNum = (v) => parseFloat(v) || 0;
export const round2 = (v) => Math.round((toNum(v) + Number.EPSILON) * 100) / 100;
export const todayISO = () => new Date().toISOString().split('T')[0];
const dateOf = (iso) => (iso ? String(iso).split('T')[0] : '');
const sumBy = (list, fn) => round2(list.reduce((s, x) => s + toNum(fn(x)), 0));

// Whole days between load and unload dates (load 1st, unload 3rd = 2 days)
export function daysBetween(fromDate, toDate) {
  if (!fromDate || !toDate) return null;
  const a = new Date(`${fromDate}T00:00:00`);
  const b = new Date(`${toDate}T00:00:00`);
  if (isNaN(a) || isNaN(b)) return null;
  return Math.max(0, Math.round((b - a) / 86400000));
}

// Trip expenses paid by the driver/vehicle out of the trip advance.
// Diesel (billed by fuel pumps) and mobil oil (issued from stock) are excluded.
export const DRIVER_EXPENSE_FIELDS = [
  ['food_expense', 'Food & Allowance'], ['toll_tax', 'Toll Tax'], ['traffic_police', 'Traffic Police'],
  ['sindh_police', 'Police'], ['custom_police', 'Custom Police'], ['excise_police', 'Excise Police'],
  ['loading_charge', 'Loading Charge'], ['kanda_scale', 'Weighbridge / Kanda Fee'], ['weighbridge_deduction', 'Weighbridge Deduction'],
  ['scale_fee', 'Scale Vehicle Fee'], ['munshiana', 'Munshiana / Misc'], ['secretary_challan', 'Secretary Challan'],
  ['security_guard', 'Security / Chowkidar'], ['service_grease', 'Service & Grease'], ['washing_filter', 'Washing & Net Filter'],
  ['tyre_expense', 'Tyre Expense'], ['workshop_repair', 'Workshop Repair'], ['driver_salary', 'Driver Salary & Wages'],
  ['rickshaw_rent', 'Rickshaw / Local Rent'], ['minor_expenses', 'Other Minor Expenses']
].map(([key, label]) => ({ key, label }));

// Parties that can receive a payment voucher (suppliers are non-financial)
export const PAYABLE_CATEGORIES = ['Vendors', 'Workshops', 'Fuel Pumps', 'Drivers', 'Vehicles', 'Personal Expenses'];

const CATEGORY_NARRATION = {
  'Vendors': 'Vendor dues', 'Workshops': 'Workshop maintenance dues', 'Fuel Pumps': 'Fuel dues',
  'Drivers': 'Driver payment', 'Vehicles': 'Vehicle payment', 'Personal Expenses': 'Personal expense'
};

// Clean initial state with no dummy seed data
const INITIAL_DATA = {
  company_info: {
    id: 1,
    name: "Falcon Energy",
    system_name: "LPG Transport Management System",
    address: "Lahore, Pakistan",
    contact: "0300-8462849",
    email: "info@falconenergy.com",
    backup_path: "C:\\NoorTransport\\Backup\\",
    last_reset: new Date().toISOString().split('T')[0]
  },
  
  lookup_tables: [
    { category: "Vehicle Status", options: ["Active", "Maintenance", "Inactive", "Retired"] },
    { category: "Trip Status", options: ["Pending", "Completed", "Cancelled"] },
    { category: "Payment Status", options: ["Pending", "In Process", "Completed"] },
    { category: "Vehicle Category", options: ["Rented", "Falcon Energy", "Open Market"] },
    { category: "Vehicle Type", options: ["Skid Mounted", "Complete Unit", "Attached Tanker"] },
    { category: "Rent Type", options: ["Monthly", "Per Ton", "Per KM"] },
    { category: "Freight Type", options: ["Per KM", "Per Ton", "Monthly"] },
    { category: "Source", options: ["Port", "JJVL", "Sinjhoro", "Qadirpur", "Sawan"] },
    { category: "Destination", options: ["KKP", "Bhatti LPG", "PPL", "OGDCL"] },
    { category: "Tanker Ownership", options: ["Falcon Energy", "Private", "Rented"] },
    { category: "Maintenance Type", options: ["Regular", "Emergency", "Scheduled"] },
    { category: "Maintenance Category", options: ["Prime Mover", "Tanker", "Tyre"] },
    { category: "Tyre Condition", options: ["New", "Old"] },
    { category: "Tyre Status", options: ["Active", "Inactive", "Expired"] },
    { category: "Vendor Type", options: ["LPG", "Spare Part", "Others"] },
    { category: "Payment Category", options: ["Vendor Payment", "Workshop Maintenance", "Trip Payment", "Fuel Payment", "Engine Oil Payment", "Other"] },
    { category: "Fuel Payment Type", options: ["Cash", "Bank", "Credit"] },
    { category: "Bank Transaction Type", options: ["Deposit", "Withdrawal", "Transfer", "Payment"] },
    { category: "Bill Type", options: ["Per Ton", "Per KM", "Monthly", "Customer Wise"] },
    { category: "Tyre Brand Category", options: ["Local", "Imported"] }
  ],

  vehicles: [],
  transporters: [],
  loading_sources: [],
  destinations: [],
  customers: [],
  drivers: [],
  vendors: [],
  suppliers: [],
  trips: [],
  fines: [],
  workshops: [],
  maintenance_heads: [],
  maintenance: [],
  document_register: [],
  tyre_brands: [],
  tyres_record: [],
  fuel_pumps: [],
  fuel_entries: [],
  engine_oil_defination: [],
  engine_oil_purchase: [],
  engine_oil_usage: [],
  bank_accounts: [],
  bank_transactions: [],
  payments: [],
  general_ledger: [],
  cash_payments: [],
  bills_register: [],
  payments_received: [],
  payment_history: [],
  vehicle_categories: [
    { id: 'CAT-001', code: 'CAT-001', name: 'Falcon Energy', status: 'Active', description: 'Falcon Energy fleet vehicles', createdAt: new Date().toISOString() },
    { id: 'CAT-002', code: 'CAT-002', name: 'Rented', status: 'Active', description: 'Rented vehicles', createdAt: new Date().toISOString() },
    { id: 'CAT-003', code: 'CAT-003', name: 'Open Market', status: 'Active', description: 'Open market vehicles', createdAt: new Date().toISOString() },
    { id: 'CAT-004', code: 'CAT-004', name: 'Private', status: 'Active', description: 'Private vehicles', createdAt: new Date().toISOString() }
  ],
  tanker_ownerships: [
    { id: 'TOW-001', code: 'TOW-001', name: 'Falcon Energy', status: 'Active', description: 'Falcon Energy owned tankers', createdAt: new Date().toISOString() },
    { id: 'TOW-002', code: 'TOW-002', name: 'Private', status: 'Active', description: 'Privately owned tankers', createdAt: new Date().toISOString() },
    { id: 'TOW-003', code: 'TOW-003', name: 'Rented', status: 'Active', description: 'Rented tankers', createdAt: new Date().toISOString() },
    { id: 'TOW-004', code: 'TOW-004', name: 'Leased', status: 'Active', description: 'Leased tankers', createdAt: new Date().toISOString() }
  ],
  users: [
    {
      id: 'USR-001',
      username: 'admin',
      password: 'admin123',
      name: 'System Administrator',
      role: 'Admin',
      status: 'Active',
      permissions: ['all'],
      createdAt: new Date().toISOString()
    }
  ]
};

class DatabaseService {
  constructor() {
    this.data = this.loadData();
    this.token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    this.ready = null;
    this.listeners = new Set();
    this.inTransaction = false;
    this.serverTables = null; // Set of tables the API can store (null = unknown)
  }

  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }
    return () => {};
  }

  // reason: 'hydrate' (fresh data from server), 'save' (local change saved), 'rollback'
  notify(reason = 'save') {
    this.listeners.forEach(fn => {
      try { fn(this.data, reason); } catch (e) { console.error('Error in DB listener:', e); }
    });
  }

  hasApiSession() {
    return Boolean(this.token);
  }

  // Keeps every existing page synchronous after startup while MySQL becomes the
  // shared source of truth. The local copy is only an offline migration/cache.
  async hydrate() {
    if (this.ready) return this.ready;
    this.ready = (async () => {
      try {
        await this.detectServerTables();
        const response = await fetch(`${API_BASE_URL}/state`, { headers: { Authorization: `Bearer ${this.token}` } });
        if (!response.ok) throw new Error('Could not load shared data');
        const payload = await response.json();
        if (payload.state) {
          this.data = this._unpackState(payload.state);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
          this.notify('hydrate');
        }
      } catch (error) {
        console.warn('Using local data because the API is unavailable:', error.message);
      }
    })();
    return this.ready;
  }

  // Ask the API which tables it can store (newer servers list them in /health)
  async detectServerTables() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const result = await response.json();
      this.serverTables = new Set(Array.isArray(result.tables) ? result.tables : []);
    } catch {
      this.serverTables = null;
    }
    return this.serverTables;
  }

  _serverStores(table) {
    return Boolean(this.serverTables && this.serverTables.has(table));
  }

  // Restore records that were carried inside lookup_tables back to their own table
  _unpackState(state) {
    const lookups = Array.isArray(state.lookup_tables) ? state.lookup_tables : [];
    const packed = lookups.filter(l => l && l.category === PACKED_CATEGORY && l.table && l.record);
    state.lookup_tables = lookups.filter(l => !(l && l.category === PACKED_CATEGORY));
    NEWER_TABLES.forEach(table => {
      const current = Array.isArray(state[table]) ? state[table] : [];
      const ids = new Set(current.map(r => r.id));
      const carried = packed.filter(p => p.table === table).map(p => p.record).filter(r => !ids.has(r.id));
      state[table] = [...current, ...carried];
    });
    return state;
  }

  // State sent to the API: newer tables the server cannot store travel inside lookup_tables
  _payloadForServer() {
    const payload = { ...this.data };
    const packedRows = [];
    NEWER_TABLES.forEach(table => {
      if (this._serverStores(table)) return;
      (this.data[table] || []).forEach(record => {
        packedRows.push({ id: `${PACKED_CATEGORY}:${table}:${record.id}`, category: PACKED_CATEGORY, table, options: [], record });
      });
      delete payload[table];
    });
    if (packedRows.length) payload.lookup_tables = [...(this.data.lookup_tables || []), ...packedRows];
    return payload;
  }

  async authenticateWithApi(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password })
      });
      const result = await response.json();
      if (!response.ok) return { success: false, error: result.error || 'Authentication failed' };
      this.token = result.token;
      localStorage.setItem(AUTH_TOKEN_KEY, result.token);
      return { success: true, user: result.user };
    } catch (error) {
      // Fallback to local authentication when API server is offline/unavailable
      const authRes = this.authenticateUser(username, password);
      if (authRes.success) {
        return { success: true, user: authRes.user, isOffline: true };
      }
      return { success: false, error: authRes.error || 'Cannot connect to database server and local credentials did not match.' };
    }
  }

  clearApiSession() {
    this.token = '';
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.users || parsed.users.length === 0) {
          parsed.users = JSON.parse(JSON.stringify(INITIAL_DATA.users));
        }
        return parsed;
      }
    } catch (e) {
      console.error("Error loading stored DB, re-initializing:", e);
    }
    // Initialize default DB state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  async saveData() {
    try {
      if (this.token) {
        if (this.serverTables === null) await this.detectServerTables();
        const payload = this._payloadForServer();
        const response = await fetch(`${API_BASE_URL}/state`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` },
          body: JSON.stringify({ state: payload })
        });

        let result = {};
        try { result = await response.json(); } catch (e) {}

        if (!response.ok || result.success === false) {
          const errMessage = result.error || result.message || `Server error (${response.status})`;
          console.error('[Database Save Failed]:', errMessage);
          throw new Error(errMessage);
        }

        // Guard: a table we sent directly must not be dropped by the API
        const sentDirect = (t) => Array.isArray(payload[t]) && payload[t].length > 0;
        const dropped = Array.isArray(result.ignoredTables)
          ? result.ignoredTables
          : (result.savedTables ? [] : NEWER_TABLES.filter(sentDirect)); // old servers do not report savedTables
        if (dropped.length) {
          this.serverTables = null; // re-detect on the next save
          throw new Error(`The server did not store: ${dropped.join(', ')}. The API is running an older version - upload the latest falcon_energy_main (db.js, index.js) and restart the Node app.`);
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      this.notify();
      return true;
    } catch (e) {
      console.error("Error saving DB:", e);
      throw e;
    }
  }

  // Run several in-memory changes and persist them with ONE save. Inside the
  // mutator, insertRecord/updateRecord/deleteRecord only change memory; if the
  // final save (or the mutator) fails, the whole state is restored.
  async transaction(mutator) {
    if (this.inTransaction) return mutator();
    const snapshot = JSON.parse(JSON.stringify(this.data));
    this.inTransaction = true;
    try {
      const result = await mutator();
      this.inTransaction = false;
      await this.saveData();
      return result;
    } catch (err) {
      this.inTransaction = false;
      this.data = snapshot;
      this.notify('rollback');
      throw err;
    }
  }

  // Get table records (returns shallow copy so React state setters trigger re-renders)
  getTable(tableName) {
    return Array.isArray(this.data[tableName]) ? [...this.data[tableName]] : [];
  }

  // Get company metadata
  getCompanyInfo() {
    return this.data.company_info || INITIAL_DATA.company_info;
  }

  // Update company metadata
  async updateCompanyInfo(info) {
    const backup = { ...this.data.company_info };
    this.data.company_info = { ...this.data.company_info, ...info };
    try {
      await this.saveData();
      return this.data.company_info;
    } catch (err) {
      this.data.company_info = backup;
      throw err;
    }
  }

  // Generic Insert with timestamps
  async insertRecord(tableName, record) {
    if (!this.data[tableName]) {
      this.data[tableName] = [];
    }
    const now = new Date().toISOString();
    const enriched = { ...record, createdAt: now, updatedAt: now };
    const originalList = [...this.data[tableName]];
    this.data[tableName].unshift(enriched);
    if (this.inTransaction) return enriched;
    try {
      await this.saveData();
      return enriched;
    } catch (err) {
      this.data[tableName] = originalList;
      throw err;
    }
  }

  // Generic Update with timestamp
  async updateRecord(tableName, keyField, keyVal, updatedFields) {
    const list = this.data[tableName] || [];
    const index = list.findIndex(item => item[keyField] === keyVal);
    if (index !== -1) {
      const now = new Date().toISOString();
      const originalItem = { ...list[index] };
      list[index] = { ...list[index], ...updatedFields, updatedAt: now };
      this.data[tableName] = list;
      if (this.inTransaction) return list[index];
      try {
        await this.saveData();
        return list[index];
      } catch (err) {
        list[index] = originalItem;
        this.data[tableName] = list;
        throw err;
      }
    }
    return null;
  }

  // Generic Delete
  async deleteRecord(tableName, keyField, keyVal) {
    if (!this.data[tableName]) return false;
    const originalList = [...this.data[tableName]];
    this.data[tableName] = this.data[tableName].filter(item => item[keyField] !== keyVal);
    if (this.inTransaction) return true;
    try {
      await this.saveData();
      return true;
    } catch (err) {
      this.data[tableName] = originalList;
      throw err;
    }
  }

  // Check if Master Data is referenced in any entry or transactional module
  checkMasterDataUsage(tableName, record) {
    if (!record) return null;

    const keys = [record.code, record.id, record.name, record.business_name, record.number, record.bank_name, record.tanker_number]
      .map(normText)
      .filter(v => v && v !== '-');
    const isMatch = (val) => keys.includes(normText(val));
    const used = (table, fields) => this.getTable(table).some(r => fields.some(f => isMatch(r[f])));

    // [table, label, ...fields that hold the name / code]
    const checks = {
      vehicles: [
        ['trips', 'trips (Trip Entry)', 'vehicle'], ['maintenance', 'maintenance entries', 'vehicle', 'tanker_number'],
        ['fuel_entries', 'fuel entries', 'vehicle'], ['engine_oil_usage', 'engine oil usage', 'vehicle'],
        ['cash_payments', 'cash payments', 'vehicle'], ['document_register', 'documents register', 'vehicle'],
        ['tyres_record', 'tyres record', 'vehicle', 'tanker_number'], ['drivers', 'drivers list', 'assigned_vehicle'],
        ['payments', 'payment vouchers', 'vehicle']
      ],
      transporters: [['vehicles', 'vehicles master', 'transporter']],
      loading_sources: [['trips', 'trips (Trip Entry)', 'source', 'plant']],
      destinations: [['trips', 'trips (Trip Entry)', 'destination']],
      customers: [
        ['trips', 'trips (Trip Entry)', 'customer'], ['bills_register', 'bills register', 'customer'],
        ['payments_received', 'payment receipts', 'customer']
      ],
      vendors: [
        ['tyres_record', 'tyre records', 'vendor'], ['engine_oil_purchase', 'engine oil purchases', 'vendor'],
        ['maintenance', 'maintenance entries', 'vendor'], ['trips', 'trips (old vendor field)', 'vendor'],
        ['payments', 'payment vouchers', 'party_name']
      ],
      suppliers: [['trips', 'trips (Trip Entry)', 'supplier']],
      drivers: [
        ['trips', 'trips (Trip Entry)', 'driver'], ['cash_payments', 'cash payments', 'driver'],
        ['payments', 'payment vouchers', 'driver']
      ],
      workshops: [['maintenance', 'maintenance entries', 'workshop'], ['payments', 'payment vouchers', 'party_name']],
      maintenance_heads: [['maintenance', 'maintenance entries', 'head']],
      fuel_pumps: [['fuel_entries', 'fuel entries', 'fuel_pump'], ['payments', 'payment vouchers', 'party_name']],
      engine_oil_defination: [
        ['engine_oil_purchase', 'engine oil purchases', 'oil_name'], ['engine_oil_usage', 'engine oil usage', 'oil_name']
      ],
      tyre_brands: [['tyres_record', 'tyre records', 'brand']],
      bank_accounts: [
        ['bank_transactions', 'bank transactions', 'account', 'bank_id'], ['payments', 'payment vouchers', 'bank_id', 'bank_account'],
        ['payments_received', 'payments received', 'bank', 'bank_id'], ['cash_payments', 'cash payments', 'bank']
      ]
    };

    for (const [table, label, ...fields] of (checks[tableName] || [])) {
      if (used(table, fields)) return label;
    }
    return null;
  }

  // Dashboard KPI Calculations
  getDashboardKPIs() {
    const vehicles = this.getTable('vehicles');
    const trips = this.getTable('trips');
    const oilPurchases = this.getTable('engine_oil_purchase');
    const cashPayments = this.getTable('cash_payments');
    const fuelEntries = this.getTable('fuel_entries');

    const activeVehicles = vehicles.filter(v => v.status === 'Active').length;
    
    // In-process trips (no unloading date or pending destination)
    const inprocessTrips = trips.filter(t => !t.unloading_date || t.unloading_date === '' || t.destination === 'Pending');

    // Total monthly metrics
    const totalRevenue = trips.reduce((sum, t) => sum + (parseFloat(t.total_cost) || 0), 0);
    const fuelExpenses = fuelEntries.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
    const cashExpenses = cashPayments.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    const oilExpenses = oilPurchases.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
    
    const totalCosts = fuelExpenses + cashExpenses + oilExpenses;
    const netProfit = totalRevenue - totalCosts;

    return {
      activeVehicles,
      totalVehicles: vehicles.length,
      inprocessCount: inprocessTrips.length,
      completedTrips: trips.length - inprocessTrips.length,
      totalRevenue,
      totalCosts,
      fuelExpenses,
      netProfit,
      inprocessTrips
    };
  }

  // Auto Generate Next ID (e.g. TRP-003, WS-004, CP-001)
  generateNextID(tableName, prefix, idField = 'id') {
    const list = this.getTable(tableName);
    let max = 0;
    list.forEach(item => {
      const val = String(item[idField] || item.payment_id || item.code || item.id || '');
      if (val.startsWith(prefix)) {
        const numStr = val.replace(prefix, '');
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > max) max = num;
      }
    });
    const next = max + 1;
    const pad = next < 10 ? '00' : next < 100 ? '0' : '';
    return `${prefix}${pad}${next}`;
  }

  // Engine Oil Stock Tracker (memory only - persisted by the caller's save/transaction)
  updateEngineOilStock(oilName, qtyChange) {
    const list = this.data.engine_oil_defination || [];
    const item = list.find(o => o.name === oilName);
    if (item) {
      item.current_stock = Math.max(0, (parseFloat(item.current_stock) || 0) + qtyChange);
      return item.current_stock;
    }
    return 0;
  }

  // Get trips associated with a specific vehicle number
  getTripsByVehicle(vehicleNumber) {
    if (!vehicleNumber) return [];
    const norm = String(vehicleNumber).trim().toLowerCase();
    const trips = this.getTable('trips');
    return trips.filter(t => t.vehicle && String(t.vehicle).trim().toLowerCase() === norm);
  }

  // Fuel summary per trip: opening (carried) + purchased in trip - remaining = consumed
  getFuelTripReport({ vehicle = '', tripId = '', fromDate = '', toDate = '', pump = '' } = {}) {
    const entries = this.data.fuel_entries || [];
    const trips = this._sortTrips((this.data.trips || []).filter(t =>
      (!vehicle || normText(t.vehicle) === normText(vehicle)) &&
      (!tripId || normText(t.id) === normText(tripId)) &&
      (!fromDate || (t.loading_date || '') >= fromDate) &&
      (!toDate || (t.loading_date || '') <= toDate) &&
      (!pump || entries.some(f => normText(f.trip_id) === normText(t.id) && normText(f.fuel_pump) === normText(pump)))
    ));
    return trips.map(t => {
      const f = this.getTripFuelSummary(t.id);
      const fills = entries.filter(e => normText(e.trip_id) === normText(t.id) && !e.is_opening_fuel);
      return {
        trip_id: t.id,
        vehicle: t.vehicle,
        loading_date: t.loading_date,
        unloading_date: t.unloading_date || '',
        opening_liters: round2(f.openingLiters),
        opening_cost: round2(f.openingCost),
        purchased_liters: round2(f.purchasedLiters),
        purchased_cost: round2(f.purchasedCost),
        remaining_liters: round2(f.remainingLiters),
        consumed_liters: round2(f.consumedLiters),
        net_expense: round2(t.unloading_date ? (toNum(t.diesel_expense) || f.netFuelExpense) : f.netFuelExpense),
        fills: fills.length,
        pumps: [...new Set(fills.map(e => e.fuel_pump).filter(Boolean))].join(', ')
      };
    });
  }

  // Helper to fetch lookup options by category or dedicated table
  getLookupOptions(category) {
    if (category === 'Vehicle Category') {
      const list = this.getTable('vehicle_categories');
      if (list && list.length > 0) {
        return list.filter(item => item.status === 'Active' || !item.status).map(item => item.name || item.code).filter(Boolean);
      }
      return ['Falcon Energy', 'Rented', 'Open Market', 'Private'];
    }

    if (category === 'Tanker Ownership') {
      const list = this.getTable('tanker_ownerships');
      if (list && list.length > 0) {
        return list.filter(item => item.status === 'Active' || !item.status).map(item => item.name || item.code).filter(Boolean);
      }
      return ['Falcon Energy', 'Private', 'Rented', 'Leased'];
    }

    const lookups = this.getTable('lookup_tables');
    const matches = lookups.filter(l => l && l.category && String(l.category).trim().toLowerCase() === String(category).trim().toLowerCase());
    const optionsSet = new Set();

    matches.forEach(m => {
      if (Array.isArray(m.options)) {
        m.options.forEach(opt => opt && optionsSet.add(opt));
      }
      if (m.name || m.title || m.value) {
        optionsSet.add(m.name || m.title || m.value);
      }
    });

    if (optionsSet.size > 0) {
      return Array.from(optionsSet);
    }

    if (category === 'Engine Oil Defination') return ['Shell Rimula R4 15W-40', 'Mobil Delvac MX 15W-40', 'ZIC X3000 Diesel Oil', 'Caltex Delo 400'];
    return [];
  }

  // Get current unassigned fuel balance for a vehicle (opening fuel for next trip)
  getVehicleCurrentFuel(vehicleNumber) {
    if (!vehicleNumber) return { liters: 0, cost: 0, rate: 0 };
    const normV = String(vehicleNumber).trim().toLowerCase();
    const vehicles = this.getTable('vehicles');
    const veh = vehicles.find(v => 
      String(v.number).trim().toLowerCase() === normV || 
      String(v.code).trim().toLowerCase() === normV
    );

    let liters = veh ? (parseFloat(veh.current_fuel_liters) || 0) : 0;
    let cost = veh ? (parseFloat(veh.current_fuel_cost) || 0) : 0;

    // Also include any standalone fuel entries for this vehicle that are NOT assigned to any trip
    const fuelEntries = this.getTable('fuel_entries');
    const unassignedEntries = fuelEntries.filter(fe => {
      const matchVeh = String(fe.vehicle).trim().toLowerCase() === normV;
      const noTrip = !fe.trip_id || fe.trip_id === '-' || String(fe.trip_id).trim() === '';
      return matchVeh && noTrip;
    });

    unassignedEntries.forEach(fe => {
      liters += parseFloat(fe.liters) || 0;
      cost += parseFloat(fe.amount) || 0;
    });

    const rate = liters > 0 ? (cost / liters) : 0;
    return { liters, cost, rate, vehicle: veh };
  }

  // Consume unassigned fuel balance and lock standalone fuel entries to the new trip
  // (memory only - call inside dbService.transaction so it is saved with the trip)
  consumeVehicleOpeningFuel(vehicleNumber, tripId) {
    if (!vehicleNumber) return;
    const normV = String(vehicleNumber).trim().toLowerCase();
    const now = new Date().toISOString();

    // 1. Reset current fuel balance on vehicle object so it's not reused
    const veh = (this.data.vehicles || []).find(v =>
      String(v.number).trim().toLowerCase() === normV ||
      String(v.code).trim().toLowerCase() === normV
    );
    if (veh) {
      veh.current_fuel_liters = 0;
      veh.current_fuel_cost = 0;
      veh.updatedAt = now;
    }

    // 2. Link any standalone unassigned fuel entries for this vehicle to the trip as opening fuel
    (this.data.fuel_entries || []).forEach(fe => {
      const matchVeh = fe.vehicle && String(fe.vehicle).trim().toLowerCase() === normV;
      const noTrip = !fe.trip_id || fe.trip_id === '-' || String(fe.trip_id).trim() === '';
      if (matchVeh && noTrip && tripId) {
        fe.trip_id = tripId;
        fe.is_opening_fuel = true;
        fe.updatedAt = now;
      }
    });
  }

  // Calculate detailed trip fuel accounting summary (Opening + In-Trip Purchases - Remaining Fuel)
  getTripFuelSummary(tripId, customRemainingLiters = null, customRemainingCost = null) {
    if (!tripId) return { openingLiters: 0, openingCost: 0, purchasedLiters: 0, purchasedCost: 0, totalLiters: 0, totalCost: 0, avgRate: 0, remainingLiters: 0, remainingCost: 0, consumedLiters: 0, netFuelExpense: 0 };

    const normId = String(tripId).trim().toLowerCase();
    const trips = this.getTable('trips');
    const trip = trips.find(t => String(t.id).trim().toLowerCase() === normId || String(t.code).trim().toLowerCase() === normId);

    let openingLiters = trip ? (parseFloat(trip.opening_fuel_liters) || 0) : 0;
    let openingCost = trip ? (parseFloat(trip.opening_fuel_cost) || 0) : 0;

    // Only trips saved before opening fuel was recorded borrow the vehicle's current balance
    if (trip && trip.vehicle && (trip.opening_fuel_liters === undefined || trip.opening_fuel_liters === null || trip.opening_fuel_liters === '')) {
      const vehFuel = this.getVehicleCurrentFuel(trip.vehicle);
      openingLiters = vehFuel.liters;
      openingCost = vehFuel.cost;
    }

    // Purchased fuel during trip (excluding pre-existing opening fuel entries)
    const fuelEntries = this.getTable('fuel_entries');
    const tripFuelEntries = fuelEntries.filter(fe => 
      fe.trip_id && String(fe.trip_id).trim().toLowerCase() === normId &&
      !fe.is_opening_fuel
    );
    
    let purchasedLiters = 0;
    let purchasedCost = 0;
    tripFuelEntries.forEach(fe => {
      purchasedLiters += parseFloat(fe.liters) || 0;
      purchasedCost += parseFloat(fe.amount) || 0;
    });

    const totalLiters = openingLiters + purchasedLiters;
    const totalCost = openingCost + purchasedCost;
    const avgRate = totalLiters > 0 ? (totalCost / totalLiters) : 0;

    const remainingLiters = (customRemainingLiters !== null && customRemainingLiters !== undefined && customRemainingLiters !== '')
      ? (parseFloat(customRemainingLiters) || 0) 
      : (trip ? (parseFloat(trip.remaining_fuel_liters) || 0) : 0);

    let remainingCost = 0;
    if (customRemainingCost !== null && customRemainingCost !== undefined && customRemainingCost !== '') {
      remainingCost = parseFloat(customRemainingCost) || 0;
    } else if (trip && trip.remaining_fuel_cost !== undefined && trip.remaining_fuel_cost !== null && trip.remaining_fuel_cost !== '') {
      remainingCost = parseFloat(trip.remaining_fuel_cost) || 0;
    } else {
      remainingCost = remainingLiters * avgRate;
    }

    const consumedLiters = Math.max(0, totalLiters - remainingLiters);
    const netFuelExpense = Math.max(0, totalCost - remainingCost);

    return {
      trip,
      openingLiters,
      openingCost,
      purchasedLiters,
      purchasedCost,
      totalLiters,
      totalCost,
      avgRate,
      remainingLiters,
      remainingCost,
      consumedLiters,
      netFuelExpense
    };
  }

  // Finalize trip fuel accounting on delivery update and carry forward remaining fuel to vehicle
  async updateTripDeliveryWithFuel(tripId, deliveryData) {
    return this.transaction(() => this._updateTripDeliveryWithFuel(tripId, deliveryData));
  }

  async _updateTripDeliveryWithFuel(tripId, deliveryData) {
    const normId = String(tripId).trim().toLowerCase();
    const trips = this.getTable('trips');
    const trip = trips.find(t => String(t.id).trim().toLowerCase() === normId || String(t.code).trim().toLowerCase() === normId);
    if (!trip) return null;

    const remainingLiters = parseFloat(deliveryData.remaining_fuel_liters) || 0;
    const remainingCost = parseFloat(deliveryData.remaining_fuel_cost) || 0;
    const summary = this.getTripFuelSummary(trip.id, remainingLiters, remainingCost);

    // Net fuel expense is calculated ONLY for consumed fuel (total available cost - remaining fuel cost)
    const netFuelExpense = summary.netFuelExpense;

    const updatedTripPayload = {
      ...deliveryData,
      opening_fuel_liters: summary.openingLiters,
      opening_fuel_cost: summary.openingCost,
      purchased_fuel_liters: summary.purchasedLiters,
      purchased_fuel_cost: summary.purchasedCost,
      remaining_fuel_liters: remainingLiters,
      remaining_fuel_cost: remainingCost,
      diesel_expense: netFuelExpense
    };

    // Update trip record
    await this.updateRecord('trips', 'id', trip.id, updatedTripPayload);
    const live = this._findTrip(trip.id);
    const veh = this._findVehicle(trip.vehicle);

    // Is there a newer trip for this vehicle already? Then its opening fuel is already fixed.
    const hasLaterTrip = (this.data.trips || []).some(t =>
      t.id !== trip.id && normText(t.vehicle) === normText(trip.vehicle) &&
      String(t.createdAt || '') > String(trip.createdAt || ''));

    // Carry forward remaining fuel & its cost as opening fuel for this vehicle's NEXT trip
    if (veh && !hasLaterTrip) {
      veh.current_fuel_liters = remainingLiters;
      veh.current_fuel_cost = remainingCost;
    }

    // Advance settlement: carry-forward + trip advances - driver-paid expenses
    const settlement = this.getTripSettlement(trip.id);
    const previousCarry = round2(trip.carry_forward); // value from an earlier save of this delivery
    Object.assign(live, {
      advance_total: settlement.advanceTotal,
      trip_expenses_total: settlement.expenseTotal,
      settlement_balance: settlement.balance,
      final_due: settlement.finalDue,
      carry_forward: settlement.carryForward
    });
    if (veh) {
      // Surplus goes to the vehicle for its next trip (adjusted by the difference on re-save)
      veh.advance_balance = Math.max(0, round2(toNum(veh.advance_balance) + settlement.carryForward - previousCarry));
      veh.updatedAt = new Date().toISOString();
    }

    return live;
  }

  // ─────────────────────────────────────────────────────────────
  // PARTY ACCOUNTING ENGINE
  // Charges = what a party billed us (payables) or what a customer owes us
  // (receivables). Payments = vouchers / receipts against them.
  // Parties are matched by EXACT name / code / id, never by substring.
  // Suppliers are non-financial and never appear here.
  // ─────────────────────────────────────────────────────────────

  // Distinct list of parties for a payment / receipt category
  getPartyListByCategory(category) {
    const names = new Set();
    const add = (v) => {
      const s = String(v ?? '').trim();
      if (s && s !== '-' && s !== 'Pending') names.add(s);
    };
    const T = (t) => this.getTable(t);

    switch (category) {
      case 'Vendors':
        T('vendors').forEach(v => add(v.business_name || v.name));
        T('tyres_record').forEach(t => add(t.vendor));
        T('engine_oil_purchase').forEach(o => add(o.vendor || o.supplier));
        break;
      case 'Workshops':
        T('workshops').forEach(w => add(w.name || w.business_name));
        T('maintenance').forEach(m => add(m.workshop));
        break;
      case 'Fuel Pumps':
        T('fuel_pumps').forEach(p => add(p.name));
        T('fuel_entries').forEach(f => add(f.fuel_pump));
        break;
      case 'Drivers':
        T('drivers').forEach(d => add(d.name));
        T('trips').forEach(t => add(t.driver));
        break;
      case 'Vehicles':
        T('vehicles').forEach(v => add(v.number));
        break;
      case 'Customers':
        T('customers').forEach(c => add(c.name || c.business_name));
        T('trips').forEach(t => add(t.customer));
        break;
      case 'Personal Expenses':
      case 'Personal Expense':
        ['Personal Expense', 'Director Expense / Salary', 'Office Petty Cash / Misc', 'Staff Expenses'].forEach(add);
        break;
      default:
        break;
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }

  // All names / codes / ids that identify the same party
  _partyAliases(partyInput) {
    const aliases = new Set();
    const add = (v) => { const s = normText(v); if (s && s !== '-') aliases.add(s); };
    const addAll = (item) => ['id', 'code', 'name', 'business_name', 'number', 'tanker_number'].forEach(k => add(item[k]));

    if (partyInput && typeof partyInput === 'object') {
      addAll(partyInput);
      return aliases;
    }
    const input = normText(partyInput);
    add(input);
    ['vendors', 'workshops', 'fuel_pumps', 'vehicles', 'customers', 'drivers', 'transporters'].forEach(table => {
      (this.data[table] || []).forEach(item => {
        const keys = ['id', 'code', 'name', 'business_name', 'number'].map(k => normText(item[k]));
        if (keys.includes(input)) addAll(item);
      });
    });
    return aliases;
  }

  _tripRoute(t) {
    if (!t) return '';
    const dest = t.destination && t.destination !== 'Pending' && t.destination !== '-' ? t.destination : '';
    return [t.source && t.source !== '-' ? t.source : '', dest].filter(Boolean).join(' → ');
  }

  // Charges + payments of one party (or every party of the category when partyInput is empty)
  getPartyTransactions(category, partyInput = '', { tripId = '', vehicle = '' } = {}) {
    const all = !partyInput || (typeof partyInput === 'string' && !partyInput.trim());
    const aliases = all ? null : this._partyAliases(partyInput);
    const is = (val) => {
      const s = normText(val);
      if (!s || s === '-' || s === 'pending') return false;
      return all ? true : aliases.has(s);
    };
    const txns = [];
    const charge = (o) => txns.push({ kind: 'charge', trip_id: '', vehicle: '', ...o, amount: round2(o.amount) });
    const payment = (o) => txns.push({ kind: 'payment', trip_id: '', vehicle: '', ...o, amount: round2(o.amount) });
    const T = (t) => this.getTable(t);

    // ---- Charges ----
    if (category === 'Vendors') {
      T('tyres_record').forEach(t => {
        if (!is(t.vendor)) return;
        const veh = t.vehicle || t.tanker_number || '';
        charge({
          date: t.purchase_date || dateOf(t.createdAt), ref: t.id, party: t.vendor, vehicle: veh,
          amount: t.total_amount || t.amount || t.cost,
          description: `Tyre purchase · ${[t.brand, t.tyre_number].filter(Boolean).join(' ') || 'Tyre'}${veh ? ` · ${veh}` : ''}`
        });
      });
      T('engine_oil_purchase').forEach(o => {
        const v = o.vendor || o.supplier;
        if (!is(v)) return;
        charge({
          date: o.date || dateOf(o.createdAt), ref: o.id, party: v, amount: o.amount || o.total_amount,
          description: `Engine oil purchase · ${o.oil_name || 'Oil'} · ${toNum(o.quantity)} L`
        });
      });
      T('maintenance').forEach(m => {
        if (!m.vendor || !is(m.vendor)) return;
        charge({
          date: m.date || dateOf(m.createdAt), ref: m.id, party: m.vendor, vehicle: m.vehicle || '',
          amount: m.total_amount || m.amount || m.cost,
          description: `Maintenance parts · ${m.head || 'Service'} · ${m.vehicle || m.tanker_number || ''}`
        });
      });
    }

    if (category === 'Workshops') {
      T('maintenance').forEach(m => {
        if (!is(m.workshop)) return;
        const veh = m.vehicle || m.tanker_number || '';
        charge({
          date: m.date || dateOf(m.createdAt), ref: m.id, party: m.workshop, vehicle: veh,
          amount: m.total_amount || m.amount || m.cost,
          description: `Maintenance · ${m.head || 'Service'}${veh ? ` · ${veh}` : ''}${m.type ? ` (${m.type})` : ''}`
        });
      });
    }

    if (category === 'Fuel Pumps') {
      T('fuel_pumps').forEach(p => {
        if (toNum(p.opening_payable) > 0 && is(p.name)) {
          charge({ date: dateOf(p.createdAt), ref: p.id, party: p.name, amount: p.opening_payable, description: 'Opening payable balance' });
        }
      });
      T('fuel_entries').forEach(f => {
        if (!is(f.fuel_pump)) return;
        const liters = toNum(f.liters);
        const amount = toNum(f.amount || f.total_amount);
        const rate = liters > 0 ? Math.round(amount / liters) : 0;
        charge({
          date: f.date || dateOf(f.createdAt), ref: f.id, party: f.fuel_pump, vehicle: f.vehicle || '', trip_id: f.trip_id || '',
          amount,
          description: `Fuel ${liters} L${rate ? ` @ ${rate}/L` : ''}${f.vehicle ? ` · ${f.vehicle}` : ''}${f.trip_id && f.trip_id !== '-' ? ` · ${f.trip_id}` : ''}`
        });
      });
    }

    if (category === 'Vehicles') {
      T('trips').forEach(t => {
        if (!is(t.vehicle) || toNum(t.final_due) <= 0) return;
        charge({
          date: t.unloading_date || t.loading_date, ref: t.id, party: t.vehicle, vehicle: t.vehicle, trip_id: t.id,
          amount: t.final_due,
          description: `Trip ${t.id} final due (expenses exceeded advance)${this._tripRoute(t) ? ` · ${this._tripRoute(t)}` : ''}`
        });
      });
    }

    if (category === 'Customers') {
      T('trips').forEach(t => {
        const income = toNum(t.net_income) || toNum(t.total_cost);
        if (!t.unloading_date || income <= 0 || !is(t.customer)) return;
        charge({
          date: t.unloading_date, ref: t.id, party: t.customer, vehicle: t.vehicle || '', trip_id: t.id, amount: income,
          description: `Freight ${t.id} · ${t.vehicle || ''}${this._tripRoute(t) ? ` · ${this._tripRoute(t)}` : ''}${t.unload_weight ? ` · ${t.unload_weight} T` : ''}`
        });
      });
    }

    // ---- Payments / receipts ----
    if (category === 'Customers') {
      T('payments_received').forEach(pr => {
        const c = pr.customer || pr.party_name;
        if (!is(c)) return;
        payment({
          date: pr.date || dateOf(pr.createdAt), ref: pr.payment_id || pr.id, party: c, amount: pr.amount,
          description: pr.description || `Receipt ${pr.payment_id || pr.id}${pr.bank && pr.bank !== '-' ? ` · ${pr.bank}` : ''}`
        });
      });
    } else {
      T('payments').forEach(p => {
        const type = p.payment_type || 'Payment';
        if (type === 'Advance') return; // advances are consumed inside each trip's settlement
        const pDate = p.payment_date || p.date || dateOf(p.createdAt);
        const ref = p.voucher_no || p.id;

        if (type === 'Settlement') {
          // Final dues belong to the vehicle, whoever the voucher was issued to
          if (category !== 'Vehicles') return;
          const veh = p.vehicle || this._findTrip(p.trip_id)?.vehicle;
          if (!is(veh)) return;
          payment({ date: pDate, ref, party: veh, vehicle: veh, trip_id: p.trip_id || '', amount: p.amount, description: p.description || `Final due settlement ${p.trip_id || ''}` });
          return;
        }

        const party = p.party_name || p.paid_to || p.party_id;
        if (!is(party)) return;
        if (p.party_category && p.party_category !== category) return;
        if (all && !p.party_category) return;
        payment({
          date: pDate, ref, party, vehicle: p.vehicle || '', trip_id: p.trip_id || '', amount: p.amount,
          description: p.description || `Payment voucher ${ref}${p.source_name ? ` · ${p.source_name}` : ''}${p.remarks ? ` · ${p.remarks}` : ''}`
        });
      });

      // Older direct cash payments to a named party
      if (!all) {
        T('cash_payments').forEach(c => {
          if (c.voucher_no || !is(c.paid_to)) return;
          payment({
            date: c.date || dateOf(c.createdAt), ref: c.id, party: c.paid_to, amount: c.amount,
            description: c.description || `Cash payment ${c.id}${c.remarks ? ` · ${c.remarks}` : ''}`
          });
        });
      }
    }

    return txns
      .filter(t => (!tripId || normText(t.trip_id) === normText(tripId)) && (!vehicle || normText(t.vehicle) === normText(vehicle)))
      .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  }

  // Total charged, total paid, outstanding balance and charge list for a party
  getPartyPayableSummary(category, partyInput) {
    const empty = { totalAccruedCost: 0, totalPaidAmount: 0, currentPayableBalance: 0, pendingItems: [], entries: [], lastDate: '' };
    if (!partyInput) return empty;

    const txns = this.getPartyTransactions(category, partyInput);
    const charges = txns.filter(t => t.kind === 'charge');
    const accrued = sumBy(charges, c => c.amount);
    const paid = sumBy(txns.filter(t => t.kind === 'payment'), p => p.amount);
    const entries = charges.map(c => ({ id: c.ref, date: c.date, description: c.description, total_amount: c.amount, trip_id: c.trip_id }));

    return {
      totalAccruedCost: accrued,
      totalPaidAmount: paid,
      currentPayableBalance: Math.max(0, round2(accrued - paid)),
      pendingItems: entries,
      entries,
      lastDate: charges.length ? charges[charges.length - 1].date : ''
    };
  }

  _outstandingList(categories, { party = '' } = {}) {
    const labels = { 'Vendors': 'Vendor', 'Workshops': 'Workshop', 'Fuel Pumps': 'Fuel Pump', 'Vehicles': 'Vehicle', 'Drivers': 'Driver', 'Customers': 'Customer' };
    const list = [];
    categories.forEach(cat => {
      this.getPartyListByCategory(cat).forEach(name => {
        if (party && normText(party) !== normText(name)) return;
        const s = this.getPartyPayableSummary(cat, name);
        if (s.currentPayableBalance <= 0.009) return;
        list.push({
          id: `${cat}|${name}`,
          reference_id: `PARTY-${name}`,
          date: s.lastDate || todayISO(),
          category: cat,
          party_type: labels[cat] || cat,
          party_name: name,
          description: `${s.entries.length} bill(s)${s.lastDate ? ` · last on ${s.lastDate}` : ''}`,
          total_amount: s.totalAccruedCost,
          paid_amount: s.totalPaidAmount,
          remaining_amount: s.currentPayableBalance,
          payment_status: s.totalPaidAmount > 0 ? 'Partially Paid' : 'Unpaid'
        });
      });
    });
    return list.sort((a, b) => b.remaining_amount - a.remaining_amount);
  }

  // Everything the company still has to pay (vendors, workshops, fuel pumps, vehicle final dues)
  getPendingPayables(filters = {}) {
    const cats = filters.category ? [filters.category] : ['Vendors', 'Workshops', 'Fuel Pumps', 'Vehicles'];
    return this._outstandingList(cats, filters);
  }

  // Everything customers still have to pay us
  getPendingReceivables(filters = {}) {
    return this._outstandingList(['Customers'], { party: filters.customer || filters.party || '' });
  }

  // ─────────────────────────────────────────────────────────────
  // TRIP ADVANCE & SETTLEMENT (tracked per vehicle)
  // previous carry-forward + advances paid for the trip - driver-paid trip
  // expenses = balance. Negative → FINAL DUE payable to the vehicle.
  // Positive → carried forward as opening advance for the vehicle's next trip.
  // ─────────────────────────────────────────────────────────────

  _findTrip(tripId) {
    if (!tripId) return null;
    const n = normText(tripId);
    return (this.data.trips || []).find(t => normText(t.id) === n) || null;
  }

  _findVehicle(vehicle) {
    if (!vehicle) return null;
    const n = normText(vehicle);
    return (this.data.vehicles || []).find(v => normText(v.number) === n || normText(v.code) === n) || null;
  }

  _sortTrips(list) {
    return [...list].sort((a, b) =>
      String(a.loading_date || '').localeCompare(String(b.loading_date || '')) ||
      String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
    );
  }

  // Carry-forward advance balance of a vehicle (surplus from its previous trip)
  getVehicleAdvanceBalance(vehicle) {
    return round2(this._findVehicle(vehicle)?.advance_balance);
  }

  // Take the vehicle's carry-forward balance for a new trip (memory only - use inside a transaction)
  takeVehicleAdvanceBalance(vehicle) {
    const veh = this._findVehicle(vehicle);
    if (!veh) return 0;
    const amount = round2(veh.advance_balance);
    veh.advance_balance = 0;
    veh.updatedAt = new Date().toISOString();
    return amount;
  }

  getVehicleActiveTrip(vehicle) {
    const n = normText(vehicle);
    const open = (this.data.trips || []).filter(t => normText(t.vehicle) === n && !t.unloading_date);
    const sorted = this._sortTrips(open);
    return sorted[sorted.length - 1] || null;
  }

  getDriverActiveTrip(driver) {
    const n = normText(driver);
    const open = (this.data.trips || []).filter(t => normText(t.driver) === n && !t.unloading_date);
    const sorted = this._sortTrips(open);
    return sorted[sorted.length - 1] || null;
  }

  getTripAdvances(tripId) {
    const n = normText(tripId);
    return (this.data.payments || []).filter(p => p.payment_type === 'Advance' && normText(p.trip_id) === n);
  }

  getTripSettlementPayments(tripId) {
    const n = normText(tripId);
    return (this.data.payments || []).filter(p => p.payment_type === 'Settlement' && normText(p.trip_id) === n);
  }

  getTripExpenseLines(trip) {
    return DRIVER_EXPENSE_FIELDS
      .map(f => ({ ...f, amount: round2(trip?.[f.key]) }))
      .filter(f => f.amount > 0);
  }

  // Full advance settlement for a trip. `overrides` lets a form preview unsaved values.
  getTripSettlement(tripId, overrides = null) {
    const base = this._findTrip(tripId);
    if (!base && !overrides) return null;
    const trip = { ...base, ...overrides };

    const voucherLine = p => ({
      id: p.voucher_no || p.id,
      date: p.payment_date || p.date || dateOf(p.createdAt),
      paid_to: p.party_name,
      category: p.party_category,
      method: p.payment_method,
      bank: p.bank_account || p.source_name || '',
      amount: round2(p.amount),
      description: p.description || ''
    });

    const previousBalance = round2(trip.previous_advance_balance);
    const advances = this.getTripAdvances(trip.id).map(voucherLine);
    const advanceTotal = sumBy(advances, a => a.amount);
    const totalAdvance = round2(previousBalance + advanceTotal);
    const expenses = this.getTripExpenseLines(trip);
    const expenseTotal = sumBy(expenses, e => e.amount);
    const balance = round2(totalAdvance - expenseTotal);
    const finalDue = balance < 0 ? -balance : 0;
    const carryForward = balance > 0 ? balance : 0;
    const settlements = this.getTripSettlementPayments(trip.id).map(voucherLine);
    const settledAmount = sumBy(settlements, s => s.amount);
    const delivered = Boolean(trip.unloading_date);
    const outstandingDue = delivered ? Math.max(0, round2(finalDue - settledAmount)) : 0;

    let status = 'Trip in progress';
    if (delivered) {
      if (finalDue > 0) status = outstandingDue > 0 ? 'Final due payable' : 'Final due settled';
      else if (carryForward > 0) status = 'Surplus carried forward';
      else status = 'Settled (nil balance)';
    }

    return {
      trip, previousBalance, advances, advanceTotal, totalAdvance, expenses, expenseTotal,
      balance, finalDue, carryForward, settlements, settledAmount, outstandingDue, delivered, status
    };
  }

  // Delivered trips whose final due is not fully paid yet
  getTripsWithOutstandingDue({ vehicle = '', driver = '' } = {}) {
    return this._sortTrips((this.data.trips || []).filter(t =>
      t.unloading_date &&
      (!vehicle || normText(t.vehicle) === normText(vehicle)) &&
      (!driver || normText(t.driver) === normText(driver))
    ))
      .map(t => ({ trip: t, settlement: this.getTripSettlement(t.id) }))
      .filter(x => x.settlement.outstandingDue > 0);
  }

  // Advance ledger: one row per trip with carry-forward, advances, expenses and result
  getAdvanceLedger({ vehicle = '', driver = '', tripId = '', fromDate = '', toDate = '', status = '' } = {}) {
    const trips = this._sortTrips((this.data.trips || []).filter(t =>
      (!vehicle || normText(t.vehicle) === normText(vehicle)) &&
      (!driver || normText(t.driver) === normText(driver)) &&
      (!tripId || normText(t.id) === normText(tripId)) &&
      (!fromDate || (t.loading_date || '') >= fromDate) &&
      (!toDate || (t.loading_date || '') <= toDate)
    ));

    const rows = trips.map(t => this.getTripSettlement(t.id)).filter(s => {
      if (status === 'open') return !s.delivered;
      if (status === 'due') return s.outstandingDue > 0;
      if (status === 'carry') return s.delivered && s.carryForward > 0;
      if (status === 'settled') return s.delivered && s.outstandingDue === 0;
      return true;
    });

    return {
      rows,
      totals: {
        previous: sumBy(rows, r => r.previousBalance),
        advances: sumBy(rows, r => r.advanceTotal),
        expenses: sumBy(rows, r => r.expenseTotal),
        finalDue: sumBy(rows, r => r.finalDue),
        settled: sumBy(rows, r => r.settledAmount),
        outstanding: sumBy(rows, r => r.outstandingDue),
        carryForward: sumBy(rows, r => (r.delivered ? r.carryForward : 0))
      },
      currentVehicleBalance: vehicle ? this.getVehicleAdvanceBalance(vehicle) : null
    };
  }

  // ── Mobil / engine oil cost linked to a trip (from Engine Oil Usage entries) ──
  getOilAverageRate(oilName) {
    const n = normText(oilName);
    const purchases = (this.data.engine_oil_purchase || []).filter(p => normText(p.oil_name) === n);
    const qty = sumBy(purchases, p => p.quantity);
    const amount = sumBy(purchases, p => p.amount || p.total_amount);
    return qty > 0 ? amount / qty : 0;
  }

  getTripMobilOilExpense(tripId) {
    const n = normText(tripId);
    const usages = n ? (this.data.engine_oil_usage || []).filter(u => normText(u.trip_id) === n) : [];
    const lines = usages.map(u => {
      const qty = toNum(u.quantity_used || u.quantity);
      const rate = this.getOilAverageRate(u.oil_name);
      return { id: u.id, date: u.date, oil: u.oil_name, qty, rate: round2(rate), amount: Math.round(qty * rate) };
    });
    return { count: lines.length, liters: sumBy(lines, l => l.qty), amount: sumBy(lines, l => l.amount), lines };
  }

  // Short, readable description for any money movement
  buildNarration(type, c = {}) {
    const clean = (arr) => arr.filter(v => v !== undefined && v !== null && String(v).trim() !== '' && v !== '-').join(' · ');
    const t = c.trip;
    const driver = t?.driver && t.driver !== '-' ? `Driver: ${t.driver}` : '';
    const via = c.bank ? `via ${c.bank}` : '';
    const ref = c.instrument ? `Ref ${c.instrument}` : '';
    switch (type) {
      case 'advance':
        return clean([`Trip advance for ${t?.id || ''}`, t?.vehicle, driver, this._tripRoute(t), via, ref]);
      case 'settlement':
        return clean([`Final due settlement for ${t?.id || ''}`, t?.vehicle, driver, via, ref]);
      case 'receipt':
        return clean([`Receipt from ${c.party}`, c.bank ? `into ${c.bank}` : '', ref]);
      default:
        return clean([`Payment to ${c.party}`, CATEGORY_NARRATION[c.category] || c.category, via, ref]);
    }
  }

  // Double-Entry Cash Account Ledger Generator (Bank-like system for Cash)
  getCashAccountLedger(accountInput = '', fromDate = '', toDate = '') {
    const rawTxns = [];
    const accountFilter = String(accountInput || '').trim().toLowerCase();

    const isMatch = (val) => {
      if (!accountFilter) return true;
      if (!val) return false;
      return String(val).trim().toLowerCase().includes(accountFilter);
    };

    // 1. Cash Inflows / Credit (Cash Top-Ups, Cash Received, Cash Deposits)
    // Cash Received from Customers
    this.getTable('payments_received').forEach(pr => {
      if (pr.payment_method === 'Cash' || pr.bank === 'Cash' || !pr.bank || pr.bank === '-') {
        if (isMatch(pr.customer) || isMatch(pr.party_name) || isMatch(pr.remarks) || isMatch(pr.bank)) {
          const amt = parseFloat(pr.amount) || 0;
          rawTxns.push({
            date: pr.date || pr.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
            ref: pr.id || pr.payment_id || 'CSH-REC',
            description: `Cash Received from ${pr.customer || pr.party_name || 'Customer'} - ${pr.remarks || ''}`,
            type: 'Credit',
            cr: amt, // Inflow / Credit to Cash Account
            dr: 0
          });
        }
      }
    });

    // Cash Payments where type is 'Deposit' or 'Income' / 'Top Up'
    this.getTable('cash_payments').forEach(cp => {
      const amt = parseFloat(cp.amount) || 0;
      const isDeposit = cp.payment_type === 'Deposit' || cp.type === 'Deposit' || cp.type === 'Income' || cp.payment_type === 'Top Up' || cp.category === 'Top Up';
      
      if (isMatch(cp.paid_to) || isMatch(cp.driver) || isMatch(cp.vehicle) || isMatch(cp.category) || isMatch(cp.head) || isMatch(cp.payment_type)) {
        if (isDeposit) {
          rawTxns.push({
            date: cp.date || cp.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
            ref: cp.id || 'CSH-DEP',
            description: `Cash Deposit / Credit (${cp.paid_to || cp.driver || 'Cash Account'}) - ${cp.remarks || ''}`,
            type: 'Credit',
            cr: amt, // Inflow
            dr: 0
          });
        } else {
          // Outflow / Debit (Expense, Driver Payment, etc.)
          rawTxns.push({
            date: cp.date || cp.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
            ref: cp.id || 'CSH-EXP',
            description: `Cash Payment to ${cp.paid_to || cp.driver || cp.vehicle || 'Party'} (${cp.payment_type || cp.category || 'Expense'}) - ${cp.remarks || ''}`,
            type: 'Debit',
            cr: 0,
            dr: amt // Outflow
          });
        }
      }
    });

    // Payment Vouchers Issued in Cash
    this.getTable('payments').forEach(p => {
      if (p.payment_source === 'Cash' || p.payment_method === 'Cash') {
        if (isMatch(p.party_name) || isMatch(p.paid_to) || isMatch(p.party_category)) {
          const amt = parseFloat(p.amount) || 0;
          rawTxns.push({
            date: p.payment_date || p.date || p.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
            ref: p.id || p.voucher_no || 'CSH-VCH',
            description: `Cash Payment Voucher to ${p.party_name || p.paid_to || 'Party'} (${p.party_category || 'Payable'})`,
            type: 'Debit',
            cr: 0,
            dr: amt // Outflow
          });
        }
      }
    });

    // Sort chronologically by date
    rawTxns.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    let openingBalance = 0; // Default Opening Balance for Cash
    const periodTxns = [];

    rawTxns.forEach(t => {
      if (fromDate && t.date < fromDate) {
        openingBalance += (t.cr - t.dr);
      } else if (!toDate || t.date <= toDate) {
        periodTxns.push(t);
      }
    });

    let currentBal = openingBalance;
    const ledgerRows = [
      {
        date: fromDate || (periodTxns[0]?.date || new Date().toISOString().split('T')[0]),
        ref: '-',
        description: 'Opening Balance',
        dr: 0,
        cr: 0,
        balance: openingBalance,
        isOpening: true
      }
    ];

    periodTxns.forEach(t => {
      currentBal += (t.cr - t.dr);
      ledgerRows.push({
        ...t,
        balance: currentBal
      });
    });

    return {
      accountName: accountInput ? `Cash Account (${accountInput})` : 'Main Cash Account',
      openingBalance: openingBalance,
      closingBalance: currentBal,
      totalCredit: periodTxns.reduce((s, x) => s + x.cr, 0),
      totalDebit: periodTxns.reduce((s, x) => s + x.dr, 0),
      totalCr: periodTxns.reduce((s, x) => s + x.cr, 0),
      totalDr: periodTxns.reduce((s, x) => s + x.dr, 0),
      rows: ledgerRows
    };
  }

  // Detailed Trip Sheet: one trip with loading, freight, diesel, expenses, advances and settlement
  getDetailedTripSheet({ vehicle = '', driver = '', tripId = '', fromDate = '', toDate = '' } = {}) {
    let trip = tripId ? this._findTrip(tripId) : null;
    if (!trip) {
      const pool = this._sortTrips((this.data.trips || []).filter(t =>
        (!vehicle || normText(t.vehicle) === normText(vehicle)) &&
        (!driver || normText(t.driver) === normText(driver)) &&
        (!fromDate || (t.loading_date || '') >= fromDate) &&
        (!toDate || (t.loading_date || '') <= toDate)
      ));
      trip = pool[pool.length - 1] || null;
    }
    if (!trip) return null;

    const fuel = this.getTripFuelSummary(trip.id);
    const pumps = [...new Set((this.data.fuel_entries || [])
      .filter(f => normText(f.trip_id) === normText(trip.id) && f.fuel_pump)
      .map(f => f.fuel_pump))];
    const hasStoredDiesel = trip.diesel_expense !== undefined && trip.diesel_expense !== '' && trip.diesel_expense !== null;
    const dieselExpense = hasStoredDiesel ? round2(trip.diesel_expense) : round2(fuel.netFuelExpense);

    const mobil = this.getTripMobilOilExpense(trip.id);
    const mobilExpense = mobil.count > 0 ? mobil.amount : round2(trip.mobil_oil_expense);

    const settlement = this.getTripSettlement(trip.id);
    const distance = toNum(trip.distance);
    const netIncome = toNum(trip.net_income) || toNum(trip.total_cost);
    const totalTripCost = round2(settlement.expenseTotal + dieselExpense + mobilExpense);
    const clean = (v) => (v && v !== '-' && v !== 'Pending' ? v : '—');

    return {
      trip,
      tripId: trip.id,
      vehicleNo: trip.vehicle || '—',
      driverName: clean(trip.driver),
      supplier: clean(trip.supplier || trip.vendor),
      customer: clean(trip.customer),
      source: clean(trip.source),
      destination: clean(trip.destination),
      plant: clean(trip.plant),
      loadDate: trip.loading_date || '',
      unloadDate: trip.unloading_date || '',
      durationDays: daysBetween(trip.loading_date, trip.unloading_date),
      status: trip.unloading_date ? (trip.status || 'Delivered') : 'In Transit',
      weights: {
        load: toNum(trip.load_weight), unload: toNum(trip.unload_weight), diff: toNum(trip.difference),
        loadPsi: toNum(trip.load_pressure), unloadPsi: toNum(trip.unload_pressure), distance
      },
      freight: {
        type: trip.freight_type || 'Per Ton',
        rate: trip.freight_type === 'Per KM' ? toNum(trip.freight_km_rate) : toNum(trip.freight_ton_rate),
        gross: toNum(trip.amount),
        shortSurplusType: trip.short_surplus_type || '',
        shortSurplusAmount: toNum(trip.short_surplus_amount),
        netIncome
      },
      diesel: {
        ...fuel,
        expense: dieselExpense,
        pumps: pumps.join(', ') || '—',
        avgKmPerLiter: fuel.consumedLiters > 0 && distance > 0 ? distance / fuel.consumedLiters : 0
      },
      mobilOil: { amount: mobilExpense, liters: mobil.liters, fromUsage: mobil.count > 0 },
      settlement,
      totals: {
        roadExpenses: settlement.expenseTotal,
        diesel: dieselExpense,
        mobilOil: mobilExpense,
        totalTripCost,
        netIncome,
        tripMargin: round2(netIncome - totalTripCost)
      }
    };
  }

  // Shared ledger builder: opening balance from rows before fromDate, then running balance
  _buildLedger(rawRows, sign, fromDate, toDate, meta = {}) {
    let opening = toNum(meta.openingBalance);
    const period = [];
    [...rawRows]
      .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))
      .forEach(r => {
        if (fromDate && (r.date || '') < fromDate) opening += sign(r);
        else if (!toDate || (r.date || '') <= toDate) period.push(r);
      });

    let balance = opening;
    const rows = [{
      date: fromDate || period[0]?.date || todayISO(), ref: '-', description: 'Opening Balance',
      dr: 0, cr: 0, balance: round2(opening), isOpening: true
    }];
    period.forEach(r => {
      balance += sign(r);
      rows.push({ ...r, balance: round2(balance) });
    });

    return {
      ...meta,
      openingBalance: round2(opening),
      closingBalance: round2(balance),
      totalDr: sumBy(period, r => r.dr),
      totalCr: sumBy(period, r => r.cr),
      rows
    };
  }

  // Bank ledger - bank_transactions is the single source of every bank movement
  getBankLedger(accountInput = '', fromDate = '', toDate = '', { txnType = '' } = {}) {
    const banks = this.data.bank_accounts || [];
    let target = null;
    if (accountInput && typeof accountInput === 'object') target = accountInput;
    else if (accountInput) {
      const q = normText(accountInput);
      target = banks.find(b => [b.id, b.bank_name, b.account_title, b.account_number].some(v => normText(v) === q)) || null;
    }
    const accounts = target ? [target] : banks;
    const openingBalance = sumBy(accounts, a => a.opening_balance);

    const rows = (this.data.bank_transactions || [])
      .filter(bt => !target || normText(bt.account) === normText(target.bank_name) || normText(bt.bank_id) === normText(target.id))
      .filter(bt => !txnType || (bt.transaction_type || bt.type) === txnType)
      .map(bt => {
        const type = bt.transaction_type || bt.type || 'Deposit';
        const inflow = type === 'Deposit' || type === 'Transfer In';
        const amt = round2(bt.amount);
        return {
          date: bt.date || dateOf(bt.createdAt),
          ref: bt.reference_no || bt.reference_id || bt.id,
          account: bt.account,
          party: bt.party_name || bt.paid_to || '',
          type,
          description: bt.description || bt.remarks || `Bank ${type}`,
          dr: inflow ? amt : 0,
          cr: inflow ? 0 : amt
        };
      });

    return this._buildLedger(rows, r => r.dr - r.cr, fromDate, toDate, {
      accountName: target ? `${target.bank_name}${target.account_number ? ` (${target.account_number})` : ''}` : 'All Bank Accounts',
      openingBalance
    });
  }

  // Party ledger. Payables (vendors, workshops, pumps, vehicles): bills Cr, payments Dr.
  // Receivables (customers): freight billed Dr, receipts Cr.
  getPartyLedger(partyCategory, partyInput = '', fromDate = '', toDate = '', opts = {}) {
    const isReceivable = partyCategory === 'Customers';
    const rows = this.getPartyTransactions(partyCategory, partyInput, opts).map(t => ({
      date: t.date,
      ref: t.ref,
      party: t.party,
      trip_id: t.trip_id,
      vehicle: t.vehicle,
      description: t.description,
      dr: (isReceivable ? t.kind === 'charge' : t.kind === 'payment') ? t.amount : 0,
      cr: (isReceivable ? t.kind === 'payment' : t.kind === 'charge') ? t.amount : 0
    }));
    const partyName = partyInput && typeof partyInput === 'object'
      ? (partyInput.name || partyInput.business_name || partyInput.number)
      : (partyInput || `All ${partyCategory}`);

    return this._buildLedger(rows, r => (isReceivable ? r.dr - r.cr : r.cr - r.dr), fromDate, toDate, {
      partyName,
      partyCategory,
      balanceType: isReceivable ? 'Receivable' : 'Payable'
    });
  }

  // Universal ledger combining bank movements and every party ledger
  getUniversalLedger(fromDate = '', toDate = '', filterCategory = '', filterParty = '') {
    const raw = [];
    if (!filterCategory || filterCategory === 'Bank') {
      this.getBankLedger().rows.filter(r => !r.isOpening).forEach(r => {
        if (filterParty && normText(r.account) !== normText(filterParty) && normText(r.party) !== normText(filterParty)) return;
        raw.push({ ...r, category: 'Bank', party: r.account || 'Bank' });
      });
    }
    ['Vendors', 'Workshops', 'Fuel Pumps', 'Vehicles', 'Customers'].forEach(cat => {
      if (filterCategory && filterCategory !== cat) return;
      this.getPartyLedger(cat, filterParty).rows.filter(r => !r.isOpening).forEach(r => raw.push({ ...r, category: cat }));
    });

    const ledger = this._buildLedger(raw, r => r.dr - r.cr, fromDate, toDate, { title: 'Universal General Ledger' });
    ledger.rows = ledger.rows.filter(r => !r.isOpening || r.balance !== 0);
    return ledger;
  }

  // Daily Activity Executive Report Data Aggregator
  getDailyActivityReport(reportDate = todayISO()) {
    const trips = this.getTable('trips');
    const cashPayments = this.getTable('cash_payments');

    // 1. Vehicle locations: loaded (open trip) or last delivery point
    const vehicleLocations = this.getTable('vehicles').map(v => {
      const active = this.getVehicleActiveTrip(v.number);
      const done = this._sortTrips(trips.filter(t => normText(t.vehicle) === normText(v.number) && t.unloading_date));
      const last = done[done.length - 1];
      return {
        number: v.number,
        location: active ? `${active.source && active.source !== '-' ? active.source : 'Loaded'} → in transit` : (last?.destination || 'Yard / Base'),
        status: active ? `Loaded (${active.id})` : (v.status || 'Empty')
      };
    });

    // 2. Loaded / decanted on the report date
    const vehiclesLoadedToday = trips.filter(t => t.loading_date === reportDate).map(t => ({
      number: t.vehicle, trip: t.id, location: t.source || '-', psi: t.load_pressure || '-'
    }));
    const vehiclesDecantedToday = trips.filter(t => t.unloading_date === reportDate).map(t => ({
      number: t.vehicle, trip: t.id, location: t.destination || '-', psi: t.unload_pressure || '-'
    }));

    // 3. Trip advances paid on the report date
    const advances = this.getTable('payments')
      .filter(p => p.payment_type === 'Advance' && (p.payment_date || p.date) === reportDate)
      .map(p => {
        const t = this._findTrip(p.trip_id);
        return { vehicle: p.vehicle || t?.vehicle || '-', trip: p.trip_id, plant: t?.source || '-', amount: round2(p.amount) };
      });

    // 4. Cash fueling / other cash expenses
    const cashFueling = cashPayments.filter(c => c.date === reportDate).map(c => ({
      vehicle: c.vehicle || '-',
      head: c.category || c.head || c.payment_type || 'Expense',
      amount: round2(c.amount),
      paidBy: c.driver || c.paid_to || 'Cash'
    }));

    // 5. Fuel pump & workshop balances as of the report date
    const pumpSummaries = this.getTable('fuel_pumps').map(pump => {
      const l = this.getPartyLedger('Fuel Pumps', pump.name, reportDate, reportDate);
      return { pumpName: pump.name, openingCr: l.openingBalance, billedToday: l.totalCr, paidToday: l.totalDr, closingBalance: l.closingBalance };
    });
    const workshopSummary = this.getTable('workshops').map(w => {
      const l = this.getPartyLedger('Workshops', w.name, reportDate, reportDate);
      return { name: w.name, previousAmount: l.openingBalance, billed: l.totalCr, paid: l.totalDr, remaining: l.closingBalance };
    });

    // 6. Payables & receivables
    const pendingPayables = this.getPendingPayables();
    const payablesTotal = sumBy(pendingPayables, x => x.remaining_amount);
    const receivablesTotal = sumBy(this.getPendingReceivables(), x => x.remaining_amount);

    // 7. Engine oil stock on the report date (current stock rolled back for later movements)
    const purchases = this.getTable('engine_oil_purchase');
    const usage = this.getTable('engine_oil_usage');
    const qtyP = p => p.quantity;
    const qtyU = u => u.quantity_used || u.quantity;
    const currentStock = sumBy(this.getTable('engine_oil_defination'), o => o.current_stock);
    const purchasedAfter = sumBy(purchases.filter(p => (p.date || '') > reportDate), qtyP);
    const usedAfter = sumBy(usage.filter(u => (u.date || '') > reportDate), qtyU);
    const purchasedOn = sumBy(purchases.filter(p => p.date === reportDate), qtyP);
    const usedOn = sumBy(usage.filter(u => u.date === reportDate), qtyU);
    const closingStock = round2(currentStock - purchasedAfter + usedAfter);
    const openingStock = round2(closingStock - purchasedOn + usedOn);

    return {
      reportNo: `DAR-${reportDate.replace(/-/g, '')}`,
      date: reportDate,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      vehicleLocations,
      vehiclesLoadedToday,
      vehiclesDecantedToday,
      advances,
      cashFueling,
      pumpSummaries,
      workshopSummary,
      pendingPayables,
      payablesTotal,
      receivablesTotal,
      oilDetails: {
        openingStock,
        purchasedStock: purchasedOn,
        usedStock: usedOn,
        totalStock: round2(openingStock + purchasedOn),
        remainingStock: closingStock
      }
    };
  }

  // Payment Voucher (payable) from a bank account. Types:
  //  'Payment'    - normal dues to vendors, workshops, fuel pumps, drivers, vehicles, personal
  //  'Advance'    - advance for a vehicle/driver's running trip (consumed in trip settlement)
  //  'Settlement' - pays the FINAL DUE of a delivered trip
  async processPaymentVoucher(voucherData) {
    return this.transaction(() => this._processPaymentVoucher(voucherData));
  }

  async _processPaymentVoucher({
    bank_id, party_category, party_name, payment_date, amount, payment_method,
    instrument_no, remarks, description, payment_type = 'Payment', trip_id = ''
  }) {
    const payAmount = round2(amount);
    if (payAmount <= 0) throw new Error('Payment voucher amount must be greater than zero.');
    if (!party_name) throw new Error('Please select a valid party / entity to make payment to.');
    if (!PAYABLE_CATEGORIES.includes(party_category)) throw new Error('Please select a valid payment category.');

    const bankObj = (this.data.bank_accounts || []).find(b => b.id === bank_id || b.bank_name === bank_id);
    if (!bankObj) throw new Error('Selected bank account was not found.');
    const available = toNum(bankObj.current_balance);
    if (available < payAmount) {
      throw new Error(`Insufficient funds in ${bankObj.bank_name}. Available: PKR ${available.toLocaleString()}, Required: PKR ${payAmount.toLocaleString()}`);
    }

    const date = payment_date || todayISO();
    let trip = null;
    let outstandingBefore = 0;
    let balanceAfter = 0;

    if (payment_type === 'Advance' || payment_type === 'Settlement') {
      if (!['Vehicles', 'Drivers'].includes(party_category)) throw new Error('Trip advances and settlements are only for vehicles and drivers.');
      trip = this._findTrip(trip_id);
      if (!trip) throw new Error('Please select the trip for this voucher.');
      const assigned = party_category === 'Vehicles' ? trip.vehicle : trip.driver;
      if (normText(assigned) !== normText(party_name)) throw new Error(`Trip ${trip.id} is not assigned to ${party_name}.`);
      const s = this.getTripSettlement(trip.id);

      if (payment_type === 'Advance') {
        if (trip.unloading_date) throw new Error(`Trip ${trip.id} is already delivered. Use Final Due Settlement instead.`);
        outstandingBefore = s.totalAdvance;              // total advance before this voucher
        balanceAfter = round2(s.totalAdvance + payAmount); // total advance after this voucher
      } else {
        if (payAmount > s.outstandingDue + 0.001) {
          throw new Error(`Amount is more than the outstanding final due of ${trip.id} (PKR ${s.outstandingDue.toLocaleString()}).`);
        }
        outstandingBefore = s.outstandingDue;
        balanceAfter = round2(s.outstandingDue - payAmount);
      }
    } else {
      const summary = this.getPartyPayableSummary(party_category, party_name);
      outstandingBefore = summary.currentPayableBalance;
      balanceAfter = Math.max(0, round2(outstandingBefore - payAmount));
    }

    bankObj.current_balance = round2(available - payAmount);
    const sourceName = `${bankObj.bank_name}${bankObj.account_number ? ` (${bankObj.account_number})` : ''}`;
    const narration = (description && description.trim()) || this.buildNarration(
      payment_type === 'Payment' ? 'payment' : payment_type.toLowerCase(),
      { party: party_name, category: party_category, trip, bank: bankObj.bank_name, instrument: instrument_no }
    );

    const voucherNo = this.generateNextID('payments', 'PV-', 'id');
    const paymentRecord = {
      id: voucherNo,
      voucher_no: voucherNo,
      date,
      payment_date: date,
      payment_source: 'Bank',
      bank_id: bankObj.id,
      bank_account: bankObj.bank_name,
      source_name: sourceName,
      party_category,
      party_name,
      payment_type,
      trip_id: trip ? trip.id : '',
      vehicle: trip ? trip.vehicle : (party_category === 'Vehicles' ? party_name : ''),
      driver: trip ? trip.driver : (party_category === 'Drivers' ? party_name : ''),
      amount: payAmount,
      outstanding_before: outstandingBefore,
      balance_after: balanceAfter,
      payment_method: payment_method || 'Bank Transfer',
      instrument_no: instrument_no || '',
      cheque_no: instrument_no || '',
      description: narration,
      remarks: remarks || '',
      status: 'Posted'
    };
    await this.insertRecord('payments', paymentRecord);

    await this.insertRecord('bank_transactions', {
      id: this.generateNextID('bank_transactions', 'TXN-', 'id'),
      date,
      transaction_type: 'Payment',
      account: bankObj.bank_name,
      bank_id: bankObj.id,
      reference_no: voucherNo,
      reference_id: voucherNo,
      party_name,
      amount: payAmount,
      description: narration,
      balance_after: bankObj.current_balance,
      status: 'Posted'
    });

    await this.insertRecord('general_ledger', {
      id: this.generateNextID('general_ledger', 'GL-', 'id'),
      date,
      voucher_type: 'Payment Voucher',
      voucher_no: voucherNo,
      source_module: 'Payment Voucher',
      reference_id: voucherNo,
      account_name: bankObj.bank_name,
      party_name,
      description: narration,
      debit: payAmount,
      credit: 0,
      amount: payAmount,
      remaining_amount: balanceAfter,
      remarks: remarks || ''
    });

    return paymentRecord;
  }

  // Receipt Voucher (receivable): customer pays into a selected bank account
  async addPaymentReceived(formData) {
    return this.transaction(() => this._addPaymentReceived(formData));
  }

  async _addPaymentReceived(formData) {
    const customer = String(formData.customer || '').trim();
    if (!customer) throw new Error('Please select the customer.');
    const amountNum = round2(formData.amount);
    if (amountNum <= 0) throw new Error('Please enter a valid amount.');
    const bankAcc = (this.data.bank_accounts || []).find(b =>
      normText(b.bank_name) === normText(formData.bank) || normText(b.id) === normText(formData.bank));
    if (!bankAcc) throw new Error('Please select the bank account that received the payment.');

    const summary = this.getPartyPayableSummary('Customers', customer);
    const receiptNo = this.generateNextID('payments_received', 'RV-', 'payment_id');
    const date = formData.date || todayISO();
    const narration = (formData.description && formData.description.trim()) ||
      this.buildNarration('receipt', { party: customer, bank: bankAcc.bank_name, instrument: formData.reference_number });

    const record = {
      id: receiptNo,
      payment_id: receiptNo,
      date,
      customer,
      party_name: customer,
      payment_method: formData.payment_method || 'Bank Transfer',
      bank: bankAcc.bank_name,
      bank_id: bankAcc.id,
      amount: amountNum,
      reference_number: formData.reference_number || '',
      cheque_no: formData.reference_number || '',
      description: narration,
      remarks: formData.remarks || '',
      outstanding_before: summary.currentPayableBalance,
      balance_after: Math.max(0, round2(summary.currentPayableBalance - amountNum))
    };
    await this.insertRecord('payments_received', record);

    bankAcc.current_balance = round2(toNum(bankAcc.current_balance) + amountNum);
    await this.insertRecord('bank_transactions', {
      id: this.generateNextID('bank_transactions', 'TXN-', 'id'),
      date,
      transaction_type: 'Deposit',
      account: bankAcc.bank_name,
      bank_id: bankAcc.id,
      reference_no: receiptNo,
      reference_id: receiptNo,
      party_name: customer,
      amount: amountNum,
      description: narration,
      balance_after: bankAcc.current_balance,
      status: 'Posted'
    });

    await this.insertRecord('payment_history', {
      id: this.generateNextID('payment_history', 'HIST-', 'id'),
      payment_id: receiptNo,
      date,
      amount: amountNum,
      type: 'Received',
      reference: formData.reference_number || receiptNo,
      remarks: narration
    });

    await this.insertRecord('general_ledger', {
      id: this.generateNextID('general_ledger', 'GL-', 'id'),
      date,
      voucher_type: 'Receipt Voucher',
      voucher_no: receiptNo,
      source_module: 'Payment Received',
      reference_id: receiptNo,
      account_name: bankAcc.bank_name,
      party_name: customer,
      description: narration,
      debit: 0,
      credit: amountNum,
      amount: amountNum,
      remaining_amount: record.balance_after,
      remarks: formData.remarks || ''
    });

    return record;
  }

  // User Management & Authentication
  getUsers() {
    return this.data.users || [];
  }

  getUserById(id) {
    return (this.data.users || []).find(u => u.id === id);
  }

  getUserByUsername(username) {
    if (!username) return null;
    return (this.data.users || []).find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  }

  authenticateUser(username, password) {
    const user = this.getUserByUsername(username);
    if (!user) {
      return { success: false, error: 'User does not exist.' };
    }
    if (user.status !== 'Active') {
      return { success: false, error: 'Account is deactivated. Please contact System Administrator.' };
    }
    const isValid = user.password?.startsWith('$2')
      ? bcrypt.compareSync(password, user.password)
      : user.password === password;
    if (!isValid) {
      return { success: false, error: 'Invalid password.' };
    }
    if (!user.password?.startsWith('$2')) {
      user.password = bcrypt.hashSync(password, 10);
      this.saveData();
    }
    return { success: true, user };
  }

  async saveUser(userData) {
    if (!this.data.users) this.data.users = [];
    const now = new Date().toISOString();

    const formattedPassword = (userData.password && typeof userData.password === 'string' && !userData.password.startsWith('$2'))
      ? bcrypt.hashSync(userData.password, 10)
      : userData.password;

    if (userData.id) {
      // Update existing user
      const idx = this.data.users.findIndex(u => u.id === userData.id);
      if (idx !== -1) {
        const passwordToUse = userData.password ? formattedPassword : this.data.users[idx].password;
        this.data.users[idx] = { ...this.data.users[idx], ...userData, password: passwordToUse, updatedAt: now };
        await this.saveData();
        return this.data.users[idx];
      }
    }

    // Insert new user
    const nextId = this.generateNextID('users', 'USR-', 'id');
    const newUser = {
      id: nextId,
      username: userData.username.trim(),
      password: formattedPassword,
      name: userData.name || userData.username,
      role: userData.role || 'Manager',
      status: userData.status || 'Active',
      permissions: userData.permissions || [],
      createdAt: now,
      updatedAt: now
    };
    this.data.users.unshift(newUser);
    await this.saveData();
    return newUser;
  }

  async deleteUser(id) {
    if (!this.data.users) return false;
    const user = this.getUserById(id);
    if (user && user.id === 'USR-001') {
      throw new Error('Root admin user cannot be deleted.');
    }
    this.data.users = this.data.users.filter(u => u.id !== id);
    await this.saveData();
    return true;
  }

  // Reset data to default seeds
  resetToDefaults() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.saveData();
    return this.data;
  }
}

export const dbService = new DatabaseService();
