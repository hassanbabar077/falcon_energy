import React, { useState } from 'react';
import { MapPin, Plus, Search, ArrowRight, Truck } from 'lucide-react';
import { dbService } from '../services/db';

export function TripsDispatch() {
  const [trips, setTrips] = useState(dbService.getTable('trips'));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);

  // New Trip form state
  const [vehicle, setVehicle] = useState('');
  const [loadingDate, setLoadingDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadPressure, setLoadPressure] = useState(120);
  const [source, setSource] = useState('');
  const [loadWeight, setLoadWeight] = useState('');
  const [customer, setCustomer] = useState('');

  const filteredTrips = trips.filter(t => {
    const matchesSearch = t.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.customer && t.customer.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === 'Inprocess') {
      return matchesSearch && (!t.unloading_date || t.destination === 'Pending');
    } else if (statusFilter === 'Completed') {
      return matchesSearch && t.unloading_date && t.destination !== 'Pending';
    }
    return matchesSearch;
  });

  const handleCreateTrip = (e) => {
    e.preventDefault();
    const newTrip = {
      id: dbService.generateNextID('trips', 'TRIP-'),
      vehicle,
      loading_date: loadingDate,
      load_pressure: parseFloat(loadPressure),
      vendor: source,
      source,
      load_weight: parseFloat(loadWeight),
      unloading_date: '',
      destination: 'Pending',
      unload_weight: 0,
      unload_pressure: 0,
      difference: 0,
      distance: 0,
      freight_type: 'Per Ton',
      freight_km_rate: 0,
      freight_ton_rate: 8500,
      amount: parseFloat(loadWeight) * 8500,
      fine_amount: 0,
      total_cost: parseFloat(loadWeight) * 8500,
      payment_status: 'Pending',
      plant: source,
      customer,
      remarks: 'Dispatched trip'
    };

    dbService.insertRecord('trips', newTrip);
    setTrips(dbService.getTable('trips'));
    setIsNewTripModalOpen(false);
    alert(`New Trip ${newTrip.id} dispatched successfully!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            Trips & Freight Dispatch Management
          </h2>
          <p className="text-xs text-slate-500">Track and dispatch LPG transport trips across Pakistan routes.</p>
        </div>
        <button
          onClick={() => setIsNewTripModalOpen(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Dispatch New Trip
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Trip ID, Vehicle, or Customer..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:border-teal-500 font-medium"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs text-slate-800 px-3 py-2 rounded-lg focus:outline-none focus:border-teal-500 font-semibold"
        >
          <option value="All">All Trip Status</option>
          <option value="Inprocess">In-Process Only</option>
          <option value="Completed">Completed Only</option>
        </select>
      </div>

      {/* Trips Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Trip ID</th>
                <th className="p-3.5">Vehicle</th>
                <th className="p-3.5">Load Date</th>
                <th className="p-3.5">Source → Destination</th>
                <th className="p-3.5">Load Wt</th>
                <th className="p-3.5">Unload Wt</th>
                <th className="p-3.5">Loss (MT)</th>
                <th className="p-3.5">Gross Freight</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTrips.map(trip => {
                const isCompleted = trip.unloading_date && trip.destination !== 'Pending';
                return (
                  <tr key={trip.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-teal-700">{trip.id}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{trip.vehicle}</td>
                    <td className="p-3.5">{trip.loading_date}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span>{trip.source}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className={trip.destination === 'Pending' ? 'text-amber-600 font-bold' : 'text-slate-800'}>
                          {trip.destination}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono font-bold">{trip.load_weight} MT</td>
                    <td className="p-3.5 font-mono">{isCompleted ? `${trip.unload_weight} MT` : '-'}</td>
                    <td className="p-3.5 font-mono text-rose-600 font-bold">
                      {isCompleted && trip.difference > 0 ? `-${trip.difference} MT` : '0'}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">PKR {(trip.amount || 0).toLocaleString()}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        isCompleted
                          ? 'bg-teal-50 text-teal-700 border-teal-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                      }`}>
                        {isCompleted ? 'COMPLETED' : 'IN TRANSIT'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Modal */}
      {isNewTripModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-teal-600" />
                Dispatch New LPG Trip
              </h3>
              <button onClick={() => setIsNewTripModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateTrip} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Select Active Vehicle</label>
                <select 
                  value={vehicle} 
                  onChange={e => setVehicle(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-teal-500 font-medium"
                  required
                >
                  <option value="">Select Vehicle</option>
                  {dbService.getTable('vehicles').filter(v => v.status === 'Active').map(v => (
                    <option key={v.code} value={v.number}>{v.number} ({v.category})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Loading Source</label>
                  <select 
                    value={source} 
                    onChange={e => setSource(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-teal-500 font-medium"
                    required
                  >
                    <option value="">Select Source</option>
                    {dbService.getTable('loading_sources').map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.city})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Customer</label>
                  <select 
                    value={customer} 
                    onChange={e => setCustomer(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-teal-500 font-medium"
                    required
                  >
                    <option value="">Select Customer</option>
                    {dbService.getTable('customers').map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Load Wt (MT)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={loadWeight} 
                    onChange={e => setLoadWeight(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-teal-500 font-medium" 
                    required 
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Load Pressure (PSI)</label>
                  <input 
                    type="number" 
                    value={loadPressure} 
                    onChange={e => setLoadPressure(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-teal-500 font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Loading Date</label>
                  <input 
                    type="date" 
                    value={loadingDate} 
                    onChange={e => setLoadingDate(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-teal-500 font-medium" 
                    required 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsNewTripModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-bold rounded-lg shadow-md shadow-teal-600/20">
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
