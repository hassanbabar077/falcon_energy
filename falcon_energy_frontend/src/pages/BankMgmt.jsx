import React from 'react';
import { Landmark } from 'lucide-react';
import { CrudPage } from '../components/CrudPage';

const config = {
  title: 'Bank Management',
  icon: Landmark,
  description: 'Multi-bank account registry with account numbers, opening balances, and current balances.',
  tableName: 'bank_accounts',
  idField: 'id',
  idPrefix: 'BN-',
  columns: [
    { key: 'id', label: 'Bank ID', format: 'bold' },
    { key: 'bank_name', label: 'Bank Name', format: 'bold' },
    { key: 'account_number', label: 'Account Number', format: 'mono' },
    { key: 'opening_balance', label: 'Opening Balance', format: 'currency' },
    { key: 'current_balance', label: 'Current Balance', format: 'currency' },
  ],
  formFields: [
    { key: 'bank_name', label: 'Bank Name', type: 'text', required: true },
    { key: 'account_number', label: 'Account Number', type: 'text', required: true },
    { key: 'opening_balance', label: 'Opening Balance', type: 'number', required: true, halfWidth: true },
    { key: 'current_balance', label: 'Current Balance', type: 'number', required: true, halfWidth: true },
  ],
  defaultValues: { bank_name: '', account_number: '', opening_balance: 0, current_balance: 0 },
};

export function BankMgmt() {
  return <CrudPage config={config} />;
}
