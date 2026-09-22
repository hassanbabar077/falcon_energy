import React from 'react';
import { Droplet } from 'lucide-react';
import { CrudPage } from '../../components/CrudPage';
import { dbService } from '../../services/db';

const config = {
  title: 'Engine Oil Purchase',
  icon: Droplet,
  description: 'Log lubricant bulk purchases and stock additions.',
  tableName: 'engine_oil_purchase',
  idField: 'id',
  idPrefix: 'ENO-',
  columns: [
    { key: 'id', label: 'Purchase ID', format: 'bold' },
    { key: 'date', label: 'Date' },
    { key: 'vendor', label: 'Vendor Name', format: 'bold' },
    { key: 'oil_name', label: 'Engine Oil Grade' },
    { key: 'quantity', label: 'Quantity (Liters)', format: 'mono' },
    { key: 'amount', label: 'Total Cost (PKR)', format: 'currency' },
  ],
  formFields: [
    { key: 'date', label: 'Purchase Date', type: 'date', required: true, halfWidth: true },
    { key: 'vendor', label: 'Vendor Name', type: 'vendor_dropdown', required: true, halfWidth: true },
    { key: 'oil_name', label: 'Engine Oil Name', type: 'engine_oil_dropdown', required: true, halfWidth: true },
    { key: 'quantity', label: 'Purchased Quantity (Liters)', type: 'number', step: '1', placeholder: 'e.g. 200', required: true, halfWidth: true },
    { key: 'amount', label: 'Total Amount (PKR)', type: 'number', placeholder: 'e.g. 240000', required: true, halfWidth: true },
    { key: 'remarks', label: 'Remarks', type: 'textarea', placeholder: 'Vendor invoice number or delivery notes' },
  ],
  defaultValues: { date: new Date().toISOString().split('T')[0], vendor: '', oil_name: 'Shell Rimula R4 15W-40', quantity: '', amount: '', remarks: '' },
  onBeforeSave: (record) => {
    // Increment Engine Oil Stock
    const qty = parseFloat(record.quantity) || 0;
    if (qty > 0) {
      dbService.updateEngineOilStock(record.oil_name, qty);
    }
  }
};

export function EngineOilPurchase() {
  return <CrudPage config={config} />;
}
