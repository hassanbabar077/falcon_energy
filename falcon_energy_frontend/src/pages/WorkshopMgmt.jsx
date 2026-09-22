import React from 'react';
import { Wrench } from 'lucide-react';
import { CrudPage } from '../components/CrudPage';
import { dbService } from '../services/db';

const config = {
  title: 'Workshop Management',
  icon: Wrench,
  description: 'Maintain authorized service workshops and view live outstanding maintenance payables.',
  tableName: 'workshops',
  idField: 'id',
  idPrefix: 'WS-',
  columns: [
    { key: 'id', label: 'Workshop ID', format: 'bold' },
    { key: 'name', label: 'Workshop Name', format: 'bold' },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'phone', label: 'Contact Number', format: 'mono' },
    { key: 'address', label: 'Address' },
    { 
      key: 'total_accrued', 
      label: 'Total Accrued (PKR)', 
      render: (row) => {
        const summary = dbService.getPartyPayableSummary('Workshops', row);
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
        const summary = dbService.getPartyPayableSummary('Workshops', row);
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
        const summary = dbService.getPartyPayableSummary('Workshops', row);
        const bal = summary.currentPayableBalance || 0;
        return (
          <span style={{ fontFamily: 'monospace', fontWeight: '800', color: bal > 0 ? '#dc2626' : '#166534' }}>
            PKR {bal.toLocaleString()}
          </span>
        );
      }
    },
    { key: 'status', label: 'Status', badge: true },
  ],
  formFields: [
    { key: 'name', label: 'Workshop Name', type: 'text', placeholder: 'e.g. Al-Madina Motor Workshop', required: true },
    { key: 'contact_person', label: 'Contact Person', type: 'text', placeholder: 'e.g. Ustad Rashid', halfWidth: true },
    { key: 'phone', label: 'Contact Number', type: 'text', placeholder: 'e.g. 0300-4455667', required: true, halfWidth: true },
    { key: 'address', label: 'Address', type: 'text', placeholder: 'e.g. Multan Road, Lahore', required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true },
    { key: 'remarks', label: 'Remarks', type: 'textarea', placeholder: 'Workshop notes or specialty' },
  ],
  defaultValues: { name: '', contact_person: '', phone: '', address: '', status: 'Active', remarks: '' },
};

export function WorkshopMgmt() {
  return <CrudPage config={config} />;
}
