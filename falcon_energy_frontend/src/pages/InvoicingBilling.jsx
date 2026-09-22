import React, { useState } from 'react';
import { Receipt } from 'lucide-react';
import { dbService } from '../services/db';

export function InvoicingBilling() {
  const [bills, setBills] = useState(dbService.getTable('bills_register'));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-600" />
            Customer Invoicing & Bills Register
          </h2>
          <p className="text-xs text-slate-500">Master customer billing register, per ton/KM rates, fine deductions, and grand total balances.</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200">
            <tr>
              <th className="p-3.5">Bill ID</th>
              <th className="p-3.5">Bill Date</th>
              <th className="p-3.5">Customer</th>
              <th className="p-3.5">Vehicle</th>
              <th className="p-3.5">Bill Type</th>
              <th className="p-3.5">Grand Total</th>
              <th className="p-3.5">Paid Amount</th>
              <th className="p-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bills.map(b => (
              <tr key={b.bill_id} className="hover:bg-slate-50">
                <td className="p-3.5 font-bold text-teal-700">{b.bill_id}</td>
                <td className="p-3.5">{b.bill_date}</td>
                <td className="p-3.5 font-semibold text-slate-900">{b.customer}</td>
                <td className="p-3.5 font-mono font-medium">{b.vehicle}</td>
                <td className="p-3.5">{b.bill_type}</td>
                <td className="p-3.5 font-bold text-slate-900">PKR {(b.grand_total || 0).toLocaleString()}</td>
                <td className="p-3.5 font-mono text-teal-700 font-bold">PKR {(b.paid_amount || 0).toLocaleString()}</td>
                <td className="p-3.5">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    {b.payment_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
