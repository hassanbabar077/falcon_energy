import React, { useState } from 'react';
import { Settings, Save, RotateCcw, Building2, ShieldCheck, Database, Server, RefreshCw } from 'lucide-react';
import { dbService } from '../services/db';

export function CompanySettings() {
  const [info, setInfo] = useState(dbService.getCompanyInfo());
  const [activeTab, setActiveTab] = useState('general');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    dbService.updateCompanyInfo(info);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDB = () => {
    if (window.confirm('WARNING: Are you sure you want to reset the database? All records will be cleared and reset to a clean production state.')) {
      dbService.resetToDefaults();
      setInfo(dbService.getCompanyInfo());
      alert('Database refreshed successfully!');
      window.location.reload();
    }
  };

  return (
    <div className="crud-container">
      {/* Header Banner */}
      <div className="crud-header-card">
        <div className="crud-header-left">
          <div className="crud-header-icon" style={{ background: '#f0fdfa', borderColor: '#99f6e4', color: '#0d9488' }}>
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="crud-header-title">System & Company Settings</h2>
            <p className="crud-header-sub">Manage organization details, official report branding, and app preferences.</p>
          </div>
        </div>

        {savedSuccess && (
          <div className="badge badge-teal" style={{ padding: '8px 16px', fontSize: '12px' }}>
            <ShieldCheck className="w-4 h-4" /> Settings Saved Successfully!
          </div>
        )}
      </div>



      {activeTab === 'general' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 16px rgba(15,23,42,0.04)' }}>
          <form onSubmit={handleSave} className="crud-form">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div className="crud-form-field">
                <label className="crud-form-label">Company / Organization Name</label>
                <input
                  type="text"
                  value={info.name}
                  onChange={e => setInfo({ ...info, name: e.target.value })}
                  className="crud-form-input"
                  style={{ fontWeight: '800', fontSize: '14px', color: '#0d9488' }}
                  required
                />
              </div>

              <div className="crud-form-field">
                <label className="crud-form-label">Application Header Title</label>
                <input
                  type="text"
                  value={info.system_name}
                  onChange={e => setInfo({ ...info, system_name: e.target.value })}
                  className="crud-form-input"
                  required
                />
              </div>

              <div className="crud-form-field">
                <label className="crud-form-label">Contact Phone / Helpline</label>
                <input
                  type="text"
                  value={info.contact}
                  onChange={e => setInfo({ ...info, contact: e.target.value })}
                  className="crud-form-input"
                />
              </div>

              <div className="crud-form-field">
                <label className="crud-form-label">Official Email Address</label>
                <input
                  type="email"
                  value={info.email}
                  onChange={e => setInfo({ ...info, email: e.target.value })}
                  className="crud-form-input"
                />
              </div>
            </div>

            <div className="crud-form-field" style={{ marginTop: '8px' }}>
              <label className="crud-form-label">Head Office Address (Appears on Printed Reports)</label>
              <textarea
                value={info.address}
                onChange={e => setInfo({ ...info, address: e.target.value })}
                className="crud-form-textarea"
                rows="3"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #f1f5f9', marginTop: '12px' }}>
              <button type="submit" className="btn btn-teal" style={{ padding: '10px 24px' }}>
                <Save className="w-4 h-4" /> Save Configuration
              </button>
            </div>
          </form>

          {/* Database Backup & Export Tools */}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px dashed #cbd5e1' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database className="w-5 h-5 text-teal-600" />
              <span>Database Backup & Data Security</span>
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Export a complete JSON database backup file of all fleet records, trips, driver HR data, and financial general ledgers.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-teal"
                style={{ padding: '12px 20px', fontWeight: '700' }}
                onClick={() => {
                  const data = JSON.stringify(dbService.data, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `FalconEnergy_Backup_${new Date().toISOString().slice(0, 10)}.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                  alert('Database backup file exported successfully!');
                }}
              >
                <Server className="w-4 h-4" /> Download Full Database Backup (.json)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

