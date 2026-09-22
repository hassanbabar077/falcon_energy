import React from 'react';
import { FileText } from 'lucide-react';
import { CrudPage } from '../components/CrudPage';

const config = {
  title: 'Document Management',
  icon: FileText,
  description: 'Vehicle document registry including tokens, route permits, insurance, fitness, and registration.',
  tableName: 'document_register',
  idField: 'id',
  idPrefix: 'DOC-',
  columns: [
    { key: 'id', label: 'Document ID', format: 'bold' },
    { key: 'vehicle', label: 'Vehicle', format: 'bold' },
    { key: 'doc_name', label: 'Document Name', format: 'bold' },
    { key: 'doc_type', label: 'Document Type', badge: true },
    { key: 'doc_number', label: 'Document Number', format: 'mono' },
    { key: 'issue_date', label: 'Issue Date' },
    { key: 'expiry_date', label: 'Expiry Date' },
    { key: 'reminder_days', label: 'Reminder' },
    { key: 'status', label: 'Status', badge: true },
  ],
  formFields: [
    { key: 'vehicle', label: 'Vehicle', type: 'vehicle_dropdown', required: true },
    { key: 'doc_name', label: 'Document Name', type: 'text', placeholder: 'e.g. Route Permit 2026', required: true },
    { key: 'doc_type', label: 'Document Type', type: 'select', options: ['Token', 'Route', 'Insurance', 'Fitness', 'Registration'], required: true },
    { key: 'doc_number', label: 'Document Number', type: 'text', required: true },
    { key: 'issue_date', label: 'Issue Date', type: 'date', required: true, halfWidth: true },
    { key: 'expiry_date', label: 'Expiry Date', type: 'date', required: true, halfWidth: true },
    { key: 'reminder_days', label: 'Reminder Days', type: 'number', required: true, halfWidth: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Valid', 'Expired', 'Pending'], required: true, halfWidth: true },
    { key: 'remarks', label: 'Remarks', type: 'textarea' },
  ],
  defaultValues: { vehicle: '', doc_name: '', doc_type: 'Token', doc_number: '', issue_date: '', expiry_date: '', reminder_days: 30, status: 'Valid', remarks: '' },
};

export function DocumentMgmt() {
  return <CrudPage config={config} />;
}
