import React from 'react';
import { Truck } from 'lucide-react';
import { CrudPage } from '../components/CrudPage';

const vehicleConfig = {
  title: 'Vehicle Management',
  icon: Truck,
  description: 'Master database of LPG fleet vehicles, tanker details, and ownership classifications.',
  tableName: 'vehicles',
  idField: 'code',
  codeField: 'code',
  idPrefix: 'VEH-',
  columns: [
    { key: 'code', label: 'Vehicle Code', format: 'bold' },
    { key: 'number', label: 'Vehicle Number', format: 'bold' },
    { key: 'transporter', label: 'Transporter' },

    { key: 'category', label: 'Category' },
    { key: 'capacity', label: 'Capacity (MT)', format: 'mono' },
    { key: 'tanker_number', label: 'Tanker No.', format: 'mono' },
    { key: 'rent_type', label: 'Rent Type' },
    { key: 'status', label: 'Status', badge: true },
  ],
  formFields: [
    { key: 'number', label: 'Vehicle Number', type: 'text', placeholder: 'e.g. LES-9901', required: true, halfWidth: true },
    { key: 'transporter', label: 'Transporter', type: 'transporter_dropdown', halfWidth: true },
    { key: 'make', label: 'Vehicle Make', type: 'text', placeholder: 'e.g. Hino / Isuzu (Optional)', halfWidth: true },
    { key: 'model', label: 'Vehicle Model', type: 'text', placeholder: 'e.g. 500 Series / 2022 (Optional)', halfWidth: true },
    { key: 'ownership', label: 'Vehicle Ownership', type: 'select', options: ['Single Owner', 'Shared Owner'], required: true, halfWidth: true },
    { key: 'category', label: 'Vehicle Category', type: 'vehicle_category_dropdown', required: true, halfWidth: true },
    { key: 'owner1', label: 'Owner Name', type: 'text', required: true, showWhen: (d) => d.ownership === 'Single Owner' },
    { key: 'owner1', label: 'Owner 1', type: 'text', required: true, showWhen: (d) => d.ownership === 'Shared Owner' },
    { key: 'owner2', label: 'Owner 2', type: 'text', required: true, showWhen: (d) => d.ownership === 'Shared Owner' },
    { key: 'engine', label: 'Engine Number', type: 'text', halfWidth: true },
    { key: 'chassis', label: 'Chassis Number', type: 'text', halfWidth: true },
    { key: 'token_expiry', label: 'Token Expiry Date', type: 'date', halfWidth: true },
    { key: 'route_expiry', label: 'Route Expiry Date', type: 'date', halfWidth: true },
    { key: 'tanker_number', label: 'Tanker Number', type: 'text', required: true, halfWidth: true },
    { key: 'tanker_ownership', label: 'Tanker Ownership', type: 'tanker_ownership_dropdown', halfWidth: true },
    { key: 'capacity', label: 'Tanker Capacity (MT)', type: 'number', step: '0.1', required: true, halfWidth: true },
    { key: 'rent_type', label: 'Rent Type', type: 'select', options: ['Per Ton', 'Per KM', 'Monthly'], required: true, halfWidth: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Maintenance', 'Inactive'], required: true },
  ],
  defaultValues: {
    transporter: '',
    make: '',
    model: '',
    ownership: 'Single Owner',
    category: 'Falcon Energy',
    owner1: '',
    owner2: '-',
    tanker_ownership: 'Falcon Energy',
    capacity: 28.5,
    rent_type: 'Per Ton',
    status: 'Active',
  },
  onBeforeSave: (record) => {
    if (record.ownership === 'Single Owner') {
      record.owner2 = '-';
    }
  },
};

export function FleetVehicles() {
  return <CrudPage config={vehicleConfig} />;
}
