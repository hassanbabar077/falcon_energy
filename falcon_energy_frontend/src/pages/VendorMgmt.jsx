import React from 'react';
import { Store } from 'lucide-react';
import { CrudPage } from '../components/CrudPage';
import { dbService } from '../services/db';

const config = {
  title: 'Vendor Management',
  icon: Store,
  description: 'Supplier directory with live calculated ledger outstanding payable balances.',
  tableName: 'vendors',
  idField: 'id',
  idPrefix: 'VND-',
  columns: [
    { key: 'id', label: 'Vendor ID', format: 'bold' },
    { key: 'business_name', label: 'Business Name', format: 'bold', render: (row) => row.business_name || row.name },
    { key: 'vendor_type', label: 'Vendor Type', badge: true },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'phone', label: 'Contact Number', format: 'mono' },
    { key: 'city', label: 'City' },
    { 
      key: 'total_accrued', 
      label: 'Total Accrued (PKR)', 
      render: (row) => {
        const summary = dbService.getPartyPayableSummary('Vendors', row);
        return (
          <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>
            PKR {(summary.totalAccruedCost || 0).toLocaleString()}
          </span>
        );
      }
    },
    { 
      key: 'total_paid', 
      label: 'Total Paid (PKR)', 
      render: (row) => {
        const summary = dbService.getPartyPayableSummary('Vendors', row);
        return (
          <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#166534' }}>
            PKR {(summary.totalPaidAmount || 0).toLocaleString()}
          </span>
        );
      }
    },
    { 
      key: 'outstanding_balance', 
      label: 'Remaining Balance (PKR)', 
      render: (row) => {
        const summary = dbService.getPartyPayableSummary('Vendors', row);
        const bal = summary.currentPayableBalance || 0;
        return (
          <span style={{ fontFamily: 'monospace', fontWeight: '800', color: bal > 0 ? '#dc2626' : '#166534' }}>
            PKR {bal.toLocaleString()}
          </span>
        );
      }
    },
  ],
  formFields: [
    { key: 'business_name', label: 'Business Name', type: 'text', required: true },
    { key: 'vendor_type', label: 'Vendor Type', type: 'select', options: ['LPG', 'Spare Part', 'Others'], required: true, halfWidth: true },
    { key: 'city', label: 'City', type: 'text', required: true, halfWidth: true },
    { key: 'contact_person', label: 'Contact Person', type: 'text', halfWidth: true },
    { key: 'phone', label: 'Contact Number', type: 'text', required: true, halfWidth: true },
    { key: 'email', label: 'Email Address', type: 'email', halfWidth: true },
    { key: 'address', label: 'Address', type: 'text' },
    { key: 'remarks', label: 'Remarks', type: 'textarea' },
  ],
  defaultValues: { business_name: '', vendor_type: 'Spare Part', city: '', contact_person: '', phone: '', email: '', address: '', remarks: '' },
  onBeforeSave: (record) => {
    if (!record.name) {
      record.name = record.business_name;
    }
  }
};

export function VendorMgmt() {
  return <CrudPage config={config} />;
}
