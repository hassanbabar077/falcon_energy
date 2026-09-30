import React from 'react';
import { Factory } from 'lucide-react';
import { CrudPage } from '../components/CrudPage';

// Suppliers are a NON-FINANCIAL reference used on trips (who supplied the LPG load).
// No payable or receivable is ever associated with a supplier.
const config = {
  title: 'Supplier Management',
  icon: Factory,
  description: 'LPG suppliers referenced on trips. Suppliers are for reference only; no payables or receivables are linked to them.',
  tableName: 'suppliers',
  idField: 'id',
  idPrefix: 'SUP-',
  columns: [
    { key: 'id', label: 'Supplier ID', format: 'bold' },
    { key: 'business_name', label: 'Business Name', format: 'bold', render: (row) => row.business_name || row.name },
    { key: 'supplier_type', label: 'Supplier Type', badge: true },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'phone', label: 'Contact Number', format: 'mono' },
    { key: 'city', label: 'City' },
    { key: 'status', label: 'Status', badge: true },
  ],
  formFields: [
    { key: 'business_name', label: 'Business Name', type: 'text', required: true },
    { key: 'supplier_type', label: 'Supplier Type', type: 'select', options: ['LPG', 'Refinery', 'Terminal', 'Others'], required: true, halfWidth: true },
    { key: 'city', label: 'City', type: 'text', required: true, halfWidth: true },
    { key: 'contact_person', label: 'Contact Person', type: 'text', halfWidth: true },
    { key: 'phone', label: 'Contact Number', type: 'text', required: true, halfWidth: true },
    { key: 'email', label: 'Email Address', type: 'email', halfWidth: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true, halfWidth: true },
    { key: 'address', label: 'Address', type: 'text' },
    { key: 'remarks', label: 'Remarks', type: 'textarea' },
  ],
  defaultValues: { business_name: '', supplier_type: 'LPG', city: '', contact_person: '', phone: '', email: '', status: 'Active', address: '', remarks: '' },
  onBeforeSave: (record) => {
    record.name = record.business_name;
  }
};

export function SupplierMgmt() {
  return <CrudPage config={config} />;
}
