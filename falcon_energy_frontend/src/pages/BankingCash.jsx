import React, { useState } from 'react';
import { Landmark } from 'lucide-react';
import { dbService } from '../services/db';

export function BankingCash() {
  const [bankAccounts, setBankAccounts] = useState(dbService.getTable('bank_accounts'));
  const [transactions, setTransactions] = useState(dbService.getTable('bank_transactions'));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-teal-600" />
            Banking Accounts & Cash Flow Register
          </h2>
          <p className="text-xs text-slate-500">Multi-bank account balances, deposit/withdrawal ledgers, and petty cash payments.</p>
        </div>
      </div>

      {/* Bank Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bankAccounts.map(b => (
          <div key={b.id} className="glass-card p-5 rounded-2xl space-y-2">
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{b.id}</span>
              <Landmark className="w-4 h-4 text-teal-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{b.bank_name}</h3>
            <p className="text-xs font-mono text-slate-500 font-medium">Acc #: {b.account_number}</p>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-500">Current Balance</span>
              <span className="text-lg font-black text-teal-700 font-mono">PKR {(b.current_balance || 0).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bank Transactions Table */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Bank Transactions Ledger</h3>
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Date</th>
              <th className="p-3">Type</th>
              <th className="p-3">Account</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Description</th>
              <th className="p-3">Balance After</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map(t => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="p-3 font-bold text-teal-700">{t.id}</td>
                <td className="p-3">{t.date}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    t.transaction_type === 'Deposit' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {t.transaction_type}
                  </span>
                </td>
                <td className="p-3 font-semibold">{t.account}</td>
                <td className="p-3 font-bold text-slate-900">PKR {(t.amount || 0).toLocaleString()}</td>
                <td className="p-3 text-slate-600">{t.description}</td>
                <td className="p-3 font-mono text-teal-700 font-bold">PKR {(t.balance_after || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
