import React from 'react';
import { Navigation } from 'lucide-react';
import { CrudPage } from '../components/CrudPage';

const config = {
  title: 'Destination Management',
  icon: Navigation,
  description: 'Unloading destinations, bottling plants, and delivery terminals.',
  tableName: 'destinations',
  idField: 'id',
  idPrefix: 'DST-',
  columns: [
    { key: 'id', label: 'Destination ID', format: 'bold' },
    { key: 'name', label: 'Destination Name', format: 'bold' },
    { key: 'city', label: 'City' },
    { key: 'location', label: 'Location' },
    { key: 'contact', label: 'Contact Person' },
    { key: 'phone', label: 'Phone', format: 'mono' },
  ],
  formFields: [
    { key: 'name', label: 'Destination Name', type: 'text', required: true },
    { key: 'city', label: 'City', type: 'text', required: true, halfWidth: true },
    { key: 'location', label: 'Location', type: 'text', halfWidth: true },
    { key: 'contact', label: 'Contact Person', type: 'text', required: true },
    { key: 'phone', label: 'Phone', type: 'text', halfWidth: true },
    { key: 'email', label: 'Email', type: 'email', halfWidth: true },
    { key: 'remarks', label: 'Remarks', type: 'textarea' },
  ],
  defaultValues: { name: '', city: '', location: '', contact: '', phone: '', email: '', remarks: '' },
};

export function DestinationMgmt() {
  return <CrudPage config={config} />;
}
