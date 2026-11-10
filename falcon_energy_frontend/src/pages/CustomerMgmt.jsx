import React from 'react';
import { Building2 } from 'lucide-react';
import { CrudPage } from '../components/CrudPage';
import { dbService } from '../services/db';

const config = {
  title: 'Customer Management',
  icon: Building2,
  description: 'Client directory with optional opening receivable and live outstanding balances.',
  tableName: 'customers',
  idField: 'id',
  idPrefix: 'CUST-',
  columns: [
    { key: 'id', label: 'Customer ID', format: 'bold' },
    { key: 'name', label: 'Customer Name', format: 'bold' },
    { key: 'city', label: 'City' },
    { key: 'location', label: 'Location/Address' },
    { key: 'concerned_person', label: 'Concerned Person' },
    { key: 'phone', label: 'Contact Number', format: 'mono' },
    { key: 'email', label: 'Email' },
    {
      key: 'opening_receivable',
      label: 'Opening Receivable',
      format: 'currency'
    },
    {
      key: 'outstanding_balance',
      label: 'Outstanding Receivable (PKR)',
      render: (row) => {
        const summary = dbService.getPartyPayableSummary('Customers', row);
        const bal = summary.currentPayableBalance || 0;
        return (
          <span style={{ fontFamily: 'monospace', fontWeight: '800', color: bal > 0 ? '#0f766e' : '#64748b' }}>
            PKR {bal.toLocaleString()}
          </span>
        );
      }
    },
    { key: 'status', label: 'Status', badge: true },
  ],
  formFields: [
    { key: 'name', label: 'Customer Name', type: 'text', required: true },
    { key: 'city', label: 'City', type: 'text', required: true, halfWidth: true },
    { key: 'location', label: 'Address / Location', type: 'text', halfWidth: true },
    { key: 'concerned_person', label: 'Concerned Person', type: 'text', required: true, halfWidth: true },
    { key: 'phone', label: 'Contact Number', type: 'text', required: true, halfWidth: true },
    { key: 'email', label: 'Email', type: 'email', required: true, halfWidth: true },
    { key: 'phone2', label: 'Second Contact', type: 'text', halfWidth: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true, halfWidth: true },
    { key: 'opening_receivable', label: 'Opening Receivable (Optional)', type: 'number', halfWidth: true },
    { key: 'opening_trip_id', label: 'Associate Opening to Trip (Optional)', type: 'all_trips_dropdown', halfWidth: true },
    { key: 'remarks', label: 'Remarks', type: 'textarea' },
  ],
  defaultValues: {
    name: '', city: '', location: '', concerned_person: '', phone: '', email: '', phone2: '',
    status: 'Active', opening_receivable: '', opening_trip_id: '', remarks: ''
  },
};

export function CustomerMgmt() {
  return <CrudPage config={config} />;
}
