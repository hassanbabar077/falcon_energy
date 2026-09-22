import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db';
import { LogOut, Shield, CalendarDays, Clock3, DatabaseBackup, RefreshCw } from 'lucide-react';

export function Navbar({ currentUser, onLogout, onRefresh }) {
  const company = dbService.getCompanyInfo();
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const isAdmin = currentUser?.role === 'Admin';

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBackup = () => {
    const data = JSON.stringify(dbService.data, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NoorLPG_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    alert('Backup downloaded successfully!');
  };

  return (
    <header className="navbar no-print">
      <div className="navbar-brand">
        <div className="navbar-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 3h15v13H1z" /><path d="M16 8h4l3 3v5h-7V8z" />
            <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        </div>
        <div><div className="navbar-title">{company.name}</div><div className="navbar-sub">{company.system_name}</div></div>
      </div>

      <div className="navbar-center">
        <div className="navbar-chip navbar-time" style={{ fontVariantNumeric: 'tabular-nums' }}>
          <CalendarDays size={14} /> {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          <span className="navbar-time-divider" /><Clock3 size={14} /> {time}
        </div>
      </div>

      <div className="navbar-actions">
        {currentUser && <div className="navbar-user"><Shield size={14} color={isAdmin ? '#2563eb' : '#0d9488'} /><span className="navbar-user-name">{currentUser.name}</span><span className="navbar-user-role">{currentUser.role}</span></div>}
        <button className="navbar-icon-btn navbar-refresh-btn" onClick={onRefresh} title="Refresh data" aria-label="Refresh data"><RefreshCw size={17} /></button>
      </div>
    </header>
  );
}
