import React, { useState, useEffect, useMemo } from 'react';
import { Edit3, Search, Check, AlertTriangle, X } from 'lucide-react';
import { dbService } from '../../services/db';

export function TripEdit() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [sources, setSources] = useState([]);

  // Search Filters
  const [searchId, setSearchId] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Active Edit Modal State
  const [editingTrip, setEditingTrip] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTrips(dbService.getTable('trips'));
    setVehicles(dbService.getTable('vehicles'));
    setVendors(dbService.getTable('vendors'));
    setSources(dbService.getTable('loading_sources'));
  };

  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      if (searchId.trim() && !t.id.toLowerCase().includes(searchId.trim().toLowerCase())) return false;
      if (filterVehicle && t.vehicle !== filterVehicle) return false;
      if (fromDate && t.loading_date < fromDate) return false;
      if (toDate && t.loading_date > toDate) return false;
      return true;
    });
  }, [trips, searchId, filterVehicle, fromDate, toDate]);

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingTrip) return;

    const updatedLoadingInfo = {
      vehicle: editingTrip.vehicle,
      loading_date: editingTrip.loading_date,
      load_pressure: parseFloat(editingTrip.load_pressure) || 0,
      vendor: editingTrip.vendor,
      source: editingTrip.source,
      load_weight: parseFloat(editingTrip.load_weight) || 0,
    };

    dbService.updateRecord('trips', 'id', editingTrip.id, updatedLoadingInfo);
    loadData();
    setEditingTrip(null);
    setToast({ message: `Trip ${editingTrip.id} loading info updated!`, type: 'success' });
  };

  return (
    <div className="crud-container">
      <div className="crud-header-card">
        <div className="crud-header-left">
          <div className="crud-header-icon">
            <Edit3 size={24} />
          </div>
          <div>
            <h2 className="crud-header-title">Trip Edit</h2>
            <p className="crud-header-sub">Locate and update loading parameters for registered transport trips.</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="crud-table-card" style={{ padding: '16px 20px' }}>
        <div className="crud-form-row" style={{ alignItems: 'flex-end', gap: '12px' }}>
          <div className="crud-form-field" style={{ flex: '1 1 180px' }}>
            <label className="crud-form-label">Search Trip ID</label>
            <input
              type="text"
              placeholder="e.g. TRP-001"
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              className="crud-form-input"
            />
          </div>

          <div className="crud-form-field" style={{ flex: '1 1 180px' }}>
            <label className="crud-form-label">Filter Vehicle</label>
            <select
              value={filterVehicle}
              onChange={e => setFilterVehicle(e.target.value)}
              className="crud-form-select"
            >
              <option value="">All Vehicles</option>
              {vehicles.map(v => (
                <option key={v.code} value={v.number}>{v.number}</option>
              ))}
            </select>
          </div>

          <div className="crud-form-field" style={{ flex: '1 1 140px' }}>
            <label className="crud-form-label">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="crud-form-input"
            />
          </div>

          <div className="crud-form-field" style={{ flex: '1 1 140px' }}>
            <label className="crud-form-label">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="crud-form-input"
            />
          </div>

          <button
            onClick={() => { setSearchId(''); setFilterVehicle(''); setFromDate(''); setToDate(''); }}
            className="btn btn-ghost"
            style={{ height: '38px' }}
          >
            Reset Filters
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
                <th>Loading Date</th>
                <th>Vehicle</th>
                <th>Source Plant</th>
                <th>Vendor</th>
                <th>Load Weight (Tons)</th>
                <th>Load Pressure</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No trips match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTrips.map(trip => (
                  <tr key={trip.id}>
                    <td className="crud-td-code">{trip.id}</td>
                    <td>{trip.loading_date}</td>
                    <td><strong>{trip.vehicle}</strong></td>
                    <td>{trip.source}</td>
                    <td>{trip.vendor}</td>
                    <td><strong style={{ color: '#0d9488' }}>{trip.load_weight} T</strong></td>
                    <td>{trip.load_pressure || '-'} PSI</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => setEditingTrip({ ...trip })}
                        className="btn btn-teal"
                        style={{ padding: '5px 12px', fontSize: '11px' }}
                      >
                        <Edit3 size={13} /> Edit Loading Info
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTrip && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">Edit Loading Details – <span style={{ fontFamily: 'monospace', color: '#0d9488' }}>{editingTrip.id}</span></span>
              <button onClick={() => setEditingTrip(null)} className="modal-close-btn"><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div className="crud-form">
                  <div className="crud-form-row">
                    <div className="crud-form-field" style={{ flex: '1 1 calc(50% - 7px)' }}>
                      <label className="crud-form-label">Vehicle</label>
                      <select
                        value={editingTrip.vehicle}
                        onChange={e => setEditingTrip({ ...editingTrip, vehicle: e.target.value })}
                        className="crud-form-select"
                        required
                      >
                        {vehicles.map(v => (
                          <option key={v.code} value={v.number}>{v.number}</option>
                        ))}
                      </select>
                    </div>

                    <div className="crud-form-field" style={{ flex: '1 1 calc(50% - 7px)' }}>
                      <label className="crud-form-label">Loading Date</label>
                      <input
                        type="date"
                        value={editingTrip.loading_date}
                        onChange={e => setEditingTrip({ ...editingTrip, loading_date: e.target.value })}
                        className="crud-form-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="crud-form-row">
                    <div className="crud-form-field" style={{ flex: '1 1 calc(50% - 7px)' }}>
                      <label className="crud-form-label">Vendor</label>
                      <select
                        value={editingTrip.vendor}
                        onChange={e => setEditingTrip({ ...editingTrip, vendor: e.target.value })}
                        className="crud-form-select"
                        required
                      >
                        {vendors.map(v => (
                          <option key={v.id} value={v.name}>{v.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="crud-form-field" style={{ flex: '1 1 calc(50% - 7px)' }}>
                      <label className="crud-form-label">Source Plant</label>
                      <select
                        value={editingTrip.source}
                        onChange={e => setEditingTrip({ ...editingTrip, source: e.target.value })}
                        className="crud-form-select"
                        required
                      >
                        {sources.map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="crud-form-row">
                    <div className="crud-form-field" style={{ flex: '1 1 calc(50% - 7px)' }}>
                      <label className="crud-form-label">Load Weight (Tons)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingTrip.load_weight}
                        onChange={e => setEditingTrip({ ...editingTrip, load_weight: e.target.value })}
                        className="crud-form-input"
                        required
                      />
                    </div>

                    <div className="crud-form-field" style={{ flex: '1 1 calc(50% - 7px)' }}>
                      <label className="crud-form-label">Load Pressure (PSI)</label>
                      <input
                        type="number"
                        value={editingTrip.load_pressure}
                        onChange={e => setEditingTrip({ ...editingTrip, load_pressure: e.target.value })}
                        className="crud-form-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setEditingTrip(null)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-teal">Save Changes</button>
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
