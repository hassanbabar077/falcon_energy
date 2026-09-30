import React, { useState, useEffect, useMemo } from 'react';
import { History, Printer, Search } from 'lucide-react';
import { dbService, toNum } from '../../services/db';
import { VoucherPrintModal } from '../../components/VoucherPrint';

const pkr = (n) => `PKR ${Math.round(toNum(n)).toLocaleString()}`;

export function PaymentHistory() {
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const payments = dbService.getTable('payments').map(p => ({
      kind: 'payment', no: p.voucher_no || p.id, date: p.payment_date || p.date, type: p.payment_type || 'Payment',
      party: p.party_name || p.paid_to, category: p.party_category || '', bank: p.bank_account || p.bank_name || p.source_name || '',
      description: p.description || p.remarks || '', amount: toNum(p.amount), record: p
    }));
    const receipts = dbService.getTable('payments_received').map(r => ({
      kind: 'receipt', no: r.payment_id || r.id, date: r.date, type: 'Receipt',
      party: r.customer || r.party_name || 'Unassigned', category: 'Customer', bank: r.bank || '',
      description: r.description || r.remarks || '', amount: toNum(r.amount), record: r
    }));
    setRows([...payments, ...receipts].sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))));
  }, []);

  const filtered = useMemo(() => rows.filter(v => {
    if (kindFilter && v.kind !== kindFilter) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return [v.no, v.party, v.bank, v.category, v.description, v.type].some(x => String(x || '').toLowerCase().includes(q));
  }), [rows, searchTerm, kindFilter]);

  const totalOut = filtered.filter(r => r.kind === 'payment').reduce((s, r) => s + r.amount, 0);
  const totalIn = filtered.filter(r => r.kind === 'receipt').reduce((s, r) => s + r.amount, 0);

  return (
    <div className="crud-container">
      <div className="crud-header-card">
        <div className="crud-header-left">
          <div className="crud-header-icon"><History size={24} /></div>
          <div>
            <h2 className="crud-header-title">Payment History</h2>
            <p className="crud-header-sub">Audit log of every payment voucher and receipt voucher with its description.</p>
          </div>
        </div>
        <div className="header-stats">
          <div><span>Paid out</span><strong className="text-rose">{pkr(totalOut)}</strong></div>
          <div><span>Received</span><strong className="text-teal">{pkr(totalIn)}</strong></div>
        </div>
      </div>

      <div className="crud-toolbar">
        <div className="crud-search-box">
          <Search size={16} className="crud-search-icon" />
          <input type="text" placeholder="Search voucher, party, bank or description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="crud-search-input" />
        </div>
        <select value={kindFilter} onChange={e => setKindFilter(e.target.value)} className="crud-form-select" style={{ maxWidth: '200px' }}>
          <option value="">All vouchers</option>
          <option value="payment">Payment vouchers</option>
          <option value="receipt">Receipt vouchers</option>
        </select>
        <div className="crud-count-badge">{filtered.length} of {rows.length}</div>
      </div>

      <div className="crud-table-card">
        <div className="crud-table-wrapper">
          <table className="crud-table">
            <thead>
              <tr>
                <th>Voucher</th><th>Date</th><th>Type</th><th>Party</th><th>Description</th><th>Bank</th>
                <th style={{ textAlign: 'right' }}>Amount</th><th style={{ textAlign: 'center' }}>Print</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="8" className="empty-cell">No vouchers found.</td></tr>
              ) : filtered.map(v => (
                <tr key={`${v.kind}-${v.no}`}>
                  <td className="crud-td-code">{v.no}</td>
                  <td>{v.date}</td>
                  <td><span className={`badge ${v.kind === 'receipt' ? 'badge-teal' : v.type === 'Advance' ? 'badge-blue' : v.type === 'Settlement' ? 'badge-amber' : 'badge-rose'}`}>{v.type}</span></td>
                  <td><strong>{v.party}</strong><div className="cell-sub">{v.category}</div></td>
                  <td className="cell-desc">{v.description || '-'}</td>
                  <td>{v.bank || '-'}</td>
                  <td className={`num-cell ${v.kind === 'receipt' ? 'text-teal' : 'text-rose'}`}>{v.kind === 'receipt' ? '+' : '−'} {pkr(v.amount)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button type="button" onClick={() => setSelected(v)} className="btn btn-ghost btn-sm"><Printer size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <VoucherPrintModal voucher={selected?.record} kind={selected?.kind} onClose={() => setSelected(null)} />
    </div>
  );
}
