import React, { useState, useEffect } from 'react';
import { CreditCard, Landmark, DollarSign, CheckCircle, AlertTriangle, Printer, RefreshCw, FileText, ArrowRight, Wallet, UserCheck, ShieldCheck } from 'lucide-react';
import { dbService } from '../../services/db';

export function PaymentEntry() {
  // Source selection state
  const [paymentSource, setPaymentSource] = useState('Bank'); // 'Bank' or 'Cash'
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);

  // Party selection state
  const [partyCategory, setPartyCategory] = useState('Vendors'); // 'Vendors', 'Workshops', 'Fuel Pumps', 'Drivers', 'Vehicles'
  const [partyList, setPartyList] = useState([]);
  const [selectedParty, setSelectedParty] = useState('');
  const [partySummary, setPartySummary] = useState({ totalAccruedCost: 0, totalPaidAmount: 0, currentPayableBalance: 0, pendingItems: [] });

  // Payment Details state
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [instrumentNo, setInstrumentNo] = useState('');
  const [remarks, setRemarks] = useState('');

  // UI & Recent Vouchers state
  const [recentVouchers, setRecentVouchers] = useState([]);
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load initial bank & party list
  const loadInitialData = () => {
    const banks = dbService.getTable('bank_accounts');
    setBankAccounts(banks);
    if (banks.length > 0 && !selectedBankId) {
      setSelectedBankId(banks[0].id);
      setSelectedBank(banks[0]);
    }

    const vouchers = dbService.getTable('payments');
    setRecentVouchers([...vouchers].reverse());
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Update selected bank when dropdown changes
  useEffect(() => {
    if (selectedBankId) {
      const b = bankAccounts.find(x => x.id === selectedBankId);
      setSelectedBank(b || null);
    }
  }, [selectedBankId, bankAccounts]);

  // Update party list when category changes
  useEffect(() => {
    const list = dbService.getPartyListByCategory(partyCategory);
    setPartyList(list);
    if (list.length > 0) {
      setSelectedParty(list[0]);
    } else {
      setSelectedParty('');
      setPartySummary({ totalAccruedCost: 0, totalPaidAmount: 0, currentPayableBalance: 0, pendingItems: [] });
    }
  }, [partyCategory]);

  // Update party financial summary when selected party changes
  useEffect(() => {
    if (selectedParty) {
      const summary = dbService.getPartyPayableSummary(partyCategory, selectedParty);
      setPartySummary(summary);
    } else {
      setPartySummary({ totalAccruedCost: 0, totalPaidAmount: 0, currentPayableBalance: 0, pendingItems: [] });
    }
  }, [partyCategory, selectedParty]);

  // Available liquidity balance
  const availableSourceBalance = paymentSource === 'Bank' ? (parseFloat(selectedBank?.current_balance) || 0) : Infinity;

  // Auto fill full payable balance
  const handlePayFullOutstanding = () => {
    if (partySummary.currentPayableBalance > 0) {
      setPayAmount(partySummary.currentPayableBalance.toString());
    }
  };

  // Submit Payment Voucher Form
  const handleSubmit = async (e) => {
    e.preventDefault();

    const amt = parseFloat(payAmount) || 0;
    if (amt <= 0) {
      setToast({ type: 'error', message: 'Please enter a valid payment amount greater than 0.' });
      return;
    }

    if (!selectedParty) {
      setToast({ type: 'error', message: 'Please select a valid party/entity to receive payment.' });
      return;
    }

    if (paymentSource === 'Bank') {
      if (!selectedBank) {
        setToast({ type: 'error', message: 'Please select a Bank Account.' });
        return;
      }
      if (amt > availableSourceBalance) {
        setToast({ type: 'error', message: `Insufficient bank balance! Available: PKR ${availableSourceBalance.toLocaleString()}, Amount: PKR ${amt.toLocaleString()}` });
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const voucher = await dbService.processPaymentVoucher({
        payment_source: paymentSource,
        bank_id: selectedBankId,
        party_category: partyCategory,
        party_name: selectedParty,
        payment_date: paymentDate,
        amount: amt,
        payment_method: paymentMethod,
        instrument_no: instrumentNo,
        remarks: remarks
      });

      setToast({ type: 'success', message: `Payment Voucher #${voucher.voucher_no} generated and saved to MySQL!` });
      
      // Auto open print modal for generated voucher
      setSelectedVoucherForPrint(voucher);

      // Reset form fields & reload balances
      setPayAmount('');
      setInstrumentNo('');
      setRemarks('');
      loadInitialData();

      // Refresh party summary
      if (selectedParty) {
        setPartySummary(dbService.getPartyPayableSummary(partyCategory, selectedParty));
      }
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to process payment voucher.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="crud-container" style={{ paddingBottom: '80px' }}>
      {/* Header Banner */}
      <div className="crud-header-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff' }}>
        <div className="crud-header-left">
          <div className="crud-header-icon" style={{ background: '#0d9488', color: '#ffffff' }}>
            <FileText size={24} />
          </div>
          <div>
            <h2 className="crud-header-title" style={{ color: '#ffffff' }}>Payment Voucher Generator</h2>
            <p className="crud-header-sub" style={{ color: '#94a3b8' }}>
              Issue financial payment vouchers against Vendors, Workshops, Fuel Pumps, Drivers, and Vehicles from Cash or Bank Accounts.
            </p>
          </div>
        </div>
        <button onClick={loadInitialData} className="btn btn-ghost" style={{ color: '#cbd5e1', borderColor: '#334155' }}>
          <RefreshCw size={16} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Main Voucher Generation Card */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <form onSubmit={handleSubmit}>
          {/* Top Control Bar: Source & Voucher Date */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
            
            {/* Payment Source: Bank Account */}
            <div>
              <label className="crud-form-label" style={{ fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'block' }}>
                Payment Source ("From") <span className="crud-required-star">*</span>
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-teal"
                  style={{ flex: 1, padding: '10px 14px', fontWeight: '700', justifyContent: 'center', cursor: 'default' }}
                >
                  <Landmark size={18} />
                  <span>Bank Account</span>
                </button>
              </div>
            </div>

            {/* Bank Account Dropdown */}
            <div className="report-control-group">
              <label className="crud-form-label" style={{ fontWeight: '700' }}>Select Bank Account *</label>
              <select
                value={selectedBankId}
                onChange={e => setSelectedBankId(e.target.value)}
                className="crud-form-select"
                required
              >
                {bankAccounts.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.bank_name} - {b.account_number} (Bal: PKR {(parseFloat(b.current_balance) || 0).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Voucher Date */}
            <div className="report-control-group">
              <label className="crud-form-label" style={{ fontWeight: '700' }}>Voucher Date *</label>
              <input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="crud-form-input"
                required
              />
            </div>
          </div>

          {/* Section: Party Target & Live Payable Ledger Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            
            {/* Party Category & Entity Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="crud-form-label" style={{ fontWeight: '700', color: '#0f172a' }}>
                  Payment To ("Category") *
                </label>
                <select
                  value={partyCategory}
                  onChange={e => setPartyCategory(e.target.value)}
                  className="crud-form-select"
                  style={{ fontWeight: '600' }}
                >
                  <option value="Vendors">Vendors & Suppliers</option>
                  <option value="Customers">Customers (Receivables & Clients)</option>
                  <option value="Workshops">Workshops (Maintenance)</option>
                  <option value="Fuel Pumps">Fuel Pumps (Fuel Stations)</option>
                  <option value="Drivers">Drivers (Salaries & Advances)</option>
                  <option value="Personal Expenses">Personal Expenses & Misc</option>
                  <option value="Vehicles">Vehicles & Transporters</option>
                </select>
              </div>

              <div>
                <label className="crud-form-label" style={{ fontWeight: '700', color: '#0f172a' }}>
                  Select {partyCategory.slice(0, -1)} / Entity *
                </label>
                <select
                  value={selectedParty}
                  onChange={e => setSelectedParty(e.target.value)}
                  className="crud-form-select"
                  style={{ fontWeight: '700', color: '#0d9488', fontSize: '15px' }}
                  required
                >
                  {partyList.length === 0 ? (
                    <option value="">No {partyCategory} registered in master data</option>
                  ) : (
                    partyList.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Live Financial Summary Widget for Selected Party */}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderRadius: '12px',
              padding: '18px 20px',
              border: '1px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Ledger Account Balance
                </div>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '99px', background: '#e0f2fe', color: '#0369a1', fontWeight: '700' }}>
                  {partyCategory}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Total Invoiced/Costs</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', fontFamily: 'monospace' }}>
                    PKR {(partySummary.totalAccruedCost || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Total Past Payments</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#166534', fontFamily: 'monospace' }}>
                    PKR {(partySummary.totalPaidAmount || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{
                background: '#ffffff',
                borderRadius: '8px',
                padding: '12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626', textTransform: 'uppercase' }}>
                    Total Outstanding Payable
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#dc2626', fontFamily: 'monospace', lineHeight: '1.2' }}>
                    PKR {(partySummary.currentPayableBalance || 0).toLocaleString()}
                  </div>
                </div>

                {partySummary.currentPayableBalance > 0 && (
                  <button
                    type="button"
                    onClick={handlePayFullOutstanding}
                    className="btn btn-ghost"
                    style={{ fontSize: '11px', fontWeight: '800', color: '#0d9488', borderColor: '#ccfbf1', background: '#f0fdfa' }}
                  >
                    Pay Full
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section: Payment Amount & Method Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            
            {/* Amount to Pay */}
            <div className="report-control-group">
              <label className="crud-form-label" style={{ fontWeight: '700', color: '#0f172a' }}>
                Payment Amount to Pay (PKR) <span className="crud-required-star">*</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="Enter amount to pay..."
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                className="crud-form-input"
                style={{ fontSize: '16px', fontWeight: '800', color: '#0d9488', fontFamily: 'monospace' }}
                required
              />
            </div>

            {/* Payment Method */}
            <div className="report-control-group">
              <label className="crud-form-label" style={{ fontWeight: '700' }}>Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="crud-form-select"
                required
              >
                {paymentSource === 'Bank' ? (
                  <>
                    <option value="Bank Transfer">Bank Transfer / IBFT</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online Payment">Online Transfer</option>
                    <option value="Pay Order">Pay Order / Demand Draft</option>
                  </>
                ) : (
                  <option value="Cash">Cash Payment</option>
                )}
              </select>
            </div>

            {/* Instrument / Cheque No */}
            <div className="report-control-group">
              <label className="crud-form-label" style={{ fontWeight: '600' }}>Cheque / Ref No (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Chq #481029 or Txn Ref..."
                value={instrumentNo}
                onChange={e => setInstrumentNo(e.target.value)}
                className="crud-form-input"
              />
            </div>
          </div>

          {/* Remarks Input */}
          <div style={{ marginBottom: '24px' }}>
            <label className="crud-form-label" style={{ fontWeight: '600' }}>Voucher Remarks / Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Payment for monthly maintenance bills, tyre supply settlement, etc."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="crud-form-input"
            />
          </div>

          {/* Submit Action Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="submit"
              disabled={isSubmitting || !selectedParty || !payAmount || parseFloat(payAmount) <= 0}
              className="btn btn-teal"
              style={{ padding: '14px 28px', fontSize: '15px', fontWeight: '800', borderRadius: '10px' }}
            >
              <CheckCircle size={20} />
              <span>Generate & Post Payment Voucher</span>
            </button>
          </div>
        </form>
      </div>

      {/* Entry Logs for Selected Party */}
      {partySummary.entries && partySummary.entries.length > 0 && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} style={{ color: '#0d9488' }} />
              <span>Accrued Expense Entries Logged for {selectedParty} ({partySummary.entries.length})</span>
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
              Accounting & Remaining Balance Managed at Party Level
            </span>
          </div>
          <div className="crud-table-wrapper">
            <table className="crud-table">
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Total Expense / Bill (PKR)</th>
                </tr>
              </thead>
              <tbody>
                {partySummary.entries.map((item) => (
                  <tr key={item.id}>
                    <td className="crud-td-code">{item.id}</td>
                    <td>{item.date}</td>
                    <td>{item.description}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>
                      PKR {item.total_amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Payment Vouchers Table */}
      <div className="crud-table-card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Recent Issued Payment Vouchers
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
            {recentVouchers.length} Total Vouchers Logged
          </span>
        </div>

        <div className="crud-table-wrapper">
          <table className="crud-table">
            <thead>
              <tr>
                <th>Voucher No</th>
                <th>Date</th>
                <th>Payment Source</th>
                <th>Category</th>
                <th>Paid To (Party)</th>
                <th>Method</th>
                <th style={{ textAlign: 'right' }}>Amount Paid</th>
                <th style={{ textAlign: 'right' }}>Balance After</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentVouchers.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No payment vouchers issued yet.
                  </td>
                </tr>
              ) : (
                recentVouchers.map((v) => (
                  <tr key={v.id}>
                    <td className="crud-td-code">{v.voucher_no || v.id}</td>
                    <td>{v.date}</td>
                    <td>
                      <span className={`badge ${v.payment_source === 'Bank' ? 'badge-blue' : 'badge-teal'}`}>
                        {v.source_name || v.payment_source || 'Bank'}
                      </span>
                    </td>
                    <td>{v.party_category || 'Vendor'}</td>
                    <td style={{ fontWeight: '700', color: '#0f172a' }}>{v.party_name}</td>
                    <td>{v.payment_method || 'Bank Transfer'}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: '800', color: '#0d9488' }}>
                      PKR {(parseFloat(v.amount) || 0).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#64748b' }}>
                      PKR {(parseFloat(v.balance_after) || 0).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedVoucherForPrint(v)}
                        className="btn btn-ghost"
                        style={{ padding: '4px 8px', fontSize: '11px', gap: '4px' }}
                      >
                        <Printer size={13} />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Payment Voucher Modal */}
      {selectedVoucherForPrint && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '16px', maxWidth: '650px', width: '100%',
            padding: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', position: 'relative'
          }}>
            {/* Printable Receipt Content */}
            <div id="printable-voucher">
              {/* Receipt Header */}
              <div style={{ borderBottom: '2px solid #0d9488', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '0.5px' }}>
                    FALCON ENERGY TRANSPORT
                  </h2>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>
                    OFFICIAL PAYMENT VOUCHER RECEIPT
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#0d9488', fontFamily: 'monospace' }}>
                    {selectedVoucherForPrint.voucher_no || selectedVoucherForPrint.id}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>
                    Date: {selectedVoucherForPrint.date}
                  </div>
                </div>
              </div>

              {/* Grid Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Paid From Source</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{selectedVoucherForPrint.source_name || selectedVoucherForPrint.payment_source}</div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>Method: {selectedVoucherForPrint.payment_method}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Paid To (Party)</div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#0d9488' }}>{selectedVoucherForPrint.party_name}</div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>Category: {selectedVoucherForPrint.party_category || 'Vendor'}</div>
                </div>
              </div>

              {/* Financial Totals Card */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#fafafa', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                  <span>Outstanding Balance Before Payment:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>
                    PKR {(parseFloat(selectedVoucherForPrint.outstanding_before) || 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: '#f0fdfa', borderBottom: '1px solid #ccfbf1', fontSize: '16px' }}>
                  <span style={{ fontWeight: '800', color: '#0d9488' }}>Amount Paid (Net Payment):</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '900', color: '#0d9488', fontSize: '18px' }}>
                    PKR {(parseFloat(selectedVoucherForPrint.amount) || 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#fafafa', fontSize: '13px' }}>
                  <span>Remaining Outstanding Balance:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#dc2626' }}>
                    PKR {(parseFloat(selectedVoucherForPrint.balance_after) || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Instrument & Remarks */}
              {selectedVoucherForPrint.remarks && (
                <div style={{ marginBottom: '24px', fontSize: '12.5px', color: '#475569', background: '#f1f5f9', padding: '10px 14px', borderRadius: '8px' }}>
                  <strong>Remarks:</strong> {selectedVoucherForPrint.remarks}
                </div>
              )}

              {/* Signatures */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '36px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1', textAlign: 'center', fontSize: '11px', color: '#64748b' }}>
                <div>
                  <div style={{ height: '30px' }}></div>
                  <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontWeight: '700' }}>Prepared By</div>
                </div>
                <div>
                  <div style={{ height: '30px' }}></div>
                  <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontWeight: '700' }}>Authorized Signatory</div>
                </div>
                <div>
                  <div style={{ height: '30px' }}></div>
                  <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontWeight: '700' }}>Receiver Signature</div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => setSelectedVoucherForPrint(null)}
                className="btn btn-ghost"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-teal"
                style={{ fontWeight: '800' }}
              >
                <Printer size={16} />
                <span>Print Voucher Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <div className={`toast-box ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: 'auto' }}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
