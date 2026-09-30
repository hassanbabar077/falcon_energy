import React, { useState, useMemo, useEffect } from 'react';
import { Printer, Filter, RotateCcw, CheckCircle2, FileText } from 'lucide-react';
import { dbService, normText, toNum, todayISO } from '../services/db';
import { hasPermission } from '../services/permissionService';
import { escapeHTML as e, money, pkr, fmtDate, printHTML } from '../utils/print';

// ─────────────────────────────────────────────────────────────
// Report catalogue: every report lists the filters that apply to it
// ─────────────────────────────────────────────────────────────
const REPORTS = [
  { id: 'trip_detailed_sheet', group: 'Trips', label: 'Trip Sheet (single trip, one page)', filters: ['trip', 'vehicle', 'driver', 'fromDate', 'toDate'], orientation: 'portrait' },
  { id: 'trips', group: 'Trips', label: 'Trip Freight Report', filters: ['fromDate', 'toDate', 'vehicle', 'driver', 'trip', 'supplier', 'customer', 'source', 'destination', 'tripStatus'], orientation: 'landscape' },
  { id: 'trip_payment_status', group: 'Trips', label: 'Trip Income & Payment Status', filters: ['fromDate', 'toDate', 'vehicle', 'customer', 'tripStatus', 'paymentStatus'], orientation: 'landscape' },
  { id: 'advance_ledger', group: 'Trips', label: 'Vehicle / Driver Advance Ledger', filters: ['fromDate', 'toDate', 'vehicle', 'driver', 'trip', 'advanceStatus'], orientation: 'landscape' },
  { id: 'fuel_trip_summary', group: 'Trips', label: 'Fuel Summary by Trip', filters: ['fromDate', 'toDate', 'vehicle', 'trip', 'pump'], orientation: 'landscape' },

  { id: 'pending_payables_overview', group: 'Balances', label: 'Pending Payables (All Parties)', filters: ['payCategory', 'party'], orientation: 'portrait' },
  { id: 'pending_receivables', group: 'Balances', label: 'Pending Receivables (Customers)', filters: ['customer'], orientation: 'portrait' },

  { id: 'customer_ledger', group: 'Ledgers', label: 'Customer Receivables Ledger', filters: ['fromDate', 'toDate', 'customer', 'vehicle', 'trip'], orientation: 'portrait' },
  { id: 'vendor_ledger', group: 'Ledgers', label: 'Vendor Ledger', filters: ['fromDate', 'toDate', 'vendor', 'vehicle'], orientation: 'portrait' },
  { id: 'workshop_ledger', group: 'Ledgers', label: 'Workshop Ledger', filters: ['fromDate', 'toDate', 'workshop', 'vehicle'], orientation: 'portrait' },
  { id: 'fuel_pump_ledger', group: 'Ledgers', label: 'Fuel Pump Ledger', filters: ['fromDate', 'toDate', 'pump', 'vehicle', 'trip'], orientation: 'portrait' },
  { id: 'vehicle_ledger', group: 'Ledgers', label: 'Vehicle Final Due Ledger', filters: ['fromDate', 'toDate', 'vehicle', 'trip'], orientation: 'portrait' },
  { id: 'bank_ledger', group: 'Ledgers', label: 'Bank Ledger', filters: ['fromDate', 'toDate', 'bank', 'txnType'], orientation: 'portrait' },
  { id: 'cash_account_ledger', group: 'Ledgers', label: 'Cash Account Ledger', filters: ['fromDate', 'toDate', 'cashHead'], orientation: 'portrait' },
  { id: 'universal_ledger', group: 'Ledgers', label: 'Universal General Ledger', filters: ['fromDate', 'toDate', 'ledgerCategory', 'party'], orientation: 'landscape' },

  { id: 'payment_vouchers', group: 'Vouchers', label: 'Payment Voucher Register', filters: ['fromDate', 'toDate', 'payCategory', 'party', 'bank', 'paymentType', 'vehicle', 'trip'], orientation: 'landscape' },
  { id: 'receipt_vouchers', group: 'Vouchers', label: 'Receipt Voucher Register', filters: ['fromDate', 'toDate', 'customer', 'bank'], orientation: 'landscape' },

  { id: 'daily_activity_report', group: 'Operations', label: 'Daily Activity Report', filters: ['reportDate'], orientation: 'landscape' },
  { id: 'maintenance', group: 'Operations', label: 'Maintenance Report', filters: ['fromDate', 'toDate', 'vehicle', 'maintCategory', 'workshop', 'head'], orientation: 'landscape' },
  { id: 'tyre', group: 'Operations', label: 'Tyre Report', filters: ['fromDate', 'toDate', 'vehicle', 'brand', 'vendor', 'tyreStatus'], orientation: 'landscape' },
  { id: 'vehicles', group: 'Masters', label: 'Vehicle Master Report', filters: ['vehicle', 'vehCategory', 'ownership', 'vehStatus'], orientation: 'landscape' },
  { id: 'drivers', group: 'Masters', label: 'Driver Master Report', filters: ['driver', 'vehicle', 'driverStatus'], orientation: 'landscape' },
  { id: 'bank', group: 'Masters', label: 'Bank Balances Report', filters: ['bank'], orientation: 'portrait' },
];

// Older report ids still used by saved permissions / landing cards
const REPORT_ALIASES = { fuel: 'fuel_pump_ledger', transporter_ledger: 'trips' };

const EMPTY_FILTERS = {
  fromDate: '', toDate: '', reportDate: '', vehicle: '', driver: '', trip: '', supplier: '', customer: '', vendor: '',
  workshop: '', pump: '', bank: '', source: '', destination: '', head: '', brand: '', party: '', cashHead: '',
  payCategory: '', ledgerCategory: '', maintCategory: '', vehCategory: '', ownership: '', txnType: '', paymentType: '',
  tripStatus: '', paymentStatus: '', advanceStatus: '', vehStatus: '', driverStatus: '', tyreStatus: ''
};

const names = (table, field) => [...new Set(dbService.getTable(table).map(r => (typeof field === 'function' ? field(r) : r[field])).filter(v => v && v !== '-'))].sort();

const FILTER_DEFS = {
  fromDate: { label: 'From Date', type: 'date' },
  toDate: { label: 'To Date', type: 'date' },
  reportDate: { label: 'Report Date', type: 'date' },
  vehicle: { label: 'Vehicle', options: () => names('vehicles', 'number') },
  driver: { label: 'Driver', options: () => dbService.getPartyListByCategory('Drivers') },
  trip: {
    label: 'Trip',
    options: (f) => dbService.getTable('trips')
      .filter(t => (!f.vehicle || t.vehicle === f.vehicle) && (!f.driver || t.driver === f.driver))
      .sort((a, b) => String(b.loading_date || '').localeCompare(String(a.loading_date || '')))
      .map(t => ({ value: t.id, label: `${t.id} · ${t.vehicle} · ${t.loading_date || ''}` }))
  },
  supplier: { label: 'Supplier', options: () => [...new Set([...names('suppliers', r => r.business_name || r.name), ...names('trips', r => r.supplier || r.vendor)])].sort() },
  customer: { label: 'Customer', options: () => dbService.getPartyListByCategory('Customers') },
  vendor: { label: 'Vendor', options: () => dbService.getPartyListByCategory('Vendors') },
  workshop: { label: 'Workshop', options: () => dbService.getPartyListByCategory('Workshops') },
  pump: { label: 'Fuel Pump', options: () => dbService.getPartyListByCategory('Fuel Pumps') },
  bank: { label: 'Bank Account', options: () => names('bank_accounts', 'bank_name') },
  source: { label: 'Loading Source', options: () => names('trips', 'source') },
  destination: { label: 'Destination', options: () => names('trips', r => (r.destination === 'Pending' ? '' : r.destination)) },
  head: { label: 'Maintenance Head', options: () => names('maintenance', 'head') },
  brand: { label: 'Tyre Brand', options: () => names('tyres_record', 'brand') },
  party: { label: 'Party Name', type: 'text', placeholder: 'Exact party name' },
  cashHead: { label: 'Cash Head / Recipient', type: 'text', placeholder: 'e.g. Driver Advances' },
  payCategory: { label: 'Party Category', options: () => ['Vendors', 'Workshops', 'Fuel Pumps', 'Vehicles', 'Drivers', 'Personal Expenses'] },
  ledgerCategory: { label: 'Ledger Category', options: () => ['Bank', 'Vendors', 'Workshops', 'Fuel Pumps', 'Vehicles', 'Customers'] },
  maintCategory: { label: 'Category', options: () => ['Prime Mover', 'Tanker'] },
  vehCategory: { label: 'Vehicle Category', options: () => dbService.getLookupOptions('Vehicle Category') },
  ownership: { label: 'Ownership', options: () => ['Single Owner', 'Shared Owner'] },
  txnType: { label: 'Transaction Type', options: () => ['Deposit', 'Payment', 'Withdrawal', 'Transfer'] },
  paymentType: { label: 'Voucher Type', options: () => ['Payment', 'Advance', 'Settlement'] },
  tripStatus: { label: 'Trip Status', options: () => ['In Transit', 'Delivered'] },
  paymentStatus: { label: 'Payment Status', options: () => ['Pending', 'In Process', 'Completed'] },
  advanceStatus: { label: 'Settlement Status', options: () => [{ value: 'open', label: 'Trip in progress' }, { value: 'due', label: 'Final due outstanding' }, { value: 'carry', label: 'Surplus carried forward' }, { value: 'settled', label: 'Settled' }] },
  vehStatus: { label: 'Status', options: () => ['Active', 'Maintenance', 'Inactive'] },
  driverStatus: { label: 'Status', options: () => ['Active', 'Inactive', 'Suspended'] },
  tyreStatus: { label: 'Status', options: () => ['Active', 'Inactive', 'Expired'] },
};

// ─────────────────────────────────────────────────────────────
// Data builders
// ─────────────────────────────────────────────────────────────
const inRange = (date, f) => (!f.fromDate || (date || '') >= f.fromDate) && (!f.toDate || (date || '') <= f.toDate);
const eq = (a, b) => !b || normText(a) === normText(b);

function filterTrips(f) {
  return dbService.getTable('trips').filter(t =>
    inRange(t.loading_date, f) && eq(t.vehicle, f.vehicle) && eq(t.driver, f.driver) && eq(t.id, f.trip) &&
    eq(t.supplier || t.vendor, f.supplier) && eq(t.customer, f.customer) && eq(t.source, f.source) && eq(t.destination, f.destination) &&
    (!f.tripStatus || (f.tripStatus === 'Delivered' ? Boolean(t.unloading_date) : !t.unloading_date)) &&
    (!f.paymentStatus || (t.payment_status || 'Pending') === f.paymentStatus)
  ).sort((a, b) => String(a.loading_date || '').localeCompare(String(b.loading_date || '')));
}

function buildData(type, f) {
  const ledgerOpts = { vehicle: f.vehicle, tripId: f.trip };
  switch (type) {
    case 'trip_detailed_sheet':
      return dbService.getDetailedTripSheet({ tripId: f.trip, vehicle: f.vehicle, driver: f.driver, fromDate: f.fromDate, toDate: f.toDate });
    case 'trips':
    case 'trip_payment_status':
      return filterTrips(f);
    case 'advance_ledger':
      return dbService.getAdvanceLedger({ vehicle: f.vehicle, driver: f.driver, tripId: f.trip, fromDate: f.fromDate, toDate: f.toDate, status: f.advanceStatus });
    case 'fuel_trip_summary':
      return dbService.getFuelTripReport({ vehicle: f.vehicle, tripId: f.trip, fromDate: f.fromDate, toDate: f.toDate, pump: f.pump });
    case 'pending_payables_overview':
      return f.payCategory === 'Drivers' || f.payCategory === 'Personal Expenses'
        ? dbService._outstandingList([f.payCategory], { party: f.party })
        : dbService.getPendingPayables({ category: f.payCategory, party: f.party });
    case 'pending_receivables':
      return dbService.getPendingReceivables({ customer: f.customer });
    case 'customer_ledger':
      return dbService.getPartyLedger('Customers', f.customer, f.fromDate, f.toDate, ledgerOpts);
    case 'vendor_ledger':
      return dbService.getPartyLedger('Vendors', f.vendor, f.fromDate, f.toDate, { vehicle: f.vehicle });
    case 'workshop_ledger':
      return dbService.getPartyLedger('Workshops', f.workshop, f.fromDate, f.toDate, { vehicle: f.vehicle });
    case 'fuel_pump_ledger':
      return dbService.getPartyLedger('Fuel Pumps', f.pump, f.fromDate, f.toDate, ledgerOpts);
    case 'vehicle_ledger':
      return dbService.getPartyLedger('Vehicles', f.vehicle, f.fromDate, f.toDate, { tripId: f.trip });
    case 'bank_ledger':
      return dbService.getBankLedger(f.bank, f.fromDate, f.toDate, { txnType: f.txnType });
    case 'cash_account_ledger':
      return dbService.getCashAccountLedger(f.cashHead, f.fromDate, f.toDate);
    case 'universal_ledger':
      return dbService.getUniversalLedger(f.fromDate, f.toDate, f.ledgerCategory, f.party);
    case 'payment_vouchers':
      return dbService.getTable('payments').filter(p =>
        inRange(p.payment_date || p.date, f) && eq(p.party_category, f.payCategory) && eq(p.party_name || p.paid_to, f.party) &&
        eq(p.bank_account || p.bank_name, f.bank) && eq(p.payment_type || 'Payment', f.paymentType) &&
        eq(p.vehicle, f.vehicle) && eq(p.trip_id, f.trip)
      ).sort((a, b) => String(a.payment_date || a.date || '').localeCompare(String(b.payment_date || b.date || '')));
    case 'receipt_vouchers':
      return dbService.getTable('payments_received').filter(r =>
        inRange(r.date, f) && eq(r.customer || r.party_name, f.customer) && eq(r.bank, f.bank)
      ).sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
    case 'daily_activity_report':
      return dbService.getDailyActivityReport(f.reportDate || todayISO());
    case 'maintenance':
      return dbService.getTable('maintenance').filter(m =>
        inRange(m.date, f) && (eq(m.vehicle, f.vehicle) || eq(m.tanker_number, f.vehicle)) && eq(m.category, f.maintCategory) &&
        eq(m.workshop, f.workshop) && eq(m.head, f.head)
      ).sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
    case 'tyre':
      return dbService.getTable('tyres_record').filter(t =>
        inRange(t.purchase_date, f) && (eq(t.vehicle, f.vehicle) || eq(t.tanker_number, f.vehicle)) && eq(t.brand, f.brand) &&
        eq(t.vendor, f.vendor) && eq(t.status, f.tyreStatus)
      );
    case 'vehicles':
      return dbService.getTable('vehicles').filter(v => eq(v.number, f.vehicle) && eq(v.category, f.vehCategory) && eq(v.ownership, f.ownership) && eq(v.status, f.vehStatus));
    case 'drivers':
      return dbService.getTable('drivers').filter(d => eq(d.name, f.driver) && eq(d.assigned_vehicle, f.vehicle) && eq(d.status, f.driverStatus));
    case 'bank':
      return dbService.getTable('bank_accounts').filter(b => eq(b.bank_name, f.bank));
    default:
      return [];
  }
}

// ─────────────────────────────────────────────────────────────
// HTML builders (shared by the preview and the printed document)
// ─────────────────────────────────────────────────────────────
const m = (v) => money(v, { blankZero: true });
const orDash = (v) => (v === undefined || v === null || v === '' || v === '-' ? '-' : v);

// cols: { h, v: row => value, cls: 'num'|'code'|'desc', fmt: 'money'|'date'|'raw', total: fn|true }
function tableHTML(cols, rows, { empty = 'No records match the selected filters.', totals = null } = {}) {
  const cell = (c, r) => {
    const raw = c.v(r);
    if (c.fmt === 'raw') return raw ?? '';
    if (c.fmt === 'money') return m(raw);
    if (c.fmt === 'date') return e(fmtDate(raw));
    return e(orDash(raw));
  };
  const head = `<tr>${cols.map(c => `<th class="${c.cls || ''}">${e(c.h)}</th>`).join('')}</tr>`;
  const body = rows.length === 0
    ? `<tr><td colspan="${cols.length}" class="empty">${e(empty)}</td></tr>`
    : rows.map(r => `<tr class="${r.isOpening ? 'opening' : ''}">${cols.map(c => `<td class="${c.cls || ''}">${cell(c, r)}</td>`).join('')}</tr>`).join('');
  const foot = totals && rows.length ? `<tfoot><tr>${cols.map((c, i) => {
    if (i === 0) return `<td>${e(totals.label || 'Total')}</td>`;
    if (c.total) return `<td class="num">${m(rows.reduce((s, r) => s + toNum(c.v(r)), 0))}</td>`;
    return '<td></td>';
  }).join('')}</tr></tfoot>` : '';
  return `<table class="grid"><thead>${head}</thead><tbody>${body}</tbody>${foot}</table>`;
}

const statsHTML = (items) => `<div class="stats">${items.map(([label, value, tone]) =>
  `<div class="stat ${tone || ''}"><span>${e(label)}</span><strong>${value}</strong></div>`).join('')}</div>`;

function ledgerHTML(data, { showCategory = false, showParty = false, drLabel = 'Debit (Dr)', crLabel = 'Credit (Cr)', balanceLabel = 'Balance' } = {}) {
  const rows = data?.rows || [];
  const cols = [
    { h: 'Date', v: r => r.date, fmt: 'date' },
    { h: 'Ref / Voucher', v: r => r.ref, cls: 'code' },
    ...(showCategory ? [{ h: 'Category', v: r => r.category }] : []),
    ...(showParty ? [{ h: 'Party / Account', v: r => r.party }] : []),
    { h: 'Description', v: r => r.description, cls: 'desc' },
    { h: drLabel, v: r => r.dr, fmt: 'money', cls: 'num', total: true },
    { h: crLabel, v: r => r.cr, fmt: 'money', cls: 'num', total: true },
    { h: balanceLabel, v: r => money(r.balance), fmt: 'raw', cls: 'num strong' },
  ];
  return statsHTML([
    ['Opening Balance', pkr(data?.openingBalance)],
    [drLabel, pkr(data?.totalDr), 'tone-blue'],
    [crLabel, pkr(data?.totalCr), 'tone-rose'],
    [`Closing ${balanceLabel}`, pkr(data?.closingBalance), 'tone-teal'],
  ]) + tableHTML(cols, rows, { totals: { label: 'Period Total' } });
}

function tripSheetHTML(d, company) {
  if (!d) return '<div class="empty-block">No trip found for the selected filters. Create a trip first, or choose a vehicle / trip in the filters.</div>';
  const s = d.settlement;
  const kv = (rows) => `<table class="kv">${rows.map(([k, v, cls]) => `<tr class="${cls || ''}"><td>${e(k)}</td><td>${v}</td></tr>`).join('')}</table>`;
  const t = d.totals;

  const advanceRows = [
    `<tr><td>—</td><td>Carry-forward</td><td>Previous trip surplus</td><td class="num">${m(s.previousBalance)}</td></tr>`,
    ...s.advances.map(a => `<tr><td>${e(fmtDate(a.date))}</td><td class="code">${e(a.id)}</td><td>${e(a.paid_to || '')}</td><td class="num">${m(a.amount)}</td></tr>`)
  ].join('');

  const expenseRows = s.expenses.length
    ? s.expenses.map((x, i) => `<tr><td>${i + 1}</td><td>${e(x.label)}</td><td class="num">${m(x.amount)}</td></tr>`).join('')
    : '<tr><td colspan="3" class="empty">No trip expenses recorded</td></tr>';

  const resultLabel = s.balance < 0 ? 'FINAL DUE (payable to vehicle)' : s.balance > 0 ? 'SURPLUS (carried to next trip)' : 'FINAL DUE / BALANCE';

  return `
  <div class="ts">
    <div class="ts-head">
      <div>
        <div class="ts-company">${e(company.name)}</div>
        <div class="ts-sub">${e(company.system_name)} · ${e(company.address)} · ${e(company.contact)}</div>
      </div>
      <div class="ts-title">
        <div class="ts-label">TRIP SHEET</div>
        <div class="ts-no">${e(d.tripId)}</div>
        <div class="ts-status">${e(d.status)}</div>
      </div>
    </div>

    <div class="ts-meta">
      <div><span>Vehicle</span><strong>${e(d.vehicleNo)}</strong></div>
      <div><span>Driver</span><strong>${e(d.driverName)}</strong></div>
      <div><span>Supplier</span><strong>${e(d.supplier)}</strong></div>
      <div><span>Customer</span><strong>${e(d.customer)}</strong></div>
      <div><span>Load Date</span><strong>${e(fmtDate(d.loadDate))}</strong></div>
      <div><span>Unload Date</span><strong>${e(d.unloadDate ? fmtDate(d.unloadDate) : 'In transit')}</strong></div>
      <div><span>Duration</span><strong>${d.durationDays === null ? '—' : `${d.durationDays} day${d.durationDays === 1 ? '' : 's'}`}</strong></div>
      <div><span>Route</span><strong>${e(d.source)} → ${e(d.destination)}</strong></div>
    </div>

    <div class="ts-grid">
      <section>
        <h4>Loading &amp; Delivery</h4>
        ${kv([
          ['Loading source', e(d.source)],
          ['Destination / Plant', `${e(d.destination)}${d.plant !== '—' && d.plant !== d.source ? ` · ${e(d.plant)}` : ''}`],
          ['Load weight', `${money(d.weights.load)} T · ${money(d.weights.loadPsi)} PSI`],
          ['Unload weight', `${money(d.weights.unload)} T · ${money(d.weights.unloadPsi)} PSI`],
          ['Weight difference', `<span class="${d.weights.diff < 0 ? 'neg' : 'pos'}">${d.weights.diff > 0 ? '+' : ''}${money(d.weights.diff)} T ${d.weights.diff < 0 ? '(Short)' : d.weights.diff > 0 ? '(Surplus)' : ''}</span>`],
          ['Distance', `${money(d.weights.distance)} KM`],
        ])}
      </section>

      <section>
        <h4>Freight &amp; Income</h4>
        ${kv([
          ['Freight type / rate', `${e(d.freight.type)} · ${m(d.freight.rate)}`],
          ['Gross freight', pkr(d.freight.gross)],
          [d.freight.shortSurplusType || 'Short / surplus adj.', `${d.freight.shortSurplusType.includes('+') ? '+' : '−'} ${pkr(d.freight.shortSurplusAmount)}`],
          ['Net income (receivable)', `<strong>${pkr(d.freight.netIncome)}</strong>`, 'hl'],
          ['Customer', e(d.customer)],
        ])}
      </section>

      <section>
        <h4>Diesel Account</h4>
        ${kv([
          ['Opening fuel (carried in)', `${money(d.diesel.openingLiters)} L · ${pkr(d.diesel.openingCost)}`],
          ['Purchased in trip', `${money(d.diesel.purchasedLiters)} L · ${pkr(d.diesel.purchasedCost)}`],
          ['Remaining (carried out)', `${money(d.diesel.remainingLiters)} L · ${pkr(d.diesel.remainingCost)}`],
          ['Consumed', `${money(d.diesel.consumedLiters)} L`],
          ['Diesel expense', `<strong>${pkr(d.diesel.expense)}</strong>`, 'hl'],
          ['Average', d.diesel.avgKmPerLiter ? `${d.diesel.avgKmPerLiter.toFixed(2)} KM/L` : '—'],
          ['Fuel pump(s)', e(d.diesel.pumps)],
        ])}
      </section>

      <section>
        <h4>Trip Expenses (paid from advance)</h4>
        <table class="grid tight">
          <thead><tr><th>#</th><th>Expense</th><th class="num">Amount</th></tr></thead>
          <tbody>${expenseRows}</tbody>
          <tfoot><tr><td></td><td>Total trip expenses</td><td class="num">${m(s.expenseTotal)}</td></tr></tfoot>
        </table>
      </section>

      <section>
        <h4>Advance Account (${e(d.vehicleNo)})</h4>
        <table class="grid tight">
          <thead><tr><th>Date</th><th>Voucher</th><th>Paid To</th><th class="num">Amount</th></tr></thead>
          <tbody>${advanceRows}</tbody>
          <tfoot><tr><td colspan="3">Total advance available</td><td class="num">${m(s.totalAdvance)}</td></tr></tfoot>
        </table>
      </section>

      <section>
        <h4>Advance Settlement</h4>
        ${kv([
          ['Total advance available', pkr(s.totalAdvance)],
          ['Less: trip expenses', `− ${pkr(s.expenseTotal)}`],
          [resultLabel, `<strong>${pkr(Math.abs(s.balance))}</strong>`, s.balance < 0 ? 'due' : 'ok'],
          ...(s.finalDue > 0 ? [['Settled so far', pkr(s.settledAmount)], ['Outstanding due', `<strong>${pkr(s.outstandingDue)}</strong>`]] : []),
          ['Status', e(s.status)],
        ])}
      </section>
    </div>

    <div class="ts-summary">
      <div><span>Trip Expenses</span><strong>${pkr(t.roadExpenses)}</strong></div>
      <div><span>Diesel</span><strong>${pkr(t.diesel)}</strong></div>
      <div><span>Mobil Oil</span><strong>${pkr(t.mobilOil)}</strong></div>
      <div><span>Total Trip Cost</span><strong>${pkr(t.totalTripCost)}</strong></div>
      <div><span>Net Income</span><strong>${pkr(t.netIncome)}</strong></div>
      <div class="${t.tripMargin < 0 ? 'neg' : 'pos'}"><span>Trip Margin</span><strong>${pkr(t.tripMargin)}</strong></div>
    </div>

    <div class="sign"><div>Prepared By</div><div>Driver</div><div>Accounts</div><div>Approved By</div></div>
  </div>`;
}

function dailyHTML(d) {
  const section = (title, inner) => `<section class="box"><h4>${e(title)}</h4>${inner}</section>`;
  return `
    ${statsHTML([
      ['Report No', e(d.reportNo)], ['Date', e(fmtDate(d.date))],
      ['Total Payables', pkr(d.payablesTotal), 'tone-rose'], ['Total Receivables', pkr(d.receivablesTotal), 'tone-teal']
    ])}
    <div class="cols-2">
      ${section('Vehicle Locations', tableHTML([{ h: 'Vehicle', v: r => r.number, cls: 'code' }, { h: 'Location', v: r => r.location }, { h: 'Status', v: r => r.status }], d.vehicleLocations, { empty: 'No vehicles' }))}
      <div>
        ${section('Loaded Today', tableHTML([{ h: 'Vehicle', v: r => r.number }, { h: 'Trip', v: r => r.trip, cls: 'code' }, { h: 'Source', v: r => r.location }, { h: 'PSI', v: r => r.psi }], d.vehiclesLoadedToday, { empty: 'None' }))}
        ${section('Decanted Today', tableHTML([{ h: 'Vehicle', v: r => r.number }, { h: 'Trip', v: r => r.trip, cls: 'code' }, { h: 'Destination', v: r => r.location }, { h: 'PSI', v: r => r.psi }], d.vehiclesDecantedToday, { empty: 'None' }))}
      </div>
    </div>
    <div class="cols-2">
      ${section('Trip Advances Paid Today', tableHTML([{ h: 'Vehicle', v: r => r.vehicle }, { h: 'Trip', v: r => r.trip, cls: 'code' }, { h: 'Source', v: r => r.plant }, { h: 'Amount', v: r => r.amount, fmt: 'money', cls: 'num', total: true }], d.advances, { empty: 'No advances', totals: {} }))}
      ${section('Cash Expenses Today', tableHTML([{ h: 'Vehicle', v: r => r.vehicle }, { h: 'Head', v: r => r.head }, { h: 'Paid By / To', v: r => r.paidBy }, { h: 'Amount', v: r => r.amount, fmt: 'money', cls: 'num', total: true }], d.cashFueling, { empty: 'No cash expenses', totals: {} }))}
    </div>
    <div class="cols-2">
      ${section('Fuel Pump Balances', tableHTML([{ h: 'Pump', v: r => r.pumpName }, { h: 'Opening', v: r => r.openingCr, fmt: 'money', cls: 'num' }, { h: 'Billed', v: r => r.billedToday, fmt: 'money', cls: 'num' }, { h: 'Paid', v: r => r.paidToday, fmt: 'money', cls: 'num' }, { h: 'Closing', v: r => r.closingBalance, fmt: 'money', cls: 'num strong', total: true }], d.pumpSummaries, { empty: 'No fuel pumps', totals: {} }))}
      ${section('Workshop Balances', tableHTML([{ h: 'Workshop', v: r => r.name }, { h: 'Previous', v: r => r.previousAmount, fmt: 'money', cls: 'num' }, { h: 'Billed', v: r => r.billed, fmt: 'money', cls: 'num' }, { h: 'Paid', v: r => r.paid, fmt: 'money', cls: 'num' }, { h: 'Remaining', v: r => r.remaining, fmt: 'money', cls: 'num strong', total: true }], d.workshopSummary, { empty: 'No workshops', totals: {} }))}
    </div>
    ${section('Engine / Mobil Oil Stock (Liters)', statsHTML([
      ['Opening Stock', money(d.oilDetails.openingStock)], ['Purchased', money(d.oilDetails.purchasedStock), 'tone-blue'],
      ['Used', money(d.oilDetails.usedStock), 'tone-rose'], ['Closing Stock', money(d.oilDetails.remainingStock), 'tone-teal']
    ]))}`;
}

function buildBodyHTML(type, data, company) {
  switch (type) {
    case 'trip_detailed_sheet':
      return tripSheetHTML(data, company);

    case 'trips':
      return statsHTML([
        ['Trips', data.length], ['Delivered', data.filter(t => t.unloading_date).length],
        ['Load Weight (T)', money(data.reduce((s, t) => s + toNum(t.load_weight), 0))],
        ['Net Income', pkr(data.reduce((s, t) => s + (toNum(t.net_income) || toNum(t.total_cost)), 0)), 'tone-teal']
      ]) + tableHTML([
        { h: 'Trip', v: t => t.id, cls: 'code' }, { h: 'Load Date', v: t => t.loading_date, fmt: 'date' }, { h: 'Unload Date', v: t => t.unloading_date, fmt: 'date' },
        { h: 'Vehicle', v: t => t.vehicle }, { h: 'Driver', v: t => t.driver }, { h: 'Supplier', v: t => t.supplier || t.vendor },
        { h: 'Source', v: t => t.source }, { h: 'Destination', v: t => (t.destination === 'Pending' ? '' : t.destination) }, { h: 'Customer', v: t => t.customer },
        { h: 'Load T', v: t => t.load_weight, fmt: 'money', cls: 'num', total: true }, { h: 'Unload T', v: t => t.unload_weight, fmt: 'money', cls: 'num', total: true },
        { h: 'Diff T', v: t => t.difference, fmt: 'money', cls: 'num', total: true },
        { h: 'Rate', v: t => (t.freight_type === 'Per KM' ? t.freight_km_rate : t.freight_ton_rate), fmt: 'money', cls: 'num' },
        { h: 'Net Income', v: t => toNum(t.net_income) || toNum(t.total_cost), fmt: 'money', cls: 'num strong', total: true },
        { h: 'Status', v: t => (t.unloading_date ? (t.status || 'Delivered') : 'In Transit') },
      ], data, { totals: {} });

    case 'trip_payment_status':
      return tableHTML([
        { h: 'Trip', v: t => t.id, cls: 'code' }, { h: 'Load Date', v: t => t.loading_date, fmt: 'date' }, { h: 'Vehicle', v: t => t.vehicle },
        { h: 'Customer', v: t => t.customer }, { h: 'Destination', v: t => (t.destination === 'Pending' ? '' : t.destination) },
        { h: 'Gross Freight', v: t => t.amount, fmt: 'money', cls: 'num', total: true },
        { h: 'Short / Surplus', v: t => (t.short_surplus_type || '').includes('+') ? toNum(t.short_surplus_amount) : -toNum(t.short_surplus_amount), fmt: 'money', cls: 'num', total: true },
        { h: 'Net Income', v: t => toNum(t.net_income) || toNum(t.total_cost), fmt: 'money', cls: 'num strong', total: true },
        { h: 'Trip Expenses', v: t => t.trip_expenses_total, fmt: 'money', cls: 'num', total: true },
        { h: 'Final Due', v: t => t.final_due, fmt: 'money', cls: 'num', total: true },
        { h: 'Payment Status', v: t => t.payment_status || 'Pending' },
        { h: 'Trip Status', v: t => (t.unloading_date ? (t.status || 'Delivered') : 'In Transit') },
      ], data, { totals: {} });

    case 'advance_ledger': {
      const rows = data.rows;
      return statsHTML([
        ['Advances Paid', pkr(data.totals.advances), 'tone-blue'], ['Trip Expenses', pkr(data.totals.expenses), 'tone-rose'],
        ['Outstanding Final Due', pkr(data.totals.outstanding), 'tone-rose'],
        [data.currentVehicleBalance !== null ? 'Vehicle Carry-Forward Now' : 'Surplus Carried Forward', pkr(data.currentVehicleBalance ?? data.totals.carryForward), 'tone-teal']
      ]) + tableHTML([
        { h: 'Trip', v: r => r.trip.id, cls: 'code' }, { h: 'Load Date', v: r => r.trip.loading_date, fmt: 'date' }, { h: 'Unload Date', v: r => r.trip.unloading_date, fmt: 'date' },
        { h: 'Vehicle', v: r => r.trip.vehicle }, { h: 'Driver', v: r => r.trip.driver },
        { h: 'Prev C/F', v: r => r.previousBalance, fmt: 'money', cls: 'num', total: true },
        { h: 'Advances', v: r => r.advanceTotal, fmt: 'money', cls: 'num', total: true },
        { h: 'Vouchers', v: r => r.advances.map(a => a.id).join(', ') },
        { h: 'Expenses', v: r => r.expenseTotal, fmt: 'money', cls: 'num', total: true },
        { h: 'Balance', v: r => money(r.balance), fmt: 'raw', cls: 'num strong' },
        { h: 'Final Due', v: r => r.finalDue, fmt: 'money', cls: 'num', total: true },
        { h: 'Settled', v: r => r.settledAmount, fmt: 'money', cls: 'num', total: true },
        { h: 'Outstanding', v: r => r.outstandingDue, fmt: 'money', cls: 'num strong', total: true },
        { h: 'Status', v: r => r.status },
      ], rows, { totals: {} });
    }

    case 'fuel_trip_summary':
      return tableHTML([
        { h: 'Trip', v: r => r.trip_id, cls: 'code' }, { h: 'Vehicle', v: r => r.vehicle }, { h: 'Load Date', v: r => r.loading_date, fmt: 'date' },
        { h: 'Opening L', v: r => r.opening_liters, fmt: 'money', cls: 'num', total: true }, { h: 'Opening Cost', v: r => r.opening_cost, fmt: 'money', cls: 'num', total: true },
        { h: 'Purchased L', v: r => r.purchased_liters, fmt: 'money', cls: 'num', total: true }, { h: 'Purchased Cost', v: r => r.purchased_cost, fmt: 'money', cls: 'num', total: true },
        { h: 'Remaining L', v: r => r.remaining_liters, fmt: 'money', cls: 'num', total: true }, { h: 'Consumed L', v: r => r.consumed_liters, fmt: 'money', cls: 'num', total: true },
        { h: 'Diesel Expense', v: r => r.net_expense, fmt: 'money', cls: 'num strong', total: true },
        { h: 'Fills', v: r => r.fills, cls: 'num' }, { h: 'Pump(s)', v: r => r.pumps },
      ], data, { totals: {} });

    case 'pending_payables_overview':
    case 'pending_receivables': {
      const isRec = type === 'pending_receivables';
      return statsHTML([
        [isRec ? 'Customers' : 'Parties', data.length],
        [isRec ? 'Total Billed' : 'Total Billed', pkr(data.reduce((s, x) => s + x.total_amount, 0))],
        [isRec ? 'Total Received' : 'Total Paid', pkr(data.reduce((s, x) => s + x.paid_amount, 0)), 'tone-blue'],
        [isRec ? 'Outstanding Receivable' : 'Outstanding Payable', pkr(data.reduce((s, x) => s + x.remaining_amount, 0)), isRec ? 'tone-teal' : 'tone-rose'],
      ]) + tableHTML([
        { h: 'Category', v: r => r.party_type }, { h: 'Party', v: r => r.party_name, cls: 'strong' }, { h: 'Details', v: r => r.description, cls: 'desc' },
        { h: 'Billed', v: r => r.total_amount, fmt: 'money', cls: 'num', total: true },
        { h: isRec ? 'Received' : 'Paid', v: r => r.paid_amount, fmt: 'money', cls: 'num', total: true },
        { h: 'Outstanding', v: r => r.remaining_amount, fmt: 'money', cls: 'num strong', total: true },
        { h: 'Status', v: r => r.payment_status },
      ], data, { totals: {}, empty: isRec ? 'No outstanding receivables.' : 'No outstanding payables.' });
    }

    case 'customer_ledger':
      return ledgerHTML(data, { showParty: !data.partyName || data.partyName.startsWith('All'), drLabel: 'Billed (Dr)', crLabel: 'Received (Cr)', balanceLabel: 'Receivable' });
    case 'vendor_ledger':
    case 'workshop_ledger':
    case 'fuel_pump_ledger':
    case 'vehicle_ledger':
      return ledgerHTML(data, { showParty: !data.partyName || data.partyName.startsWith('All'), drLabel: 'Paid (Dr)', crLabel: 'Billed (Cr)', balanceLabel: 'Payable' });
    case 'bank_ledger':
      return ledgerHTML(data, { showParty: true, drLabel: 'Deposits (Dr)', crLabel: 'Payments (Cr)', balanceLabel: 'Bank Balance' });
    case 'cash_account_ledger':
      return ledgerHTML(data, { drLabel: 'Outflow (Dr)', crLabel: 'Inflow (Cr)', balanceLabel: 'Cash Balance' });
    case 'universal_ledger':
      return ledgerHTML(data, { showCategory: true, showParty: true });

    case 'payment_vouchers':
      return tableHTML([
        { h: 'Voucher', v: p => p.voucher_no || p.id, cls: 'code' }, { h: 'Date', v: p => p.payment_date || p.date, fmt: 'date' },
        { h: 'Type', v: p => p.payment_type || 'Payment' }, { h: 'Category', v: p => p.party_category }, { h: 'Paid To', v: p => p.party_name || p.paid_to, cls: 'strong' },
        { h: 'Trip', v: p => p.trip_id, cls: 'code' }, { h: 'Description', v: p => p.description || p.remarks, cls: 'desc' },
        { h: 'Bank', v: p => p.bank_account || p.bank_name || p.source_name }, { h: 'Method / Ref', v: p => [p.payment_method, p.instrument_no].filter(Boolean).join(' · ') },
        { h: 'Amount', v: p => p.amount, fmt: 'money', cls: 'num strong', total: true },
      ], data, { totals: {} });

    case 'receipt_vouchers':
      return tableHTML([
        { h: 'Receipt', v: r => r.payment_id || r.id, cls: 'code' }, { h: 'Date', v: r => r.date, fmt: 'date' },
        { h: 'Customer', v: r => r.customer || r.party_name || 'Unassigned', cls: 'strong' }, { h: 'Description', v: r => r.description || r.remarks, cls: 'desc' },
        { h: 'Bank', v: r => r.bank }, { h: 'Ref', v: r => r.reference_number },
        { h: 'Amount', v: r => r.amount, fmt: 'money', cls: 'num strong', total: true },
      ], data, { totals: {} });

    case 'daily_activity_report':
      return dailyHTML(data);

    case 'maintenance':
      return tableHTML([
        { h: 'Date', v: r => r.date, fmt: 'date' }, { h: 'Ref', v: r => r.id, cls: 'code' }, { h: 'Category', v: r => r.category },
        { h: 'Vehicle / Tanker', v: r => (r.category === 'Tanker' ? r.tanker_number || r.vehicle : r.vehicle) }, { h: 'Workshop', v: r => r.workshop },
        { h: 'Head', v: r => r.head }, { h: 'Type', v: r => r.type || r.maintenance_type }, { h: 'Details', v: r => r.remarks || r.description, cls: 'desc' },
        { h: 'Amount', v: r => r.total_amount || r.amount, fmt: 'money', cls: 'num strong', total: true },
      ], data, { totals: {} });

    case 'tyre':
      return tableHTML([
        { h: 'Tyre ID', v: r => r.id, cls: 'code' }, { h: 'Tyre No.', v: r => r.tyre_number }, { h: 'Purchase Date', v: r => r.purchase_date, fmt: 'date' },
        { h: 'Category', v: r => r.category }, { h: 'Vehicle / Tanker', v: r => (r.category === 'Tanker' ? r.tanker_number || r.vehicle : r.vehicle) },
        { h: 'Brand', v: r => r.brand }, { h: 'Vendor', v: r => r.vendor }, { h: 'Condition', v: r => r.condition },
        { h: 'Status', v: r => r.status }, { h: 'Amount', v: r => r.total_amount || r.amount || r.cost, fmt: 'money', cls: 'num', total: true },
      ], data, { totals: {} });

    case 'vehicles':
      return tableHTML([
        { h: 'Code', v: r => r.code, cls: 'code' }, { h: 'Vehicle No.', v: r => r.number, cls: 'strong' }, { h: 'Make / Model', v: r => [r.make, r.model].filter(Boolean).join(' ') },
        { h: 'Category', v: r => r.category }, { h: 'Ownership', v: r => r.ownership }, { h: 'Owner(s)', v: r => [r.owner1, r.owner2 !== '-' ? r.owner2 : ''].filter(Boolean).join(', ') },
        { h: 'Tanker No.', v: r => r.tanker_number }, { h: 'Capacity MT', v: r => r.capacity, cls: 'num' }, { h: 'Engine', v: r => r.engine || r.engine_no },
        { h: 'Chassis', v: r => r.chassis || r.chassis_no }, { h: 'Token Exp.', v: r => r.token_expiry, fmt: 'date' }, { h: 'Route Exp.', v: r => r.route_expiry, fmt: 'date' },
        { h: 'Advance C/F', v: r => r.advance_balance, fmt: 'money', cls: 'num' }, { h: 'Status', v: r => r.status },
      ], data);

    case 'drivers':
      return tableHTML([
        { h: 'ID', v: r => r.id, cls: 'code' }, { h: 'Name', v: r => r.name, cls: 'strong' }, { h: "Father's Name", v: r => r.father_name },
        { h: 'CNIC', v: r => r.cnic }, { h: 'Mobile', v: r => r.mobile || r.phone }, { h: 'License', v: r => r.license || r.license_no },
        { h: 'License Expiry', v: r => r.license_expiry, fmt: 'date' }, { h: 'Assigned Vehicle', v: r => r.assigned_vehicle },
        { h: 'Joining Date', v: r => r.joining_date, fmt: 'date' }, { h: 'Status', v: r => r.status },
      ], data);

    case 'bank':
      return tableHTML([
        { h: 'Bank ID', v: r => r.id, cls: 'code' }, { h: 'Bank', v: r => r.bank_name, cls: 'strong' }, { h: 'Account No.', v: r => r.account_number },
        { h: 'Opening Balance', v: r => r.opening_balance, fmt: 'money', cls: 'num', total: true },
        { h: 'Current Balance', v: r => r.current_balance, fmt: 'money', cls: 'num strong', total: true },
      ], data, { totals: {} });

    default:
      return '<div class="empty-block">Select a report.</div>';
  }
}

function buildDocumentHTML(report, data, filters, company) {
  const body = buildBodyHTML(report.id, data, company);
  if (report.id === 'trip_detailed_sheet') return body; // has its own compact header

  const applied = report.filters
    .filter(k => filters[k])
    .map(k => {
      const def = FILTER_DEFS[k];
      const opt = typeof def.options === 'function' ? def.options(filters).find(o => (o.value ?? o) === filters[k]) : null;
      return `<span class="chip">${e(def.label)}: ${e(opt?.label || (def.type === 'date' ? fmtDate(filters[k]) : filters[k]))}</span>`;
    });

  return `
    <div class="letterhead">
      <div>
        <div class="lh-company">${e(company.name)}</div>
        <div class="lh-sub">${e(company.system_name)} · ${e(company.address)} · ${e(company.contact)}</div>
      </div>
      <div class="lh-right">
        <div class="lh-title">${e(report.label)}</div>
        <div class="lh-sub">Generated ${e(new Date().toLocaleString('en-GB'))}</div>
      </div>
    </div>
    <div class="filters">${applied.length ? applied.join('') : '<span class="chip chip-muted">No filters · all records</span>'}</div>
    ${body}
    <div class="sign"><div>Prepared By</div><div>Checked By</div><div>Approved By</div></div>`;
}

export const REPORT_CSS = `
  .rpt { font-family: 'Nunito', 'Segoe UI', sans-serif; color: #0f172a; font-size: 10.5px; line-height: 1.4; }
  .rpt .letterhead { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; border-bottom: 2px solid #0f766e; padding-bottom: 8px; margin-bottom: 8px; }
  .rpt .lh-company { font-size: 17px; font-weight: 900; letter-spacing: -.2px; }
  .rpt .lh-title { font-size: 13px; font-weight: 900; color: #0f766e; text-align: right; }
  .rpt .lh-sub { font-size: 9.5px; color: #64748b; font-weight: 600; }
  .rpt .lh-right { text-align: right; }
  .rpt .filters { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; }
  .rpt .chip { background: #f0fdfa; border: 1px solid #99f6e4; color: #0f766e; border-radius: 99px; padding: 1px 8px; font-size: 9.5px; font-weight: 700; }
  .rpt .chip-muted { background: #f8fafc; border-color: #e2e8f0; color: #64748b; }
  .rpt .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 6px; margin-bottom: 10px; }
  .rpt .stat { border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 9px; background: #f8fafc; }
  .rpt .stat span { display: block; font-size: 8.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: .4px; }
  .rpt .stat strong { display: block; font-size: 12.5px; font-weight: 900; margin-top: 1px; }
  .rpt .tone-teal strong { color: #0f766e; } .rpt .tone-rose strong { color: #be123c; } .rpt .tone-blue strong { color: #1d4ed8; }
  .rpt table.grid { width: 100%; border-collapse: collapse; }
  .rpt table.grid th { background: #0f172a; color: #fff; text-align: left; padding: 5px 6px; font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .3px; }
  .rpt table.grid td { padding: 4px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  .rpt table.grid tbody tr:nth-child(even) td { background: #f8fafc; }
  .rpt table.grid tr.opening td { background: #f1f5f9; font-weight: 800; }
  .rpt table.grid tfoot td { border-top: 2px solid #0f172a; font-weight: 900; background: #f0fdfa; padding: 5px 6px; }
  .rpt .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .rpt .code { font-family: 'Consolas', monospace; font-weight: 700; color: #0f766e; white-space: nowrap; }
  .rpt .strong { font-weight: 800; }
  .rpt .desc { color: #334155; min-width: 160px; }
  .rpt .empty { text-align: center; color: #94a3b8; padding: 14px; font-style: italic; }
  .rpt .empty-block { padding: 40px; text-align: center; color: #64748b; font-weight: 700; }
  .rpt .neg { color: #be123c; } .rpt .pos { color: #0f766e; }
  .rpt .sign { display: flex; justify-content: space-between; gap: 18px; margin-top: 34px; font-size: 9.5px; font-weight: 700; color: #475569; }
  .rpt .sign div { flex: 1; border-top: 1px solid #94a3b8; padding-top: 3px; text-align: center; }
  .rpt .cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  .rpt .box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px; margin-bottom: 8px; break-inside: avoid; }
  .rpt .box h4, .rpt .ts h4 { font-size: 9.5px; font-weight: 900; text-transform: uppercase; letter-spacing: .5px; color: #0f766e; margin-bottom: 4px; }

  /* Trip sheet – designed for one A4 portrait page */
  .rpt .ts { font-size: 9.5px; }
  .rpt .ts-head { display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: #fff; border-radius: 6px; padding: 8px 12px; }
  .rpt .ts-company { font-size: 15px; font-weight: 900; }
  .rpt .ts-sub { font-size: 8.5px; color: #94a3b8; font-weight: 600; }
  .rpt .ts-title { text-align: right; }
  .rpt .ts-label { font-size: 9px; font-weight: 900; letter-spacing: 1.5px; color: #5eead4; }
  .rpt .ts-no { font-size: 16px; font-weight: 900; font-family: 'Consolas', monospace; }
  .rpt .ts-status { display: inline-block; font-size: 8.5px; font-weight: 800; background: #14b8a6; color: #fff; border-radius: 99px; padding: 0 7px; }
  .rpt .ts-meta { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #cbd5e1; border-radius: 6px; margin: 6px 0; overflow: hidden; }
  .rpt .ts-meta div { padding: 4px 8px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
  .rpt .ts-meta div:nth-child(4n) { border-right: 0; }
  .rpt .ts-meta div:nth-child(n+5) { border-bottom: 0; }
  .rpt .ts-meta span, .rpt .ts-summary span { display: block; font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: .4px; }
  .rpt .ts-meta strong { font-size: 10px; }
  .rpt .ts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .rpt .ts-grid section { border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px 7px; break-inside: avoid; }
  .rpt table.kv { width: 100%; border-collapse: collapse; }
  .rpt table.kv td { padding: 2px 0; border-bottom: 1px dotted #e2e8f0; }
  .rpt table.kv td:last-child { text-align: right; font-weight: 700; }
  .rpt table.kv tr.hl td { background: #f0fdfa; color: #0f766e; }
  .rpt table.kv tr.due td { background: #fff1f2; color: #be123c; font-weight: 900; }
  .rpt table.kv tr.ok td { background: #f0fdfa; color: #0f766e; font-weight: 900; }
  .rpt table.grid.tight th { padding: 3px 5px; font-size: 7.5px; }
  .rpt table.grid.tight td { padding: 2px 5px; }
  .rpt .ts-summary { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; margin-top: 6px; }
  .rpt .ts-summary div { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 6px; }
  .rpt .ts-summary strong { font-size: 10.5px; font-weight: 900; }
  .rpt .ts-summary .pos strong { color: #0f766e; } .rpt .ts-summary .neg strong { color: #be123c; }
  .rpt .ts .sign { margin-top: 26px; }
`;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export function ReportsPrinting({ defaultReport = 'pending_payables_overview', currentUser }) {
  const company = dbService.getCompanyInfo();

  const allowedReports = useMemo(
    () => REPORTS.filter(r => !currentUser || hasPermission(currentUser, `rpt_${r.id}`) ||
      Object.entries(REPORT_ALIASES).some(([alias, target]) => target === r.id && hasPermission(currentUser, `rpt_${alias}`))),
    [currentUser]
  );

  const initial = REPORT_ALIASES[defaultReport] || defaultReport;
  const [reportType, setReportType] = useState(initial);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);

  useEffect(() => {
    setReportType(REPORT_ALIASES[defaultReport] || defaultReport);
  }, [defaultReport]);

  const report = REPORTS.find(r => r.id === reportType) || allowedReports[0] || REPORTS[0];
  const isDirty = JSON.stringify(draft) !== JSON.stringify(applied);

  const data = useMemo(() => buildData(report.id, applied), [report.id, applied]);
  const documentHTML = useMemo(() => buildDocumentHTML(report, data, applied, company), [report, data, applied]);

  const changeReport = (id) => {
    setReportType(id);
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  };

  const setFilter = (key, value) => setDraft(prev => {
    const next = { ...prev, [key]: value };
    if ((key === 'vehicle' || key === 'driver') && prev.trip) next.trip = ''; // trip list depends on these
    return next;
  });

  const handlePrint = () => printHTML({
    title: `${company.name} - ${report.label}`,
    html: `<div class="rpt">${documentHTML}</div>`,
    css: REPORT_CSS,
    orientation: report.orientation,
    margin: report.id === 'trip_detailed_sheet' ? '8mm' : '10mm'
  });

  const groups = [...new Set(allowedReports.map(r => r.group))];

  return (
    <div className="crud-container">
      <div className="crud-header-card">
        <div className="crud-header-left">
          <div className="crud-header-icon"><FileText size={24} /></div>
          <div>
            <h2 className="crud-header-title">Reports & Ledgers</h2>
            <p className="crud-header-sub">Choose a report, set the filters, press Apply, then print or save as PDF.</p>
          </div>
        </div>
        <button onClick={handlePrint} className="btn btn-teal"><Printer size={16} /> Print / Save PDF</button>
      </div>

      <div className="crud-table-card report-filter-card">
        <div className="report-filter-head">
          <Filter size={16} />
          <select value={report.id} onChange={e => changeReport(e.target.value)} className="crud-form-select report-select">
            {groups.map(g => (
              <optgroup key={g} label={g}>
                {allowedReports.filter(r => r.group === g).map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        <form className="report-filter-grid" onSubmit={(ev) => { ev.preventDefault(); setApplied(draft); }}>
          {report.filters.map(key => {
            const def = FILTER_DEFS[key];
            return (
              <div className="crud-form-field" key={key}>
                <label className="crud-form-label">{def.label}</label>
                {def.type === 'date' ? (
                  <input type="date" value={draft[key]} onChange={ev => setFilter(key, ev.target.value)} className="crud-form-input" />
                ) : def.type === 'text' ? (
                  <input type="text" value={draft[key]} placeholder={def.placeholder} onChange={ev => setFilter(key, ev.target.value)} className="crud-form-input" />
                ) : (
                  <select value={draft[key]} onChange={ev => setFilter(key, ev.target.value)} className="crud-form-select">
                    <option value="">All</option>
                    {def.options(draft).map(o => {
                      const value = o.value ?? o;
                      return <option key={value} value={value}>{o.label ?? o}</option>;
                    })}
                  </select>
                )}
              </div>
            );
          })}
          <div className="report-filter-actions">
            <button type="submit" className={`btn ${isDirty ? 'btn-amber' : 'btn-teal'}`}>
              <CheckCircle2 size={15} /> {isDirty ? 'Apply Filters' : 'Filters Applied'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => { setDraft(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); }}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </form>
      </div>

      <div className="report-preview">
        <style>{REPORT_CSS}</style>
        <div className={`report-paper report-paper--${report.orientation}`}>
          <div className="rpt" dangerouslySetInnerHTML={{ __html: documentHTML }} />
        </div>
      </div>
    </div>
  );
}
