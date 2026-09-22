import React from 'react';
import { Disc } from 'lucide-react';
import { CrudPage } from '../components/CrudPage';

const config = {
  title: 'Tyre Management (Master Data)',
  icon: Disc,
  description: 'Master record of vehicle & tanker tyres linked with Tyre Brands and Vendors.',
  tableName: 'tyres_record',
  idField: 'id',
  idPrefix: 'TYR-',
  columns: [
    { key: 'id', label: 'Tyre ID', format: 'bold' },
    { key: 'category', label: 'Category', badge: true },
    { key: 'vehicle', label: 'Vehicle / Tanker', format: 'bold', render: (row) => row.category === 'Tanker' ? (row.tanker_number || '-') : (row.vehicle || '-') },
    { key: 'brand', label: 'Brand' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'condition', label: 'Condition', badge: true },
    { key: 'status', label: 'Status', badge: true },
  ],
  formFields: [
    { key: 'category', label: 'Category', type: 'select', options: ['Prime Mover', 'Tanker'], required: true, halfWidth: true },
    
    // Dynamic field: If Prime Mover -> show Vehicle / Transport
    { key: 'vehicle', label: 'Vehicle / Transport', type: 'vehicle_dropdown', required: true, halfWidth: true, showWhen: (d) => d.category === 'Prime Mover' },
    
    // Dynamic field: If Tanker -> show Tanker Number
    { key: 'tanker_number', label: 'Tanker Number', type: 'tanker_dropdown', required: true, halfWidth: true, showWhen: (d) => d.category === 'Tanker' },
    
    { key: 'brand', label: 'Tyre Brand', type: 'tyre_brand_dropdown', required: true, halfWidth: true },
    { key: 'vendor', label: 'Vendor', type: 'vendor_dropdown', required: true, halfWidth: true },
    { key: 'tyre_number', label: 'Tyre Number / Code', type: 'text', placeholder: 'e.g. GY-9901-FL', required: true, halfWidth: true },
    { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Old'], required: true, halfWidth: true },
    
    // Date of Manufacture required if condition === 'New'
    { key: 'date_of_manufacture', label: 'Date of Manufacture', type: 'date', required: true, halfWidth: true, showWhen: (d) => d.condition === 'New' },
    { key: 'date_of_manufacture', label: 'Date of Manufacture (Optional)', type: 'date', halfWidth: true, showWhen: (d) => d.condition === 'Old' },
    
    { key: 'purchase_date', label: 'Purchase Date', type: 'date', required: true, halfWidth: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'Expired'], required: true, halfWidth: true },
    { key: 'discard_reason', label: 'Discard Reason', type: 'text' },
    { key: 'discard_date', label: 'Discard Date', type: 'date', halfWidth: true },
    { key: 'remarks', label: 'Remarks', type: 'textarea' },
  ],
  defaultValues: {
    category: 'Prime Mover',
    vehicle: '',
    tanker_number: '',
    brand: '',
    vendor: '',
    tyre_number: '',
    condition: 'New',
    date_of_manufacture: new Date().toISOString().split('T')[0],
    purchase_date: new Date().toISOString().split('T')[0],
    status: 'Active',
    discard_reason: '',
    discard_date: '',
    remarks: '',
  },
  onBeforeSave: (record) => {
    if (record.category === 'Tanker') {
      record.vehicle = record.tanker_number;
    }
  }
};

export function TyreMgmt() {
  return <CrudPage config={config} />;
}
