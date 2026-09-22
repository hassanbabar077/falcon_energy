import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Check, AlertTriangle, X } from 'lucide-react';
import { dbService } from '../../services/db';

export function PaymentReceived() {
  const [payments, setPayments] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    payment_method: 'Cash',
    bank: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    reference_number: '',
    remarks: ''
  });

  const [nextId, setNextId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPayments(dbService.getTable('payments_received'));
    setBankAccounts(dbService.getTable('bank_accounts'));
  };

  useEffect(() => {
    const prefix = formData.payment_method === 'Cash' ? 'CP-' : 'BP-';
    setNextId(dbService.generateNextID('payments_received', prefix, 'payment_id'));
  }, [formData.payment_method, isAddOpen]);

  const handleChange = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setToast({ message: 'Please enter a valid payment amount.', type: 'error' });
      return;
    }
    if (formData.payment_method === 'Bank' && !formData.bank) {
      setToast({ message: 'Please select a Bank account.', type: 'error' });
      return;
    }

    // Call service to insert payment received and trigger payment history creation
    dbService.addPaymentReceived(formData);

    loadData();
    setIsAddOpen(false);
    setToast({ message: `Payment ${nextId} recorded and added to Payment History!`, type: 'success' });
    setFormData({
      payment_method: 'Cash',
      bank: '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      reference_number: '',
      remarks: ''
    });
  };

  return (
    <div className="crud-container">
      {/* Header Banner */}
      <div className="crud-header-card">
        <div className="crud-header-left">
          <div className="crud-header-icon">
            <CreditCard size={24} />
          </div>
          <div>
            <h2 className="crud-header-title">Payment Received</h2>
            <p className="crud-header-sub">Record incoming customer payments via Cash (CP-001) or Bank (BP-001) with automatic Payment History audit tracking.</p>
          </div>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="btn btn-teal">
          <Plus size={16} /> Record Payment Received
        </button>
      </div>

      {/* Table Card */}
      <div className="crud-table-card">
        <div className="crud-table-wrapper">
          <table className="crud-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Date</th>
                <th>Method</th>
                <th>Bank Account</th>
                <th>Amount (PKR)</th>
                <th>Reference No.</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No payments received yet.
                  </td>
                </tr>
              ) : (
                payments.map(p => (
                  <tr key={p.payment_id || p.id}>
                    <td className="crud-td-code">{p.payment_id}</td>
                    <td>{p.date}</td>
                    <td>
                      <span className={p.payment_method === 'Cash' ? 'badge badge-amber' : 'badge badge-teal'}>
                        {p.payment_method}
                      </span>
                    </td>
                    <td>{p.bank || '-'}</td>
                    <td><strong style={{ color: '#0d9488' }}>PKR {(parseFloat(p.amount) || 0).toLocaleString()}</strong></td>
                    <td><span style={{ fontFamily: 'monospace' }}>{p.reference_number || '-'}</span></td>
                    <td>{p.remarks || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <span className="badge badge-teal" style={{ marginBottom: '4px' }}>Auto Generated ID</span>
                <div className="modal-title">Record Payment Received – <span style={{ fontFamily: 'monospace', color: '#0d9488' }}>{nextId}</span></div>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="modal-close-btn"><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="crud-form">
                  <div className="crud-form-row">
                    <div className="crud-form-field" style={{ flex: '1 1 calc(50% - 7px)' }}>
                      <label className="crud-form-label"><span>Payment Method</span> <span className="crud-required-star">*</span></label>
                      <select
                        value={formData.payment_method}
                        onChange={e => handleChange('payment_method', e.target.value)}
                        className="crud-form-select"
                        required
                      >
                        <option value="Cash">Cash (CP- Series)</option>
                        <option value="Bank">Bank (BP- Series)</option>
                      </select>
                    </div>

                    <div className="crud-form-field" style={{ flex: '1 1 calc(50% - 7px)' }}>
                      <label className="crud-form-label"><span>Payment Date</span> <span className="crud-required-star">*</span></label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={e => handleChange('date', e.target.value)}
                        className="crud-form-input"
                        required
                      />
                    </div>
                  </div>

                  {formData.payment_method === 'Bank' && (
                    <div className="crud-form-field">
                      <label className="crud-form-label"><span>Bank Account</span> <span className="crud-required-star">*</span></label>
                      <select
                        value={formData.bank}
                        onChange={e => handleChange('bank', e.target.value)}
                        className="crud-form-select"
                        required
                      >
                        <option value="">Select Bank Account</option>
                        {bankAccounts.map(b => (
                          <option key={b.id} value={b.bank_name}>{b.bank_name} ({b.account_number})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="crud-form-row">
                    <div className="crud-form-field" style={{ flex: '1 1 calc(50% - 7px)' }}>
                      <label className="crud-form-label"><span>Amount (PKR)</span> <span className="crud-required-star">*</span></label>
                      <input
                        type="number"
                        placeholder="e.g. 150000"
                        value={formData.amount}
                        onChange={e => handleChange('amount', e.target.value)}
                        className="crud-form-input"
                        required
                      />
                    </div>

                    <div className="crud-form-field" style={{ flex: '1 1 calc(50% - 7px)' }}>
                      <label className="crud-form-label"><span>Reference Number</span> <span className="crud-optional-tag">(Optional)</span></label>
                      <input
                        type="text"
                        placeholder="e.g. CHK-99801 / Trans-102"
                        value={formData.reference_number}
                        onChange={e => handleChange('reference_number', e.target.value)}
                        className="crud-form-input"
                      />
                    </div>
                  </div>

                  <div className="crud-form-field">
                    <label className="crud-form-label"><span>Remarks</span> <span className="crud-optional-tag">(Optional)</span></label>
                    <textarea
                      placeholder="Payment details, invoice reference, or depositor notes"
                      value={formData.remarks}
                      onChange={e => handleChange('remarks', e.target.value)}
                      className="crud-form-textarea"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsAddOpen(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-teal">Save Payment & Log History</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast-box ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
