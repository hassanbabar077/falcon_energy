// Permission Service for Falcon Energy Transport System Role-Based Access Control

export const PERMISSION_MODULES = [
  {
    key: 'masterData',
    label: 'Master Data Management',
    description: 'Vehicles, Drivers, Vendors, Locations, & Bank Accounts',
    items: [
      { id: 'vehicles', label: 'Fleet Vehicles' },
      { id: 'transporters', label: 'Transporters' },
      { id: 'sources', label: 'Loading Sources' },
      { id: 'destinations', label: 'Destinations' },
      { id: 'customers', label: 'Customers' },
      { id: 'workshops', label: 'Workshops' },
      { id: 'maint_heads', label: 'Maintenance Heads' },
      { id: 'documents', label: 'Documents Register' },
      { id: 'vendors', label: 'Vendors' },
      { id: 'drivers', label: 'Drivers & HR' },
      { id: 'tyres', label: 'Tyres Inventory' },
      { id: 'tyre_brands', label: 'Tyre Brands' },
      { id: 'cash', label: 'Cash Accounts' },
      { id: 'fuel_pump', label: 'Fuel Pumps' },
      { id: 'engine_oil', label: 'Engine Oil Master' },
      { id: 'bank_accounts', label: 'Bank Accounts' }
    ]
  },
  {
    key: 'entries',
    label: 'Operational Entries',
    description: 'Trip Dispatch, Fueling, Maintenance & Payments',
    items: [
      { id: 'trip_entry', label: 'Trip Dispatch Entry' },
      { id: 'trip_edit', label: 'Trip Edit & History' },
      { id: 'update_delivery', label: 'Update Delivery Status' },
      { id: 'fuel_entry', label: 'Fuel & Oil Entry' },
      { id: 'maint_entry', label: 'Maintenance Entry' },
      { id: 'payment_entry', label: 'Payment Settlement Entry' },
      { id: 'payment_received', label: 'Payment Received' },
      { id: 'payment_history', label: 'Payment History' },
      { id: 'tyre_purchase', label: 'Tyre Purchase Entry' },
      { id: 'engine_oil_purchase', label: 'Engine Oil Purchase' },
      { id: 'engine_oil_usage', label: 'Engine Oil Usage' }
    ]
  },
  {
    key: 'reports',
    label: 'Reports & Ledgers',
    description: 'Ledgers, Freight Analytics, Vehicle & Fuel Reports',
    items: [
      { id: 'rpt_trip_detailed_sheet', label: 'Detailed Trip Sheet Report (1671 JW Style)' },
      { id: 'rpt_cash_account_ledger', label: 'Cash Account General Ledger' },
      { id: 'rpt_daily_activity_report', label: 'Daily Activity Report' },
      { id: 'rpt_universal_ledger', label: 'Universal General Ledger' },
      { id: 'rpt_pending_payables_overview', label: 'Pending Payables Overview' },
      { id: 'rpt_fuel_trip_summary', label: 'Fuel Trip Summary' },
      { id: 'rpt_vendor_ledger', label: 'Vendor Ledger' },
      { id: 'rpt_workshop_ledger', label: 'Workshop Ledger' },
      { id: 'rpt_fuel_pump_ledger', label: 'Fuel Pump Ledger' },
      { id: 'rpt_bank_ledger', label: 'Bank Ledger' },
      { id: 'rpt_trip_payment_status', label: 'Trip Payment Status' },
      { id: 'rpt_trips', label: 'Trips Summary Report' },
      { id: 'rpt_vehicles', label: 'Vehicle Performance Report' },
      { id: 'rpt_drivers', label: 'Driver Report' },
      { id: 'rpt_maintenance', label: 'Maintenance Report' },
      { id: 'rpt_fuel', label: 'Fuel Ledger' },
      { id: 'rpt_bank', label: 'Bank Register' },
      { id: 'rpt_tyre', label: 'Tyre Stock & Usage' }
    ]
  },
  {
    key: 'quickActions',
    label: 'Quick Actions',
    description: 'Shortcuts and System Billing Tools',
    items: [
      { id: 'qa_trip_entry', label: 'Quick Trip Entry' },
      { id: 'qa_fuel_entry', label: 'Quick Fuel Entry' },
      { id: 'qa_payment_entry', label: 'Quick Payment Entry' },
      { id: 'qa_maint_entry', label: 'Quick Maintenance' },
      { id: 'qa_billing_summary', label: 'Invoicing & Billing' },
      { id: 'qa_backup', label: 'Database Backup' }
    ]
  },
  {
    key: 'system',
    label: 'System & Security',
    description: 'User Management and System Settings',
    items: [
      { id: 'user_mgmt', label: 'User & Permission Management' },
      { id: 'settings', label: 'Company Settings' }
    ]
  }
];

// Helper to check if a user has permission for a specific page or section ID
export function hasPermission(user, pageId) {
  if (!user) return false;

  // Root Admin or 'all' permission has full unrestricted access
  if (user.role === 'Admin' || (Array.isArray(user.permissions) && user.permissions.includes('all'))) {
    return true;
  }

  // Dashboard is accessible to all logged-in active users
  if (pageId === 'dashboard') return true;

  const permissions = Array.isArray(user.permissions) ? user.permissions : [];

  // Admin-only pages
  if (pageId === 'user_mgmt') {
    return user.role === 'Admin';
  }

  // Section Landing Pages (masterData, entries, reports, quickActions)
  if (['masterData', 'entries', 'reports', 'quickActions'].includes(pageId)) {
    if (permissions.includes(pageId)) return true;

    // Alternatively, if user has permission for ANY item inside this section, allow section landing access
    const category = PERMISSION_MODULES.find(m => m.key === pageId);
    if (category) {
      return category.items.some(item => permissions.includes(item.id));
    }
  }

  // Quick action mappings to base pages
  if (pageId === 'qa_trip_entry') return permissions.includes('trip_entry') || permissions.includes('qa_trip_entry');
  if (pageId === 'qa_fuel_entry') return permissions.includes('fuel_entry') || permissions.includes('qa_fuel_entry');
  if (pageId === 'qa_payment_entry') return permissions.includes('payment_entry') || permissions.includes('qa_payment_entry');
  if (pageId === 'qa_maint_entry') return permissions.includes('maint_entry') || permissions.includes('qa_maint_entry');
  if (pageId === 'qa_billing_summary') return permissions.includes('qa_billing_summary');
  if (pageId === 'qa_backup') return permissions.includes('qa_backup') || user.role === 'Admin';
  if (pageId === 'qa_restore') return user.role === 'Admin';

  // Check reports wildcard or specific report
  if (pageId.startsWith('rpt_')) {
    if (permissions.includes('reports') || permissions.includes(pageId)) return true;
  }

  // Check explicit permission ID
  return permissions.includes(pageId);
}

// Filter landing page cards based on user permissions
export function filterAllowedCards(user, cards) {
  if (!user) return [];
  if (user.role === 'Admin' || (Array.isArray(user.permissions) && user.permissions.includes('all'))) {
    return cards;
  }
  return cards.filter(card => hasPermission(user, card.id));
}
