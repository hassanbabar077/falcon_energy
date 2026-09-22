import React from 'react';
import { Building } from 'lucide-react';
import { CrudPage } from '../../components/CrudPage';

const config = {
  title: 'Tanker Ownership Master',
  icon: Building,
  description: 'Manage custom tanker ownership classifications (e.g. Falcon Energy, Private, Rented) used in vehicle forms.',
  tableName: 'lookup_tables',
  idField: 'id',
  idPrefix: 'TOW-',
  columns: [
    { key: 'id', label: 'Ownership ID', format: 'bold' },
    { key: 'name', label: 'Ownership Type', format: 'bold' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status', badge: true }
  ],
  formFields: [
    { key: 'name', label: 'Ownership Name', type: 'text', placeholder: 'e.g. Falcon Energy / Private / Leased', required: true, halfWidth: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true, halfWidth: true },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional details regarding ownership classification' }
  ],
  defaultValues: { name: '', status: 'Active', description: '', category: 'Tanker Ownership' },
  onBeforeSave: (record) => {
    record.category = 'Tanker Ownership';
  }
};

export function TankerOwnership() {
  return <CrudPage config={config} />;
}
