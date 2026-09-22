import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { CrudPage } from '../../components/CrudPage';

const config = {
  title: 'Tyre Purchase Entry',
  icon: ShoppingCart,
  description: 'Record new and old tyre purchases for fleet vehicles.',
  tableName: 'tyres_record',
  idField: 'id',
  idPrefix: 'TYR-',
  columns: [
    { key: 'id', label: 'Tyre ID', format: 'bold' },
    { key: 'purchase_date', label: 'Purchase Date' },
    { key: 'vendor', label: 'Vendor', format: 'bold' },
    { key: 'brand', label: 'Brand' },
    { key: 'tyre_number', label: 'Tyre No.' },
    { key: 'category', label: 'Category', badge: true },
    { key: 'total_amount', label: 'Total Cost (PKR)', format: 'currency' },
  ],
  formFields: [
    { key: 'category', label: 'Category', type: 'select', options: ['Prime Mover', 'Tanker'], required: true, halfWidth: true },
    
    // Dynamic field: If Prime Mover -> show Vehicle / Transport
    { key: 'vehicle', label: 'Vehicle / Transport', type: 'vehicle_dropdown', required: true, halfWidth: true, showWhen: (d) => d.category === 'Prime Mover' },
    
    // Dynamic field: If Tanker -> show Tanker Number
    { key: 'tanker_number', label: 'Tanker Number', type: 'tanker_dropdown', required: true, halfWidth: true, showWhen: (d) => d.category === 'Tanker' },
    
    { key: 'brand', label: 'Tyre Brand', type: 'tyre_brand_dropdown', required: true, halfWidth: true },
    { key: 'vendor', label: 'Vendor Name', type: 'vendor_dropdown', required: true, halfWidth: true },
    { key: 'tyre_number', label: 'Tyre Serial / Code', type: 'text', placeholder: 'e.g. GY-9901-FL', required: true, halfWidth: true },
    { key: 'condition', label: 'Tyre Type', type: 'select', options: ['New', 'Old'], required: true, halfWidth: true },
    
    // Date of Manufacture required if condition === 'New'
    { key: 'date_of_manufacture', label: 'Date of Manufacture', type: 'date', required: true, halfWidth: true, showWhen: (d) => d.condition === 'New' },
    { key: 'date_of_manufacture', label: 'Date of Manufacture (Optional)', type: 'date', halfWidth: true, showWhen: (d) => d.condition === 'Old' },
    
    { key: 'purchase_date', label: 'Purchase Date', type: 'date', required: true, halfWidth: true },
    { key: 'total_amount', label: 'Total Purchase Amount (PKR)', type: 'number', placeholder: 'e.g. 85000', required: true, halfWidth: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true, halfWidth: true },
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
    total_amount: '',
    status: 'Active',
    remarks: '',
  },
  onBeforeSave: (record) => {
    if (record.category === 'Tanker') {
      record.vehicle = record.tanker_number;
    }
  }
};

export function TyrePurchase() {
  return <CrudPage config={config} />;
}
