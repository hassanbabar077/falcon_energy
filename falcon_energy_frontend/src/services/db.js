// SQLite / Local Persistence Data Store Engine for Falcon Energy Transport System
// Handles full offline persistence, 28 relational tables, and default seed data
import bcrypt from 'bcryptjs';

const STORAGE_KEY = 'NOOR_TRANSPORT_DB_V14';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const AUTH_TOKEN_KEY = 'noorTransport.apiToken';

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
  }

  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }
    return () => {};
  }

  notify() {
    this.listeners.forEach(fn => {
      try { fn(this.data); } catch (e) { console.error('Error in DB listener:', e); }
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
        const response = await fetch(`${API_BASE_URL}/state`, { headers: { Authorization: `Bearer ${this.token}` } });
        if (!response.ok) throw new Error('Could not load shared data');
        const payload = await response.json();
        if (payload.state) {
          this.data = payload.state;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
          this.notify();
        }
      } catch (error) {
        console.warn('Using local data because the API is unavailable:', error.message);
      }
    })();
    return this.ready;
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
        const response = await fetch(`${API_BASE_URL}/state`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` },
          body: JSON.stringify({ state: this.data })
        });

        let result = {};
        try { result = await response.json(); } catch (e) {}

        if (!response.ok || result.success === false) {
          const errMessage = result.error || result.message || `Server error (${response.status})`;
          console.error('[Database Save Failed]:', errMessage);
          throw new Error(errMessage);
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

    const codeOrId = record.code || record.id || '';
    const name = record.name || record.business_name || record.number || record.bank_name || '';

    const isMatch = (val) => {
      if (!val) return false;
      const sVal = String(val).trim().toLowerCase();
      return (codeOrId && sVal === String(codeOrId).trim().toLowerCase()) ||
             (name && sVal === String(name).trim().toLowerCase());
    };

    if (tableName === 'vehicles') {
      if (this.getTable('trips').some(t => isMatch(t.vehicle))) return 'trips (Trip Entry)';
      if (this.getTable('maintenance').some(m => isMatch(m.vehicle))) return 'maintenance entries';
      if (this.getTable('fuel_entries').some(f => isMatch(f.vehicle))) return 'fuel entries';
      if (this.getTable('engine_oil_usage').some(e => isMatch(e.vehicle))) return 'engine oil usage';
      if (this.getTable('cash_payments').some(c => isMatch(c.vehicle))) return 'cash payments';
      if (this.getTable('document_register').some(d => isMatch(d.vehicle))) return 'documents register';
      if (this.getTable('tyres_record').some(t => isMatch(t.vehicle))) return 'tyres record';
      if (this.getTable('drivers').some(d => isMatch(d.assigned_vehicle))) return 'drivers list';
    }

    if (tableName === 'transporters') {
      if (this.getTable('vehicles').some(v => isMatch(v.transporter))) return 'vehicles master';
    }

    if (tableName === 'loading_sources') {
      if (this.getTable('trips').some(t => isMatch(t.source) || isMatch(t.plant))) return 'trips (Trip Entry)';
    }

    if (tableName === 'destinations') {
      if (this.getTable('trips').some(t => isMatch(t.destination))) return 'trips (Trip Entry)';
    }

    if (tableName === 'customers') {
      if (this.getTable('trips').some(t => isMatch(t.customer))) return 'trips (Trip Entry)';
      if (this.getTable('bills_register').some(b => isMatch(b.customer))) return 'bills register';
    }

    if (tableName === 'vendors') {
      if (this.getTable('trips').some(t => isMatch(t.vendor))) return 'trips (Trip Entry)';
    }

    if (tableName === 'drivers') {
      if (this.getTable('cash_payments').some(c => isMatch(c.driver))) return 'cash payments';
    }

    if (tableName === 'workshops') {
      if (this.getTable('maintenance').some(m => isMatch(m.workshop))) return 'maintenance entries';
    }

    if (tableName === 'maintenance_heads') {
      if (this.getTable('maintenance').some(m => isMatch(m.head))) return 'maintenance entries';
    }

    if (tableName === 'fuel_pumps') {
      if (this.getTable('fuel_entries').some(f => isMatch(f.fuel_pump))) return 'fuel entries';
    }

    if (tableName === 'engine_oil_defination') {
      if (this.getTable('engine_oil_purchase').some(p => isMatch(p.oil_name))) return 'engine oil purchases';
      if (this.getTable('engine_oil_usage').some(u => isMatch(u.oil_name))) return 'engine oil usage';
    }

    if (tableName === 'tyre_brands') {
      if (this.getTable('tyres_record').some(t => isMatch(t.brand))) return 'tyre records';
    }

    if (tableName === 'bank_accounts') {
      if (this.getTable('bank_transactions').some(b => isMatch(b.account))) return 'bank transactions';
      if (this.getTable('cash_payments').some(c => isMatch(c.bank))) return 'cash payments';
      if (this.getTable('payments_received').some(p => isMatch(p.bank))) return 'payments received';
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

  // Engine Oil Stock Tracker
  updateEngineOilStock(oilName, qtyChange) {
    const list = this.data.engine_oil_defination || [];
    const item = list.find(o => o.name === oilName);
    if (item) {
      item.current_stock = Math.max(0, (item.current_stock || 0) + qtyChange);
      this.saveData();
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

  // Calculate Fuel breakdown per vehicle and trip (Opening fuel vs Additional fuel)
  getTripVehicleFuelSummary(vehicleNumber = '', tripId = '') {
    const fuelEntries = this.getTable('fuel_entries');
    
    // Sort chronologically by date and createdAt
    const sorted = [...fuelEntries].sort((a, b) => {
      const dateA = a.date || a.createdAt || '';
      const dateB = b.date || b.createdAt || '';
      return dateA.localeCompare(dateB);
    });

    const summaryMap = {}; // Key: "vehicle|trip_id"

    sorted.forEach(entry => {
      if (!entry.vehicle) return;
      const v = String(entry.vehicle).trim();
      const t = entry.trip_id ? String(entry.trip_id).trim() : 'No Trip';
      const key = `${v}|${t}`;

      const liters = parseFloat(entry.liters) || 0;
      const amount = parseFloat(entry.amount) || 0;

      if (!summaryMap[key]) {
        summaryMap[key] = {
          vehicle: v,
          trip_id: t,
          opening_liters: liters, // 1st entry is Opening / Already Available Fuel
          added_liters: 0,
          total_liters: liters,
          total_amount: amount,
          entries_count: 1,
          entries: [entry]
        };
      } else {
        summaryMap[key].added_liters += liters;
        summaryMap[key].total_liters += liters;
        summaryMap[key].total_amount += amount;
        summaryMap[key].entries_count += 1;
        summaryMap[key].entries.push(entry);
      }
    });

    let results = Object.values(summaryMap);

    if (vehicleNumber) {
      const normV = String(vehicleNumber).trim().toLowerCase();
      results = results.filter(r => r.vehicle.toLowerCase() === normV);
    }
    if (tripId) {
      const normT = String(tripId).trim().toLowerCase();
      results = results.filter(r => r.trip_id.toLowerCase() === normT);
    }

    return results;
  }

  // Record Payment Received and auto-create Payment History
  addPaymentReceived(paymentRecord) {
    const isCash = paymentRecord.payment_method === 'Cash';
    const prefix = isCash ? 'CP-' : 'BP-';
    const paymentId = this.generateNextID('payments_received', prefix, 'payment_id');
    
    const record = {
      ...paymentRecord,
      payment_id: paymentId,
      bank: isCash ? '-' : paymentRecord.bank || '-'
    };

    this.insertRecord('payments_received', record);

    // Auto trigger entry into Payment History
    const historyId = this.generateNextID('payment_history', 'PH-', 'id');
    const historyEntry = {
      id: historyId,
      payment_id: paymentId,
      date: paymentRecord.date || new Date().toISOString().split('T')[0],
      amount: parseFloat(paymentRecord.amount) || 0,
      type: 'Top Up',
      reference: isCash ? 'Cash' : 'Bank',
      remarks: paymentRecord.remarks || `Auto recorded for ${paymentId}`
    };

    this.insertRecord('payment_history', historyEntry);
    return record;
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

  // Record payment received and automatically update selected bank balance (Item 6)
  async addPaymentReceived(formData) {
    const prefix = formData.payment_method === 'Cash' ? 'CP-' : 'BP-';
    const nextId = this.generateNextID('payments_received', prefix, 'payment_id');
    const amountNum = parseFloat(formData.amount) || 0;

    const record = {
      id: nextId,
      payment_id: nextId,
      date: formData.date || new Date().toISOString().split('T')[0],
      payment_method: formData.payment_method,
      bank: formData.bank || '-',
      amount: amountNum,
      reference_number: formData.reference_number || '-',
      remarks: formData.remarks || ''
    };

    await this.insertRecord('payments_received', record);

    // Also record in payment_history
    const historyId = this.generateNextID('payment_history', 'HIST-', 'id');
    const historyRecord = {
      id: historyId,
      payment_id: nextId,
      date: record.date,
      amount: amountNum,
      type: 'Received',
      reference: formData.reference_number || record.date,
      remarks: formData.remarks || `Payment Received via ${formData.payment_method}`
    };
    await this.insertRecord('payment_history', historyRecord);

    // If Bank payment method, add amount to bank_accounts current_balance
    if (formData.payment_method === 'Bank' && formData.bank) {
      const bankAccounts = this.getTable('bank_accounts');
      const bankAcc = bankAccounts.find(b => 
        String(b.bank_name).trim().toLowerCase() === String(formData.bank).trim().toLowerCase() ||
        String(b.id).trim().toLowerCase() === String(formData.bank).trim().toLowerCase()
      );
      if (bankAcc) {
        const curBal = parseFloat(bankAcc.current_balance) || 0;
        const newBal = curBal + amountNum;
        bankAcc.current_balance = newBal;

        // Record bank transaction credit
        const txnId = this.generateNextID('bank_transactions', 'TXN-', 'id');
        const bankTxn = {
          id: txnId,
          date: record.date,
          transaction_type: 'Deposit',
          account: bankAcc.bank_name,
          bank_id: bankAcc.id,
          amount: amountNum,
          debit: 0,
          credit: amountNum,
          reference_id: nextId,
          party_name: 'Customer / Received',
          description: `Payment Received (${nextId}) into ${bankAcc.bank_name}`,
          balance_after: newBal
        };
        await this.insertRecord('bank_transactions', bankTxn);
      }
    }

    await this.saveData();
    return record;
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
  consumeVehicleOpeningFuel(vehicleNumber, tripId) {
    if (!vehicleNumber) return;
    const normV = String(vehicleNumber).trim().toLowerCase();

    // 1. Reset current fuel balance on vehicle object so it's not reused
    const vehicles = this.getTable('vehicles');
    const veh = vehicles.find(v => 
      String(v.number).trim().toLowerCase() === normV || 
      String(v.code).trim().toLowerCase() === normV
    );
    if (veh) {
      this.updateRecord('vehicles', 'code', veh.code, {
        current_fuel_liters: 0,
        current_fuel_cost: 0
      });
    }

    // 2. Link any standalone unassigned fuel entries for this vehicle to the trip as opening fuel
    const fuelEntries = this.getTable('fuel_entries');
    fuelEntries.forEach(fe => {
      const matchVeh = fe.vehicle && String(fe.vehicle).trim().toLowerCase() === normV;
      const noTrip = !fe.trip_id || fe.trip_id === '-' || String(fe.trip_id).trim() === '';
      if (matchVeh && noTrip && tripId) {
        this.updateRecord('fuel_entries', 'id', fe.id, { trip_id: tripId, is_opening_fuel: true });
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

    if (openingLiters === 0 && trip && trip.vehicle) {
      const vehFuel = this.getVehicleCurrentFuel(trip.vehicle);
      openingLiters = vehFuel.liters;
      openingCost = vehFuel.cost;
    }

    // Purchased fuel during trip (excluding pre-existing opening fuel entries)
    const fuelEntries = this.getTable('fuel_entries');
    const tripFuelEntries = fuelEntries.filter(fe => 
      fe.trip_id && String(fe.trip_id).trim().toLowerCase() === normId &&
      !fe.is_opening_fuel &&
      !(openingLiters > 0 && parseFloat(fe.liters || fe.qty) === openingLiters)
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
    const updatedTrip = await this.updateRecord('trips', 'id', trip.id, updatedTripPayload);

    // Carry forward remaining fuel & its cost as opening fuel for this vehicle's NEXT trip!
    if (trip.vehicle) {
      const normV = String(trip.vehicle).trim().toLowerCase();
      const vehicles = this.getTable('vehicles');
      const veh = vehicles.find(v => 
        String(v.number).trim().toLowerCase() === normV || 
        String(v.code).trim().toLowerCase() === normV
      );
      if (veh) {
        await this.updateRecord('vehicles', 'code', veh.code, {
          current_fuel_liters: remainingLiters,
          current_fuel_cost: remainingCost
        });
      }
    }

    return updatedTrip;
  }

  // Get distinct list of entities for a selected payment category
  getPartyListByCategory(category) {
    const namesSet = new Set();

    if (category === 'Vendors') {
      this.getTable('vendors').forEach(v => v.name && namesSet.add(v.name));
      this.getTable('tyres_record').forEach(t => t.vendor && namesSet.add(t.vendor));
      this.getTable('engine_oil_purchase').forEach(e => e.vendor && namesSet.add(e.vendor));
      this.getTable('trips').forEach(tr => tr.vendor && namesSet.add(tr.vendor));
    } else if (category === 'Workshops') {
      this.getTable('workshops').forEach(w => w.name && namesSet.add(w.name));
      this.getTable('maintenance').forEach(m => m.workshop && namesSet.add(m.workshop));
    } else if (category === 'Fuel Pumps') {
      this.getTable('fuel_pumps').forEach(f => f.name && namesSet.add(f.name));
      this.getTable('fuel_entries').forEach(fe => fe.fuel_pump && namesSet.add(fe.fuel_pump));
    } else if (category === 'Drivers') {
      this.getTable('drivers').forEach(d => d.name && namesSet.add(d.name));
    } else if (category === 'Personal Expenses' || category === 'Personal Expense') {
      namesSet.add('Personal Expense');
      namesSet.add('Director Expense / Salary');
      namesSet.add('Office Petty Cash / Misc');
      namesSet.add('Staff Expenses');
      this.getTable('cash_payments').forEach(c => c.category === 'Personal Expense' && c.paid_to && namesSet.add(c.paid_to));
    } else if (category === 'Vehicles') {
      this.getTable('vehicles').forEach(v => v.number && namesSet.add(v.number));
      this.getTable('transporters').forEach(t => t.name && namesSet.add(t.name));
    } else if (category === 'Tyres') {
      this.getTable('tyre_brands').forEach(b => b.brand_name && namesSet.add(b.brand_name));
      this.getTable('tyres_record').forEach(t => t.vendor && namesSet.add(t.vendor));
    }

    return Array.from(namesSet).filter(Boolean).sort();
  }

  // Get total accrued cost, total paid, net current payable balance, and entry references for a party
  getPartyPayableSummary(category, partyInput) {
    if (!partyInput) {
      return { totalAccruedCost: 0, totalPaidAmount: 0, currentPayableBalance: 0, entries: [] };
    }

    // 1. Build comprehensive set of target match strings (lowercased)
    const matchTargets = new Set();
    const addTarget = (str) => {
      if (str !== null && str !== undefined && String(str).trim() !== '' && String(str).trim() !== '-') {
        matchTargets.add(String(str).trim().toLowerCase());
      }
    };

    if (typeof partyInput === 'object') {
      addTarget(partyInput.id);
      addTarget(partyInput.code);
      addTarget(partyInput.name);
      addTarget(partyInput.business_name);
      addTarget(partyInput.number);
      addTarget(partyInput.tanker_number);
    } else {
      const pStr = String(partyInput).trim();
      addTarget(pStr);

      // Search all master tables to find associated ID or Business Name if string was passed
      const masterTables = ['vendors', 'workshops', 'fuel_pumps', 'transporters', 'vehicles', 'customers', 'drivers'];
      const normInput = pStr.toLowerCase();

      masterTables.forEach(tName => {
        (this.getTable(tName) || []).forEach(item => {
          const itemID = String(item.id || item.code || '').toLowerCase();
          const itemName = String(item.name || item.business_name || item.number || '').toLowerCase();
          if (itemID === normInput || itemName === normInput || (normInput.length >= 3 && (itemName.includes(normInput) || normInput.includes(itemName)))) {
            addTarget(item.id);
            addTarget(item.code);
            addTarget(item.name);
            addTarget(item.business_name);
            addTarget(item.number);
            addTarget(item.tanker_number);
          }
        });
      });
    }

    const targetList = Array.from(matchTargets);

    const isMatch = (val) => {
      if (!val || val === '-' || val === 'Pending') return false;
      const sVal = String(val).trim().toLowerCase();
      for (const target of targetList) {
        if (sVal === target) return true;
        if (sVal.length >= 3 && target.length >= 3) {
          if (sVal.includes(target) || target.includes(sVal)) return true;
        }
      }
      return false;
    };

    const entries = [];
    let totalAccrued = 0;

    // 1. Tyre Purchases
    this.getTable('tyres_record').forEach(t => {
      if (isMatch(t.vendor) || isMatch(t.brand) || (category === 'Vehicles' && isMatch(t.vehicle))) {
        const total = parseFloat(t.total_amount || t.amount || t.cost) || 0;
        totalAccrued += total;
        entries.push({
          id: `TYR-${t.id}`,
          date: t.purchase_date || t.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          description: `Tyre Purchase (${t.brand || ''} - ${t.tyre_number || ''})`,
          total_amount: total
        });
      }
    });

    // 2. Maintenance & Workshop Entries
    this.getTable('maintenance').forEach(m => {
      if (isMatch(m.workshop) || isMatch(m.vendor) || (category === 'Vehicles' && (isMatch(m.vehicle) || isMatch(m.tanker_number)))) {
        const total = parseFloat(m.total_amount || m.amount || m.cost) || 0;
        totalAccrued += total;
        entries.push({
          id: `MIN-${m.id}`,
          date: m.date || new Date().toISOString().split('T')[0],
          description: `Maintenance (${m.head || 'Service'} - ${m.vehicle || m.tanker_number || ''})`,
          total_amount: total
        });
      }
    });

    // 3. Fuel Entries
    this.getTable('fuel_entries').forEach(f => {
      if (isMatch(f.fuel_pump) || isMatch(f.vendor) || (category === 'Vehicles' && isMatch(f.vehicle))) {
        const total = parseFloat(f.amount || f.total_amount || f.total_cost) || 0;
        const liters = f.liters ? `${f.liters}L` : 'Fuel';
        const veh = f.vehicle ? ` (${f.vehicle})` : '';
        const rate = f.rate ? ` @ PKR ${f.rate}/L` : '';
        totalAccrued += total;
        entries.push({
          id: `FE-${f.id}`,
          date: f.date || new Date().toISOString().split('T')[0],
          description: `Fuel Fill ${liters}${veh}${rate}`,
          total_amount: total
        });
      }
    });

    // 4. Engine Oil Purchases
    this.getTable('engine_oil_purchase').forEach(o => {
      if (isMatch(o.vendor) || isMatch(o.supplier)) {
        const total = parseFloat(o.amount || o.total_amount || o.total_cost) || 0;
        totalAccrued += total;
        entries.push({
          id: `ENO-${o.id}`,
          date: o.date || new Date().toISOString().split('T')[0],
          description: `Engine Oil Purchase (${o.oil_name} - Qty ${o.quantity})`,
          total_amount: total
        });
      }
    });

    // 5. Trips Freight & Subcontractor Costs
    this.getTable('trips').forEach(tr => {
      if (isMatch(tr.vendor) || isMatch(tr.transporter) || isMatch(tr.customer) || (category === 'Vehicles' && isMatch(tr.vehicle))) {
        const total = parseFloat(tr.total_cost || tr.amount || tr.freight_amount) || 0;
        if (total > 0) {
          totalAccrued += total;
          entries.push({
            id: `TRP-${tr.id}`,
            date: tr.loading_date || new Date().toISOString().split('T')[0],
            description: `Trip Freight (${tr.vehicle || ''} - ${tr.source} to ${tr.destination})`,
            total_amount: total
          });
        }
      }
    });

    // Compute Total Vouchers Paid to this Party across payments and cash_payments
    const vouchers = this.getTable('payments').filter(p => isMatch(p.party_name) || isMatch(p.paid_to) || isMatch(p.party_id));
    const totalVouchersPaid = vouchers.reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0);

    const cashPayments = this.getTable('cash_payments').filter(c => isMatch(c.paid_to) || isMatch(c.party_name));
    const totalCashPaid = cashPayments.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

    const grandTotalPaid = totalVouchersPaid + totalCashPaid;

    // Current Outstanding Balance against Party
    const currentPayableBalance = Math.max(0, totalAccrued - grandTotalPaid);

    return {
      totalAccruedCost: totalAccrued,
      totalPaidAmount: grandTotalPaid,
      currentPayableBalance: currentPayableBalance,
      pendingItems: entries, // Entry reference list showing total amount
      entries: entries
    };
  }

  // Get Party-centric pending payables overview list across all categories
  getPendingPayables() {
    const categories = ['Vendors', 'Workshops', 'Fuel Pumps', 'Drivers', 'Vehicles'];
    const payablesList = [];

    categories.forEach(cat => {
      const parties = this.getPartyListByCategory(cat);
      parties.forEach(partyName => {
        const summary = this.getPartyPayableSummary(cat, partyName);
        if (summary.currentPayableBalance > 0) {
          payablesList.push({
            id: `PAY-${partyName}`,
            reference_id: `PARTY-${partyName}`,
            date: new Date().toISOString().split('T')[0],
            party_type: cat.slice(0, -1), // e.g. Vendor, Workshop, Fuel Pump
            party_name: partyName,
            description: `Accumulated balance across ${summary.entries.length} entry record(s)`,
            total_amount: summary.totalAccruedCost,
            paid_amount: summary.totalPaidAmount,
            remaining_amount: summary.currentPayableBalance,
            payment_status: summary.totalPaidAmount > 0 ? 'In Process' : 'Pending'
          });
        }
      });
    });

    return payablesList;
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

  // Detailed Trip Expense & Fuel Settlement Engine (Urdu 1671 JW Excel Sheet Structure)
  getDetailedTripSheet(vehicleInput = '', tripInput = '') {
    const trips = this.getTable('trips');
    const cashPayments = this.getTable('cash_payments');
    const fuelEntries = this.getTable('fuel_entries');
    const maintenance = this.getTable('maintenance');

    const vehicleFilter = String(vehicleInput || '').trim().toLowerCase();
    const tripFilter = String(tripInput || '').trim().toLowerCase();

    // Find requested trip
    let trip = null;

    if (tripFilter) {
      // 1. Specific Trip Filter matched by ID, Voucher, or Trip Number
      trip = trips.find(t => 
        String(t.id || t.trip_id || t.voucher_no || '').toLowerCase() === tripFilter ||
        String(t.id || t.trip_id || '').toLowerCase().includes(tripFilter)
      );
    }

    if (!trip && vehicleFilter) {
      // 2. Filter latest trip matching selected vehicle
      const vehicleTrips = trips.filter(t => 
        String(t.vehicle || t.vehicle_no || '').toLowerCase().includes(vehicleFilter)
      );
      if (vehicleTrips.length > 0) {
        trip = vehicleTrips[vehicleTrips.length - 1]; // Latest trip for this vehicle
      }
    }

    // Default fallback to latest trip overall if no specific match found
    if (!trip && trips.length > 0) {
      trip = trips[trips.length - 1];
    }

    if (!trip) {
      return null;
    }

    const currentTripId = trip.id || trip.trip_id;
    const vehicleNo = trip.vehicle || trip.vehicle_no || (vehicleInput || 'Vehicle N/A');
    const driverName = trip.driver || trip.driver_name || 'Driver N/A';

    // 1. Diesel Calculations
    let openingFuelQty = parseFloat(trip.opening_fuel_liters || trip.opening_fuel_ltr || trip.previous_fuel) || 0;
    let openingFuelCost = parseFloat(trip.opening_fuel_cost) || (openingFuelQty * (parseFloat(trip.fuel_rate) || 0));

    if (openingFuelQty === 0 && vehicleNo) {
      const vehFuel = this.getVehicleCurrentFuel(vehicleNo);
      openingFuelQty = vehFuel.liters;
      openingFuelCost = vehFuel.cost;
    }

    // Fuel entries specifically purchased during this trip (excluding pre-existing opening fuel entries)
    const tripFuel = fuelEntries.filter(f => 
      f && f.trip_id && String(f.trip_id).trim() === String(currentTripId).trim() &&
      !f.is_opening_fuel &&
      !(openingFuelQty > 0 && parseFloat(f.liters || f.qty) === openingFuelQty)
    );

    let cashFuelQty = 0;
    let cashFuelAmt = 0;
    let creditFuelQty = 0;
    let creditFuelAmt = 0;
    let fuelPumpsUsed = [];

    tripFuel.forEach(f => {
      const qty = parseFloat(f.qty || f.liters || f.fuel_qty) || 0;
      const amt = parseFloat(f.amount || f.total_amount) || 0;
      const pump = f.fuel_pump || f.pump_name || f.vendor || '';
      if (pump && !fuelPumpsUsed.includes(pump)) {
        fuelPumpsUsed.push(pump);
      }
      if (f.payment_method === 'Cash' || f.payment_type === 'Cash') {
        cashFuelQty += qty;
        cashFuelAmt += amt;
      } else {
        creditFuelQty += qty;
        creditFuelAmt += amt;
      }
    });

    const totalFuelQty = openingFuelQty + cashFuelQty + creditFuelQty;
    const totalFuelAmt = openingFuelCost + cashFuelAmt + creditFuelAmt;

    const remainingFuelQty = parseFloat(trip.remaining_fuel_liters) || 0;
    const avgRate = totalFuelQty > 0 ? (totalFuelAmt / totalFuelQty) : 0;
    const remainingFuelAmt = parseFloat(trip.remaining_fuel_cost) || (remainingFuelQty * avgRate);

    const consumedFuelQty = Math.max(0, totalFuelQty - remainingFuelQty);
    const consumedFuelAmt = Math.max(0, totalFuelAmt - remainingFuelAmt);

    // 2. Travel & Route Metrics
    const routeName = trip.route || (trip.source && trip.destination ? `${trip.source} to ${trip.destination}` : 'N/A');
    const totalKm = parseFloat(trip.total_km || trip.km_reading || trip.distance) || 0;
    const totalDays = parseFloat(trip.total_days || trip.duration) || 0;
    const startDate = trip.loading_date || trip.date || '-';
    const endDate = trip.unloading_date || trip.delivery_date || '-';
    const fuelAverageKml = consumedFuelQty > 0 ? (totalKm / consumedFuelQty).toFixed(2) : '0.00';

    // 3. Driver Advances
    const advanceAmount = parseFloat(trip.advance_paid || trip.driver_advance || trip.advance_cash || trip.advance) || 0;
    const advanceBreakdown = Array.isArray(trip.advance_breakdown) ? trip.advance_breakdown : (advanceAmount > 0 ? [{ source: 'Advance Cash', amount: advanceAmount }] : []);

    // 4. Trip Expenses & Journal
    // Find cash expenses linked to vehicle or trip
    const tripCashPayments = cashPayments.filter(cp => 
      (cp.trip_id && String(cp.trip_id) === String(currentTripId)) ||
      (cp.vehicle === vehicleNo || cp.driver === driverName)
    );

    // Dynamic expense mapping from trip fields & cash payments
    let foodExpense = parseFloat(trip.food_expense || trip.roti_expense) || 0;
    let tollTax = parseFloat(trip.toll_tax || trip.toll) || 0;
    let otherExpenses = parseFloat(trip.other_expenses || trip.challan || trip.misc_expense || trip.fine_amount) || 0;
    let trafficFine = parseFloat(trip.traffic_fine || trip.fine) || 0;
    let workshopRepair = parseFloat(trip.workshop_repair || trip.repair_cost) || 0;
    let loadingCharge = parseFloat(trip.loading_charge || trip.loading_cost) || 0;
    let kandaScale = parseFloat(trip.kanda_scale || trip.weighbridge_cost) || 0;
    let munshiana = parseFloat(trip.munshiana) || 0;

    // Daily Journal / Sub Expenses directly calculated from trip or cash payments
    const journalExpenses = [
      { sr: 1, title: 'Tyre Expense', amount: parseFloat(trip.tyre_expense) || 0 },
      { sr: 2, title: 'Traffic Police', amount: parseFloat(trip.traffic_police) || 0 },
      { sr: 3, title: 'Custom Police', amount: parseFloat(trip.custom_police) || 0 },
      { sr: 4, title: 'Excise Police', amount: parseFloat(trip.excise_police) || 0 },
      { sr: 5, title: 'Sindh Police', amount: parseFloat(trip.sindh_police) || 0 },
      { sr: 6, title: 'Service & Grease', amount: parseFloat(trip.service_grease) || 0 },
      { sr: 7, title: 'Washing & Net Filter', amount: parseFloat(trip.washing_filter) || 0 },
      { sr: 8, title: 'Secretary Challan', amount: parseFloat(trip.secretary_challan) || 0 },
      { sr: 9, title: 'Security Guard / Chowkidar', amount: parseFloat(trip.security_guard) || 0 },
      { sr: 10, title: 'Weighbridge Deduction', amount: parseFloat(trip.weighbridge_deduction) || 0 },
      { sr: 11, title: 'Driver Salary & Wages', amount: parseFloat(trip.driver_salary || trip.salary) || 0 },
      { sr: 12, title: 'Other Minor Expenses', amount: parseFloat(trip.minor_expenses) || 0 },
      { sr: 13, title: 'Scale Vehicle Fee', amount: parseFloat(trip.scale_fee) || 0 },
      { sr: 14, title: 'Rickshaw / Local Rent', amount: parseFloat(trip.rickshaw_rent) || 0 }
    ];

    let totalSubExpenses = journalExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);

    let totalExpensesExclDiesel = foodExpense + tollTax + otherExpenses + trafficFine + cashFuelAmt + workshopRepair + loadingCharge + kandaScale + munshiana + totalSubExpenses;

    const totalTripCostWithDiesel = totalExpensesExclDiesel + consumedFuelAmt;

    // 5. Trip Net Settlement
    const totalTripExpenseForDriver = parseFloat(trip.total_driver_expense || trip.driver_expenses) || totalExpensesExclDiesel;
    const currentTripBalance = advanceAmount - totalTripExpenseForDriver;
    const previousBalance = parseFloat(trip.previous_balance) || 0;
    const finalVehicleBalance = currentTripBalance + previousBalance;

    // 6. Loading & Weight Details
    const loadingPlant = trip.source || 'N/A';
    const unloadingPlant = trip.destination || 'N/A';
    const loadedWeight = parseFloat(trip.load_weight || trip.loaded_weight_kg || trip.loading_weight) || 0;
    const unloadedWeight = parseFloat(trip.unload_weight || trip.unloaded_weight_kg || trip.unloading_weight) || 0;
    const weightDifference = trip.difference !== undefined ? trip.difference : (loadedWeight > 0 && unloadedWeight > 0 ? parseFloat((unloadedWeight - loadedWeight).toFixed(2)) : 0);
    const loadPressure = parseFloat(trip.load_pressure || trip.load_pressure_psi) || 0;
    const unloadPressure = parseFloat(trip.unload_pressure || trip.unload_pressure_psi) || 0;

    return {
      tripId: currentTripId,
      vehicleNo,
      driverName,
      dates: { startDate, endDate, totalDays },
      route: { name: routeName, distanceKm: totalKm, averageKml: fuelAverageKml },
      diesel: {
        openingQty: openingFuelQty, openingAmt: openingFuelCost,
        cashQty: cashFuelQty, cashAmt: cashFuelAmt,
        creditQty: creditFuelQty, creditAmt: creditFuelAmt,
        totalQty: totalFuelQty, totalAmt: totalFuelAmt,
        consumedQty: consumedFuelQty, consumedAmt: consumedFuelAmt,
        remainingQty: remainingFuelQty, remainingAmt: remainingFuelAmt,
        fuelPumps: fuelPumpsUsed.length > 0 ? fuelPumpsUsed.join(', ') : 'N/A'
      },
      summary: {
        advanceReceived: advanceAmount,
        totalExpenses: totalTripExpenseForDriver,
        currentTripBalance: currentTripBalance,
        previousBalance: previousBalance,
        finalBalanceDue: finalVehicleBalance
      },
      loading: {
        loadingPlant, unloadingPlant,
        loadedWeight, unloadedWeight,
        weightDifference, loadPressure, unloadPressure
      },
      advancesList: advanceBreakdown,
      expensesBreakdown: {
        foodExpense, tollTax, otherExpenses, trafficFine,
        cashFuelAmt, workshopRepair, loadingCharge, kandaScale, munshiana,
        totalSubExpenses, totalExpensesExclDiesel, totalTripCostWithDiesel
      },
      journalExpenses
    };
  }

  // Double-Entry Bank & Cash Ledger Generator
  getBankLedger(accountInput, fromDate = '', toDate = '') {
    const bankAccounts = this.getTable('bank_accounts');
    let targetAccount = null;

    if (typeof accountInput === 'object') {
      targetAccount = accountInput;
    } else if (accountInput) {
      const q = String(accountInput).trim().toLowerCase();
      targetAccount = bankAccounts.find(b => 
        String(b.id || '').toLowerCase() === q ||
        String(b.bank_name || '').toLowerCase() === q ||
        String(b.account_title || '').toLowerCase() === q ||
        String(b.account_number || '').toLowerCase() === q ||
        String(b.bank_name || '').toLowerCase().includes(q)
      );
    }

    let initialOpeningBalance = targetAccount ? (parseFloat(targetAccount.opening_balance) || 0) : 0;
    const accountName = targetAccount ? (targetAccount.bank_name || targetAccount.account_title) : String(accountInput || '');

    const isMatch = (val) => {
      if (!val) return false;
      const sVal = String(val).trim().toLowerCase();
      if (!targetAccount && !accountInput) return true;
      const candidates = [
        targetAccount?.id, targetAccount?.bank_name, targetAccount?.account_title, targetAccount?.account_number, accountName, accountInput
      ].filter(Boolean).map(s => String(s).trim().toLowerCase());

      return candidates.some(c => sVal === c || sVal.includes(c) || c.includes(sVal));
    };

    const rawTxns = [];

    // Bank Transactions table
    this.getTable('bank_transactions').forEach(bt => {
      if (isMatch(bt.account) || isMatch(bt.bank_name) || isMatch(bt.account_number)) {
        const type = bt.type || bt.transaction_type || 'Deposit';
        const isDebit = type === 'Deposit' || type === 'Transfer In';
        const amt = parseFloat(bt.amount) || 0;
        rawTxns.push({
          date: bt.date || bt.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          ref: bt.reference_no || bt.id || 'BT-TXN',
          description: bt.description || bt.remarks || `Bank ${type}`,
          dr: isDebit ? amt : 0,
          cr: isDebit ? 0 : amt
        });
      }
    });

    // Payment Vouchers Issued (Payments out -> Credit / Cr)
    this.getTable('payments').forEach(p => {
      if (isMatch(p.bank_account) || isMatch(p.bank) || isMatch(p.account) || p.payment_mode === 'Bank' || !accountInput) {
        const amt = parseFloat(p.amount) || 0;
        rawTxns.push({
          date: p.payment_date || p.date || p.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          ref: p.id || p.voucher_no || 'PAY-VCH',
          description: `Payment to ${p.party_name || p.paid_to || 'Party'} (${p.category || 'Expense'}) - ${p.remarks || ''}`,
          dr: 0,
          cr: amt
        });
      }
    });

    // Cash Payments / Vouchers
    if (!accountInput || accountName.toLowerCase().includes('cash')) {
      this.getTable('cash_payments').forEach(cp => {
        const amt = parseFloat(cp.amount) || 0;
        rawTxns.push({
          date: cp.date || cp.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          ref: cp.id || 'CASH-VCH',
          description: `Cash Payment to ${cp.paid_to || cp.party_name || 'Party'} (${cp.head || cp.category || 'Expense'})`,
          dr: 0,
          cr: amt
        });
      });
    }

    // Customer Payments Received (Deposits -> Debit / Dr)
    this.getTable('payments_received').forEach(pr => {
      if (isMatch(pr.bank) || isMatch(pr.account) || isMatch(pr.bank_account) || !accountInput) {
        const amt = parseFloat(pr.amount) || 0;
        rawTxns.push({
          date: pr.date || pr.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          ref: pr.id || 'REC-VCH',
          description: `Payment Received from ${pr.customer || pr.party_name || 'Customer'} - ${pr.remarks || ''}`,
          dr: amt,
          cr: 0
        });
      }
    });

    rawTxns.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    let openingBalance = initialOpeningBalance;
    const periodTxns = [];

    rawTxns.forEach(t => {
      if (fromDate && t.date < fromDate) {
        openingBalance += (t.dr - t.cr);
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
      currentBal += (t.dr - t.cr);
      ledgerRows.push({
        ...t,
        balance: currentBal
      });
    });

    return {
      accountName: accountName || 'All Bank Accounts',
      openingBalance: openingBalance,
      closingBalance: currentBal,
      totalDr: periodTxns.reduce((s, x) => s + x.dr, 0),
      totalCr: periodTxns.reduce((s, x) => s + x.cr, 0),
      rows: ledgerRows
    };
  }

  // Double-Entry Party General Ledger Generator (Vendors, Workshops, Fuel Pumps, Transporters, Customers)
  getPartyLedger(partyCategory, partyInput, fromDate = '', toDate = '') {
    const summary = this.getPartyPayableSummary(partyCategory, partyInput);
    const rawTxns = [];

    // Accrued Liabilities -> Credit (Cr)
    (summary.entries || []).forEach(e => {
      rawTxns.push({
        date: e.date,
        ref: e.id,
        description: e.description,
        dr: 0,
        cr: parseFloat(e.total_amount) || 0
      });
    });

    const normInput = typeof partyInput === 'object' ? (partyInput.name || partyInput.business_name) : partyInput;
    const isMatch = (val) => {
      if (!val) return false;
      const sVal = String(val).trim().toLowerCase();
      const pVal = String(normInput || '').trim().toLowerCase();
      return sVal === pVal || sVal.includes(pVal) || pVal.includes(sVal);
    };

    // Payment Vouchers Issued (Settlements -> Debit / Dr)
    this.getTable('payments').forEach(p => {
      if (isMatch(p.party_name) || isMatch(p.paid_to) || isMatch(p.party_id)) {
        const amt = parseFloat(p.amount) || 0;
        rawTxns.push({
          date: p.payment_date || p.date || p.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          ref: p.id || 'PAY-VCH',
          description: `Payment Voucher Issued (${p.payment_mode || 'Bank'} - ${p.bank || ''}) - ${p.remarks || ''}`,
          dr: amt,
          cr: 0
        });
      }
    });

    // Cash Payments (Settlements -> Debit / Dr)
    this.getTable('cash_payments').forEach(c => {
      if (isMatch(c.paid_to) || isMatch(c.party_name)) {
        const amt = parseFloat(c.amount) || 0;
        rawTxns.push({
          date: c.date || c.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          ref: c.id || 'CSH-VCH',
          description: `Cash Payment Issued (${c.head || 'Expense'}) - ${c.remarks || ''}`,
          dr: amt,
          cr: 0
        });
      }
    });

    rawTxns.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    let openingBalance = 0;
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
      partyName: normInput || 'All Parties',
      partyCategory: partyCategory,
      openingBalance: openingBalance,
      closingBalance: currentBal,
      totalDr: periodTxns.reduce((s, x) => s + x.dr, 0),
      totalCr: periodTxns.reduce((s, x) => s + x.cr, 0),
      rows: ledgerRows
    };
  }

  // Universal General Ledger combining all bank, cash, vendor, workshop, fuel pump, transporter & customer ledgers
  getUniversalLedger(fromDate = '', toDate = '', filterCategory = '', filterParty = '') {
    const rawTxns = [];

    // Bank & Cash Ledgers
    const bankAccounts = this.getTable('bank_accounts');
    bankAccounts.forEach(acc => {
      if (filterCategory && filterCategory !== 'Bank' && filterCategory !== 'Cash') return;
      const bLedger = this.getBankLedger(acc, fromDate, toDate);
      (bLedger.rows || []).forEach(r => {
        if (!r.isOpening) {
          rawTxns.push({
            date: r.date,
            ref: r.ref,
            category: acc.bank_name?.toLowerCase().includes('cash') ? 'Cash' : 'Bank',
            party: acc.bank_name || acc.account_title,
            description: r.description,
            dr: r.dr,
            cr: r.cr
          });
        }
      });
    });

    // Party Ledgers
    const categories = ['Vendors', 'Workshops', 'Fuel Pumps', 'Transporters', 'Customers'];
    categories.forEach(cat => {
      if (filterCategory && filterCategory !== cat) return;
      const pLedger = this.getPartyLedger(cat, filterParty, fromDate, toDate);
      (pLedger.rows || []).forEach(r => {
        if (!r.isOpening) {
          rawTxns.push({
            date: r.date,
            ref: r.ref,
            category: cat,
            party: pLedger.partyName || cat,
            description: r.description,
            dr: r.dr,
            cr: r.cr
          });
        }
      });
    });

    // Sort chronologically
    rawTxns.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    let currentBal = 0;
    const ledgerRows = [];

    rawTxns.forEach(t => {
      currentBal += (t.dr - t.cr);
      ledgerRows.push({
        ...t,
        balance: currentBal
      });
    });

    return {
      title: 'Universal General Ledger',
      totalDr: ledgerRows.reduce((s, x) => s + x.dr, 0),
      totalCr: ledgerRows.reduce((s, x) => s + x.cr, 0),
      rows: ledgerRows
    };
  }

  // Daily Activity Executive Report Data Aggregator
  getDailyActivityReport(reportDate = new Date().toISOString().split('T')[0]) {
    const vehicles = this.getTable('vehicles');
    const trips = this.getTable('trips');
    const fuelEntries = this.getTable('fuel_entries');
    const cashPayments = this.getTable('cash_payments');
    const maintenance = this.getTable('maintenance');
    const fuelPumps = this.getTable('fuel_pumps');
    const workshops = this.getTable('workshops');
    const oilPurchases = this.getTable('engine_oil_purchase');
    const oilUsage = this.getTable('engine_oil_usage');
    const oilDef = this.getTable('engine_oil_defination');

    // 1. Vehicle Locations Snapshot
    const vehicleLocations = vehicles.map(v => {
      // Find latest trip active or delivered
      const activeTrip = trips.find(t => t.vehicle === v.number && (t.status === 'Dispatched' || t.status === 'In Transit'));
      return {
        number: v.number,
        location: activeTrip ? (activeTrip.destination || activeTrip.source || 'En Route') : (v.location || 'Yard / Base'),
        status: activeTrip ? 'Load' : (v.status || 'Empty')
      };
    });

    // 2. Vehicles Loaded Today & Decanted Today
    const vehiclesLoadedToday = trips.filter(t => t.loading_date === reportDate).map(t => ({
      number: t.vehicle,
      location: t.destination || t.source || '-',
      psi: t.load_pressure || '-'
    }));

    const vehiclesDecantedToday = trips.filter(t => t.unloading_date === reportDate).map(t => ({
      number: t.vehicle,
      location: t.destination || '-',
      psi: t.unload_pressure || '-'
    }));

    // 3. Advances From Plants / By Umair
    const advances = cashPayments.filter(c => c.date === reportDate && (c.head?.toLowerCase().includes('advance') || c.category === 'Advances')).map(c => ({
      vehicle: c.vehicle || '-',
      plant: c.head || 'Plant Advance',
      amount: parseFloat(c.amount) || 0
    }));

    // 4. Cash Fueling / Other Expenses
    const cashFueling = cashPayments.filter(c => c.date === reportDate && (c.head?.toLowerCase().includes('fuel') || c.head?.toLowerCase().includes('expense'))).map(c => ({
      vehicle: c.vehicle || '-',
      qty: c.liters || '-',
      amount: parseFloat(c.amount) || 0,
      paidBy: c.paid_by || c.bank || 'Cash'
    }));

    // 5. Fuel Pump Credit Ledgers (Saqib Pump / Active Pumps)
    const pumpSummaries = fuelPumps.slice(0, 3).map((pump, idx) => {
      const pLedger = this.getPartyLedger('Fuel Pumps', pump.name, '', reportDate);
      return {
        pumpName: `${pump.name} ( Pump ${idx + 1} )`,
        openingCr: pLedger.openingBalance || 0,
        paymentsThisDate: pLedger.rows.filter(r => r.date === reportDate && r.dr > 0).map(r => ({
          vehicle: r.ref || r.description?.split(' ')[0] || '-',
          dr: r.dr
        })),
        totalDr: pLedger.totalDr,
        totalCr: pLedger.totalCr,
        closingBalance: pLedger.closingBalance
      };
    });

    // 6. Workshop Details
    const workshopSummary = workshops.map(w => {
      const wLedger = this.getPartyLedger('Workshops', w.name, '', reportDate);
      return {
        name: w.name,
        previousAmount: wLedger.openingBalance || 0,
        paid: wLedger.totalDr || 0,
        remaining: wLedger.closingBalance || 0,
        paidBy: 'Bank/Cash'
      };
    });

    // 7. Payables Amounts Total
    const pendingPayables = this.getPendingPayables();
    const payablesTotal = pendingPayables.reduce((s, x) => s + x.remaining_amount, 0);

    // 8. Mobil Oil Details
    const totalOilPurchased = oilPurchases.reduce((s, x) => s + (parseFloat(x.quantity_liters) || 0), 0);
    const totalOilUsed = oilUsage.reduce((s, x) => s + (parseFloat(x.quantity_used) || 0), 0);
    const oilOpeningStock = 258; // Current baseline
    const oilRemainingStock = oilOpeningStock + totalOilPurchased - totalOilUsed;

    return {
      reportNo: '220',
      date: reportDate,
      time: '7:00 AM',
      vehicleLocations,
      vehiclesLoadedToday,
      vehiclesDecantedToday,
      advances,
      cashFueling,
      pumpSummaries,
      workshopSummary,
      pendingPayables,
      payablesTotal,
      oilDetails: {
        openingStock: oilOpeningStock,
        purchasedStock: totalOilPurchased,
        totalStock: oilOpeningStock + totalOilPurchased,
        remainingStock: oilRemainingStock
      }
    };
  }

  // Process Unified Payment Voucher against Party Balance
  async processPaymentVoucher({
    payment_source, // 'Bank' or 'Cash'
    bank_id,
    cash_id,
    party_category,
    party_name,
    payment_date,
    amount,
    payment_method,
    instrument_no,
    remarks
  }) {
    const payAmount = parseFloat(amount) || 0;
    if (payAmount <= 0) {
      throw new Error("Payment voucher amount must be greater than zero.");
    }
    if (!party_name) {
      throw new Error("Please select a valid party / entity to make payment to.");
    }

    let sourceName = 'Cash Account';
    let bankObj = null;

    // 1. Source Account Balance Deductions
    if (payment_source === 'Bank') {
      const banks = this.getTable('bank_accounts');
      bankObj = banks.find(b => b.id === bank_id || b.bank_name === bank_id);
      if (!bankObj) {
        throw new Error("Selected bank account was not found.");
      }

      const available = parseFloat(bankObj.current_balance) || 0;
      if (available < payAmount) {
        throw new Error(`Insufficient funds in ${bankObj.bank_name}. Available balance: PKR ${available.toLocaleString()}, Required: PKR ${payAmount.toLocaleString()}`);
      }

      bankObj.current_balance = available - payAmount;
      sourceName = `${bankObj.bank_name} (${bankObj.account_number || ''})`;
    } else {
      sourceName = 'Cash Account';
      // Record cash payment ledger entry
      const cashTxnId = this.generateNextID('cash_payments', 'CP-', 'id');
      await this.insertRecord('cash_payments', {
        id: cashTxnId,
        date: payment_date || new Date().toISOString().split('T')[0],
        category: party_category,
        paid_to: party_name,
        amount: payAmount,
        remarks: remarks || `Payment Voucher to ${party_name}`
      });
    }

    // 2. Fetch Outstanding Summary for Party
    const partySummary = this.getPartyPayableSummary(party_category, party_name);
    const outstandingBefore = partySummary.currentPayableBalance;
    const balanceAfter = Math.max(0, outstandingBefore - payAmount);

    // 3. Generate Voucher Record
    const voucherNo = this.generateNextID('payments', 'PV-', 'id');
    const paymentRecord = {
      id: voucherNo,
      voucher_no: voucherNo,
      date: payment_date || new Date().toISOString().split('T')[0],
      payment_source: payment_source,
      bank_id: bankObj ? bankObj.id : null,
      source_name: sourceName,
      party_category: party_category,
      party_name: party_name,
      amount: payAmount,
      outstanding_before: outstandingBefore,
      balance_after: balanceAfter,
      payment_method: payment_method || (payment_source === 'Bank' ? 'Bank Transfer' : 'Cash'),
      instrument_no: instrument_no || '',
      remarks: remarks || '',
      createdAt: new Date().toISOString()
    };

    await this.insertRecord('payments', paymentRecord);

    // 4. Record Bank Transaction Entry (if Bank source)
    if (payment_source === 'Bank' && bankObj) {
      const txnId = this.generateNextID('bank_transactions', 'TXN-', 'id');
      const bankTxn = {
        id: txnId,
        date: payment_date || new Date().toISOString().split('T')[0],
        transaction_type: 'Payment',
        account: bankObj.bank_name,
        bank_id: bankObj.id,
        amount: payAmount,
        debit: payAmount,
        credit: 0,
        reference_id: voucherNo,
        paid_to: party_name,
        description: `Payment Voucher ${voucherNo} to ${party_name} (${party_category})`,
        balance_after: bankObj.current_balance
      };
      await this.insertRecord('bank_transactions', bankTxn);
    }

    // 5. Record General Ledger Entry against Party
    const glId = this.generateNextID('general_ledger', 'GL-', 'id');
    const glRecord = {
      id: glId,
      date: payment_date || new Date().toISOString().split('T')[0],
      source_module: 'Payment Voucher',
      reference_id: voucherNo,
      party_name: party_name,
      amount: payAmount,
      paid_amount: payAmount,
      remaining_amount: balanceAfter,
      payment_status: balanceAfter === 0 ? 'Completed' : 'In Process',
      bank_name: sourceName,
      remarks: remarks || `Voucher ${voucherNo} paid via ${payment_method || payment_source}`
    };
    await this.insertRecord('general_ledger', glRecord);

    await this.saveData();
    return paymentRecord;
  }


  // Process Centralized Payment
  processPayment({ bank_id, bank_name, paid_to, payment_date, payment_method, remarks, item_payments }) {
    // 1. Check Bank Balance
    const banks = this.getTable('bank_accounts');
    const bank = banks.find(b => b.id === bank_id || b.bank_name === bank_name);
    if (!bank) {
      throw new Error("Selected bank account not found.");
    }

    const totalPayAmount = item_payments.reduce((sum, item) => sum + (parseFloat(item.pay_amount) || 0), 0);
    if (totalPayAmount <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }

    if ((parseFloat(bank.current_balance) || 0) < totalPayAmount) {
      throw new Error(`Insufficient funds in bank account ${bank.bank_name}. Available: PKR ${parseFloat(bank.current_balance).toLocaleString()}, Required: PKR ${totalPayAmount.toLocaleString()}`);
    }

    const paymentId = this.generateNextID('payments', 'PAY-', 'id');
    const txnId = this.generateNextID('bank_transactions', 'TXN-', 'id');
    const glId = this.generateNextID('general_ledger', 'GL-', 'id');

    // 2. Process each item payment
    const processedReferences = [];

    item_payments.forEach(item => {
      const payAmount = parseFloat(item.pay_amount) || 0;
      if (payAmount <= 0) return;

      const sourceTable = item.source_table;
      const recordId = item.record_id;
      const record = (this.data[sourceTable] || []).find(r => r.id === recordId);

      if (record) {
        const totalAmount = parseFloat(record.total_amount || record.amount || record.total_cost) || 0;
        const currentPaid = parseFloat(record.paid_amount) || 0;
        const newPaid = currentPaid + payAmount;
        const newRemaining = Math.max(0, totalAmount - newPaid);
        const newStatus = newRemaining === 0 ? 'Completed' : 'In Process';

        record.paid_amount = newPaid;
        record.remaining_amount = newRemaining;
        record.payment_status = newStatus;
        processedReferences.push(`${item.reference_id} (PKR ${payAmount.toLocaleString()})`);
      }
    });

    // 3. Deduct Bank Balance
    const newBankBalance = (parseFloat(bank.current_balance) || 0) - totalPayAmount;
    bank.current_balance = newBankBalance;

    // 4. Record Bank Ledger Entry
    const bankTxn = {
      id: txnId,
      date: payment_date || new Date().toISOString().split('T')[0],
      transaction_type: 'Payment',
      account: bank.bank_name,
      bank_id: bank.id,
      amount: totalPayAmount,
      debit: totalPayAmount,
      credit: 0,
      reference_id: paymentId,
      paid_to: paid_to,
      description: `Payment to ${paid_to}: ${processedReferences.join(', ')}`,
      balance_after: newBankBalance
    };
    this.insertRecord('bank_transactions', bankTxn);

    // 5. Record Payment Record
    const paymentRecord = {
      id: paymentId,
      payment_date: payment_date || new Date().toISOString().split('T')[0],
      bank_id: bank.id,
      bank_name: bank.bank_name,
      paid_to: paid_to,
      amount: totalPayAmount,
      payment_method: payment_method || 'Bank Transfer',
      remarks: remarks || '',
      item_details: item_payments,
      references: processedReferences.join(', ')
    };
    this.insertRecord('payments', paymentRecord);

    // 6. Record General Ledger Entry
    const glRecord = {
      id: glId,
      date: payment_date || new Date().toISOString().split('T')[0],
      source_module: 'Payment Entry',
      reference_id: paymentId,
      party_name: paid_to,
      amount: totalPayAmount,
      paid_amount: totalPayAmount,
      remaining_amount: 0,
      payment_status: 'Completed',
      bank_id: bank.id,
      bank_name: bank.bank_name,
      remarks: remarks || `Paid via ${payment_method || 'Bank'}`
    };
    this.insertRecord('general_ledger', glRecord);

    this.saveData();
    return paymentRecord;
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
