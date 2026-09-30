import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Check, AlertTriangle, X, CheckCircle, Fuel, Droplet, Wallet, Receipt } from 'lucide-react';
import { dbService, DRIVER_EXPENSE_FIELDS, toNum } from '../../services/db';

const pkr = (n) => `PKR ${Math.round(toNum(n)).toLocaleString()}`;

export function UpdateDelivery() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [destinations, setDestinations] = useState([]);

  // Search Filters
  const [searchId, setSearchId] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Delivery Modal State
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTrips(dbService.getTable('trips'));
    setVehicles(dbService.getTable('vehicles'));
    setCustomers(dbService.getTable('customers'));
    setDestinations(dbService.getTable('destinations'));
  };

  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      if (searchId.trim() && !t.id.toLowerCase().includes(searchId.trim().toLowerCase())) return false;
      if (filterVehicle && t.vehicle !== filterVehicle) return false;
      if (filterStatus === 'In Transit' && t.unloading_date) return false;
      if (filterStatus === 'Delivered' && !t.unloading_date) return false;
      if (fromDate && t.loading_date < fromDate) return false;
      if (toDate && t.loading_date > toDate) return false;
      return true;
    });
  }, [trips, searchId, filterVehicle, filterStatus, fromDate, toDate]);

  // Freight: gross (rate based) +/- short/surplus = net income receivable from the customer
  const recalcFreight = (t) => {
    const unload = toNum(t.unload_weight);
    const load = toNum(t.load_weight);
    t.difference = load > 0 && unload > 0 ? parseFloat((unload - load).toFixed(2)) : 0;

    let gross = toNum(t.amount);
    if (t.freight_type === 'Per Ton' && t.freight_ton_rate) gross = Math.round(unload * toNum(t.freight_ton_rate));
    else if (t.freight_type === 'Per KM' && t.freight_km_rate) gross = Math.round(toNum(t.distance) * toNum(t.freight_km_rate));
    t.amount = gross;

    const adj = toNum(t.short_surplus_amount);
    const net = t.short_surplus_type === 'Addition / Surplus Bonus (+)' ? gross + adj : gross - adj;
    t.net_income = Math.max(0, net);
    t.total_cost = t.net_income;
    return t;
  };

  // Diesel expense = opening + purchased - remaining (calculated, not typed)
  const recalcDiesel = (t) => {
    const fuelSum = dbService.getTripFuelSummary(t.id, t.remaining_fuel_liters, t.remaining_fuel_cost);
    t.diesel_expense = Math.round(fuelSum.netFuelExpense);
    return fuelSum;
  };

  const openDeliveryModal = (trip) => {
    const mobil = dbService.getTripMobilOilExpense(trip.id);
    const draft = {
      ...trip,
      unloading_date: trip.unloading_date || new Date().toISOString().split('T')[0],
      unload_weight: trip.unload_weight || '',
      unload_pressure: trip.unload_pressure || '',
      difference: trip.difference || 0,
      distance: trip.distance || '',
      remaining_fuel_liters: trip.remaining_fuel_liters ?? '',
      remaining_fuel_cost: trip.remaining_fuel_cost ?? '',
      remaining_cost_manual: Boolean(trip.remaining_fuel_cost),
      freight_type: trip.freight_type || 'Per Ton',
      freight_km_rate: trip.freight_km_rate || '',
      freight_ton_rate: trip.freight_ton_rate || '',
      amount: trip.amount || 0,
      // Mobil oil comes from Engine Oil Usage entries linked to this trip; manual only when none exist
      mobil_oil_expense: mobil.count > 0 ? mobil.amount : (trip.mobil_oil_expense || ''),
      mobil_oil_auto: mobil.count > 0,
      mobil_oil_info: mobil,
      short_surplus_type: trip.short_surplus_type || 'Shortage Penalty (-)',
      short_surplus_amount: trip.short_surplus_amount || '',
      payment_status: trip.payment_status || 'Pending',
      customer: trip.customer && trip.customer !== '-' ? trip.customer : '',
      destination: trip.destination === 'Pending' || trip.destination === '-' ? '' : (trip.destination || ''),
      plant: trip.plant || trip.source || '',
      remarks: trip.remarks || ''
    };
    DRIVER_EXPENSE_FIELDS.forEach(f => { draft[f.key] = trip[f.key] || (f.key === 'sindh_police' ? trip.police || '' : ''); });
    recalcDiesel(draft);
    recalcFreight(draft);
    setSelectedTrip(draft);
  };

  const handleFieldChange = (key, val) => {
    setSelectedTrip(prev => {
      const updated = { ...prev, [key]: val };
      if (key === 'remaining_fuel_cost') updated.remaining_cost_manual = val !== '';
      if (key === 'remaining_fuel_liters' || key === 'remaining_fuel_cost') {
        if (key === 'remaining_fuel_liters' && !updated.remaining_cost_manual) {
          // Value remaining fuel at the trip's average rate until the user types a cost
          const { avgRate } = dbService.getTripFuelSummary(updated.id, val, null);
          updated.remaining_fuel_cost = val === '' ? '' : Math.round(toNum(val) * avgRate);
        }
        recalcDiesel(updated);
      }
      return recalcFreight(updated);
    });
  };

  const settlement = useMemo(
    () => (selectedTrip ? dbService.getTripSettlement(selectedTrip.id, selectedTrip) : null),
    [selectedTrip]
  );
  const fuelSum = useMemo(
    () => (selectedTrip ? dbService.getTripFuelSummary(selectedTrip.id, selectedTrip.remaining_fuel_liters, selectedTrip.remaining_fuel_cost) : null),
    [selectedTrip]
  );

  const handleSaveDelivery = async (e) => {
    e.preventDefault();
    if (!selectedTrip || saving) return;

    const newStatus = selectedTrip.payment_status === 'Completed' ? 'Completed' : 'Delivered';
    const expenseValues = {};
    DRIVER_EXPENSE_FIELDS.forEach(f => { expenseValues[f.key] = toNum(selectedTrip[f.key]); });
    const roadExpenses = Object.values(expenseValues).reduce((s, v) => s + v, 0);

    const deliveryUpdates = {
      unloading_date: selectedTrip.unloading_date,
      customer: selectedTrip.customer,
      destination: selectedTrip.destination || '-',
      unload_weight: toNum(selectedTrip.unload_weight),
      unload_pressure: toNum(selectedTrip.unload_pressure),
      difference: selectedTrip.difference,
      distance: toNum(selectedTrip.distance),
      freight_type: selectedTrip.freight_type,
      freight_km_rate: toNum(selectedTrip.freight_km_rate),
      freight_ton_rate: toNum(selectedTrip.freight_ton_rate),
      amount: toNum(selectedTrip.amount),
      remaining_fuel_liters: toNum(selectedTrip.remaining_fuel_liters),
      remaining_fuel_cost: toNum(selectedTrip.remaining_fuel_cost),
      mobil_oil_expense: toNum(selectedTrip.mobil_oil_expense),
      mobil_oil_source: selectedTrip.mobil_oil_auto ? 'Engine Oil Usage' : 'Manual',
      ...expenseValues,
      police: expenseValues.sindh_police,
      short_surplus_type: selectedTrip.short_surplus_type || 'Shortage Penalty (-)',
      short_surplus_amount: toNum(selectedTrip.short_surplus_amount),
      net_income: toNum(selectedTrip.net_income),
      total_cost: toNum(selectedTrip.net_income),
      other_expenses: roadExpenses,
      fine_amount: roadExpenses,
      payment_status: selectedTrip.payment_status || 'Pending',
      status: newStatus,
      plant: selectedTrip.plant || '-',
      remarks: selectedTrip.remarks || ''
    };

    try {
      setSaving(true);
      const saved = await dbService.updateTripDeliveryWithFuel(selectedTrip.id, deliveryUpdates);
      loadData();
      setSelectedTrip(null);
      const due = toNum(saved?.final_due);
      const carry = toNum(saved?.carry_forward);
      const tail = due > 0 ? ` Final due ${pkr(due)} is now payable to ${saved.vehicle}.` : carry > 0 ? ` ${pkr(carry)} carried forward to the next trip.` : '';
      setToast({ message: `Delivery for ${selectedTrip.id} saved. Net income ${pkr(deliveryUpdates.net_income)} billed to ${deliveryUpdates.customer}.${tail}`, type: 'success' });
      setTimeout(() => window.location.reload(), 1400);
    } catch (err) {
      setToast({ message: `Update Failed: ${err.message || 'Database operation failed'}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const t = selectedTrip;

  return (
    <div className="crud-container">
      <div className="crud-header-card">
        <div className="crud-header-left">
          <div className="crud-header-icon">
            <Clock size={24} />
          </div>
          <div>
            <h2 className="crud-header-title">Update Trip Delivery</h2>
            <p className="crud-header-sub">Record unloading, bill net freight to the customer, and settle the trip advance.</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="crud-table-card" style={{ padding: '16px 20px' }}>
        <div className="crud-form-row" style={{ alignItems: 'flex-end', gap: '12px' }}>
          <div className="crud-form-field" style={{ flex: '1 1 150px' }}>
            <label className="crud-form-label">Search Trip ID</label>
            <input type="text" placeholder="e.g. TRP-001" value={searchId} onChange={e => setSearchId(e.target.value)} className="crud-form-input" />
          </div>
          <div className="crud-form-field" style={{ flex: '1 1 150px' }}>
            <label className="crud-form-label">Vehicle</label>
            <select value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)} className="crud-form-select">
              <option value="">All Vehicles</option>
              {vehicles.map(v => <option key={v.code} value={v.number}>{v.number}</option>)}
            </select>
          </div>
          <div className="crud-form-field" style={{ flex: '1 1 140px' }}>
            <label className="crud-form-label">Delivery Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="crud-form-select">
              <option value="">View All</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
          <div className="crud-form-field" style={{ flex: '1 1 130px' }}>
            <label className="crud-form-label">From Date</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="crud-form-input" />
          </div>
          <div className="crud-form-field" style={{ flex: '1 1 130px' }}>
            <label className="crud-form-label">To Date</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="crud-form-input" />
          </div>
          <button onClick={() => { setSearchId(''); setFilterVehicle(''); setFilterStatus(''); setFromDate(''); setToDate(''); }} className="btn btn-ghost" style={{ height: '38px' }}>
            Reset
          </button>
        </div>
      </div>

      {/* Trips Table */}
      <div className="crud-table-card">
        <div className="crud-table-wrapper">
          <table className="crud-table">
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Vehicle</th>
                <th>Load Date</th>
                <th>Load Wt (T)</th>
                <th>Unload Date</th>
                <th>Customer</th>
                <th>Destination</th>
                <th>Diff (T)</th>
                <th style={{ textAlign: 'right' }}>Net Income</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No trips found.</td>
                </tr>
              ) : (
                filteredTrips.map(trip => (
                  <tr key={trip.id}>
                    <td className="crud-td-code">{trip.id}</td>
                    <td><strong>{trip.vehicle}</strong></td>
                    <td>{trip.loading_date}</td>
                    <td>{trip.load_weight}</td>
                    <td>{trip.unloading_date || <span style={{ color: '#94a3b8' }}>Pending</span>}</td>
                    <td>{trip.customer && trip.customer !== '-' ? trip.customer : '-'}</td>
                    <td>{trip.destination}</td>
                    <td>
                      {trip.difference ? (
                        <span style={{ color: trip.difference < 0 ? '#e11d48' : '#0d9488', fontWeight: 700 }}>
                          {trip.difference > 0 ? '+' : ''}{trip.difference} {trip.difference < 0 ? '(Short)' : '(Surplus)'}
                        </span>
                      ) : <span style={{ color: '#64748b' }}>0</span>}
                    </td>
                    <td className="num-cell">{trip.unloading_date ? pkr(trip.net_income || trip.total_cost) : '-'}</td>
                    <td>
                      <span className={`badge ${trip.unloading_date ? 'badge-teal' : 'badge-amber'}`}>
                        {trip.unloading_date ? (trip.status || 'Delivered') : 'In Transit'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => openDeliveryModal(trip)} className="btn btn-teal btn-sm">
                        <CheckCircle size={13} /> {trip.unloading_date ? 'Edit Delivery' : 'Update Delivery'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Delivery Modal */}
      {t && (
        <div className="modal-overlay">
          <div className="modal-box modal-box--wide">
            <div className="modal-header">
              <span className="modal-title">Update Delivery – <span style={{ fontFamily: 'monospace', color: '#0d9488' }}>{t.id}</span></span>
              <button onClick={() => setSelectedTrip(null)} className="modal-close-btn"><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveDelivery}>
              <div className="modal-body">
                <div className="crud-form">
                  {/* Read-only dispatch summary */}
                  <div className="summary-strip">
                    <div><span>Vehicle</span><strong>{t.vehicle}</strong></div>
                    <div><span>Driver</span><strong>{t.driver && t.driver !== '-' ? t.driver : '—'}</strong></div>
                    <div><span>Supplier</span><strong>{t.supplier || t.vendor || '—'}</strong></div>
                    <div><span>Source</span><strong>{t.source || '—'}</strong></div>
                    <div><span>Load Date</span><strong>{t.loading_date}</strong></div>
                    <div><span>Load Wt / PSI</span><strong>{t.load_weight} T / {t.load_pressure || 0}</strong></div>
                  </div>

                  {/* 1. Delivery */}
                  <div className="form-section">
                    <div className="form-section-title">1. Delivery Details</div>
                    <div className="crud-form-row">
                      <div className="crud-form-field">
                        <label className="crud-form-label"><span>Unloading Date</span> <span className="crud-required-star">*</span></label>
                        <input type="date" value={t.unloading_date} onChange={e => handleFieldChange('unloading_date', e.target.value)} className="crud-form-input" required />
                      </div>
                      <div className="crud-form-field">
                        <label className="crud-form-label"><span>Customer (Receivable)</span> <span className="crud-required-star">*</span></label>
                        <select value={t.customer} onChange={e => handleFieldChange('customer', e.target.value)} className="crud-form-select" required>
                          <option value="">Select Customer</option>
                          {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="crud-form-field">
                        <label className="crud-form-label"><span>Destination Terminal</span> <span className="crud-required-star">*</span></label>
                        <select value={t.destination} onChange={e => handleFieldChange('destination', e.target.value)} className="crud-form-select" required>
                          <option value="">Select Destination</option>
                          {destinations.map(d => <option key={d.id} value={d.name}>{d.name}{d.city ? ` (${d.city})` : ''}</option>)}
                        </select>
                      </div>
                      <div className="crud-form-field">
                        <label className="crud-form-label"><span>Plant / Receiving Station</span></label>
                        <input type="text" placeholder="e.g. KKP Gate 2" value={t.plant} onChange={e => handleFieldChange('plant', e.target.value)} className="crud-form-input" />
                      </div>
                    </div>

                    <div className="crud-form-row">
                      <div className="crud-form-field">
                        <label className="crud-form-label"><span>Unload Weight (Tons)</span> <span className="crud-required-star">*</span></label>
                        <input type="number" step="0.01" placeholder="e.g. 28.35" value={t.unload_weight} onChange={e => handleFieldChange('unload_weight', e.target.value)} className="crud-form-input" required />
                      </div>
                      <div className="crud-form-field">
                        <label className="crud-form-label"><span>Unload Pressure</span></label>
                        <input type="number" placeholder="e.g. 30" value={t.unload_pressure} onChange={e => handleFieldChange('unload_pressure', e.target.value)} className="crud-form-input" />
                      </div>
                      <div className="crud-form-field">
                        <label className="crud-form-label"><span>Weight Diff (Short/Surplus)</span></label>
                        <div className={`calc-field ${t.difference < 0 ? 'calc-field--neg' : t.difference > 0 ? 'calc-field--pos' : ''}`}>
                          {t.difference < 0 ? `${t.difference} T (Short)` : t.difference > 0 ? `+${t.difference} T (Surplus)` : '0.00 T'}
                        </div>
                      </div>
                      <div className="crud-form-field">
                        <label className="crud-form-label"><span>Short / Surplus Adjustment</span></label>
                        <select value={t.short_surplus_type} onChange={e => handleFieldChange('short_surplus_type', e.target.value)} className="crud-form-select">
                          <option value="Shortage Penalty (-)">Shortage Penalty (-)</option>
                          <option value="Addition / Surplus Bonus (+)">Surplus Bonus (+)</option>
                        </select>
                      </div>
                      <div className="crud-form-field">
                        <label className="crud-form-label"><span>Short / Surplus Amt (PKR)</span> <span className="crud-optional-tag">(Optional)</span></label>
                        <input type="number" placeholder="e.g. 5000" value={t.short_surplus_amount} onChange={e => handleFieldChange('short_surplus_amount', e.target.value)} className="crud-form-input" />
                      </div>
                    </div>
                  </div>

                  {/* 2. Freight & Income */}
                  <div className="form-section">
                    <div className="form-section-title"><Receipt size={15} /> 2. Freight & Customer Income</div>
                    <div className="crud-form-row">
                      <div className="crud-form-field">
                        <label className="crud-form-label"><span>Distance (KM)</span> <span className="crud-optional-tag">(Optional)</span></label>
                        <input type="number" placeholder="e.g. 1250" value={t.distance} onChange={e => handleFieldChange('distance', e.target.value)} className="crud-form-input" />
                      </div>
                      <div className="crud-form-field">
                        <label className="crud-form-label"><span>Freight Type</span></label>
                        <select value={t.freight_type} onChange={e => handleFieldChange('freight_type', e.target.value)} className="crud-form-select">
                          <option value="Per Ton">Per Ton</option>
                          <option value="Per KM">Per KM</option>
                          <option value="Monthly">Monthly</option>
                        </select>
                      </div>
                      <div className="crud-form-field">
                        <label className="crud-form-label"><span>Freight Rate (PKR)</span></label>
                        <input
                          type="number" placeholder="Rate"
                          value={t.freight_type === 'Per Ton' ? t.freight_ton_rate : t.freight_km_rate}
                          onChange={e => handleFieldChange(t.freight_type === 'Per Ton' ? 'freight_ton_rate' : 'freight_km_rate', e.target.value)}
                          className="crud-form-input"
                          disabled={t.freight_type === 'Monthly'}
                        />
                      </div>
                      <div className="crud-form-field">
                        <label className="crud-form-label"><span>Gross Freight Amount</span></label>
                        <input type="number" value={t.amount} onChange={e => handleFieldChange('amount', e.target.value)} className="crud-form-input" style={{ fontWeight: 700 }} />
                      </div>
                      <div className="crud-form-field">
                        <label className="crud-form-label"><span>Net Income (Receivable from Customer)</span></label>
                        <div className="calc-field calc-field--pos calc-field--big">{pkr(t.net_income)}</div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Fuel & Mobil Oil */}
                  <div className="form-section">
                    <div className="form-section-title"><Fuel size={15} /> 3. Diesel & Mobil Oil</div>
                    <div className="crud-form-row">
                      <div className="crud-form-field">
                        <label className="crud-form-label"><span>Opening Fuel</span></label>
                        <div className="calc-field">{fuelSum.openingLiters.toFixed(1)} L · {pkr(fuelSum.openingCost)}</div>
                      </div>
                      <div className="crud-form-field">
                        <label className="crud-form-label"><span>Purchased in Trip</span></label>
                        <div className="calc-field">{fuelSum.purchasedLiters.toFixed(1)} L · {pkr(fuelSum.purchasedCost)}</div>
                      </div>
                      <div className="crud-form-field">
                        <label className="crud-form-label"><span>Remaining Fuel at Trip End (L)</span></label>
                        <input type="number" step="0.1" placeholder="e.g. 50" value={t.remaining_fuel_liters} onChange={e => handleFieldChange('remaining_fuel_liters', e.target.value)} className="crud-form-input" />
                      </div>
                      <div className="crud-form-field">
                        <label className="crud-form-label"><span>Remaining Fuel Cost (PKR)</span></label>
                        <input type="number" placeholder="Auto at average rate" value={t.remaining_fuel_cost} onChange={e => handleFieldChange('remaining_fuel_cost', e.target.value)} className="crud-form-input" />
                      </div>
                    </div>
                    <div className="crud-form-row">
                      <div className="crud-form-field">
                        <label className="crud-form-label"><span>Diesel Expense (Consumed)</span></label>
                        <div className="calc-field calc-field--amber">{pkr(t.diesel_expense)}</div>
                        <span className="crud-field-hint">Opening + purchased − remaining. Remaining fuel is carried to {t.vehicle}'s next trip.</span>
                      </div>
                      <div className="crud-form-field">
                        <label className="crud-form-label"><Droplet size={13} /> <span>Mobil Oil Expense</span></label>
                        {t.mobil_oil_auto ? (
                          <>
                            <div className="calc-field calc-field--blue">{pkr(t.mobil_oil_expense)}</div>
                            <span className="crud-field-hint">
                              From {t.mobil_oil_info.count} oil usage entr{t.mobil_oil_info.count === 1 ? 'y' : 'ies'} ({t.mobil_oil_info.liters} L at average purchase rate)
                            </span>
                          </>
                        ) : (
                          <>
                            <input type="number" placeholder="0" value={t.mobil_oil_expense} onChange={e => handleFieldChange('mobil_oil_expense', e.target.value)} className="crud-form-input" />
                            <span className="crud-field-hint">No oil usage entry linked to this trip. Enter manually.</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4. Driver-paid trip expenses */}
                  <div className="form-section">
                    <div className="form-section-title">
                      <span>4. Trip Expenses (paid from advance)</span>
                      <span className="form-section-total">Total: {pkr(settlement?.expenseTotal)}</span>
                    </div>
                    <div className="expense-grid">
                      {DRIVER_EXPENSE_FIELDS.map(f => (
                        <div className="crud-form-field" key={f.key}>
                          <label className="crud-form-label"><span>{f.label}</span></label>
                          <input type="number" placeholder="0" value={t[f.key]} onChange={e => handleFieldChange(f.key, e.target.value)} className="crud-form-input" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 5. Advance settlement */}
                  {settlement && (
                    <div className="form-section settlement-box">
                      <div className="form-section-title"><Wallet size={15} /> 5. Advance Settlement ({t.vehicle})</div>
                      <div className="settlement-lines">
                        <div><span>Previous carry-forward advance</span><strong>{pkr(settlement.previousBalance)}</strong></div>
                        <div>
                          <span>+ Advances paid for this trip ({settlement.advances.length} voucher{settlement.advances.length === 1 ? '' : 's'})</span>
                          <strong>{pkr(settlement.advanceTotal)}</strong>
                        </div>
                        {settlement.advances.map(a => (
                          <div key={a.id} className="settlement-sub"><span>{a.id} · {a.date} · {a.paid_to}</span><span>{pkr(a.amount)}</span></div>
                        ))}
                        <div className="settlement-total"><span>= Total advance available</span><strong>{pkr(settlement.totalAdvance)}</strong></div>
                        <div><span>− Trip expenses</span><strong>{pkr(settlement.expenseTotal)}</strong></div>
                        <div className={`settlement-result ${settlement.balance < 0 ? 'is-due' : 'is-surplus'}`}>
                          <span>FINAL DUE / BALANCE</span>
                          <strong>{settlement.balance < 0 ? `${pkr(settlement.finalDue)} payable to ${t.vehicle}` : settlement.balance > 0 ? `${pkr(settlement.carryForward)} carried forward` : 'Nil'}</strong>
                        </div>
                      </div>
                      <span className="crud-field-hint">
                        {settlement.balance < 0
                          ? 'The final due becomes a payable. Pay it from Payment Entry → Vehicles/Drivers → Final Due Settlement.'
                          : 'Any surplus becomes the opening advance of this vehicle\'s next trip.'}
                      </span>
                    </div>
                  )}

                  <div className="crud-form-row">
                    <div className="crud-form-field">
                      <label className="crud-form-label"><span>Trip Payment Status</span></label>
                      <select value={t.payment_status} onChange={e => handleFieldChange('payment_status', e.target.value)} className="crud-form-select">
                        <option value="Pending">Pending</option>
                        <option value="In Process">In Process</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div className="crud-form-field" style={{ flex: '2 1 300px' }}>
                      <label className="crud-form-label"><span>Delivery Remarks</span></label>
                      <input type="text" placeholder="Unloading notes..." value={t.remarks} onChange={e => handleFieldChange('remarks', e.target.value)} className="crud-form-input" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setSelectedTrip(null)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-teal" disabled={saving}>{saving ? 'Saving…' : 'Save Delivery'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast-box ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
