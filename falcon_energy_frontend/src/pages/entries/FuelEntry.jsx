import React from 'react';
import { Fuel } from 'lucide-react';
import { CrudPage } from '../../components/CrudPage';

const config = {
  title: 'Fuel Entry',
  icon: Fuel,
  description: 'Log diesel refuel details, pump selections, and trip assignments for fleet vehicles.',
  tableName: 'fuel_entries',
  idField: 'id',
  idPrefix: 'FE-',
  columns: [
    { key: 'id', label: 'Fuel ID', format: 'bold' },
    { key: 'date', label: 'Date' },
    { key: 'vehicle', label: 'Vehicle', format: 'bold' },
    { key: 'liters', label: 'Liters (L)', format: 'mono' },
    { key: 'amount', label: 'Amount (PKR)', format: 'currency' },
    { key: 'fuel_pump', label: 'Fuel Pump' },
    { key: 'trip_id', label: 'Trip ID', format: 'mono' },
  ],
  formFields: [
    { key: 'vehicle', label: 'Vehicle', type: 'vehicle_dropdown', required: true, halfWidth: true },
    { key: 'date', label: 'Refuel Date', type: 'date', required: true, halfWidth: true },
    { key: 'liters', label: 'Liters (L)', type: 'number', step: '0.01', placeholder: 'e.g. 320', required: true, halfWidth: true },
    { key: 'amount', label: 'Total Amount (PKR)', type: 'number', placeholder: 'e.g. 92800', required: true, halfWidth: true },
    { key: 'fuel_pump', label: 'Fuel Pump', type: 'fuel_pump_dropdown', required: true, halfWidth: true },
    { key: 'trip_id', label: 'Associated Trip ID', type: 'trip_dropdown', halfWidth: true },
    { key: 'remarks', label: 'Remarks', type: 'textarea', placeholder: 'Meter reading, driver signature, or receipt notes' },
  ],
  defaultValues: { vehicle: '', date: new Date().toISOString().split('T')[0], liters: '', amount: '', fuel_pump: '', trip_id: '', remarks: '' },
};

export function FuelEntry() {
  return <CrudPage config={config} />;
}
