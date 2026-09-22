import React from 'react';
import { MapPin } from 'lucide-react';
import { CrudPage } from '../components/CrudPage';

const config = {
  title: 'Source Management',
  icon: MapPin,
  description: 'Loading source terminals, refineries, and field pickup locations.',
  tableName: 'loading_sources',
  idField: 'id',
  idPrefix: 'SRC-',
  columns: [
    { key: 'id', label: 'Source ID', format: 'bold' },
    { key: 'name', label: 'Source Name', format: 'bold' },
    { key: 'city', label: 'City' },
    { key: 'location', label: 'Location' },
    { key: 'contact', label: 'Contact Person' },
    { key: 'phone', label: 'Phone', format: 'mono' },
  ],
  formFields: [
    { key: 'name', label: 'Source Name', type: 'text', required: true },
    { key: 'city', label: 'City', type: 'text', required: true, halfWidth: true },
    { key: 'location', label: 'Location', type: 'text', halfWidth: true },
    { key: 'contact', label: 'Contact Person', type: 'text', required: true },
    { key: 'phone', label: 'Phone', type: 'text', halfWidth: true },
    { key: 'email', label: 'Email', type: 'email', halfWidth: true },
    { key: 'remarks', label: 'Remarks', type: 'textarea' },
  ],
  defaultValues: { name: '', city: '', location: '', contact: '', phone: '', email: '', remarks: '' },
};

export function SourceMgmt() {
  return <CrudPage config={config} />;
}
