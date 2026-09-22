import React from 'react';
import { Droplets } from 'lucide-react';
import { CrudPage } from '../components/CrudPage';

const config = {
  title: 'Engine Oil Management',
  icon: Droplets,
  description: 'Engine oil product registry with initial purchase quantities and current stock levels.',
  tableName: 'engine_oil_defination',
  idField: 'id',
  idPrefix: 'ENO-',
  columns: [
    { key: 'id', label: 'Engine Oil ID', format: 'bold' },
    { key: 'name', label: 'Oil Name', format: 'bold' },
    { key: 'packing_size', label: 'Packing Size' },
    { key: 'current_stock', label: 'Availability Qty (Liters)', format: 'mono' },
  ],
  formFields: [
    { key: 'name', label: 'Oil Name', type: 'text', placeholder: 'e.g. Shell Rimula 15W-40', required: true },
    { key: 'packing_size', label: 'Packing Size', type: 'text', placeholder: 'e.g. 4L / 20L Bucket / 208L Drum', required: true, halfWidth: true },
    { key: 'current_stock', label: 'Available Quantity (Liters)', type: 'number', placeholder: 'Current Stock Qty', required: true, halfWidth: true },
    { key: 'initial_qty', label: 'Initial Quantity (Liters)', type: 'number', halfWidth: true },
  ],
  defaultValues: { name: '', packing_size: '', current_stock: 0, initial_qty: 0 },
};

export function EngineOilMgmt() {
  return <CrudPage config={config} />;
}
