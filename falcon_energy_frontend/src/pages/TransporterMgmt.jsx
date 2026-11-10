import React from 'react';
import { Truck as TruckIcon } from 'lucide-react';
import { CrudPage } from '../components/CrudPage';
import { dbService } from '../services/db';

const config = {
  title: 'Transporter Management',
  icon: TruckIcon,
  description: 'Third-party transporters with optional opening payable and live outstanding balances.',
  tableName: 'transporters',
  idField: 'id',
  idPrefix: 'TR-',
  columns: [
    { key: 'id', label: 'Transporter ID', format: 'bold' },
    { key: 'business_name', label: 'Business Name', format: 'bold', render: (row) => row.business_name || row.name },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'phone', label: 'Contact Number', format: 'mono' },
    {
      key: 'opening_payable',
      label: 'Opening Payable',
      format: 'currency'
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
    { key: 'opening_payable', label: 'Opening Payable (Optional)', type: 'number', halfWidth: true },
    { key: 'opening_trip_id', label: 'Associate Opening to Trip (Optional)', type: 'all_trips_dropdown', halfWidth: true },
  ],
  defaultValues: {
    business_name: '', contact_person: '', phone: '', opening_payable: '', opening_trip_id: ''
  },
  onBeforeSave: (record) => {
    if (!record.name) record.name = record.business_name;
  }
};

export function TransporterMgmt() {
  return <CrudPage config={config} />;
}
