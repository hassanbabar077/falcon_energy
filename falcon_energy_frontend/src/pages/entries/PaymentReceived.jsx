import React, { useState, useEffect, useMemo } from 'react';
import { ArrowDownLeft, Plus, Check, AlertTriangle, X, Printer, Users } from 'lucide-react';
import { dbService, toNum } from '../../services/db';
import { VoucherPrintModal } from '../../components/VoucherPrint';

const pkr = (n) => `PKR ${Math.round(toNum(n)).toLocaleString()}`;
const today = () => new Date().toISOString().split('T')[0];
const EMPTY_FORM = { customer: '', bank: '', date: today(), amount: '', payment_method: 'Bank Transfer', reference_number: '', remarks: '' };

export function PaymentReceived() {
  const [receipts, setReceipts] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [description, setDescription] = useState('');
  const [descriptionEdited, setDescriptionEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [receiptToPrint, setReceiptToPrint] = useState(null);
  const [search, setSearch] = useState('');

  const loadData = () => {
    setReceipts([...dbService.getTable('payments_received')].sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))));
    setBankAccounts(dbService.getTable('bank_accounts'));
    setCustomers(dbService.getPartyListByCategory('Customers'));
  };

  useEffect(() => { loadData(); }, []);

  const handleChange = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const receivable = useMemo(
    () => (formData.customer ? dbService.getPartyPayableSummary('Customers', formData.customer) : null),
    [formData.customer, receipts]
  );

  const autoDescription = formData.customer
    ? dbService.buildNarration('receipt', { party: formData.customer, bank: formData.bank, instrument: formData.reference_number })
    : '';
  useEffect(() => {
    if (!descriptionEdited) setDescription(autoDescription);
  }, [autoDescription, descriptionEdited]);

  const openForm = () => {
    setFormData({ ...EMPTY_FORM, date: today(), bank: bankAccounts[0]?.bank_name || '' });
    setDescriptionEdited(false);
    setIsAddOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      const record = await dbService.addPaymentReceived({ ...formData, description });
      loadData();
      setIsAddOpen(false);
      setToast({ message: `Receipt ${record.payment_id} saved. ${pkr(record.amount)} added to ${record.bank}.`, type: 'success' });
      setReceiptToPrint(record);
    } catch (err) {
      setToast({ message: `Save Failed: ${err.message || 'Database operation failed'}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const filtered = receipts.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [r.payment_id, r.customer, r.party_name, r.bank, r.description, r.reference_number].some(v => String(v || '').toLowerCase().includes(q));
  });

  return (
    <div className="crud-container">
      <div className="crud-header-card">
        <div className="crud-header-left">
          <div className="crud-header-icon"><ArrowDownLeft size={24} /></div>
          <div>
            <h2 className="crud-header-title">Payment Received (Receivables)</h2>
            <p className="crud-header-sub">Receive customer freight payments into a bank account. Trip net income is the customer receivable.</p>
          </div>
        </div>
        <button onClick={openForm} className="btn btn-teal"><Plus size={16} /> New Receipt Voucher</button>
      </div>

      <div className="crud-toolbar">
        <div className="crud-search-box">
          <input type="text" placeholder="Search receipts..." value={search} onChange={e => setSearch(e.target.value)} className="crud-search-input" style={{ paddingLeft: '14px' }} />
        </div>
        <div className="crud-count-badge">{filtered.length} receipt{filtered.length === 1 ? '' : 's'}</div>
      </div>

      <div className="crud-table-card">
        <div className="crud-table-wrapper">
          <table className="crud-table">
            <thead>
              <tr>
                <th>Receipt</th><th>Date</th><th>Customer</th><th>Description</th><th>Bank</th>
                <th>Ref</th><th style={{ textAlign: 'right' }}>Amount</th><th style={{ textAlign: 'center' }}>Print</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="8" className="empty-cell">No payments received yet.</td></tr>
              ) : filtered.map(p => (
                <tr key={p.payment_id || p.id}>
                  <td className="crud-td-code">{p.payment_id || p.id}</td>
                  <td>{p.date}</td>
                  <td><strong>{p.customer || p.party_name || <span className="muted">Unassigned</span>}</strong></td>
                  <td className="cell-desc">{p.description || p.remarks || '-'}</td>
                  <td>{p.bank && p.bank !== '-' ? p.bank : 'Cash'}</td>
                  <td>{p.reference_number && p.reference_number !== '-' ? p.reference_number : '-'}</td>
                  <td className="num-cell">{pkr(p.amount)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReceiptToPrint(p)}><Printer size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <span className="modal-title">New Receipt Voucher</span>
              <button onClick={() => setIsAddOpen(false)} className="modal-close-btn"><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="crud-form">
                  <div className="crud-form-row">
                    <div className="crud-form-field">
                      <label className="crud-form-label"><Users size={13} /> <span>Customer</span> <span className="crud-required-star">*</span></label>
                      <select value={formData.customer} onChange={e => { handleChange('customer', e.target.value); setDescriptionEdited(false); }} className="crud-form-select" required>
                        <option value="">Select Customer</option>
                        {customers.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="crud-form-field">
                      <label className="crud-form-label"><span>Date</span> <span className="crud-required-star">*</span></label>
                      <input type="date" value={formData.date} onChange={e => handleChange('date', e.target.value)} className="crud-form-input" required />
                    </div>
                  </div>

                  {receivable && (
                    <div className="context-card context-card--inline">
                      <div className="context-row"><span>Freight billed (delivered trips)</span><strong>{pkr(receivable.totalAccruedCost)}</strong></div>
                      <div className="context-row"><span>Already received</span><strong>{pkr(receivable.totalPaidAmount)}</strong></div>
                      <div className="context-row context-row--due"><span>Outstanding receivable</span><strong>{pkr(receivable.currentPayableBalance)}</strong></div>
                    </div>
                  )}

                  <div className="crud-form-row">
                    <div className="crud-form-field">
                      <label className="crud-form-label"><span>Deposit Into (Bank)</span> <span className="crud-required-star">*</span></label>
                      <select value={formData.bank} onChange={e => handleChange('bank', e.target.value)} className="crud-form-select" required>
                        <option value="">Select Bank Account</option>
                        {bankAccounts.map(b => <option key={b.id} value={b.bank_name}>{b.bank_name} ({b.account_number})</option>)}
                      </select>
                    </div>
                    <div className="crud-form-field">
                      <label className="crud-form-label"><span>Method</span></label>
                      <select value={formData.payment_method} onChange={e => handleChange('payment_method', e.target.value)} className="crud-form-select">
                        <option value="Bank Transfer">Bank Transfer / IBFT</option>
                        <option value="Cheque">Cheque Deposit</option>
                        <option value="Online Payment">Online Transfer</option>
                        <option value="Pay Order">Pay Order</option>
                      </select>
                    </div>
                  </div>

                  <div className="crud-form-row">
                    <div className="crud-form-field">
                      <label className="crud-form-label"><span>Amount (PKR)</span> <span className="crud-required-star">*</span></label>
                      <div className="input-with-action">
                        <input type="number" placeholder="e.g. 150000" value={formData.amount} onChange={e => handleChange('amount', e.target.value)} className="crud-form-input crud-form-input--amount" required />
                        {receivable?.currentPayableBalance > 0 && (
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleChange('amount', String(receivable.currentPayableBalance))}>Receive Full</button>
                        )}
                      </div>
                    </div>
                    <div className="crud-form-field">
                      <label className="crud-form-label"><span>Cheque / Ref No</span> <span className="crud-optional-tag">(Optional)</span></label>
                      <input type="text" placeholder="e.g. CHK-99801" value={formData.reference_number} onChange={e => handleChange('reference_number', e.target.value)} className="crud-form-input" />
                    </div>
                  </div>

                  <div className="crud-form-field">
                    <label className="crud-form-label"><span>Description (shown in reports)</span> <span className="crud-required-star">*</span></label>
                    <input type="text" value={description} onChange={e => { setDescription(e.target.value); setDescriptionEdited(true); }} className="crud-form-input" required />
                    {descriptionEdited && <button type="button" className="link-btn" onClick={() => setDescriptionEdited(false)}>Use automatic description</button>}
                  </div>

                  <div className="crud-form-field">
                    <label className="crud-form-label"><span>Remarks</span> <span className="crud-optional-tag">(Optional)</span></label>
                    <textarea value={formData.remarks} onChange={e => handleChange('remarks', e.target.value)} className="crud-form-textarea" placeholder="Invoice reference or depositor notes" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsAddOpen(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-teal" disabled={saving}>{saving ? 'Saving…' : 'Save Receipt'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <VoucherPrintModal voucher={receiptToPrint} kind="receipt" onClose={() => setReceiptToPrint(null)} />

      {toast && (
        <div className={`toast-box ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="toast-close">✕</button>
        </div>
      )}
    </div>
  );
}
