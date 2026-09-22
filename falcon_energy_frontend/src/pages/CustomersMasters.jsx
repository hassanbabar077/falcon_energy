import React, { useState } from 'react';
import { Building2, MapPin, Navigation, Truck } from 'lucide-react';
import { dbService } from '../services/db';

export function CustomersMasters({ defaultTab = 'customers' }) {
  const [activeSubTab, setActiveSubTab] = useState(defaultTab);
  const [customers, setCustomers] = useState(dbService.getTable('customers'));
  const [sources, setSources] = useState(dbService.getTable('loading_sources'));
  const [destinations, setDestinations] = useState(dbService.getTable('destinations'));
  const [transporters, setTransporters] = useState(dbService.getTable('transporters'));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-600" />
            Master Directories & Locations
          </h2>
          <p className="text-xs text-slate-500">Directory of Customers, Loading Refineries, Unloading Plants, and Transporters.</p>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'customers', label: 'Customers', count: customers.length, icon: Building2 },
          { id: 'sources', label: 'Loading Sources', count: sources.length, icon: MapPin },
          { id: 'destinations', label: 'Destinations', count: destinations.length, icon: Navigation },
          { id: 'transporters', label: 'Transporters', count: transporters.length, icon: Truck },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                isActive ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label} ({tab.count})</span>
            </button>
          );
        })}
      </div>

      {activeSubTab === 'customers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customers.map(c => (
            <div key={c.id} className="glass-card p-5 rounded-2xl space-y-2">
              <div className="flex justify-between">
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{c.id}</span>
                <span className="text-[10px] font-bold text-teal-600">{c.status}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
              <p className="text-xs text-slate-500">Location: {c.location} | Concerned: {c.concerned_person}</p>
              <p className="text-xs font-mono text-slate-700 font-medium">Contact: {c.phone} | Email: {c.email}</p>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'sources' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sources.map(s => (
            <div key={s.id} className="glass-card p-5 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{s.id}</span>
              <h3 className="text-base font-bold text-slate-900">{s.name}</h3>
              <p className="text-xs text-slate-500">City: {s.city} | Location: {s.location}</p>
              <p className="text-xs font-mono text-slate-700 font-medium">Contact: {s.phone}</p>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'destinations' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {destinations.map(d => (
            <div key={d.id} className="glass-card p-5 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{d.id}</span>
              <h3 className="text-base font-bold text-slate-900">{d.name}</h3>
              <p className="text-xs text-slate-500">City: {d.city} | Location: {d.location}</p>
              <p className="text-xs font-mono text-slate-700 font-medium">Contact: {d.phone}</p>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'transporters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {transporters.map(t => (
            <div key={t.id} className="glass-card p-5 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{t.id}</span>
              <h3 className="text-base font-bold text-slate-900">{t.business_name}</h3>
              <p className="text-xs text-slate-500">Contact: {t.contact_person} ({t.phone})</p>
              <p className="text-xs text-slate-500">Address: {t.address}, {t.city}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
