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
