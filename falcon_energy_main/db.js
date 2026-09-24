import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

export const emptyState = () => ({
  company_info: { id: 1, name: 'Falcon Energy', system_name: 'LPG Transport Management System', address: 'Lahore, Pakistan', contact: '0300-8462849', email: 'info@falconenergy.com', backup_path: 'C:\\NoorTransport\\Backup\\', last_reset: new Date().toISOString().slice(0, 10) },
  lookup_tables: [
    { category: 'Vehicle Status', options: ['Active', 'Maintenance', 'Inactive', 'Retired'] },
    { category: 'Trip Status', options: ['Pending', 'Completed', 'Cancelled'] },
    { category: 'Payment Status', options: ['Pending', 'In Process', 'Completed'] },
    { category: 'Vehicle Category', options: ['Rented', 'Falcon Energy', 'Open Market'] },
    { category: 'Vehicle Type', options: ['Skid Mounted', 'Complete Unit', 'Attached Tanker'] },
    { category: 'Rent Type', options: ['Monthly', 'Per Ton', 'Per KM'] },
    { category: 'Freight Type', options: ['Per KM', 'Per Ton', 'Monthly'] },
    { category: 'Source', options: ['Port', 'JJVL', 'Sinjhoro', 'Qadirpur', 'Sawan'] },
    { category: 'Destination', options: ['KKP', 'Bhatti LPG', 'PPL', 'OGDCL'] },
    { category: 'Tanker Ownership', options: ['Falcon Energy', 'Private', 'Rented'] },
    { category: 'Maintenance Type', options: ['Regular', 'Emergency', 'Scheduled'] },
    { category: 'Maintenance Category', options: ['Prime Mover', 'Tanker', 'Tyre'] },
    { category: 'Tyre Condition', options: ['New', 'Old'] },
    { category: 'Tyre Status', options: ['Active', 'Inactive', 'Expired'] },
    { category: 'Vendor Type', options: ['LPG', 'Spare Part', 'Others'] },
    { category: 'Payment Category', options: ['Vendor Payment', 'Workshop Maintenance', 'Trip Payment', 'Fuel Payment', 'Engine Oil Payment', 'Other'] },
    { category: 'Fuel Payment Type', options: ['Cash', 'Bank', 'Credit'] },
    { category: 'Bank Transaction Type', options: ['Deposit', 'Withdrawal', 'Transfer', 'Payment'] },
    { category: 'Bill Type', options: ['Per Ton', 'Per KM', 'Monthly', 'Customer Wise'] },
    { category: 'Tyre Brand Category', options: ['Local', 'Imported'] }
  ],
  vehicles: [], transporters: [], loading_sources: [], destinations: [], customers: [], drivers: [], vendors: [], trips: [], fines: [], workshops: [], maintenance_heads: [], maintenance: [], document_register: [], tyre_brands: [], tyres_record: [], fuel_pumps: [], fuel_entries: [], engine_oil_defination: [], engine_oil_purchase: [], engine_oil_usage: [], bank_accounts: [], bank_transactions: [], payments: [], general_ledger: [], cash_payments: [], bills_register: [], payments_received: [], payment_history: [],
  vehicle_categories: [
    { id: 'CAT-001', code: 'CAT-001', name: 'Falcon Energy', status: 'Active', description: 'Falcon Energy fleet vehicles', createdAt: new Date().toISOString() },
    { id: 'CAT-002', code: 'CAT-002', name: 'Rented', status: 'Active', description: 'Rented vehicles', createdAt: new Date().toISOString() },
    { id: 'CAT-003', code: 'CAT-003', name: 'Open Market', status: 'Active', description: 'Open market vehicles', createdAt: new Date().toISOString() },
    { id: 'CAT-004', code: 'CAT-004', name: 'Private', status: 'Active', description: 'Private vehicles', createdAt: new Date().toISOString() }
  ],
  tanker_ownerships: [
    { id: 'TOW-001', code: 'TOW-001', name: 'Falcon Energy', status: 'Active', description: 'Falcon Energy owned tankers', createdAt: new Date().toISOString() },
    { id: 'TOW-002', code: 'TOW-002', name: 'Private', status: 'Active', description: 'Privately owned tankers', createdAt: new Date().toISOString() },
    { id: 'TOW-003', code: 'TOW-003', name: 'Rented', status: 'Active', description: 'Rented tankers', createdAt: new Date().toISOString() },
    { id: 'TOW-004', code: 'TOW-004', name: 'Leased', status: 'Active', description: 'Leased tankers', createdAt: new Date().toISOString() }
  ],
  users: [{ id: 'USR-001', username: 'admin', password: bcrypt.hashSync('admin123', 10), name: 'System Administrator', role: 'Admin', status: 'Active', permissions: ['all'], createdAt: new Date().toISOString() }]
});

export function createPool(config) {
  return mysql.createPool({
    host: config.DB_HOST || '127.0.0.1',
    port: Number(config.DB_PORT || 3306),
    user: config.DB_USER || 'root',
    password: config.DB_PASSWORD !== undefined ? config.DB_PASSWORD : '',
    database: config.DB_NAME || 'falcon_energy',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

export const TABLE_COLUMNS = {
  company_info: ['id', 'name', 'system_name', 'address', 'contact', 'email', 'backup_path', 'last_reset'],
  lookup_tables: ['id', 'category', 'options'],
  vehicle_categories: ['id', 'code', 'name', 'status', 'description', 'createdAt', 'updatedAt'],
  tanker_ownerships: ['id', 'code', 'name', 'status', 'description', 'createdAt', 'updatedAt'],
  users: ['id', 'username', 'password', 'name', 'role', 'status', 'permissions', 'createdAt'],
  vehicles: ['id', 'code', 'number', 'transporter', 'category', 'type', 'rent_type', 'ownership', 'capacity', 'engine_no', 'chassis_no', 'model', 'status', 'assigned_driver', 'remarks', 'createdAt', 'updatedAt'],
  transporters: ['id', 'code', 'name', 'contact_person', 'phone', 'email', 'address', 'cnic', 'status', 'remarks', 'createdAt', 'updatedAt'],
  loading_sources: ['id', 'code', 'name', 'location', 'contact_person', 'phone', 'status', 'remarks', 'createdAt', 'updatedAt'],
  destinations: ['id', 'code', 'name', 'location', 'distance_km', 'status', 'remarks', 'createdAt', 'updatedAt'],
  customers: ['id', 'code', 'business_name', 'contact_person', 'phone', 'email', 'address', 'ntn', 'strn', 'status', 'remarks', 'createdAt', 'updatedAt'],
  drivers: ['id', 'code', 'name', 'father_name', 'cnic', 'license_no', 'license_expiry', 'phone', 'emergency_contact', 'assigned_vehicle', 'status', 'address', 'remarks', 'createdAt', 'updatedAt'],
  vendors: ['id', 'code', 'name', 'vendor_type', 'contact_person', 'phone', 'address', 'ntn', 'status', 'remarks', 'createdAt', 'updatedAt'],
  trips: ['id', 'trip_no', 'loading_date', 'unloading_date', 'vehicle', 'transporter', 'driver', 'source', 'plant', 'destination', 'customer', 'vendor', 'freight_type', 'freight_rate', 'loading_weight', 'unloading_weight', 'weight_diff', 'shortage_allowance', 'shortage_qty', 'shortage_rate', 'shortage_amount', 'total_freight', 'deductions', 'advances', 'net_freight', 'total_cost', 'amount', 'payment_status', 'status', 'remarks', 'createdAt', 'updatedAt'],
  fines: ['id', 'date', 'vehicle', 'driver', 'fine_type', 'location', 'challan_no', 'amount', 'paid_by', 'status', 'remarks', 'createdAt', 'updatedAt'],
  workshops: ['id', 'code', 'name', 'contact_person', 'phone', 'address', 'specialization', 'status', 'remarks', 'createdAt', 'updatedAt'],
  maintenance_heads: ['id', 'code', 'name', 'category', 'status', 'remarks', 'createdAt', 'updatedAt'],
  maintenance: ['id', 'date', 'vehicle', 'tanker_number', 'workshop', 'vendor', 'head', 'category', 'maintenance_type', 'meter_reading', 'description', 'amount', 'cost', 'total_amount', 'payment_status', 'status', 'remarks', 'createdAt', 'updatedAt'],
  document_register: ['id', 'document_type', 'vehicle', 'document_no', 'issue_date', 'expiry_date', 'issuing_authority', 'cost', 'status', 'remarks', 'createdAt', 'updatedAt'],
  tyre_brands: ['id', 'brand_code', 'brand_name', 'category', 'origin', 'status', 'remarks', 'createdAt', 'updatedAt'],
  tyres_record: ['id', 'purchase_date', 'tyre_number', 'brand', 'vendor', 'size', 'pattern', 'vehicle', 'position', 'condition', 'status', 'cost', 'amount', 'total_amount', 'meter_reading', 'remarks', 'createdAt', 'updatedAt'],
  fuel_pumps: ['id', 'code', 'name', 'location', 'contact_person', 'phone', 'payment_type', 'status', 'remarks', 'createdAt', 'updatedAt'],
  fuel_entries: ['id', 'date', 'vehicle', 'driver', 'trip_id', 'fuel_pump', 'vendor', 'liters', 'rate', 'amount', 'total_amount', 'payment_type', 'meter_reading', 'receipt_no', 'remarks', 'createdAt', 'updatedAt'],
  engine_oil_defination: ['id', 'code', 'name', 'brand', 'grade', 'unit', 'current_stock', 'min_stock', 'price', 'status', 'remarks', 'createdAt', 'updatedAt'],
  engine_oil_purchase: ['id', 'date', 'oil_name', 'vendor', 'supplier', 'quantity', 'unit_price', 'amount', 'total_amount', 'invoice_no', 'remarks', 'createdAt', 'updatedAt'],
  engine_oil_usage: ['id', 'date', 'vehicle', 'driver', 'oil_name', 'quantity', 'meter_reading', 'remarks', 'createdAt', 'updatedAt'],
  bank_accounts: ['id', 'code', 'bank_name', 'account_title', 'account_number', 'branch', 'iban', 'opening_balance', 'current_balance', 'status', 'remarks', 'createdAt', 'updatedAt'],
  bank_transactions: ['id', 'date', 'account', 'transaction_type', 'reference_no', 'party_name', 'description', 'amount', 'cheque_no', 'status', 'remarks', 'createdAt', 'updatedAt'],
  payments: ['id', 'voucher_no', 'payment_date', 'date', 'party_category', 'party_name', 'party_id', 'paid_to', 'payment_source', 'payment_method', 'bank_account', 'cheque_no', 'amount', 'total_amount', 'remarks', 'status', 'createdAt', 'updatedAt'],
  general_ledger: ['id', 'date', 'account_name', 'party_name', 'voucher_type', 'voucher_no', 'description', 'debit', 'credit', 'balance', 'remarks', 'createdAt', 'updatedAt'],
  cash_payments: ['id', 'date', 'paid_to', 'driver', 'vehicle', 'category', 'payment_type', 'type', 'head', 'amount', 'bank', 'remarks', 'createdAt', 'updatedAt'],
  bills_register: ['id', 'bill_no', 'bill_date', 'customer', 'bill_type', 'from_date', 'to_date', 'total_trips', 'total_weight', 'total_amount', 'status', 'remarks', 'createdAt', 'updatedAt'],
  payments_received: ['id', 'payment_id', 'date', 'customer', 'party_name', 'payment_method', 'bank', 'cheque_no', 'amount', 'remarks', 'createdAt', 'updatedAt'],
  payment_history: ['id', 'payment_id', 'date', 'amount', 'type', 'reference', 'remarks', 'createdAt', 'updatedAt']
};

export const TABLE_SCHEMAS = {
  company_info: `CREATE TABLE IF NOT EXISTS \`company_info\` (
    id INT PRIMARY KEY,
    name VARCHAR(191),
    system_name VARCHAR(191),
    address TEXT,
    contact VARCHAR(191),
    email VARCHAR(191),
    backup_path VARCHAR(255),
    last_reset VARCHAR(50),
    raw_data JSON
  )`,

  lookup_tables: `CREATE TABLE IF NOT EXISTS \`lookup_tables\` (
    id VARCHAR(191) PRIMARY KEY,
    category VARCHAR(191) NOT NULL,
    options JSON,
    raw_data JSON
  )`,

  vehicle_categories: `CREATE TABLE IF NOT EXISTS \`vehicle_categories\` (
    id VARCHAR(191) PRIMARY KEY,
    code VARCHAR(100),
    name VARCHAR(191) NOT NULL,
    status VARCHAR(50),
    description TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  tanker_ownerships: `CREATE TABLE IF NOT EXISTS \`tanker_ownerships\` (
    id VARCHAR(191) PRIMARY KEY,
    code VARCHAR(100),
    name VARCHAR(191) NOT NULL,
    status VARCHAR(50),
    description TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  users: `CREATE TABLE IF NOT EXISTS \`users\` (
    id VARCHAR(191) PRIMARY KEY,
    username VARCHAR(191) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(191),
    role VARCHAR(100),
    status VARCHAR(50),
    permissions JSON,
    \`createdAt\` VARCHAR(100),
    raw_data JSON
  )`,

  vehicles: `CREATE TABLE IF NOT EXISTS \`vehicles\` (
    id VARCHAR(191) PRIMARY KEY,
    code VARCHAR(100),
    number VARCHAR(100),
    transporter VARCHAR(191),
    category VARCHAR(100),
    type VARCHAR(100),
    rent_type VARCHAR(100),
    ownership VARCHAR(100),
    capacity VARCHAR(100),
    engine_no VARCHAR(100),
    chassis_no VARCHAR(100),
    model VARCHAR(100),
    status VARCHAR(50),
    assigned_driver VARCHAR(191),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  transporters: `CREATE TABLE IF NOT EXISTS \`transporters\` (
    id VARCHAR(191) PRIMARY KEY,
    code VARCHAR(100),
    name VARCHAR(191),
    contact_person VARCHAR(191),
    phone VARCHAR(100),
    email VARCHAR(191),
    address TEXT,
    cnic VARCHAR(100),
    status VARCHAR(50),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  loading_sources: `CREATE TABLE IF NOT EXISTS \`loading_sources\` (
    id VARCHAR(191) PRIMARY KEY,
    code VARCHAR(100),
    name VARCHAR(191),
    location VARCHAR(191),
    contact_person VARCHAR(191),
    phone VARCHAR(100),
    status VARCHAR(50),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  destinations: `CREATE TABLE IF NOT EXISTS \`destinations\` (
    id VARCHAR(191) PRIMARY KEY,
    code VARCHAR(100),
    name VARCHAR(191),
    location VARCHAR(191),
    distance_km DECIMAL(10,2),
    status VARCHAR(50),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  customers: `CREATE TABLE IF NOT EXISTS \`customers\` (
    id VARCHAR(191) PRIMARY KEY,
    code VARCHAR(100),
    business_name VARCHAR(191),
    contact_person VARCHAR(191),
    phone VARCHAR(100),
    email VARCHAR(191),
    address TEXT,
    ntn VARCHAR(100),
    strn VARCHAR(100),
    status VARCHAR(50),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  drivers: `CREATE TABLE IF NOT EXISTS \`drivers\` (
    id VARCHAR(191) PRIMARY KEY,
    code VARCHAR(100),
    name VARCHAR(191),
    father_name VARCHAR(191),
    cnic VARCHAR(100),
    license_no VARCHAR(100),
    license_expiry VARCHAR(100),
    phone VARCHAR(100),
    emergency_contact VARCHAR(100),
    assigned_vehicle VARCHAR(191),
    status VARCHAR(50),
    address TEXT,
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  vendors: `CREATE TABLE IF NOT EXISTS \`vendors\` (
    id VARCHAR(191) PRIMARY KEY,
    code VARCHAR(100),
    name VARCHAR(191),
    vendor_type VARCHAR(100),
    contact_person VARCHAR(191),
    phone VARCHAR(100),
    address TEXT,
    ntn VARCHAR(100),
    status VARCHAR(50),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  trips: `CREATE TABLE IF NOT EXISTS \`trips\` (
    id VARCHAR(191) PRIMARY KEY,
    trip_no VARCHAR(100),
    loading_date VARCHAR(100),
    unloading_date VARCHAR(100),
    vehicle VARCHAR(191),
    transporter VARCHAR(191),
    driver VARCHAR(191),
    source VARCHAR(191),
    plant VARCHAR(191),
    destination VARCHAR(191),
    customer VARCHAR(191),
    vendor VARCHAR(191),
    freight_type VARCHAR(100),
    freight_rate DECIMAL(12,2),
    loading_weight DECIMAL(12,2),
    unloading_weight DECIMAL(12,2),
    weight_diff DECIMAL(12,2),
    shortage_allowance DECIMAL(12,2),
    shortage_qty DECIMAL(12,2),
    shortage_rate DECIMAL(12,2),
    shortage_amount DECIMAL(12,2),
    total_freight DECIMAL(12,2),
    deductions DECIMAL(12,2),
    advances DECIMAL(12,2),
    net_freight DECIMAL(12,2),
    total_cost DECIMAL(12,2),
    amount DECIMAL(12,2),
    payment_status VARCHAR(50),
    status VARCHAR(50),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  fines: `CREATE TABLE IF NOT EXISTS \`fines\` (
    id VARCHAR(191) PRIMARY KEY,
    date VARCHAR(100),
    vehicle VARCHAR(191),
    driver VARCHAR(191),
    fine_type VARCHAR(100),
    location VARCHAR(191),
    challan_no VARCHAR(100),
    amount DECIMAL(12,2),
    paid_by VARCHAR(191),
    status VARCHAR(50),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  workshops: `CREATE TABLE IF NOT EXISTS \`workshops\` (
    id VARCHAR(191) PRIMARY KEY,
    code VARCHAR(100),
    name VARCHAR(191),
    contact_person VARCHAR(191),
    phone VARCHAR(100),
    address TEXT,
    specialization VARCHAR(191),
    status VARCHAR(50),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  maintenance_heads: `CREATE TABLE IF NOT EXISTS \`maintenance_heads\` (
    id VARCHAR(191) PRIMARY KEY,
    code VARCHAR(100),
    name VARCHAR(191),
    category VARCHAR(100),
    status VARCHAR(50),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  maintenance: `CREATE TABLE IF NOT EXISTS \`maintenance\` (
    id VARCHAR(191) PRIMARY KEY,
    date VARCHAR(100),
    vehicle VARCHAR(191),
    tanker_number VARCHAR(191),
    workshop VARCHAR(191),
    vendor VARCHAR(191),
    head VARCHAR(191),
    category VARCHAR(100),
    maintenance_type VARCHAR(100),
    meter_reading VARCHAR(100),
    description TEXT,
    amount DECIMAL(12,2),
    cost DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    payment_status VARCHAR(50),
    status VARCHAR(50),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  document_register: `CREATE TABLE IF NOT EXISTS \`document_register\` (
    id VARCHAR(191) PRIMARY KEY,
    document_type VARCHAR(191),
    vehicle VARCHAR(191),
    document_no VARCHAR(100),
    issue_date VARCHAR(100),
    expiry_date VARCHAR(100),
    issuing_authority VARCHAR(191),
    cost DECIMAL(12,2),
    status VARCHAR(50),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  tyre_brands: `CREATE TABLE IF NOT EXISTS \`tyre_brands\` (
    id VARCHAR(191) PRIMARY KEY,
    brand_code VARCHAR(100),
    brand_name VARCHAR(191),
    category VARCHAR(100),
    origin VARCHAR(100),
    status VARCHAR(50),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  tyres_record: `CREATE TABLE IF NOT EXISTS \`tyres_record\` (
    id VARCHAR(191) PRIMARY KEY,
    purchase_date VARCHAR(100),
    tyre_number VARCHAR(100),
    brand VARCHAR(191),
    vendor VARCHAR(191),
    size VARCHAR(100),
    pattern VARCHAR(100),
    vehicle VARCHAR(191),
    position VARCHAR(100),
    condition_val VARCHAR(100),
    status VARCHAR(50),
    cost DECIMAL(12,2),
    amount DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    meter_reading VARCHAR(100),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  fuel_pumps: `CREATE TABLE IF NOT EXISTS \`fuel_pumps\` (
    id VARCHAR(191) PRIMARY KEY,
    code VARCHAR(100),
    name VARCHAR(191),
    location VARCHAR(191),
    contact_person VARCHAR(191),
    phone VARCHAR(100),
    payment_type VARCHAR(100),
    status VARCHAR(50),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  fuel_entries: `CREATE TABLE IF NOT EXISTS \`fuel_entries\` (
    id VARCHAR(191) PRIMARY KEY,
    date VARCHAR(100),
    vehicle VARCHAR(191),
    driver VARCHAR(191),
    trip_id VARCHAR(191),
    fuel_pump VARCHAR(191),
    vendor VARCHAR(191),
    liters DECIMAL(12,2),
    rate DECIMAL(12,2),
    amount DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    payment_type VARCHAR(100),
    meter_reading VARCHAR(100),
    receipt_no VARCHAR(100),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  engine_oil_defination: `CREATE TABLE IF NOT EXISTS \`engine_oil_defination\` (
    id VARCHAR(191) PRIMARY KEY,
    code VARCHAR(100),
    name VARCHAR(191),
    brand VARCHAR(191),
    grade VARCHAR(100),
    unit VARCHAR(50),
    current_stock DECIMAL(12,2),
    min_stock DECIMAL(12,2),
    price DECIMAL(12,2),
    status VARCHAR(50),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  engine_oil_purchase: `CREATE TABLE IF NOT EXISTS \`engine_oil_purchase\` (
    id VARCHAR(191) PRIMARY KEY,
    date VARCHAR(100),
    oil_name VARCHAR(191),
    vendor VARCHAR(191),
    supplier VARCHAR(191),
    quantity DECIMAL(12,2),
    unit_price DECIMAL(12,2),
    amount DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    invoice_no VARCHAR(100),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  engine_oil_usage: `CREATE TABLE IF NOT EXISTS \`engine_oil_usage\` (
    id VARCHAR(191) PRIMARY KEY,
    date VARCHAR(100),
    vehicle VARCHAR(191),
    driver VARCHAR(191),
    oil_name VARCHAR(191),
    quantity DECIMAL(12,2),
    meter_reading VARCHAR(100),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  bank_accounts: `CREATE TABLE IF NOT EXISTS \`bank_accounts\` (
    id VARCHAR(191) PRIMARY KEY,
    code VARCHAR(100),
    bank_name VARCHAR(191),
    account_title VARCHAR(191),
    account_number VARCHAR(191),
    branch VARCHAR(191),
    iban VARCHAR(191),
    opening_balance DECIMAL(12,2),
    current_balance DECIMAL(12,2),
    status VARCHAR(50),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  bank_transactions: `CREATE TABLE IF NOT EXISTS \`bank_transactions\` (
    id VARCHAR(191) PRIMARY KEY,
    date VARCHAR(100),
    account VARCHAR(191),
    transaction_type VARCHAR(100),
    reference_no VARCHAR(100),
    party_name VARCHAR(191),
    description TEXT,
    amount DECIMAL(12,2),
    cheque_no VARCHAR(100),
    status VARCHAR(50),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  payments: `CREATE TABLE IF NOT EXISTS \`payments\` (
    id VARCHAR(191) PRIMARY KEY,
    voucher_no VARCHAR(100),
    payment_date VARCHAR(100),
    date VARCHAR(100),
    party_category VARCHAR(100),
    party_name VARCHAR(191),
    party_id VARCHAR(191),
    paid_to VARCHAR(191),
    payment_source VARCHAR(100),
    payment_method VARCHAR(100),
    bank_account VARCHAR(191),
    cheque_no VARCHAR(100),
    amount DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    remarks TEXT,
    status VARCHAR(50),
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  general_ledger: `CREATE TABLE IF NOT EXISTS \`general_ledger\` (
    id VARCHAR(191) PRIMARY KEY,
    date VARCHAR(100),
    account_name VARCHAR(191),
    party_name VARCHAR(191),
    voucher_type VARCHAR(100),
    voucher_no VARCHAR(100),
    description TEXT,
    debit DECIMAL(12,2),
    credit DECIMAL(12,2),
    balance DECIMAL(12,2),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  cash_payments: `CREATE TABLE IF NOT EXISTS \`cash_payments\` (
    id VARCHAR(191) PRIMARY KEY,
    date VARCHAR(100),
    paid_to VARCHAR(191),
    driver VARCHAR(191),
    vehicle VARCHAR(191),
    category VARCHAR(100),
    payment_type VARCHAR(100),
    type_val VARCHAR(100),
    head VARCHAR(191),
    amount DECIMAL(12,2),
    bank VARCHAR(191),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  bills_register: `CREATE TABLE IF NOT EXISTS \`bills_register\` (
    id VARCHAR(191) PRIMARY KEY,
    bill_no VARCHAR(100),
    bill_date VARCHAR(100),
    customer VARCHAR(191),
    bill_type VARCHAR(100),
    from_date VARCHAR(100),
    to_date VARCHAR(100),
    total_trips INT,
    total_weight DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    status VARCHAR(50),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  payments_received: `CREATE TABLE IF NOT EXISTS \`payments_received\` (
    id VARCHAR(191) PRIMARY KEY,
    payment_id VARCHAR(191),
    date VARCHAR(100),
    customer VARCHAR(191),
    party_name VARCHAR(191),
    payment_method VARCHAR(100),
    bank VARCHAR(191),
    cheque_no VARCHAR(100),
    amount DECIMAL(12,2),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`,

  payment_history: `CREATE TABLE IF NOT EXISTS \`payment_history\` (
    id VARCHAR(191) PRIMARY KEY,
    payment_id VARCHAR(191),
    date VARCHAR(100),
    amount DECIMAL(12,2),
    type_val VARCHAR(100),
    reference VARCHAR(191),
    remarks TEXT,
    \`createdAt\` VARCHAR(100),
    \`updatedAt\` VARCHAR(100),
    raw_data JSON
  )`
};

export async function initializeDatabase(pool, config = {}) {
  const dbName = config.DB_NAME || process.env.DB_NAME || 'falcon_energy';
  try {
    const rootConn = await mysql.createConnection({
      host: config.DB_HOST || process.env.DB_HOST || '127.0.0.1',
      port: Number(config.DB_PORT || process.env.DB_PORT || 3306),
      user: config.DB_USER || process.env.DB_USER || 'root',
      password: config.DB_PASSWORD !== undefined ? config.DB_PASSWORD : (process.env.DB_PASSWORD || '')
    });
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await rootConn.end();
  } catch (e) {
    // If root database creation connection fails, continue with pool execution
  }

  await pool.query('DROP TABLE IF EXISTS app_records');

  for (const [tableName, sql] of Object.entries(TABLE_SCHEMAS)) {
    await pool.query(sql);
  }
}

export async function resetDatabase(pool) {
  await pool.query('DROP TABLE IF EXISTS app_records');
  for (const [tableName] of Object.entries(TABLE_SCHEMAS)) {
    try {
      await pool.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    } catch (e) {
      // Ignore drop errors
    }
  }
  for (const [tableName, sql] of Object.entries(TABLE_SCHEMAS)) {
    await pool.query(sql);
  }
}

export async function ensureSeedState(pool) {
  const currentState = await readState(pool);
  if (!currentState) {
    await writeState(pool, emptyState());
  }
}

function parseRow(row) {
  if (row.raw_data) {
    return typeof row.raw_data === 'string' ? JSON.parse(row.raw_data) : row.raw_data;
  }
  const { raw_data, ...rest } = row;
  return rest;
}

export async function readState(pool) {
  const tables = Object.keys(TABLE_SCHEMAS);
  const state = {};
  let hasAnyData = false;

  for (const table of tables) {
    try {
      const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
      if (rows.length > 0) hasAnyData = true;

      if (table === 'company_info') {
        state.company_info = rows[0] ? parseRow(rows[0]) : null;
      } else {
        state[table] = rows.map(r => parseRow(r));
      }
    } catch (error) {
      if (table === 'company_info') state.company_info = null;
      else state[table] = [];
    }
  }

  if (!hasAnyData && !state.company_info) return null;
  return state;
}

function mapEntityRow(table, record, fallbackId = '1') {
  if (!record || typeof record !== 'object') return {};
  const columns = TABLE_COLUMNS[table] || [];
  const row = {};

  for (const col of columns) {
    let propName = col;
    if (col === 'condition_val') propName = 'condition';
    if (col === 'type_val') propName = 'type';

    if (propName in record) {
      const val = record[propName];
      row[col] = (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val;
    }
  }

  if (!row.id) {
    row.id = String(record.id ?? record.code ?? record.payment_id ?? record.voucher_no ?? fallbackId);
  }

  row.raw_data = JSON.stringify(record);
  return row;
}

function insertRowQuery(tableName, row) {
  const keys = Object.keys(row);
  const cols = keys.map(k => `\`${k}\``).join(', ');
  const values = keys.map(() => '?').join(', ');
  const queryText = `INSERT INTO \`${tableName}\` (${cols}) VALUES (${values})`;
  const params = keys.map(k => row[k]);
  return { queryText, params };
}

export async function writeState(pool, state) {
  if (state.users && Array.isArray(state.users)) {
    for (const u of state.users) {
      if (u.password && typeof u.password === 'string' && !u.password.startsWith('$2')) {
        u.password = await bcrypt.hash(u.password, 10);
      }
    }
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const [entity, value] of Object.entries(state)) {
      if (!TABLE_SCHEMAS[entity]) continue;

      await connection.query(`DELETE FROM \`${entity}\``);

      if (entity === 'company_info' && value && typeof value === 'object') {
        const row = mapEntityRow(entity, value, '1');
        const { queryText, params } = insertRowQuery(entity, row);
        await connection.query(queryText, params);
      } else if (Array.isArray(value) && value.length > 0) {
        for (let idx = 0; idx < value.length; idx++) {
          const item = value[idx];
          const row = mapEntityRow(entity, item, String(idx + 1));
          const { queryText, params } = insertRowQuery(entity, row);
          await connection.query(queryText, params);
        }
      }
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function verifyUser(pool, username, password) {
  const state = await readState(pool);
  const user = state?.users?.find(item => item.username?.toLowerCase() === username.trim().toLowerCase());
  if (!user || user.status !== 'Active') return null;
  const valid = user.password?.startsWith('$2') ? await bcrypt.compare(password, user.password) : user.password === password;
  if (!valid) return null;
  if (!user.password.startsWith('$2')) {
    user.password = await bcrypt.hash(password, 12);
    await writeState(pool, state);
  }
  const { password: _password, ...safeUser } = user;
  return safeUser;
}
