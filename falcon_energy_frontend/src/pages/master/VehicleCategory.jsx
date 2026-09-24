import React from 'react';
import { Tag } from 'lucide-react';
import { CrudPage } from '../../components/CrudPage';

const config = {
  title: 'Vehicle Category Master',
  icon: Tag,
  description: 'Manage custom vehicle categories (e.g. Falcon Energy, Rented, Open Market) used in vehicle forms.',
  tableName: 'vehicle_categories',
  idField: 'id',
  codeField: 'code',
  idPrefix: 'CAT-',
  columns: [
    { key: 'code', label: 'Category ID', format: 'bold' },
    { key: 'name', label: 'Category Name', format: 'bold' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status', badge: true }
  ],
  formFields: [
    { key: 'name', label: 'Category Name', type: 'text', placeholder: 'e.g. Falcon Energy / Open Market', required: true, halfWidth: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true, halfWidth: true },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional notes on category usage' }
  ],
  defaultValues: { name: '', status: 'Active', description: '' }
};

export function VehicleCategory() {
  return <CrudPage config={config} />;
}
