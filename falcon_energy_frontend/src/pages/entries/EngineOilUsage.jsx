import React from 'react';
import { Droplet } from 'lucide-react';
import { CrudPage } from '../../components/CrudPage';
import { dbService } from '../../services/db';

const config = {
  title: 'Engine Oil Usage',
  icon: Droplet,
  description: 'Record engine oil consumption per vehicle and automatically update stock inventory levels.',
  tableName: 'engine_oil_usage',
  idField: 'id',
  idPrefix: 'EOU-',
  columns: [
    { key: 'id', label: 'Usage ID', format: 'bold' },
    { key: 'date', label: 'Date' },
    { key: 'vehicle', label: 'Vehicle', format: 'bold' },
    { key: 'trip_id', label: 'Trip ID', format: 'mono' },
    { key: 'oil_name', label: 'Engine Oil Grade', format: 'bold' },
    { key: 'quantity_used', label: 'Used Qty (Liters)', format: 'mono' },
    { key: 'status', label: 'Status', badge: true },
  ],
  formFields: [
    { key: 'vehicle', label: 'Vehicle', type: 'vehicle_dropdown', required: true, halfWidth: true },
    { key: 'trip_id', label: 'Associated Trip ID', type: 'trip_dropdown', halfWidth: true },
    { key: 'date', label: 'Usage Date', type: 'date', required: true, halfWidth: true },
    { key: 'oil_name', label: 'Engine Oil Grade', type: 'select', options: ['Shell Rimula R4 15W-40', 'Mobil Delvac MX 15W-40', 'ZIC X3000 Diesel Oil', 'Caltex Delo 400'], required: true, halfWidth: true },
    { key: 'quantity_used', label: 'Quantity Used (Liters)', type: 'number', step: '1', placeholder: 'e.g. 35', required: true, halfWidth: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Completed', 'Pending'], required: true, halfWidth: true },
    { key: 'remarks', label: 'Remarks', type: 'textarea', placeholder: 'Oil change service notes or meter reading' },
  ],
  defaultValues: { vehicle: '', trip_id: '', date: new Date().toISOString().split('T')[0], oil_name: 'Shell Rimula R4 15W-40', quantity_used: '', status: 'Completed', remarks: '' },
  onBeforeSave: (record) => {
    const qty = parseFloat(record.quantity_used) || 0;
    if (qty > 0) {
      // Decrement stock
      dbService.updateEngineOilStock(record.oil_name, -qty);
    }
  }
};

export function EngineOilUsage() {
  return <CrudPage config={config} />;
}
