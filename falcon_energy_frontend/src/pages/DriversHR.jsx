import React, { useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { dbService } from '../services/db';

export function DriversHR() {
  const [drivers, setDrivers] = useState(dbService.getTable('drivers'));
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [cnic, setCnic] = useState('');
  const [mobile, setMobile] = useState('');
  const [license, setLicense] = useState('');
  const [assignedVehicle, setAssignedVehicle] = useState('');

  const handleAddDriver = (e) => {
    e.preventDefault();
    const newDriver = {
      id: dbService.generateNextID('drivers', 'DRV-'),
      name,
      father_name: fatherName,
      cnic,
      mobile,
      mobile2: '',
      license,
      license_expiry: '2027-12-31',
      email: '',
      address: 'Lahore',
      joining_date: new Date().toISOString().split('T')[0],
      status: 'Active',
      assigned_vehicle: assignedVehicle,
      previous_vehicle: '-',
      last_change: new Date().toISOString().split('T')[0],
      remarks: 'Active LPG Driver'
    };

    dbService.insertRecord('drivers', newDriver);
    setDrivers(dbService.getTable('drivers'));
    setIsModalOpen(false);
    alert(`Driver ${name} registered successfully!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Driver HR Master & Assignment
          </h2>
          <p className="text-xs text-slate-500">Driver registry, CNIC verification, license validity, and vehicle assignment logs.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Register Driver
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200">
            <tr>
              <th className="p-3.5">Driver ID</th>
              <th className="p-3.5">Name</th>
              <th className="p-3.5">CNIC</th>
              <th className="p-3.5">Mobile</th>
              <th className="p-3.5">License #</th>
              <th className="p-3.5">Assigned Vehicle</th>
              <th className="p-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {drivers.map(d => (
              <tr key={d.id} className="hover:bg-slate-50 transition">
                <td className="p-3.5 font-bold text-teal-700">{d.id}</td>
                <td className="p-3.5 font-semibold text-slate-900">
                  <div>{d.name}</div>
                  <div className="text-[10px] text-slate-400 font-normal">S/O {d.father_name}</div>
                </td>
                <td className="p-3.5 font-mono font-medium">{d.cnic}</td>
                <td className="p-3.5 font-mono font-medium">{d.mobile}</td>
                <td className="p-3.5">
                  <div className="font-mono text-slate-800 font-bold">{d.license}</div>
                  <div className="text-[10px] text-teal-600 font-semibold">Exp: {d.license_expiry}</div>
                </td>
                <td className="p-3.5 font-bold text-slate-900">
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 font-mono text-slate-800">{d.assigned_vehicle}</span>
                </td>
                <td className="p-3.5">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Register Driver</h3>
            <form onSubmit={handleAddDriver} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800" required />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Father Name</label>
                <input type="text" value={fatherName} onChange={e => setFatherName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">CNIC Number</label>
                  <input type="text" placeholder="35202-0000000-0" value={cnic} onChange={e => setCnic(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800" required />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Mobile</label>
                  <input type="text" placeholder="0300-0000000" value={mobile} onChange={e => setMobile(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">License #</label>
                  <input type="text" value={license} onChange={e => setLicense(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800" required />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Assign Vehicle</label>
                  <select value={assignedVehicle} onChange={e => setAssignedVehicle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800" required>
                    <option value="">Select Vehicle</option>
                    {dbService.getTable('vehicles').map(v => (
                      <option key={v.code} value={v.number}>{v.number}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-bold rounded-lg shadow-md shadow-teal-600/20">Save Driver</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
