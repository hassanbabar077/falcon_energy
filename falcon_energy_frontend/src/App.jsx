import React, { useEffect, useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { SectionLandingPage } from './components/SectionLandingPage';
import { LoginPage } from './pages/LoginPage';
import { UserMgmt } from './pages/UserMgmt';
import { hasPermission } from './services/permissionService';

import {
  MASTER_DATA_CARDS,
  ENTRIES_CARDS,
  REPORTS_CARDS,
  QUICK_ACTIONS_CARDS
} from './config/landingConfig';

import { Database, FileText, ClipboardList, Zap, ArrowLeft, ShieldAlert } from 'lucide-react';

import { DashboardOverview } from './pages/DashboardOverview';
import { FleetVehicles } from './pages/FleetVehicles';
import { TransporterMgmt } from './pages/TransporterMgmt';
import { SourceMgmt } from './pages/SourceMgmt';
import { DestinationMgmt } from './pages/DestinationMgmt';
import { CustomerMgmt } from './pages/CustomerMgmt';
import { WorkshopMgmt } from './pages/WorkshopMgmt';
import { MaintHeadMgmt } from './pages/MaintHeadMgmt';
import { DocumentMgmt } from './pages/DocumentMgmt';
import { VendorMgmt } from './pages/VendorMgmt';
import { DriverMgmt } from './pages/DriverMgmt';
import { TyreBrandMgmt } from './pages/TyreBrandMgmt';
import { TyreMgmt } from './pages/TyreMgmt';
import { CashMgmt } from './pages/CashMgmt';
import { FuelPumpMgmt } from './pages/FuelPumpMgmt';
import { EngineOilMgmt } from './pages/EngineOilMgmt';
import { BankMgmt } from './pages/BankMgmt';

// Entries Sub-System Pages
import { PaymentEntry } from './pages/entries/PaymentEntry';
import { TripEntry } from './pages/entries/TripEntry';
import { TripEdit } from './pages/entries/TripEdit';
import { UpdateDelivery } from './pages/entries/UpdateDelivery';
import { FuelEntry } from './pages/entries/FuelEntry';
import { MaintenanceEntry } from './pages/entries/MaintenanceEntry';
import { TyrePurchase } from './pages/entries/TyrePurchase';
import { EngineOilPurchase } from './pages/entries/EngineOilPurchase';
import { EngineOilUsage } from './pages/entries/EngineOilUsage';
import { PaymentReceived } from './pages/entries/PaymentReceived';
import { PaymentHistory } from './pages/entries/PaymentHistory';

import { InvoicingBilling } from './pages/InvoicingBilling';
import { ReportsPrinting } from './pages/ReportsPrinting';
import { CompanySettings } from './pages/CompanySettings';
import { VehicleCategory } from './pages/master/VehicleCategory';
import { TankerOwnership } from './pages/master/TankerOwnership';
import { dbService } from './services/db';

const MASTER_DATA_IDS = [
  'vehicles', 'transporters', 'sources', 'destinations', 'customers',
  'workshops', 'maint_heads', 'documents', 'vendors', 'drivers', 'tyres',
  'tyre_brands', 'cash', 'fuel_pump', 'engine_oil', 'bank_accounts',
  'vehicle_category', 'tanker_ownership'
];

const ENTRIES_IDS = [
  'payment_entry', 'trip_entry', 'trip_edit', 'update_delivery',
  'fuel_entry', 'maint_entry', 'tyre_purchase', 'engine_oil_purchase',
  'engine_oil_usage', 'payment_received', 'payment_history'
];

const QUICK_ACTION_IDS = [
  'qa_trip_entry', 'qa_fuel_entry', 'qa_payment_entry', 'qa_maint_entry',
  'qa_billing_summary'
];

const NAV_STATE_KEY = 'noorTransport.activePage';
const USER_SESSION_KEY = 'noorTransport.currentUser';
const SESSION_TIMESTAMP_KEY = 'noorTransport.lastActivity';
const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 Hours in milliseconds

export default function App() {
  const [databaseReady, setDatabaseReady] = useState(() => !dbService.hasApiSession());
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem(NAV_STATE_KEY) || 'dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  // Authentication State with Session Expiry Check
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_SESSION_KEY);
      const lastActivity = localStorage.getItem(SESSION_TIMESTAMP_KEY);

      if (stored && lastActivity) {
        const elapsed = Date.now() - parseInt(lastActivity, 10);
        if (elapsed > SESSION_TIMEOUT_MS) {
          localStorage.removeItem(USER_SESSION_KEY);
          localStorage.removeItem(SESSION_TIMESTAMP_KEY);
          return null;
        }
      }
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  useEffect(() => {
    if (dbService.hasApiSession()) dbService.hydrate().finally(() => setDatabaseReady(true));

    // Global listener: Auto-refresh active views whenever database state changes
    const unsubscribe = dbService.subscribe(() => {
      setRefreshKey(prev => prev + 1);
    });
    return () => unsubscribe();
  }, []);

  // Session Inactivity Monitoring & Auto-Logout
  useEffect(() => {
    if (!currentUser) return;

    // Update last activity timestamp on mount and user interaction
    const updateActivity = () => {
      localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
    };

    updateActivity();

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    const handleUserActivity = () => {
      updateActivity();
    };

    activityEvents.forEach(evt => window.addEventListener(evt, handleUserActivity));

    // Interval check every 1 minute to auto logout if idle for 2+ hours
    const timer = setInterval(() => {
      const lastActivity = localStorage.getItem(SESSION_TIMESTAMP_KEY);
      if (lastActivity) {
        const elapsed = Date.now() - parseInt(lastActivity, 10);
        if (elapsed > SESSION_TIMEOUT_MS) {
          setCurrentUser(null);
          localStorage.removeItem(USER_SESSION_KEY);
          localStorage.removeItem(SESSION_TIMESTAMP_KEY);
          alert('Your session has expired due to 2 hours of inactivity. Please log in again.');
        }
      }
    }, 60000);

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, handleUserActivity));
      clearInterval(timer);
    };
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(NAV_STATE_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(currentUser));
      if (!localStorage.getItem(SESSION_TIMESTAMP_KEY)) {
        localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
      }
    } else {
      localStorage.removeItem(USER_SESSION_KEY);
      localStorage.removeItem(SESSION_TIMESTAMP_KEY);
    }
  }, [currentUser]);

  const handleLoginSuccess = async (user) => {
    await dbService.hydrate();
    setDatabaseReady(true);
    setCurrentUser(user);
    localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    dbService.clearApiSession();
    localStorage.removeItem(USER_SESSION_KEY);
    localStorage.removeItem(SESSION_TIMESTAMP_KEY);
  };

  const handleBackup = () => {
    const data = JSON.stringify(dbService.data, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NoorLPG_Backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert('Database Backup downloaded successfully!');
  };

  const handleNavSelect = (id) => {
    if (id === 'qa_backup') {
      handleBackup();
      return;
    }
    setActiveTab(id);
  };

  if (!databaseReady) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: "'Nunito', 'Segoe UI', sans-serif", color: '#0f766e' }}>Loading Noor Transport data…</div>;
  }

  // Render Login Screen if not authenticated
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Determine back parent section
  const getParentSection = () => {
    if (MASTER_DATA_IDS.includes(activeTab)) return { id: 'masterData', title: 'Back to Master Data' };
    if (ENTRIES_IDS.includes(activeTab)) return { id: 'entries', title: 'Back to Entries' };
    if (activeTab.startsWith('rpt_')) return { id: 'reports', title: 'Back to Reports' };
    if (QUICK_ACTION_IDS.includes(activeTab)) return { id: 'quickActions', title: 'Back to Quick Actions' };
    return null;
  };

  const parentSection = getParentSection();

  // Permission Verification Guard
  const userHasAccess = hasPermission(currentUser, activeTab);

  const renderModuleContent = () => {
    if (!userHasAccess) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #fee2e2',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          marginTop: '20px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#fef2f2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#dc2626',
            marginBottom: '16px'
          }}>
            <ShieldAlert size={36} />
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>
            Access Restricted
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '420px', margin: '0 0 24px 0', lineHeight: '1.5' }}>
            You do not have permission to access this module. Please contact your System Administrator to request module authorization.
          </p>

          <button
            onClick={() => setActiveTab('dashboard')}
            className="btn btn-teal"
            style={{ padding: '10px 20px', fontWeight: '700', borderRadius: '10px' }}
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    // Dashboard
    if (activeTab === 'dashboard') return <DashboardOverview key={refreshKey} onUpdateTrip={handleRefresh} onNavigate={handleNavSelect} />;

    // User Management (Admin Only)
    if (activeTab === 'user_mgmt') return <UserMgmt key={refreshKey} />;

    // Main Section Landing Pages
    if (activeTab === 'masterData') {
      return (
        <SectionLandingPage
          title="Master Data Management"
          subtitle="Configure system master records, fleet vehicles, drivers, locations, and vendors."
          icon={Database}
          items={MASTER_DATA_CARDS}
          onSelectModule={handleNavSelect}
          currentUser={currentUser}
        />
      );
    }

    if (activeTab === 'entries') {
      return (
        <SectionLandingPage
          title="Operational Entries"
          subtitle="Manage daily trip dispatches, fuel entries, maintenance, and centralized payment settlements."
          icon={ClipboardList}
          items={ENTRIES_CARDS}
          onSelectModule={handleNavSelect}
          currentUser={currentUser}
        />
      );
    }

    if (activeTab === 'reports') {
      return (
        <SectionLandingPage
          title="Financial & Operational Reports"
          subtitle="View and export comprehensive ledgers, trip freight reports, bank status, and system analytics."
          icon={FileText}
          items={REPORTS_CARDS}
          onSelectModule={handleNavSelect}
          currentUser={currentUser}
        />
      );
    }

    if (activeTab === 'quickActions') {
      return (
        <SectionLandingPage
          title="Quick Actions"
          subtitle="Frequently used administrative utilities, invoicing summary, and database backups."
          icon={Zap}
          items={QUICK_ACTIONS_CARDS}
          onSelectModule={handleNavSelect}
          currentUser={currentUser}
        />
      );
    }

    // Master Data Child Pages
    if (activeTab === 'vehicles')      return <FleetVehicles key={refreshKey} />;
    if (activeTab === 'transporters')   return <TransporterMgmt key={refreshKey} />;
    if (activeTab === 'sources')        return <SourceMgmt key={refreshKey} />;
    if (activeTab === 'destinations')   return <DestinationMgmt key={refreshKey} />;
    if (activeTab === 'customers')      return <CustomerMgmt key={refreshKey} />;
    if (activeTab === 'workshops')      return <WorkshopMgmt key={refreshKey} />;
    if (activeTab === 'maint_heads')    return <MaintHeadMgmt key={refreshKey} />;
    if (activeTab === 'documents')      return <DocumentMgmt key={refreshKey} />;
    if (activeTab === 'vendors')        return <VendorMgmt key={refreshKey} />;
    if (activeTab === 'drivers')        return <DriverMgmt key={refreshKey} />;
    if (activeTab === 'tyres')          return <TyreMgmt key={refreshKey} />;
    if (activeTab === 'tyre_brands')    return <TyreBrandMgmt key={refreshKey} />;
    if (activeTab === 'cash')           return <CashMgmt key={refreshKey} />;
    if (activeTab === 'fuel_pump')      return <FuelPumpMgmt key={refreshKey} />;
    if (activeTab === 'engine_oil')     return <EngineOilMgmt key={refreshKey} />;
    if (activeTab === 'bank_accounts')  return <BankMgmt key={refreshKey} />;
    if (activeTab === 'vehicle_category') return <VehicleCategory key={refreshKey} />;
    if (activeTab === 'tanker_ownership') return <TankerOwnership key={refreshKey} />;

    // Entries Child Pages
    if (activeTab === 'payment_entry')       return <PaymentEntry key={refreshKey} />;
    if (activeTab === 'trip_entry')          return <TripEntry key={refreshKey} />;
    if (activeTab === 'trip_edit')           return <TripEdit key={refreshKey} />;
    if (activeTab === 'update_delivery')     return <UpdateDelivery key={refreshKey} />;
    if (activeTab === 'fuel_entry')          return <FuelEntry key={refreshKey} />;
    if (activeTab === 'maint_entry')         return <MaintenanceEntry key={refreshKey} />;
    if (activeTab === 'tyre_purchase')       return <TyrePurchase key={refreshKey} />;
    if (activeTab === 'engine_oil_purchase') return <EngineOilPurchase key={refreshKey} />;
    if (activeTab === 'engine_oil_usage')    return <EngineOilUsage key={refreshKey} />;
    if (activeTab === 'payment_received')    return <PaymentReceived key={refreshKey} />;
    if (activeTab === 'payment_history')     return <PaymentHistory key={refreshKey} />;

    // Reports Child Pages
    if (activeTab.startsWith('rpt_')) {
      const reportType = activeTab.replace('rpt_', '');
      return <ReportsPrinting key={`${activeTab}-${refreshKey}`} defaultReport={reportType} />;
    }

    // Quick Actions
    if (activeTab === 'qa_trip_entry') return <TripEntry key={refreshKey} />;
    if (activeTab === 'qa_fuel_entry') return <FuelEntry key={refreshKey} />;
    if (activeTab === 'qa_payment_entry') return <PaymentEntry key={refreshKey} />;
    if (activeTab === 'qa_maint_entry') return <MaintenanceEntry key={refreshKey} />;
    if (activeTab === 'qa_billing_summary') return <InvoicingBilling key={refreshKey} defaultTab="summary" />;
    if (activeTab === 'qa_restore' || activeTab === 'settings') return <CompanySettings key={refreshKey} />;

    // Fallback
    return <DashboardOverview key={refreshKey} onUpdateTrip={handleRefresh} onNavigate={handleNavSelect} />;
  };

  return (
    <div className="app-shell">
      <Navbar currentUser={currentUser} onRefresh={handleRefresh} />

      <div className="app-body">
        <Sidebar activeTab={activeTab} setActiveTab={handleNavSelect} currentUser={currentUser} onLogout={handleLogout} />

        <main className="app-main">
          {parentSection && (
            <div style={{ marginBottom: '12px', paddingLeft: '4px' }}>
              <button
                onClick={() => setActiveTab(parentSection.id)}
                className="btn btn-ghost"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#0d9488',
                  background: '#f0fdfa',
                  border: '1px solid #ccfbf1',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={14} />
                <span>{parentSection.title}</span>
              </button>
            </div>
          )}

          {renderModuleContent()}
        </main>
      </div>
    </div>
  );
}
