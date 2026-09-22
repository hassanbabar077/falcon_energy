import React from 'react';
import { Wrench } from 'lucide-react';
import { CrudPage } from '../components/CrudPage';

const config = {
  title: 'Maintenance Head Management',
  icon: Wrench,
  description: 'Define and manage maintenance expense categories for prime movers, tankers, and tyres.',
  tableName: 'maintenance_heads',
  idField: 'id',
  idPrefix: 'MH-',
  columns: [
    { key: 'id', label: 'Head ID', format: 'bold' },
    { key: 'name', label: 'Head Name', format: 'bold' },
    { key: 'category', label: 'Category', badge: true },
    { key: 'remarks', label: 'Remarks' },
  ],
  formFields: [
    { key: 'name', label: 'Head Name', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'select', options: ['Prime Mover', 'Tanker', 'Tyre', 'Both'], required: true },
    { key: 'remarks', label: 'Remarks', type: 'textarea' },
  ],
  defaultValues: { name: '', category: 'Prime Mover', remarks: '' },
};

export function MaintHeadMgmt() {
  return <CrudPage config={config} />;
}
