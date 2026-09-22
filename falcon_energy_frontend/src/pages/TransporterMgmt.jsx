import React from 'react';
import { Truck as TruckIcon } from 'lucide-react';
import { CrudPage } from '../components/CrudPage';

const config = {
  title: 'Transporter Management',
  icon: TruckIcon,
  description: 'Registry of third-party transporters, haulage subcontractors, and freight partners.',
  tableName: 'transporters',
  idField: 'id',
  idPrefix: 'TR-',
  columns: [
    { key: 'id', label: 'Transporter ID', format: 'bold' },
    { key: 'business_name', label: 'Business Name', format: 'bold' },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'phone', label: 'Contact Number', format: 'mono' },
    { 
      key: 'total_accrued', 
      label: 'Total Accrued (PKR)', 
      render: (row) => {
        const summary = dbService.getPartyPayableSummary('Transporters', row);
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
        const summary = dbService.getPartyPayableSummary('Transporters', row);
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
        const summary = dbService.getPartyPayableSummary('Transporters', row);
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
    { key: 'contact_person', label: 'Contact Person', type: 'text', required: true, halfWidth: true },
    { key: 'phone', label: 'Contact Number', type: 'text', required: true, halfWidth: true },
  ],
  defaultValues: { business_name: '', contact_person: '', phone: '' },
};

export function TransporterMgmt() {
  return <CrudPage config={config} />;
}
