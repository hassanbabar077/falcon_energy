import React, { useState } from 'react';
import { LayoutDashboard, Database, ClipboardList, FileBarChart, Zap, Settings, Users, LogOut, AlertTriangle } from 'lucide-react';
import { hasPermission } from '../../services/permissionService';

const MASTER_DATA_IDS = [
  'masterData', 'vehicles', 'transporters', 'sources', 'destinations', 'customers',
  'workshops', 'maint_heads', 'documents', 'vendors', 'drivers', 'tyres',
  'tyre_brands', 'cash', 'fuel_pump', 'engine_oil', 'bank_accounts'
];

const ENTRIES_IDS = [
  'entries', 'payment_entry', 'trip_entry', 'trip_edit', 'update_delivery',
  'fuel_entry', 'maint_entry', 'tyre_purchase', 'engine_oil_purchase',
  'engine_oil_usage', 'payment_received', 'payment_history'
];

const REPORT_IDS = [
  'reports', 'rpt_daily_activity_report', 'rpt_universal_ledger',
  'rpt_pending_payables_overview', 'rpt_fuel_trip_summary', 'rpt_vendor_ledger',
  'rpt_workshop_ledger', 'rpt_fuel_pump_ledger', 'rpt_bank_ledger',
  'rpt_transporter_ledger', 'rpt_customer_ledger', 'rpt_trip_payment_status',
  'rpt_trips', 'rpt_vehicles', 'rpt_drivers', 'rpt_maintenance',
  'rpt_fuel', 'rpt_bank', 'rpt_tyre'
];

const QUICK_ACTION_IDS = [
  'quickActions', 'qa_trip_entry', 'qa_fuel_entry', 'qa_payment_entry',
  'qa_maint_entry', 'qa_billing_summary', 'qa_backup'
];

const BASE_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, ids: ['dashboard'] },
  { id: 'masterData', label: 'Master Data', icon: Database, ids: MASTER_DATA_IDS },
  { id: 'entries', label: 'Entries', icon: ClipboardList, ids: ENTRIES_IDS },
  { id: 'reports', label: 'Reports', icon: FileBarChart, ids: REPORT_IDS },
  { id: 'quickActions', label: 'Quick Actions', icon: Zap, ids: QUICK_ACTION_IDS },
  { id: 'user_mgmt', label: 'Users & Roles', icon: Users, ids: ['user_mgmt'], adminOnly: true },
  { id: 'settings', label: 'Settings', icon: Settings, ids: ['settings'] }
];

export function Sidebar({ activeTab, setActiveTab, currentUser, onLogout }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const allowedNavItems = BASE_NAV_ITEMS.filter(item => {
    if (item.adminOnly) {
      return currentUser?.role === 'Admin';
    }
    return hasPermission(currentUser, item.id);
  });

  return (
    <>
      <aside className="sidebar no-print" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div className="sidebar-scroll" style={{ flex: 1 }}>
          <div className="sidebar-section-label">Navigation</div>
          {allowedNavItems.map(item => {
            const isActive = item.ids.includes(activeTab);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`sidebar-item${isActive ? ' active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="sidebar-item-icon"><Icon size={17} aria-hidden="true" /></span>
                <span>{item.label}</span>
                {isActive && <span className="sidebar-active-dot" />}
              </button>
            );
          })}
        </div>

        {/* Sidebar Logout Button */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #fecdd3',
              background: '#fff1f2',
              color: '#e11d48',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Logout Warning Confirmation Modal */}
      {showConfirm && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-card" style={{ maxWidth: '420px', padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fff1f2', color: '#e11d48', display: 'grid', placeItems: 'center', margin: '0 auto 16px auto' }}>
              <AlertTriangle size={32} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Logout Confirmation
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
              Are you sure you want to log out of <strong>Falcon Energy Transport System</strong>? Any unsaved form progress will be lost.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px', fontWeight: '700' }}
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                style={{ flex: 1, padding: '10px', fontWeight: '700', background: '#e11d48', color: '#ffffff', border: 'none' }}
                onClick={() => {
                  setShowConfirm(false);
                  if (onLogout) onLogout();
                }}
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
