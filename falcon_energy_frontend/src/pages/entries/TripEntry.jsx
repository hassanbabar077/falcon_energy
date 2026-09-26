import React, { useState, useEffect } from 'react';
import { Truck, Check, AlertTriangle, Plus, Fuel } from 'lucide-react';
import { dbService } from '../../services/db';

export function TripEntry() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [sources, setSources] = useState([]);
  const [toast, setToast] = useState(null);
  const [vehicleFuel, setVehicleFuel] = useState({ liters: 0, cost: 0, rate: 0 });

  const defaultForm = {
    vehicle: '',
    driver: '',
    loading_date: new Date().toISOString().split('T')[0],
    load_pressure: '',
    vendor: '',
    source: '',
    load_weight: '',
    remarks: ''
  };

  const [formData, setFormData] = useState({ ...defaultForm });
  const [nextTripId, setNextTripId] = useState('');

  useEffect(() => {
    setVehicles(dbService.getTable('vehicles'));
    setDrivers(dbService.getTable('drivers'));
    setVendors(dbService.getTable('vendors'));
    setSources(dbService.getTable('loading_sources'));
    setNextTripId(dbService.generateNextID('trips', 'TRP-', 'id'));
  }, []);

  const handleChange = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleVehicleChange = (val) => {
    const selectedVeh = vehicles.find(v => v.number === val || v.code === val);
    let autoDriver = selectedVeh?.assigned_driver || selectedVeh?.driver || '';
    if (!autoDriver) {
      const matchedDriver = drivers.find(d => d.vehicle === val || d.assigned_vehicle === val);
      if (matchedDriver) autoDriver = matchedDriver.name;
    }

    const fuelBal = dbService.getVehicleCurrentFuel(val);
    setVehicleFuel(fuelBal);

    setFormData(prev => ({
      ...prev,
      vehicle: val,
      driver: autoDriver || prev.driver
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicle || !formData.loading_date || !formData.load_weight) {
      setToast({ message: 'Please fill in all required loading fields.', type: 'error' });
      return;
    }

    const currentFuel = dbService.getVehicleCurrentFuel(formData.vehicle);

    const tripRecord = {
      id: nextTripId,
      vehicle: formData.vehicle,
      driver: formData.driver || '-',
      loading_date: formData.loading_date,
      load_pressure: parseFloat(formData.load_pressure) || 0,
      vendor: formData.vendor || '-',
      source: formData.source || '-',
      load_weight: parseFloat(formData.load_weight) || 0,
      // Opening Fuel inherited from vehicle's carry-forward / unassigned fuel
      opening_fuel_liters: currentFuel.liters,
      opening_fuel_cost: currentFuel.cost,
      purchased_fuel_liters: 0,
      purchased_fuel_cost: 0,
      remaining_fuel_liters: 0,
      remaining_fuel_cost: 0,
      // Delivery fields initial pending state
      unloading_date: '',
      customer: '-',
      destination: 'Pending',
      unload_weight: 0,
      unload_pressure: 0,
      difference: 0,
      distance: 0,
      freight_type: 'Per Ton',
      freight_km_rate: 0,
      freight_ton_rate: 0,
      amount: 0,
      fine_amount: 0,
      total_cost: 0,
      payment_status: 'Pending',
      plant: formData.source || '-',
      remarks: formData.remarks || ''
    };

    try {
      await dbService.insertRecord('trips', tripRecord);

      // Consume vehicle opening fuel & link unassigned fuel entries to this trip so they aren't reused
      dbService.consumeVehicleOpeningFuel(formData.vehicle, nextTripId);

      setToast({ message: `Trip ${nextTripId} registered with ${currentFuel.liters.toFixed(1)} L opening fuel!`, type: 'success' });
      setFormData({ ...defaultForm });
      setVehicleFuel({ liters: 0, cost: 0, rate: 0 });
      setNextTripId(dbService.generateNextID('trips', 'TRP-', 'id'));
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      setToast({ message: `Save Failed: ${err.message || 'Database operation failed'}`, type: 'error' });
    }
  };

  return (
    <div className="crud-container">
      {/* Header Banner */}
      <div className="crud-header-card">
        <div className="crud-header-left">
          <div className="crud-header-icon">
            <Truck size={24} />
          </div>
          <div>
            <h2 className="crud-header-title">Trip Loading Entry</h2>
            <p className="crud-header-sub">Register initial dispatch loading information & inherit opening fuel for LPG tankers.</p>
          </div>
        </div>
        <div className="crud-count-badge" style={{ fontSize: '13px', fontWeight: '800', color: '#0d9488', borderColor: '#ccfbf1', background: '#f0fdfa' }}>
          Auto Trip ID: <span style={{ fontFamily: 'monospace' }}>{nextTripId}</span>
        </div>
      </div>

      {/* Form Card */}
      <div className="crud-table-card" style={{ padding: '24px' }}>
        <form onSubmit={handleSubmit} className="crud-form">
          <div className="crud-form-row">
            <div className="crud-form-field" style={{ flex: '1 1 calc(33.3% - 8px)' }}>
              <label className="crud-form-label">
                <span>Vehicle (Tanker Unit)</span> <span className="crud-required-star">*</span>
              </label>
              <select
                value={formData.vehicle}
                onChange={e => handleVehicleChange(e.target.value)}
                className="crud-form-select"
                required
              >
                <option value="">Select Vehicle</option>
                {vehicles.map(v => (
                  <option key={v.code} value={v.number}>{v.number} ({v.ownership})</option>
                ))}
              </select>

              {formData.vehicle && (
                <div style={{ marginTop: '8px', padding: '6px 10px', background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '6px', fontSize: '12px', color: '#0d9488', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Fuel size={14} />
                  <span>Opening Fuel: {vehicleFuel.liters.toFixed(1)} L (PKR {vehicleFuel.cost.toLocaleString()})</span>
                </div>
              )}
            </div>

            <div className="crud-form-field" style={{ flex: '1 1 calc(33.3% - 8px)' }}>
              <label className="crud-form-label">
                <span>Assigned Driver</span> <span className="crud-optional-tag">(Optional)</span>
              </label>
              <select
                value={formData.driver}
                onChange={e => handleChange('driver', e.target.value)}
                className="crud-form-select"
              >
                <option value="">Select Driver</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="crud-form-field" style={{ flex: '1 1 calc(33.3% - 8px)' }}>
              <label className="crud-form-label">
                <span>Loading Date</span> <span className="crud-required-star">*</span>
              </label>
              <input
                type="date"
                value={formData.loading_date}
                onChange={e => handleChange('loading_date', e.target.value)}
                className="crud-form-input"
                required
              />
            </div>
          </div>

          <div className="crud-form-row">
            <div className="crud-form-field" style={{ flex: '1 1 calc(50% - 7px)' }}>
              <label className="crud-form-label">
                <span>Vendor / Contractor</span> <span className="crud-required-star">*</span>
              </label>
              <select
                value={formData.vendor}
                onChange={e => handleChange('vendor', e.target.value)}
                className="crud-form-select"
                required
              >
                <option value="">Select Vendor</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.name}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="crud-form-field" style={{ flex: '1 1 calc(50% - 7px)' }}>
              <label className="crud-form-label">
                <span>Loading Source Plant</span> <span className="crud-required-star">*</span>
              </label>
              <select
                value={formData.source}
                onChange={e => handleChange('source', e.target.value)}
                className="crud-form-select"
                required
              >
                <option value="">Select Loading Source</option>
                {sources.map(s => (
                  <option key={s.id} value={s.name}>{s.name} ({s.city})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="crud-form-row">
            <div className="crud-form-field" style={{ flex: '1 1 calc(50% - 7px)' }}>
              <label className="crud-form-label">
                <span>Load Weight (Metric Tons)</span> <span className="crud-required-star">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 28.50"
                value={formData.load_weight}
                onChange={e => handleChange('load_weight', e.target.value)}
                className="crud-form-input"
                required
              />
            </div>

            <div className="crud-form-field" style={{ flex: '1 1 calc(50% - 7px)' }}>
              <label className="crud-form-label">
                <span>Load Pressure (PSI / Bar)</span> <span className="crud-optional-tag">(Optional)</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 120"
                value={formData.load_pressure}
                onChange={e => handleChange('load_pressure', e.target.value)}
                className="crud-form-input"
              />
            </div>
          </div>

          <div className="crud-form-field">
            <label className="crud-form-label">
              <span>Loading Remarks</span> <span className="crud-optional-tag">(Optional)</span>
            </label>
            <textarea
              placeholder="Enter dispatch notes, seal numbers, or loading instructions..."
              value={formData.remarks}
              onChange={e => handleChange('remarks', e.target.value)}
              className="crud-form-textarea"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px' }}>
            <button type="submit" className="btn btn-teal">
              <Plus size={16} /> Save Loading Entry
            </button>
          </div>
        </form>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div className={`toast-box ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
