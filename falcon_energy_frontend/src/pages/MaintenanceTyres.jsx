import React, { useState } from 'react';
import { Wrench, Disc } from 'lucide-react';
import { dbService } from '../services/db';

export function MaintenanceTyres() {
  const [maintenance, setMaintenance] = useState(dbService.getTable('maintenance'));
  const [tyres, setTyres] = useState(dbService.getTable('tyres_record'));
  const [activeTab, setActiveTab] = useState('maintenance');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-teal-600" />
            Maintenance & Tyre Lifecycle Management
          </h2>
          <p className="text-xs text-slate-500">Track prime mover & tanker maintenance expenses, heads, and tyre replacements.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${
            activeTab === 'maintenance' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Maintenance Expenses ({maintenance.length})
        </button>
        <button
          onClick={() => setActiveTab('tyres')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${
            activeTab === 'tyres' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Disc className="w-4 h-4" />
          Tyres Inventory ({tyres.length})
        </button>
      </div>

      {activeTab === 'maintenance' ? (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Vehicle</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Maintenance Head</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Paid</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {maintenance.map(m => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-bold text-teal-700">{m.id}</td>
                  <td className="p-3.5 font-semibold text-slate-900">{m.vehicle}</td>
                  <td className="p-3.5">{m.category}</td>
                  <td className="p-3.5">{m.head}</td>
                  <td className="p-3.5">{m.date}</td>
                  <td className="p-3.5 font-bold text-slate-900">PKR {(m.total_amount || 0).toLocaleString()}</td>
                  <td className="p-3.5 font-mono text-teal-700 font-bold">PKR {(m.sending_amount || 0).toLocaleString()}</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Vehicle</th>
                <th className="p-3.5">Tire Number</th>
                <th className="p-3.5">Brand</th>
                <th className="p-3.5">Condition</th>
                <th className="p-3.5">Fitment Date</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tyres.map(t => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-bold text-teal-700">{t.id}</td>
                  <td className="p-3.5 font-semibold text-slate-900">{t.vehicle}</td>
                  <td className="p-3.5 font-mono font-bold text-slate-800">{t.tyre_number}</td>
                  <td className="p-3.5 font-semibold">{t.brand}</td>
                  <td className="p-3.5">{t.condition}</td>
                  <td className="p-3.5">{t.purchase_date}</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
