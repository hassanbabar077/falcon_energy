import {
  Truck, Building2, MapPin, Navigation, Users, Wrench, Cog, FileText,
  Store, UserCheck, CircleDot, Tag, Banknote, Fuel, Droplets, Landmark,
  CreditCard, PenTool, Edit3, Clock, ShoppingCart, Package, ArrowDownLeft,
  History, AlertCircle, BookOpen, TrendingUp,
  Building, Receipt, Save, Settings
} from 'lucide-react';

export const MASTER_DATA_CARDS = [
  { id: 'vehicles', label: 'Vehicles', icon: Truck, description: 'Add, view and manage all fleet trucks & prime movers', color: '#0d9488', bg: '#f0fdfa', borderColor: '#ccfbf1' },
  { id: 'drivers', label: 'Drivers & HR', icon: UserCheck, description: 'Driver profiles, CNICs, licenses, and assigned trucks', color: '#2563eb', bg: '#eff6ff', borderColor: '#bfdbfe' },
  { id: 'customers', label: 'Customers', icon: Users, description: 'Customer master records, billing terms and contacts', color: '#059669', bg: '#ecfdf5', borderColor: '#a7f3d0' },
  { id: 'vendors', label: 'Vendors', icon: Store, description: 'Manage tyre suppliers, spare parts and oil vendors', color: '#d97706', bg: '#fffbeb', borderColor: '#fde68a' },
  { id: 'transporters', label: 'Transporters', icon: Building2, description: 'Manage transport company partners and contacts', color: '#2563eb', bg: '#eff6ff', borderColor: '#bfdbfe' },
  { id: 'sources', label: 'Sources / Loading', icon: MapPin, description: 'Configure LPG loading plants, refineries and sources', color: '#d97706', bg: '#fffbeb', borderColor: '#fde68a' },
  { id: 'destinations', label: 'Destinations', icon: Navigation, description: 'Manage unloading LPG terminals, plants and depots', color: '#7c3aed', bg: '#f5f3ff', borderColor: '#ddd6fe' },
  { id: 'fuel_pump', label: 'Fuel Pumps', icon: Fuel, description: 'Fuel pump master data and contract rates', color: '#d97706', bg: '#fffbeb', borderColor: '#fde68a' },
  { id: 'workshops', label: 'Workshops', icon: Wrench, description: 'Maintenance & repair workshops and mechanic logs', color: '#dc2626', bg: '#fef2f2', borderColor: '#fecaca' },
  { id: 'maint_heads', label: 'Maintenance Heads', icon: Cog, description: 'Expense heads for regular & emergency vehicle servicing', color: '#4f46e5', bg: '#eef2ff', borderColor: '#c7d2fe' },
  { id: 'tyre_brands', label: 'Tyre Brands', icon: Tag, description: 'Tyre brand master data, category and origin details', color: '#7c3aed', bg: '#f5f3ff', borderColor: '#ddd6fe' },
  { id: 'tyres', label: 'Tyre Inventory', icon: CircleDot, description: 'Tyre serial numbers, positions, and status', color: '#0d9488', bg: '#f0fdfa', borderColor: '#ccfbf1' },
  { id: 'engine_oil', label: 'Engine Oil Master', icon: Droplets, description: 'Engine oil master data and brand inventory', color: '#0891b2', bg: '#ecfeff', borderColor: '#a5f3fc' },
  { id: 'vehicle_category', label: 'Vehicle Category', icon: Tag, description: 'Manage vehicle categories (Falcon Energy, Rented, etc.)', color: '#0d9488', bg: '#f0fdfa', borderColor: '#ccfbf1' },
  { id: 'tanker_ownership', label: 'Tanker Ownership', icon: Building, description: 'Manage tanker ownership classifications (Falcon Energy, Private, etc.)', color: '#2563eb', bg: '#eff6ff', borderColor: '#bfdbfe' },
  { id: 'bank_accounts', label: 'Bank Accounts', icon: Landmark, description: 'Manage company bank accounts and running balances', color: '#2563eb', bg: '#eff6ff', borderColor: '#bfdbfe' },
  { id: 'cash', label: 'Cash Accounts', icon: Banknote, description: 'Track cash accounts, balances, and petty cash', color: '#059669', bg: '#ecfdf5', borderColor: '#a7f3d0' },
  { id: 'documents', label: 'Document Register', icon: FileText, description: 'Track vehicle route permits, fitness & licenses', color: '#0891b2', bg: '#ecfeff', borderColor: '#a5f3fc' },
];

export const ENTRIES_CARDS = [
  { id: 'trip_entry', label: 'Trip Entry / Dispatch', icon: PenTool, description: 'Dispatch and create new LPG transport trip records', color: '#2563eb', bg: '#eff6ff', borderColor: '#bfdbfe' },
  { id: 'update_delivery', label: 'Update Delivery', icon: Clock, description: 'Record unloading weights, pressures, and freight cost', color: '#d97706', bg: '#fffbeb', borderColor: '#fde68a' },
  { id: 'trip_edit', label: 'Edit Trip Records', icon: Edit3, description: 'Search, modify or update existing trip dispatch records', color: '#4f46e5', bg: '#eef2ff', borderColor: '#c7d2fe' },
  { id: 'fuel_entry', label: 'Fuel Entry', icon: Fuel, description: 'Log diesel refills, pump bills, and fuel receipts', color: '#0891b2', bg: '#ecfeff', borderColor: '#a5f3fc' },
  { id: 'maint_entry', label: 'Maintenance Entry', icon: Wrench, description: 'Record vehicle repair logs and workshop job cards', color: '#dc2626', bg: '#fef2f2', borderColor: '#fecaca' },
  { id: 'engine_oil_purchase', label: 'Oil Purchase Entry', icon: Package, description: 'Log bulk engine oil purchases and inventory top-ups', color: '#059669', bg: '#ecfdf5', borderColor: '#a7f3d0' },
  { id: 'engine_oil_usage', label: 'Oil Usage Entry', icon: Droplets, description: 'Track oil consumption per vehicle service', color: '#0891b2', bg: '#ecfeff', borderColor: '#a5f3fc' },
  { id: 'tyre_purchase', label: 'Tyre Purchase Entry', icon: ShoppingCart, description: 'Record new tyre purchases and vendor payables', color: '#7c3aed', bg: '#f5f3ff', borderColor: '#ddd6fe' },
  { id: 'payment_entry', label: 'Payment Entry (Voucher)', icon: CreditCard, description: 'Centralized portal to pay pending payables from bank', color: '#0d9488', bg: '#f0fdfa', borderColor: '#ccfbf1', badge: 'Core Payment' },
  { id: 'payment_received', label: 'Payment Received', icon: ArrowDownLeft, description: 'Record customer freight payments and receipts', color: '#2563eb', bg: '#eff6ff', borderColor: '#bfdbfe' },
  { id: 'payment_history', label: 'Payment History', icon: History, description: 'View historical payment logs and transaction receipts', color: '#4f46e5', bg: '#eef2ff', borderColor: '#c7d2fe' },
];

export const REPORTS_CARDS = [
  { id: 'rpt_trip_detailed_sheet', label: 'Trip Sheet Report', icon: FileText, description: 'Executive trip sheet with Diesel, Route, Driver Advance, Sub-Expenses and Net Balance', color: '#b45309', bg: '#fef3c7', borderColor: '#fde68a', badge: 'Trip Report' },
  { id: 'rpt_cash_account_ledger', label: 'Cash Account Ledger', icon: Banknote, description: 'Bank-style cash account statement with Opening Balance, Inflows (Cr), Outflows (Dr) and Running Balance', color: '#059669', bg: '#ecfdf5', borderColor: '#a7f3d0', badge: 'Cash Ledger' },
  { id: 'rpt_daily_activity_report', label: 'Daily Activity Report', icon: BookOpen, description: 'Executive dashboard layout with vehicle locations, fuel, workshop & oil stock', color: '#0f766e', bg: '#f0fdfa', borderColor: '#99f6e4', badge: 'Executive' },
  { id: 'rpt_universal_ledger', label: 'Universal Ledger', icon: BookOpen, description: 'Combined double-entry general ledger for all bank, vendor & party accounts', color: '#7c3aed', bg: '#f5f3ff', borderColor: '#ddd6fe', badge: 'Universal' },
  { id: 'rpt_pending_payables_overview', label: 'Pending Payment Report', icon: AlertCircle, description: 'Consolidated view of all company pending payables', color: '#dc2626', bg: '#fef2f2', borderColor: '#fecaca', badge: 'Payables' },
  { id: 'rpt_fuel_trip_summary', label: 'Fuel Summary Report', icon: Fuel, description: 'Opening & added fuel breakdown per trip and vehicle', color: '#0d9488', bg: '#f0fdfa', borderColor: '#ccfbf1' },
  { id: 'rpt_vendor_ledger', label: 'Vendor Ledger', icon: BookOpen, description: 'Detailed financial ledger for vendor purchases & bills', color: '#2563eb', bg: '#eff6ff', borderColor: '#bfdbfe' },
  { id: 'rpt_workshop_ledger', label: 'Workshop Ledger', icon: Wrench, description: 'Maintenance bills, paid amounts, and workshop balances', color: '#d97706', bg: '#fffbeb', borderColor: '#fde68a' },
  { id: 'rpt_fuel_pump_ledger', label: 'Fuel Pump Ledger', icon: Fuel, description: 'Fuel pump credit accounts and payment ledgers', color: '#d97706', bg: '#fffbeb', borderColor: '#fde68a' },
  { id: 'rpt_bank_ledger', label: 'Bank Ledger', icon: Landmark, description: 'Bank account debits, credits, and running balance', color: '#0d9488', bg: '#f0fdfa', borderColor: '#ccfbf1' },
  { id: 'rpt_trips', label: 'Trip Freight Report', icon: FileText, description: 'Comprehensive trip freight logs and dispatch metrics', color: '#4f46e5', bg: '#eef2ff', borderColor: '#c7d2fe' },
  { id: 'rpt_trip_payment_status', label: 'Trip Payment Status', icon: TrendingUp, description: 'Trip settlement and payment status overview', color: '#059669', bg: '#ecfdf5', borderColor: '#a7f3d0' },
  { id: 'rpt_vehicles', label: 'Vehicle Report', icon: Truck, description: 'Fleet vehicle operational status and performance', color: '#0891b2', bg: '#ecfeff', borderColor: '#a5f3fc' },
  { id: 'rpt_drivers', label: 'Driver Report', icon: Users, description: 'Driver assignments and performance statistics', color: '#2563eb', bg: '#eff6ff', borderColor: '#bfdbfe' },
  { id: 'rpt_maintenance', label: 'Maintenance Report', icon: Wrench, description: 'Repair expenses breakdown by vehicle and category', color: '#dc2626', bg: '#fef2f2', borderColor: '#fecaca' },
  { id: 'rpt_bank', label: 'Bank Master Report', icon: Building, description: 'Bank master balances and liquidity status', color: '#0d9488', bg: '#f0fdfa', borderColor: '#ccfbf1' },
  { id: 'rpt_tyre', label: 'Tyre Report', icon: CircleDot, description: 'Tyre inventory life, wear, and mileage performance', color: '#0d9488', bg: '#f0fdfa', borderColor: '#ccfbf1' },
];

export const QUICK_ACTIONS_CARDS = [
  { id: 'qa_trip_entry', label: 'Add Trip', icon: PenTool, description: 'Create a new LPG transport trip dispatch', color: '#2563eb', bg: '#eff6ff', borderColor: '#bfdbfe', actionLabel: 'Open' },
  { id: 'qa_fuel_entry', label: 'Add Fuel Entry', icon: Fuel, description: 'Record a diesel refill and fuel receipt', color: '#0891b2', bg: '#ecfeff', borderColor: '#a5f3fc', actionLabel: 'Open' },
  { id: 'qa_payment_entry', label: 'Add Payment', icon: CreditCard, description: 'Open centralized payable settlement entry', color: '#0d9488', bg: '#f0fdfa', borderColor: '#ccfbf1', actionLabel: 'Open' },
  { id: 'qa_maint_entry', label: 'Add Maintenance', icon: Wrench, description: 'Record a vehicle repair or workshop job', color: '#dc2626', bg: '#fef2f2', borderColor: '#fecaca', actionLabel: 'Open' },
  { id: 'qa_billing_summary', label: 'Billing Summary', icon: Receipt, description: 'Quick overview of customer invoicing & billing summary', color: '#2563eb', bg: '#eff6ff', borderColor: '#bfdbfe', actionLabel: 'Open' },
  { id: 'qa_backup', label: 'Backup Database', icon: Save, description: 'Export full SQLite/JSON database backup file to computer', color: '#059669', bg: '#ecfdf5', borderColor: '#a7f3d0', actionLabel: 'Download' },
  { id: 'settings', label: 'Company Settings', icon: Settings, description: 'Manage company profile, letterhead, and system configuration', color: '#7c3aed', bg: '#f5f3ff', borderColor: '#ddd6fe', actionLabel: 'Open' },
];
