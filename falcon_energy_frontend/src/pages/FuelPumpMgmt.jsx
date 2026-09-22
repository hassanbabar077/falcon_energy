import React from 'react';
import { Fuel } from 'lucide-react';
import { CrudPage } from '../components/CrudPage';
import { dbService } from '../services/db';

const config = {
  title: 'Fuel Pump Management',
  icon: Fuel,
  description: 'Fuel pump station registry with location details and live calculated ledger outstanding balances.',
  tableName: 'fuel_pumps',
  idField: 'id',
  idPrefix: 'FP-',
  columns: [
    { key: 'id', label: 'Fuel Pump ID', format: 'bold' },
    { key: 'name', label: 'Pump Name', format: 'bold' },
    { key: 'location', label: 'Location' },
    { key: 'phone', label: 'Contact Number', format: 'mono' },
    { 
      key: 'total_accrued', 
      label: 'Total Accrued (PKR)', 
      render: (row) => {
        const summary = dbService.getPartyPayableSummary('Fuel Pumps', row);
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
        const summary = dbService.getPartyPayableSummary('Fuel Pumps', row);
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
        const summary = dbService.getPartyPayableSummary('Fuel Pumps', row);
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
    { key: 'name', label: 'Pump Name', type: 'text', required: true },
    { key: 'location', label: 'Location', type: 'text', required: true, halfWidth: true },
    { key: 'phone', label: 'Contact Number', type: 'text', required: true, halfWidth: true },
    { key: 'opening_payable', label: 'Opening Payable (Optional)', type: 'number', halfWidth: true },
  ],
  defaultValues: { name: '', location: '', phone: '', opening_payable: 0 },
};

export function FuelPumpMgmt() {
  return <CrudPage config={config} />;
}
