import React, { useState } from 'react';
import { Fuel, Droplets } from 'lucide-react';
import { dbService } from '../services/db';

export function FuelAndOil() {
  const [fuelEntries, setFuelEntries] = useState(dbService.getTable('fuel_entries'));
  const [oilProducts, setOilProducts] = useState(dbService.getTable('engine_oil_defination'));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Fuel className="w-5 h-5 text-teal-600" />
            Fuel & Engine Oil Inventory Management
          </h2>
          <p className="text-xs text-slate-500">Track fuel pump fill-ups and real-time lubricant stock levels with auto-deductions.</p>
        </div>
      </div>

      {/* Engine Oil Stock Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {oilProducts.map(oil => (
          <div key={oil.id} className="glass-card p-5 rounded-2xl space-y-2">
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{oil.id}</span>
              <Droplets className="w-4 h-4 text-teal-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{oil.name}</h3>
            <div className="flex justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px]">Initial Purchase</span>
                <span className="font-mono text-slate-700 font-bold">{oil.initial_qty} Liters</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Current Stock</span>
                <span className="font-mono text-teal-700 font-extrabold text-sm">{oil.current_stock} Liters</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fuel Entries Table */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Vehicle Fuel Filling Register</h3>
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Date</th>
              <th className="p-3">Vehicle</th>
              <th className="p-3">Pump Station</th>
              <th className="p-3">Liters</th>
              <th className="p-3">Total Amount</th>
              <th className="p-3">Trip ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fuelEntries.map(f => (
              <tr key={f.id} className="hover:bg-slate-50">
                <td className="p-3 font-bold text-teal-700">{f.id}</td>
                <td className="p-3">{f.date}</td>
                <td className="p-3 font-semibold text-slate-900">{f.vehicle}</td>
                <td className="p-3">{f.pump}</td>
                <td className="p-3 font-mono font-bold">{f.liters} L</td>
                <td className="p-3 font-bold text-slate-900">PKR {(f.amount || 0).toLocaleString()}</td>
                <td className="p-3 font-mono text-amber-600 font-bold">{f.trip_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
