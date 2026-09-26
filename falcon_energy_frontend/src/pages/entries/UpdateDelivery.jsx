import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Search, Check, AlertTriangle, X, CheckCircle, Fuel } from 'lucide-react';
import { dbService } from '../../services/db';

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
      if (filterStatus && (t.payment_status || 'Pending') !== filterStatus) return false;
      if (fromDate && t.loading_date < fromDate) return false;
      if (toDate && t.loading_date > toDate) return false;
      return true;
    });
  }, [trips, searchId, filterVehicle, filterStatus, fromDate, toDate]);

  const openDeliveryModal = (trip) => {
    setSelectedTrip({
      ...trip,
      unloading_date: trip.unloading_date || new Date().toISOString().split('T')[0],
      unload_weight: trip.unload_weight || '',
      unload_pressure: trip.unload_pressure || '',
      difference: trip.difference || 0,
      distance: trip.distance || '',
      remaining_fuel_liters: trip.remaining_fuel_liters !== undefined && trip.remaining_fuel_liters !== null ? trip.remaining_fuel_liters : '',
      remaining_fuel_cost: trip.remaining_fuel_cost !== undefined && trip.remaining_fuel_cost !== null ? trip.remaining_fuel_cost : '',
      freight_type: trip.freight_type || 'Per Ton',
      freight_km_rate: trip.freight_km_rate || '',
      freight_ton_rate: trip.freight_ton_rate || '',
      amount: trip.amount || 0,
      // Optional Expense Fields
      diesel_expense: trip.diesel_expense || '',
      mobil_oil_expense: trip.mobil_oil_expense || '',
      tyre_expense: trip.tyre_expense || '',
      traffic_police: trip.traffic_police || '',
      custom_police: trip.custom_police || '',
      excise_police: trip.excise_police || '',
      sindh_police: trip.sindh_police || trip.police || '',
      service_grease: trip.service_grease || '',
      washing_filter: trip.washing_filter || '',
      secretary_challan: trip.secretary_challan || '',
      security_guard: trip.security_guard || '',
      weighbridge_deduction: trip.weighbridge_deduction || '',
      driver_salary: trip.driver_salary || '',
      minor_expenses: trip.minor_expenses || '',
      scale_fee: trip.scale_fee || '',
      rickshaw_rent: trip.rickshaw_rent || '',
      food_expense: trip.food_expense || '',
      toll_tax: trip.toll_tax || '',
      workshop_repair: trip.workshop_repair || '',
      loading_charge: trip.loading_charge || '',
      kanda_scale: trip.kanda_scale || '',
      munshiana: trip.munshiana || '',
      fine_amount: trip.fine_amount || 0,
      other_expenses: trip.other_expenses || 0,
      total_cost: trip.total_cost || 0,
      payment_status: trip.payment_status || 'Pending',
      customer: trip.customer || '',
      destination: trip.destination === 'Pending' ? '' : trip.destination,
      plant: trip.plant || trip.source || '',
      remarks: trip.remarks || ''
    });
  };

  // Compute total of all optional expenses
  const calcOptionalExpenses = (updatedTrip) => {
    const fields = [
      'diesel_expense', 'mobil_oil_expense',
      'tyre_expense', 'traffic_police', 'custom_police', 'excise_police', 'sindh_police',
      'service_grease', 'washing_filter', 'secretary_challan', 'security_guard', 'weighbridge_deduction',
      'driver_salary', 'minor_expenses', 'scale_fee', 'rickshaw_rent', 'food_expense',
      'toll_tax', 'workshop_repair', 'loading_charge', 'kanda_scale', 'munshiana'
    ];
    let sum = 0;
    fields.forEach(f => {
      const val = parseFloat(updatedTrip[f]);
      if (!isNaN(val) && val > 0) sum += val;
    });
    return sum;
  };

  // Recalculate difference, fuel expense, and totals
  const handleFieldChange = (key, val) => {
    setSelectedTrip(prev => {
      const updated = { ...prev, [key]: val };

      // Calculate trip fuel accounting (Opening + In-Trip Purchases - Remaining Fuel)
      const fuelSum = dbService.getTripFuelSummary(updated.id, updated.remaining_fuel_liters, updated.remaining_fuel_cost);
      if (key === 'remaining_fuel_liters' && val !== '' && (!updated.remaining_fuel_cost || updated.remaining_fuel_cost === 0)) {
        updated.remaining_fuel_cost = Math.round(fuelSum.remainingCost);
      }
      updated.diesel_expense = Math.round(fuelSum.netFuelExpense);

      // Calculate difference = unload_weight - load_weight (Negative = Short, Positive = Surplus)
      const load = parseFloat(updated.load_weight) || 0;
      const unload = parseFloat(updated.unload_weight) || 0;
      updated.difference = (load > 0 && unload > 0) ? parseFloat((unload - load).toFixed(2)) : 0;

      // Auto compute freight amount if freight rates entered
      const type = updated.freight_type;
      let calculatedAmt = parseFloat(updated.amount) || 0;
      if (type === 'Per Ton' && updated.freight_ton_rate) {
        calculatedAmt = Math.round(unload * parseFloat(updated.freight_ton_rate));
      } else if (type === 'Per KM' && updated.freight_km_rate) {
        const dist = parseFloat(updated.distance) || 0;
        calculatedAmt = Math.round(dist * parseFloat(updated.freight_km_rate));
      }
      updated.amount = calculatedAmt;

      const optExpensesSum = calcOptionalExpenses(updated);
      const manualOtherExp = parseFloat(updated.other_expenses) || 0;
      const totalOtherExp = Math.max(optExpensesSum, manualOtherExp);

      updated.computed_other_expenses = optExpensesSum > 0 ? optExpensesSum : manualOtherExp;
      updated.total_cost = Math.max(0, calculatedAmt - totalOtherExp);

      return updated;
    });
  };

  const handleSaveDelivery = async (e) => {
    e.preventDefault();
    if (!selectedTrip) return;

    // Requirement 11: When delivery is updated, trip status should change (Delivered or Completed)
    const newStatus = selectedTrip.payment_status === 'Completed' ? 'Completed' : 'Delivered';
    const computedOther = calcOptionalExpenses(selectedTrip) || parseFloat(selectedTrip.other_expenses) || 0;

    const deliveryUpdates = {
      unloading_date: selectedTrip.unloading_date,
      customer: selectedTrip.customer || '-',
      destination: selectedTrip.destination || '-',
      unload_weight: parseFloat(selectedTrip.unload_weight) || 0,
      unload_pressure: parseFloat(selectedTrip.unload_pressure) || 0,
      difference: selectedTrip.difference,
      distance: parseFloat(selectedTrip.distance) || 0,
      freight_type: selectedTrip.freight_type,
      freight_km_rate: parseFloat(selectedTrip.freight_km_rate) || 0,
      freight_ton_rate: parseFloat(selectedTrip.freight_ton_rate) || 0,
      amount: parseFloat(selectedTrip.amount) || 0,
      remaining_fuel_liters: parseFloat(selectedTrip.remaining_fuel_liters) || 0,
      remaining_fuel_cost: parseFloat(selectedTrip.remaining_fuel_cost) || 0,
      // Persist optional fields including Diesel and Mobil Oil
      diesel_expense: parseFloat(selectedTrip.diesel_expense) || 0,
      mobil_oil_expense: parseFloat(selectedTrip.mobil_oil_expense) || 0,
      tyre_expense: parseFloat(selectedTrip.tyre_expense) || 0,
      traffic_police: parseFloat(selectedTrip.traffic_police) || 0,
      custom_police: parseFloat(selectedTrip.custom_police) || 0,
      excise_police: parseFloat(selectedTrip.excise_police) || 0,
      sindh_police: parseFloat(selectedTrip.sindh_police) || 0,
      police: parseFloat(selectedTrip.sindh_police) || 0,
      service_grease: parseFloat(selectedTrip.service_grease) || 0,
      washing_filter: parseFloat(selectedTrip.washing_filter) || 0,
      secretary_challan: parseFloat(selectedTrip.secretary_challan) || 0,
      security_guard: parseFloat(selectedTrip.security_guard) || 0,
      weighbridge_deduction: parseFloat(selectedTrip.weighbridge_deduction) || 0,
      driver_salary: parseFloat(selectedTrip.driver_salary) || 0,
      minor_expenses: parseFloat(selectedTrip.minor_expenses) || 0,
      scale_fee: parseFloat(selectedTrip.scale_fee) || 0,
      rickshaw_rent: parseFloat(selectedTrip.rickshaw_rent) || 0,
      food_expense: parseFloat(selectedTrip.food_expense) || 0,
      toll_tax: parseFloat(selectedTrip.toll_tax) || 0,
      workshop_repair: parseFloat(selectedTrip.workshop_repair) || 0,
      loading_charge: parseFloat(selectedTrip.loading_charge) || 0,
      kanda_scale: parseFloat(selectedTrip.kanda_scale) || 0,
      munshiana: parseFloat(selectedTrip.munshiana) || 0,

      other_expenses: computedOther,
      fine_amount: computedOther,
      total_cost: parseFloat(selectedTrip.total_cost) || 0,
      payment_status: selectedTrip.payment_status || 'Pending',
      status: newStatus,
      plant: selectedTrip.plant || '-',
      remarks: selectedTrip.remarks || ''
    };

    try {
      await dbService.updateTripDeliveryWithFuel(selectedTrip.id, deliveryUpdates);
      loadData();
      setSelectedTrip(null);
      setToast({ message: `Delivery info for Trip ${selectedTrip.id} saved to database! Status set to '${newStatus}'.`, type: 'success' });
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      setToast({ message: `Update Failed: ${err.message || 'Database operation failed'}`, type: 'error' });
    }
  };

  return (
    <div className="crud-container">
      <div className="crud-header-card">
        <div className="crud-header-left">
          <div className="crud-header-icon">
            <Clock size={24} />
          </div>
          <div>
            <h2 className="crud-header-title">Update Trip Delivery</h2>
            <p className="crud-header-sub">Complete unloading details, weight difference calculations, and freight billing upon arrival.</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="crud-table-card" style={{ padding: '16px 20px' }}>
        <div className="crud-form-row" style={{ alignItems: 'flex-end', gap: '12px' }}>
          <div className="crud-form-field" style={{ flex: '1 1 150px' }}>
            <label className="crud-form-label">Search Trip ID</label>
            <input
              type="text"
              placeholder="e.g. TRP-001"
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              className="crud-form-input"
            />
          </div>

          <div className="crud-form-field" style={{ flex: '1 1 150px' }}>
            <label className="crud-form-label">Vehicle</label>
            <select value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)} className="crud-form-select">
              <option value="">All Vehicles</option>
              {vehicles.map(v => (
                <option key={v.code} value={v.number}>{v.number}</option>
              ))}
            </select>
          </div>

          <div className="crud-form-field" style={{ flex: '1 1 140px' }}>
            <label className="crud-form-label">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="crud-form-select">
              <option value="">View All</option>
              <option value="Pending">Pending</option>
              <option value="In Process">In Process</option>
              <option value="Completed">Completed</option>
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
                <th>Loading Date</th>
                <th>Load Wt (Tons)</th>
                <th>Unload Date</th>
                <th>Destination</th>
                <th>Unload Wt</th>
                <th>Diff (Tons)</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No pending deliveries found.
                  </td>
                </tr>
              ) : (
                filteredTrips.map(trip => {
                  const statusClass = trip.payment_status === 'Completed' ? 'badge badge-teal' : trip.payment_status === 'In Process' ? 'badge badge-amber' : 'badge badge-rose';
                  return (
                    <tr key={trip.id}>
                      <td className="crud-td-code">{trip.id}</td>
                      <td><strong>{trip.vehicle}</strong></td>
                      <td>{trip.loading_date}</td>
                      <td>{trip.load_weight} T</td>
                      <td>{trip.unloading_date || <span style={{ color: '#94a3b8' }}>Pending</span>}</td>
                      <td>{trip.destination}</td>
                      <td>{trip.unload_weight ? `${trip.unload_weight} T` : '-'}</td>
                      <td>
                        {trip.difference ? (
                          trip.difference < 0 ? (
                            <span style={{ color: '#e11d48', fontWeight: 'bold' }}>{trip.difference} T (Short)</span>
                          ) : (
                            <span style={{ color: '#0d9488', fontWeight: 'bold' }}>+{trip.difference} T (Surplus)</span>
                          )
                        ) : (
                          <span style={{ color: '#64748b' }}>0 T</span>
                        )}
                      </td>
                      <td><span className={statusClass}>{trip.payment_status || 'Pending'}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => openDeliveryModal(trip)} className="btn btn-teal" style={{ padding: '5px 12px', fontSize: '11px' }}>
                          <CheckCircle size={13} /> Update Delivery
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Delivery Modal */}
      {selectedTrip && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">Update Delivery Details – <span style={{ fontFamily: 'monospace', color: '#0d9488' }}>{selectedTrip.id}</span></span>
              <button onClick={() => setSelectedTrip(null)} className="modal-close-btn"><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveDelivery}>
              <div className="modal-body">
                <div className="crud-form">
                  {/* Read-Only Dispatch Summary */}
                  <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div>Vehicle: <strong>{selectedTrip.vehicle}</strong> | Vendor: <strong>{selectedTrip.vendor}</strong></div>
                    <div>Load Wt: <strong style={{ color: '#0d9488' }}>{selectedTrip.load_weight} T</strong> | Pressure: <strong>{selectedTrip.load_pressure} PSI</strong></div>
                  </div>

                  <div className="crud-form-row">
                    <div className="crud-form-field" style={{ flex: '1 1 calc(50% - 7px)' }}>
                      <label className="crud-form-label"><span>Unloading Date</span> <span className="crud-required-star">*</span></label>
                      <input
                        type="date"
                        value={selectedTrip.unloading_date}
                        onChange={e => handleFieldChange('unloading_date', e.target.value)}
                        className="crud-form-input"
                        required
                      />
                    </div>

                    <div className="crud-form-field" style={{ flex: '1 1 calc(50% - 7px)' }}>
                      <label className="crud-form-label"><span>Customer</span> <span className="crud-required-star">*</span></label>
                      <select
                        value={selectedTrip.customer}
                        onChange={e => handleFieldChange('customer', e.target.value)}
                        className="crud-form-select"
                        required
                      >
                        <option value="">Select Customer</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="crud-form-row">
                    <div className="crud-form-field" style={{ flex: '1 1 calc(50% - 7px)' }}>
                      <label className="crud-form-label"><span>Destination Terminal</span> <span className="crud-required-star">*</span></label>
                      <select
                        value={selectedTrip.destination}
                        onChange={e => handleFieldChange('destination', e.target.value)}
                        className="crud-form-select"
                        required
                      >
                        <option value="">Select Destination</option>
                        {destinations.map(d => (
                          <option key={d.id} value={d.name}>{d.name} ({d.city})</option>
                        ))}
                      </select>
                    </div>

                    <div className="crud-form-field" style={{ flex: '1 1 calc(50% - 7px)' }}>
                      <label className="crud-form-label"><span>Plant / Receiving Station</span> <span className="crud-optional-tag">(Optional)</span></label>
                      <input
                        type="text"
                        placeholder="e.g. KKP Gate 2"
                        value={selectedTrip.plant}
                        onChange={e => handleFieldChange('plant', e.target.value)}
                        className="crud-form-input"
                      />
                    </div>
                  </div>

                  <div className="crud-form-row">
                    <div className="crud-form-field" style={{ flex: '1 1 calc(33.3% - 8px)' }}>
                      <label className="crud-form-label"><span>Unload Weight (Tons)</span> <span className="crud-required-star">*</span></label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 28.35"
                        value={selectedTrip.unload_weight}
                        onChange={e => handleFieldChange('unload_weight', e.target.value)}
                        className="crud-form-input"
                        required
                      />
                    </div>

                    <div className="crud-form-field" style={{ flex: '1 1 calc(33.3% - 8px)' }}>
                      <label className="crud-form-label"><span>Unload Pressure</span></label>
                      <input
                        type="number"
                        placeholder="e.g. 30"
                        value={selectedTrip.unload_pressure}
                        onChange={e => handleFieldChange('unload_pressure', e.target.value)}
                        className="crud-form-input"
                      />
                    </div>

                    <div className="crud-form-field" style={{ flex: '1 1 calc(33.3% - 8px)' }}>
                      <label className="crud-form-label">
                        <span>Weight Diff (Short/Surplus)</span>
                      </label>
                      <div className="crud-form-input" style={{
                        background: selectedTrip.difference < 0 ? '#fff1f2' : selectedTrip.difference > 0 ? '#f0fdfa' : '#f8fafc',
                        color: selectedTrip.difference < 0 ? '#e11d48' : selectedTrip.difference > 0 ? '#0d9488' : '#475569',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {selectedTrip.difference < 0
                          ? `${selectedTrip.difference} T (Short)`
                          : selectedTrip.difference > 0
                          ? `+${selectedTrip.difference} T (Surplus)`
                          : '0.00 T'}
                      </div>
                    </div>
                  </div>

                  <div className="crud-form-row">
                    <div className="crud-form-field" style={{ flex: '1 1 calc(33.3% - 8px)' }}>
                      <label className="crud-form-label"><span>Distance (KM)</span> <span className="crud-optional-tag">(Optional)</span></label>
                      <input
                        type="number"
                        placeholder="e.g. 1250 (Optional)"
                        value={selectedTrip.distance}
                        onChange={e => handleFieldChange('distance', e.target.value)}
                        className="crud-form-input"
                      />
                    </div>

                    <div className="crud-form-field" style={{ flex: '1 1 calc(33.3% - 8px)' }}>
                      <label className="crud-form-label"><span>Freight Type</span></label>
                      <select
                        value={selectedTrip.freight_type}
                        onChange={e => handleFieldChange('freight_type', e.target.value)}
                        className="crud-form-select"
                      >
                        <option value="Per Ton">Per Ton</option>
                        <option value="Per KM">Per KM</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </div>

                    <div className="crud-form-field" style={{ flex: '1 1 calc(33.3% - 8px)' }}>
                      <label className="crud-form-label"><span>Freight Rate (PKR)</span></label>
                      <input
                        type="number"
                        placeholder="Rate"
                        value={selectedTrip.freight_type === 'Per Ton' ? selectedTrip.freight_ton_rate : selectedTrip.freight_km_rate}
                        onChange={e => handleFieldChange(selectedTrip.freight_type === 'Per Ton' ? 'freight_ton_rate' : 'freight_km_rate', e.target.value)}
                        className="crud-form-input"
                      />
                    </div>
                  </div>

                  {/* Trip Fuel & Carry-Forward Accounting Section */}
                  {selectedTrip && (() => {
                    const fuelSum = dbService.getTripFuelSummary(selectedTrip.id, selectedTrip.remaining_fuel_liters, selectedTrip.remaining_fuel_cost);
                    return (
                      <div style={{ marginTop: '16px', border: '1px solid #99f6e4', borderRadius: '10px', padding: '14px 16px', background: '#f0fdfa' }}>
                        <div style={{ fontWeight: '800', color: '#0d9488', fontSize: '13px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Fuel size={16} /> Trip Fuel & Carry-Forward Accounting
                          </span>
                          <span style={{ fontSize: '12px', background: '#ccfbf1', color: '#0f766e', padding: '4px 10px', borderRadius: '6px', fontWeight: '800' }}>
                            Net Trip Diesel Expense: PKR {fuelSum.netFuelExpense.toLocaleString()}
                          </span>
                        </div>

                        <div className="crud-form-row" style={{ gap: '12px', alignItems: 'flex-start' }}>
                          <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                            <label className="crud-form-label"><span>Opening Fuel (L)</span></label>
                            <input type="text" readOnly value={`${fuelSum.openingLiters.toFixed(1)} L (PKR ${fuelSum.openingCost.toLocaleString()})`} className="crud-form-input" style={{ background: '#e2e8f0', cursor: 'not-allowed', fontWeight: 'bold' }} />
                          </div>
                          <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                            <label className="crud-form-label"><span>Purchased in Trip (L)</span></label>
                            <input type="text" readOnly value={`${fuelSum.purchasedLiters.toFixed(1)} L (PKR ${fuelSum.purchasedCost.toLocaleString()})`} className="crud-form-input" style={{ background: '#e2e8f0', cursor: 'not-allowed', fontWeight: 'bold' }} />
                          </div>
                          <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                            <label className="crud-form-label"><span>Remaining Fuel at Trip End (L)</span></label>
                            <input
                              type="number"
                              step="0.1"
                              placeholder="e.g. 50"
                              value={selectedTrip.remaining_fuel_liters ?? ''}
                              onChange={e => handleFieldChange('remaining_fuel_liters', e.target.value)}
                              className="crud-form-input"
                              style={{ borderColor: '#0d9488', fontWeight: 'bold', background: '#ffffff' }}
                            />
                          </div>
                          <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                            <label className="crud-form-label"><span>Remaining Fuel Cost (PKR)</span></label>
                            <input
                              type="number"
                              placeholder="e.g. 14000"
                              value={selectedTrip.remaining_fuel_cost ?? ''}
                              onChange={e => handleFieldChange('remaining_fuel_cost', e.target.value)}
                              className="crud-form-input"
                              style={{ borderColor: '#0d9488', fontWeight: 'bold', background: '#ffffff' }}
                            />
                          </div>
                        </div>
                        <p style={{ fontSize: '11px', color: '#0f766e', marginTop: '6px', margin: 0 }}>
                          ℹ️ Remaining fuel value (PKR {(parseFloat(selectedTrip.remaining_fuel_cost) || fuelSum.remainingCost).toLocaleString()}) will be deducted from this trip's expense and carried forward as Opening Fuel to vehicle <strong>{selectedTrip.vehicle}</strong>'s next trip.
                        </p>
                      </div>
                    );
                  })()}

                  {/* Optional Trip Expenses Accordion / Section */}
                  <div style={{ marginTop: '16px', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 16px', background: '#f8fafc' }}>
                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '13px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Optional Trip Expenses (Trip Sheet Report Fields)</span>
                      <span style={{ fontSize: '11px', color: '#0d9488', fontWeight: 'bold' }}>
                        Total Optional: PKR {(calcOptionalExpenses(selectedTrip) || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="crud-form-row">
                      <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                        <label className="crud-form-label"><span>Diesel Expense</span></label>
                        <input type="number" placeholder="0" value={selectedTrip.diesel_expense} onChange={e => handleFieldChange('diesel_expense', e.target.value)} className="crud-form-input" />
                      </div>
                      <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                        <label className="crud-form-label"><span>Mobil Oil Expense</span></label>
                        <input type="number" placeholder="0" value={selectedTrip.mobil_oil_expense} onChange={e => handleFieldChange('mobil_oil_expense', e.target.value)} className="crud-form-input" />
                      </div>
                      <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                        <label className="crud-form-label"><span>Tyre Expense</span></label>
                        <input type="number" placeholder="0" value={selectedTrip.tyre_expense} onChange={e => handleFieldChange('tyre_expense', e.target.value)} className="crud-form-input" />
                      </div>
                      <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                        <label className="crud-form-label"><span>Traffic Police</span></label>
                        <input type="number" placeholder="0" value={selectedTrip.traffic_police} onChange={e => handleFieldChange('traffic_police', e.target.value)} className="crud-form-input" />
                      </div>
                    </div>

                    <div className="crud-form-row">
                      <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                        <label className="crud-form-label"><span>Police</span></label>
                        <input type="number" placeholder="0" value={selectedTrip.sindh_police} onChange={e => handleFieldChange('sindh_police', e.target.value)} className="crud-form-input" />
                      </div>
                      <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                        <label className="crud-form-label"><span>Service & Grease</span></label>
                        <input type="number" placeholder="0" value={selectedTrip.service_grease} onChange={e => handleFieldChange('service_grease', e.target.value)} className="crud-form-input" />
                      </div>
                      <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                        <label className="crud-form-label"><span>Washing & Net Filter</span></label>
                        <input type="number" placeholder="0" value={selectedTrip.washing_filter} onChange={e => handleFieldChange('washing_filter', e.target.value)} className="crud-form-input" />
                      </div>
                      <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                        <label className="crud-form-label"><span>Secretary Challan</span></label>
                        <input type="number" placeholder="0" value={selectedTrip.secretary_challan} onChange={e => handleFieldChange('secretary_challan', e.target.value)} className="crud-form-input" />
                      </div>
                    </div>

                    <div className="crud-form-row">
                      <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                        <label className="crud-form-label"><span>Security / Chowkidar</span></label>
                        <input type="number" placeholder="0" value={selectedTrip.security_guard} onChange={e => handleFieldChange('security_guard', e.target.value)} className="crud-form-input" />
                      </div>
                      <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                        <label className="crud-form-label"><span>Weighbridge Deduction</span></label>
                        <input type="number" placeholder="0" value={selectedTrip.weighbridge_deduction} onChange={e => handleFieldChange('weighbridge_deduction', e.target.value)} className="crud-form-input" />
                      </div>
                      <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                        <label className="crud-form-label"><span>Driver Salary & Wages</span></label>
                        <input type="number" placeholder="0" value={selectedTrip.driver_salary} onChange={e => handleFieldChange('driver_salary', e.target.value)} className="crud-form-input" />
                      </div>
                      <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                        <label className="crud-form-label"><span>Other Minor Expenses</span></label>
                        <input type="number" placeholder="0" value={selectedTrip.minor_expenses} onChange={e => handleFieldChange('minor_expenses', e.target.value)} className="crud-form-input" />
                      </div>
                    </div>

                    <div className="crud-form-row">
                      <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                        <label className="crud-form-label"><span>Scale Vehicle Fee</span></label>
                        <input type="number" placeholder="0" value={selectedTrip.scale_fee} onChange={e => handleFieldChange('scale_fee', e.target.value)} className="crud-form-input" />
                      </div>
                      <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                        <label className="crud-form-label"><span>Rickshaw / Local Rent</span></label>
                        <input type="number" placeholder="0" value={selectedTrip.rickshaw_rent} onChange={e => handleFieldChange('rickshaw_rent', e.target.value)} className="crud-form-input" />
                      </div>
                      <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                        <label className="crud-form-label"><span>Food & Allowance</span></label>
                        <input type="number" placeholder="0" value={selectedTrip.food_expense} onChange={e => handleFieldChange('food_expense', e.target.value)} className="crud-form-input" />
                      </div>
                      <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                        <label className="crud-form-label"><span>Toll Tax</span></label>
                        <input type="number" placeholder="0" value={selectedTrip.toll_tax} onChange={e => handleFieldChange('toll_tax', e.target.value)} className="crud-form-input" />
                      </div>
                    </div>

                    <div className="crud-form-row">
                      <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                        <label className="crud-form-label"><span>Workshop Repair</span></label>
                        <input type="number" placeholder="0" value={selectedTrip.workshop_repair} onChange={e => handleFieldChange('workshop_repair', e.target.value)} className="crud-form-input" />
                      </div>
                      <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                        <label className="crud-form-label"><span>Loading Charge</span></label>
                        <input type="number" placeholder="0" value={selectedTrip.loading_charge} onChange={e => handleFieldChange('loading_charge', e.target.value)} className="crud-form-input" />
                      </div>
                      <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                        <label className="crud-form-label"><span>Weighbridge / Kanda Fee</span></label>
                        <input type="number" placeholder="0" value={selectedTrip.kanda_scale} onChange={e => handleFieldChange('kanda_scale', e.target.value)} className="crud-form-input" />
                      </div>
                      <div className="crud-form-field" style={{ flex: '1 1 calc(25% - 9px)' }}>
                        <label className="crud-form-label"><span>Munshiana / Misc</span></label>
                        <input type="number" placeholder="0" value={selectedTrip.munshiana} onChange={e => handleFieldChange('munshiana', e.target.value)} className="crud-form-input" />
                      </div>
                    </div>
                  </div>

                  <div className="crud-form-row">
                    <div className="crud-form-field" style={{ flex: '1 1 calc(33.3% - 8px)' }}>
                      <label className="crud-form-label"><span>Gross Amount (PKR)</span></label>
                      <input
                        type="number"
                        value={selectedTrip.amount}
                        onChange={e => handleFieldChange('amount', e.target.value)}
                        className="crud-form-input"
                        style={{ fontWeight: 'bold' }}
                      />
                    </div>

                    <div className="crud-form-field" style={{ flex: '1 1 calc(33.3% - 8px)' }}>
                      <label className="crud-form-label"><span>Total Expenses (PKR)</span></label>
                      <input
                        type="number"
                        value={calcOptionalExpenses(selectedTrip) || selectedTrip.other_expenses || selectedTrip.fine_amount || 0}
                        onChange={e => handleFieldChange('other_expenses', e.target.value)}
                        className="crud-form-input"
                      />
                    </div>

                    <div className="crud-form-field" style={{ flex: '1 1 calc(33.3% - 8px)' }}>
                      <label className="crud-form-label"><span>Net Total Cost (PKR)</span></label>
                      <input
                        type="number"
                        readOnly
                        value={selectedTrip.total_cost}
                        className="crud-form-input"
                        style={{ background: '#f0fdfa', color: '#0d9488', fontWeight: 'bold' }}
                      />
                    </div>
                  </div>

                  <div className="crud-form-row">
                    <div className="crud-form-field" style={{ flex: '1 1 100%' }}>
                      <label className="crud-form-label"><span>Payment Status</span></label>
                      <select
                        value={selectedTrip.payment_status}
                        onChange={e => handleFieldChange('payment_status', e.target.value)}
                        className="crud-form-select"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Process">In Process</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="crud-form-field">
                    <label className="crud-form-label"><span>Delivery Remarks</span></label>
                    <textarea
                      placeholder="Enter unloading notes..."
                      value={selectedTrip.remarks}
                      onChange={e => handleFieldChange('remarks', e.target.value)}
                      className="crud-form-textarea"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setSelectedTrip(null)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-teal">Save Delivery Info</button>
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
