import React, { useState, useEffect } from 'react';
import { Banknote, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { CrudPage } from '../components/CrudPage';
import { dbService } from '../services/db';

const config = {
  title: 'Cash Management',
  icon: Banknote,
  description: 'Manage petty cash transactions, driver advances, cash deposits (credits), and cash expenses (debits).',
  tableName: 'cash_payments',
  idField: 'id',
  idPrefix: 'CSH-',
  columns: [
    { key: 'id', label: 'Cash ID', format: 'bold' },
    { key: 'date', label: 'Date' },
    { key: 'vehicle', label: 'Vehicle', format: 'bold' },
    { key: 'driver', label: 'Driver / Recipient' },
    { key: 'amount', label: 'Amount', format: 'currency' },
    { key: 'payment_type', label: 'Type (Credit / Debit)', badge: true },
    { key: 'status', label: 'Status', badge: true },
  ],
  formFields: [
    { key: 'date', label: 'Date', type: 'date', required: true, halfWidth: true },
    { key: 'vehicle', label: 'Vehicle / Tanker', type: 'vehicle_dropdown', halfWidth: true },
    { key: 'driver', label: 'Driver Name / Recipient', type: 'text', required: true },
    { key: 'amount', label: 'Amount (PKR)', type: 'number', required: true, halfWidth: true },
    { key: 'payment_type', label: 'Payment Type', type: 'select', options: ['Expense (Debit)', 'Driver Payment (Debit)', 'Deposit (Credit)', 'Cash Top-Up (Credit)', 'Other'], required: true, halfWidth: true },
    { key: 'category', label: 'Category / Head', type: 'text', halfWidth: true },
    { key: 'reference_id', label: 'Reference ID', type: 'text', halfWidth: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Paid', 'Pending', 'Unpaid'] },
    { key: 'remarks', label: 'Remarks / Details', type: 'textarea' },
  ],
  defaultValues: {
    date: new Date().toISOString().split('T')[0], vehicle: '', driver: '',
    amount: 0, payment_type: 'Expense (Debit)', category: '', reference_id: '',
    status: 'Paid', remarks: '',
  },
};

export function CashMgmt() {
  const [cashLedger, setCashLedger] = useState(() => dbService.getCashAccountLedger());

  const handleDataChange = () => {
    setCashLedger(dbService.getCashAccountLedger());
  };

  return (
    <div className="space-y-4">
      {/* Cash Account Bank-Like KPI Header Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '16px'
      }}>
        <div style={{
          background: 'linear-[#0f172a, #1e293b]',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '16px 20px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Cash Balance</div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: cashLedger.closingBalance >= 0 ? '#22c55e' : '#ef4444', marginTop: '2px', fontFamily: 'monospace' }}>
              PKR {cashLedger.closingBalance.toLocaleString()}
            </div>
          </div>
          <div style={{ background: '#1e293b', width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
            <Wallet size={24} />
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          padding: '16px 20px',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Total Cash Credit (Inflows)</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#16a34a', marginTop: '2px', fontFamily: 'monospace' }}>
              + PKR {cashLedger.totalCredit.toLocaleString()}
            </div>
          </div>
          <div style={{ background: '#f0fdf4', width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
            <TrendingUp size={24} />
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          padding: '16px 20px',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Total Cash Debit (Outflows)</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#dc2626', marginTop: '2px', fontFamily: 'monospace' }}>
              - PKR {cashLedger.totalDebit.toLocaleString()}
            </div>
          </div>
          <div style={{ background: '#fef2f2', width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
            <TrendingDown size={24} />
          </div>
        </div>
      </div>

      <CrudPage config={config} onItemSaved={handleDataChange} onItemDeleted={handleDataChange} />
    </div>
  );
}

