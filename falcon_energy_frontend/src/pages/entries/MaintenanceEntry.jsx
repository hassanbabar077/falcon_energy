import React from 'react';
import { Wrench } from 'lucide-react';
import { CrudPage } from '../../components/CrudPage';

const config = {
  title: 'Maintenance Entry',
  icon: Wrench,
  description: 'Track fleet vehicle repair logs and workshop maintenance expenses.',
  tableName: 'maintenance',
  idField: 'id',
  idPrefix: 'MIN-',
  columns: [
    { key: 'id', label: 'Maint ID', format: 'bold' },
    { key: 'date', label: 'Date' },
    { key: 'category', label: 'Category', badge: true },
    { key: 'vehicle', label: 'Vehicle / Tanker', format: 'bold', render: (row) => row.category === 'Tanker' ? (row.tanker_number || row.vehicle || '-') : (row.vehicle || '-') },
    { key: 'type', label: 'Type', badge: true },
    { key: 'head', label: 'Maintenance Head' },
    { key: 'workshop', label: 'Workshop' },
    { key: 'total_amount', label: 'Total Expense (PKR)', format: 'currency' },
  ],
  formFields: [
    { key: 'category', label: 'Category', type: 'select', options: ['Prime Mover', 'Tanker'], required: true, halfWidth: true },
    
    // Dynamic field: If Prime Mover -> show Vehicle / Transport
    { key: 'vehicle', label: 'Vehicle / Transport', type: 'vehicle_dropdown', required: true, halfWidth: true, showWhen: (d) => d.category === 'Prime Mover' },
    
    // Dynamic field: If Tanker -> show Tanker Number
    { key: 'tanker_number', label: 'Tanker Number', type: 'tanker_dropdown', required: true, halfWidth: true, showWhen: (d) => d.category === 'Tanker' },

    { key: 'date', label: 'Service Date', type: 'date', required: true, halfWidth: true },
    { key: 'type', label: 'Maintenance Type', type: 'select', options: ['Regular', 'Emergency', 'Scheduled'], required: true, halfWidth: true },
    { key: 'head', label: 'Maintenance Head', type: 'maintenance_head_dropdown', required: true, halfWidth: true },
    { key: 'workshop', label: 'Workshop', type: 'workshop_dropdown', required: true, halfWidth: true },
    { key: 'total_amount', label: 'Total Amount (PKR)', type: 'number', placeholder: 'e.g. 35000', required: true, halfWidth: true },
    { key: 'remarks', label: 'Remarks / Job Details', type: 'textarea', placeholder: 'Job description, replaced part serial numbers, or mechanic notes' },
  ],
  defaultValues: {
    category: 'Prime Mover',
    vehicle: '',
    tanker_number: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Regular',
    head: '',
    workshop: '',
    total_amount: '',
    remarks: ''
  },
  onBeforeSave: (record) => {
    if (record.category === 'Tanker') {
      record.vehicle = record.tanker_number;
    }
  }
};

export function MaintenanceEntry() {
  return <CrudPage config={config} />;
}
