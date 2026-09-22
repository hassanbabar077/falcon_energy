import React from 'react';
import { Building2 } from 'lucide-react';
import { CrudPage } from '../components/CrudPage';

const config = {
  title: 'Customer Management',
  icon: Building2,
  description: 'Client directory with contact information, contractual details, and status tracking.',
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
    { key: 'remarks', label: 'Remarks', type: 'textarea' },
  ],
  defaultValues: { name: '', city: '', location: '', concerned_person: '', phone: '', email: '', phone2: '', status: 'Active', remarks: '' },
};

export function CustomerMgmt() {
  return <CrudPage config={config} />;
}
