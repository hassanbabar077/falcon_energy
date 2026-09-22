import React from 'react';
import { Users } from 'lucide-react';
import { CrudPage } from '../components/CrudPage';

const config = {
  title: 'Driver Management',
  icon: Users,
  description: 'Driver HR registry with CNIC verification, license tracking, and vehicle assignment.',
  tableName: 'drivers',
  idField: 'id',
  idPrefix: 'DR-',
  columns: [
    { key: 'id', label: 'Driver ID', format: 'bold' },
    { key: 'name', label: 'Driver Name', format: 'bold' },
    { key: 'cnic', label: 'CNIC', format: 'mono' },
    { key: 'mobile', label: 'Mobile', format: 'mono' },
    { key: 'license', label: 'License #', format: 'mono' },
    { key: 'assigned_vehicle', label: 'Assigned Vehicle' },
    { key: 'status', label: 'Status', badge: true },
  ],
  formFields: [
    { key: 'name', label: 'Driver Name', type: 'text', required: true },
    { key: 'father_name', label: "Father's Name", type: 'text', halfWidth: true },
    { key: 'cnic', label: 'CNIC', type: 'text', placeholder: '35202-0000000-0', halfWidth: true },
    { key: 'mobile', label: 'Mobile Number', type: 'text', placeholder: '0300-0000000', halfWidth: true },
    { key: 'mobile2', label: 'Second Mobile', type: 'text', halfWidth: true },
    { key: 'license', label: 'License Number', type: 'text', halfWidth: true },
    { key: 'license_expiry', label: 'License Expiry Date', type: 'date', halfWidth: true },
    { key: 'email', label: 'Email', type: 'email', halfWidth: true },
    { key: 'address', label: 'Address', type: 'text', halfWidth: true },
    { key: 'joining_date', label: 'Joining Date', type: 'date', required: true, halfWidth: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'Suspended'], required: true, halfWidth: true },
    { key: 'assigned_vehicle', label: 'Assigned Vehicle', type: 'vehicle_dropdown', halfWidth: true },
    { key: 'previous_vehicle', label: 'Previous Vehicle', type: 'text', halfWidth: true },
    { key: 'last_change', label: 'Last Change Date', type: 'date', halfWidth: true },
    { key: 'remarks', label: 'Remarks', type: 'textarea' },
  ],
  defaultValues: {
    name: '', father_name: '', cnic: '', mobile: '', mobile2: '', license: '',
    license_expiry: '', email: '', address: '', joining_date: new Date().toISOString().split('T')[0],
    status: 'Active', assigned_vehicle: '', previous_vehicle: '-', last_change: '', remarks: '',
  },
};

export function DriverMgmt() {
  return <CrudPage config={config} />;
}
