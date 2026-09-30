import React, { useState, useEffect, useMemo } from 'react';
import { CreditCard, Landmark, CheckCircle, AlertTriangle, Printer, RefreshCw, FileText, Truck, Wallet, ClipboardCheck } from 'lucide-react';
import { dbService, PAYABLE_CATEGORIES, toNum } from '../../services/db';
import { VoucherPrintModal } from '../../components/VoucherPrint';

const pkr = (n) => `PKR ${Math.round(toNum(n)).toLocaleString()}`;

const CATEGORY_LABELS = {
  'Vendors': 'Vendors & Suppliers of Parts / Oil / Tyres',
  'Workshops': 'Workshops (Maintenance)',
  'Fuel Pumps': 'Fuel Pumps',
  'Drivers': 'Drivers (Trip Advance / Settlement)',
  'Vehicles': 'Vehicles (Trip Advance / Settlement)',
  'Personal Expenses': 'Personal Expenses & Misc'
};

const PAYMENT_TYPES = [
  { id: 'Advance', label: 'Trip Advance', hint: 'Advance for the running trip' },
  { id: 'Settlement', label: 'Final Due Settlement', hint: 'Pay the final due of a delivered trip' }
];

export function PaymentEntry() {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState('');

  const [partyCategory, setPartyCategory] = useState('Vendors');
  const [selectedParty, setSelectedParty] = useState('');
  const [paymentType, setPaymentType] = useState('Payment');
  const [settlementTripId, setSettlementTripId] = useState('');

  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [instrumentNo, setInstrumentNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionEdited, setDescriptionEdited] = useState(false);

  const [recentVouchers, setRecentVouchers] = useState([]);
  const [voucherToPrint, setVoucherToPrint] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadInitialData = () => {
    const banks = dbService.getTable('bank_accounts');
    setBankAccounts(banks);
    if (banks.length > 0 && !selectedBankId) setSelectedBankId(banks[0].id);
    setRecentVouchers([...dbService.getTable('payments')].reverse());
  };

  useEffect(() => { loadInitialData(); }, []);

  const isTripParty = partyCategory === 'Vehicles' || partyCategory === 'Drivers';
  const selectedBank = bankAccounts.find(b => b.id === selectedBankId) || null;
  const partyList = useMemo(() => dbService.getPartyListByCategory(partyCategory), [partyCategory, recentVouchers]);

  // Reset dependent selections when the category changes
  useEffect(() => {
    setSelectedParty(partyList[0] || '');
    setPaymentType(isTripParty ? 'Advance' : 'Payment');
    setSettlementTripId('');
  }, [partyCategory]);

  const activeTrip = useMemo(() => {
    if (!isTripParty || !selectedParty) return null;
    return partyCategory === 'Vehicles' ? dbService.getVehicleActiveTrip(selectedParty) : dbService.getDriverActiveTrip(selectedParty);
  }, [partyCategory, selectedParty, recentVouchers]);

  const dueTrips = useMemo(() => {
    if (!isTripParty || !selectedParty) return [];
    return dbService.getTripsWithOutstandingDue(partyCategory === 'Vehicles' ? { vehicle: selectedParty } : { driver: selectedParty });
  }, [partyCategory, selectedParty, recentVouchers]);

  useEffect(() => {
    if (paymentType === 'Settlement') setSettlementTripId(dueTrips[0]?.trip.id || '');
  }, [paymentType, dueTrips]);

  const tripForVoucher = paymentType === 'Advance' ? activeTrip : paymentType === 'Settlement' ? dbService._findTrip(settlementTripId) : null;
  const tripSettlement = useMemo(() => (tripForVoucher ? dbService.getTripSettlement(tripForVoucher.id) : null), [tripForVoucher, recentVouchers]);

  const partySummary = useMemo(() => (
    !isTripParty && selectedParty
      ? dbService.getPartyPayableSummary(partyCategory, selectedParty)
      : { totalAccruedCost: 0, totalPaidAmount: 0, currentPayableBalance: 0, entries: [] }
  ), [partyCategory, selectedParty, isTripParty, recentVouchers]);

  // Auto description (editable) – refreshed while the user has not typed their own
  const autoDescription = selectedParty ? dbService.buildNarration(
    paymentType === 'Payment' ? 'payment' : paymentType.toLowerCase(),
    { party: selectedParty, category: partyCategory, trip: tripForVoucher, bank: selectedBank?.bank_name, instrument: instrumentNo }
  ) : '';
  useEffect(() => {
    if (!descriptionEdited) setDescription(autoDescription);
  }, [autoDescription, descriptionEdited]);

  const outstanding = paymentType === 'Settlement' ? (tripSettlement?.outstandingDue || 0) : partySummary.currentPayableBalance;
  const availableBalance = toNum(selectedBank?.current_balance);

  const resetForm = () => {
    setPayAmount('');
    setInstrumentNo('');
    setRemarks('');
    setDescriptionEdited(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = toNum(payAmount);
    if (amt <= 0) return setToast({ type: 'error', message: 'Please enter a valid payment amount greater than 0.' });
    if (!selectedParty) return setToast({ type: 'error', message: 'Please select the party to pay.' });
    if (!selectedBank) return setToast({ type: 'error', message: 'Please select a bank account.' });
    if (amt > availableBalance) return setToast({ type: 'error', message: `Insufficient bank balance. Available: ${pkr(availableBalance)}` });
    if (paymentType === 'Advance' && !activeTrip) return setToast({ type: 'error', message: `${selectedParty} has no running trip. Create the trip first, then pay the advance.` });
    if (paymentType === 'Settlement' && !settlementTripId) return setToast({ type: 'error', message: 'No trip with an outstanding final due is selected.' });

    try {
      setIsSubmitting(true);
      const voucher = await dbService.processPaymentVoucher({
        bank_id: selectedBankId,
        party_category: partyCategory,
        party_name: selectedParty,
        payment_type: paymentType,
        trip_id: tripForVoucher?.id || '',
        payment_date: paymentDate,
        amount: amt,
        payment_method: paymentMethod,
        instrument_no: instrumentNo,
        description,
        remarks
      });
      setToast({ type: 'success', message: `Voucher ${voucher.voucher_no} posted: ${voucher.description}` });
      setVoucherToPrint(voucher);
      resetForm();
      loadInitialData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to process payment voucher.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="crud-container" style={{ paddingBottom: '80px' }}>
      <div className="crud-header-card">
        <div className="crud-header-left">
          <div className="crud-header-icon"><FileText size={24} /></div>
          <div>
            <h2 className="crud-header-title">Payment Voucher (Payables)</h2>
            <p className="crud-header-sub">Pay vendors, workshops, fuel pumps, drivers, vehicles and personal expenses from a bank account.</p>
          </div>
        </div>
        <button onClick={loadInitialData} className="btn btn-ghost"><RefreshCw size={16} /> Refresh</button>
      </div>

      <div className="panel-card">
        <form onSubmit={handleSubmit}>
          {/* Source & date */}
          <div className="form-grid form-grid--3">
            <div className="crud-form-field">
              <label className="crud-form-label"><Landmark size={13} /> Pay From (Bank Account) *</label>
              <select value={selectedBankId} onChange={e => setSelectedBankId(e.target.value)} className="crud-form-select" required>
                {bankAccounts.length === 0 && <option value="">No bank account in master data</option>}
                {bankAccounts.map(b => (
                  <option key={b.id} value={b.id}>{b.bank_name} - {b.account_number} (Bal: {pkr(b.current_balance)})</option>
                ))}
              </select>
            </div>
            <div className="crud-form-field">
              <label className="crud-form-label">Voucher Date *</label>
              <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="crud-form-input" required />
            </div>
            <div className="crud-form-field">
              <label className="crud-form-label">Payment Category *</label>
              <select value={partyCategory} onChange={e => setPartyCategory(e.target.value)} className="crud-form-select">
                {PAYABLE_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
          </div>

          <div className="form-grid form-grid--2" style={{ marginTop: '16px' }}>
            {/* Party + type */}
            <div className="form-stack">
              <div className="crud-form-field">
                <label className="crud-form-label">Pay To ({partyCategory === 'Personal Expenses' ? 'Head' : partyCategory.replace(/s$/, '')}) *</label>
                <select value={selectedParty} onChange={e => { setSelectedParty(e.target.value); setDescriptionEdited(false); }} className="crud-form-select crud-form-select--strong" required>
                  {partyList.length === 0 ? <option value="">No {partyCategory} in master data</option> : partyList.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {isTripParty && (
                <div className="crud-form-field">
                  <label className="crud-form-label">Voucher Type *</label>
                  <div className="segmented">
                    {PAYMENT_TYPES.map(pt => (
                      <button type="button" key={pt.id} className={paymentType === pt.id ? 'active' : ''} onClick={() => { setPaymentType(pt.id); setDescriptionEdited(false); }} title={pt.hint}>
                        {pt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {paymentType === 'Settlement' && (
                <div className="crud-form-field">
                  <label className="crud-form-label">Trip with Final Due *</label>
                  <select value={settlementTripId} onChange={e => setSettlementTripId(e.target.value)} className="crud-form-select">
                    {dueTrips.length === 0 && <option value="">No outstanding final due for {selectedParty}</option>}
                    {dueTrips.map(({ trip, settlement }) => (
                      <option key={trip.id} value={trip.id}>{trip.id} · {trip.vehicle} · unloaded {trip.unloading_date} · due {pkr(settlement.outstandingDue)}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Live context panel */}
            {paymentType === 'Advance' ? (
              <div className="context-card">
                <div className="context-card-head"><Truck size={15} /> Running Trip</div>
                {activeTrip ? (
                  <>
                    <div className="context-row"><span>Trip</span><strong>{activeTrip.id}</strong></div>
                    <div className="context-row"><span>Vehicle / Driver</span><strong>{activeTrip.vehicle} · {activeTrip.driver && activeTrip.driver !== '-' ? activeTrip.driver : '—'}</strong></div>
                    <div className="context-row"><span>Route</span><strong>{dbService._tripRoute(activeTrip) || '—'} · loaded {activeTrip.loading_date}</strong></div>
                    <div className="context-row"><span>Carry-forward advance</span><strong>{pkr(tripSettlement?.previousBalance)}</strong></div>
                    <div className="context-row"><span>Advances paid so far</span><strong>{pkr(tripSettlement?.advanceTotal)} ({tripSettlement?.advances.length || 0})</strong></div>
                    <div className="context-row context-row--total"><span>Total advance available</span><strong>{pkr(tripSettlement?.totalAdvance)}</strong></div>
                  </>
                ) : (
                  <div className="context-empty">No running trip for {selectedParty || 'this party'}. An advance can only be paid against a trip that has not been delivered yet.</div>
                )}
              </div>
            ) : paymentType === 'Settlement' ? (
              <div className="context-card">
                <div className="context-card-head"><ClipboardCheck size={15} /> Trip Settlement</div>
                {tripSettlement ? (
                  <>
                    <div className="context-row"><span>Total advance</span><strong>{pkr(tripSettlement.totalAdvance)}</strong></div>
                    <div className="context-row"><span>Trip expenses</span><strong>{pkr(tripSettlement.expenseTotal)}</strong></div>
                    <div className="context-row"><span>Final due</span><strong>{pkr(tripSettlement.finalDue)}</strong></div>
                    <div className="context-row"><span>Already settled</span><strong>{pkr(tripSettlement.settledAmount)}</strong></div>
                    <div className="context-row context-row--due"><span>Outstanding due</span><strong>{pkr(tripSettlement.outstandingDue)}</strong></div>
                  </>
                ) : <div className="context-empty">Select a trip with a final due.</div>}
              </div>
            ) : (
              <div className="context-card">
                <div className="context-card-head"><Wallet size={15} /> Ledger Balance · {selectedParty || '—'}</div>
                <div className="context-row"><span>Total billed / costs</span><strong>{pkr(partySummary.totalAccruedCost)}</strong></div>
                <div className="context-row"><span>Total paid</span><strong>{pkr(partySummary.totalPaidAmount)}</strong></div>
                <div className="context-row context-row--due"><span>Outstanding payable</span><strong>{pkr(partySummary.currentPayableBalance)}</strong></div>
              </div>
            )}
          </div>

          {/* Amount & method */}
          <div className="form-grid form-grid--3" style={{ marginTop: '16px' }}>
            <div className="crud-form-field">
              <label className="crud-form-label">Amount (PKR) *</label>
              <div className="input-with-action">
                <input type="number" min="1" placeholder="Enter amount..." value={payAmount} onChange={e => setPayAmount(e.target.value)} className="crud-form-input crud-form-input--amount" required />
                {paymentType !== 'Advance' && outstanding > 0 && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPayAmount(String(Math.round(outstanding * 100) / 100))}>Pay Full</button>
                )}
              </div>
            </div>
            <div className="crud-form-field">
              <label className="crud-form-label">Payment Method *</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="crud-form-select">
                <option value="Bank Transfer">Bank Transfer / IBFT</option>
                <option value="Cheque">Cheque</option>
                <option value="Online Payment">Online Transfer</option>
                <option value="Pay Order">Pay Order / Demand Draft</option>
              </select>
            </div>
            <div className="crud-form-field">
              <label className="crud-form-label">Cheque / Ref No (Optional)</label>
              <input type="text" placeholder="e.g. Chq #481029" value={instrumentNo} onChange={e => setInstrumentNo(e.target.value)} className="crud-form-input" />
            </div>
          </div>

          <div className="form-grid form-grid--2" style={{ marginTop: '16px' }}>
            <div className="crud-form-field">
              <label className="crud-form-label">Description (shown in reports) *</label>
              <input type="text" value={description} onChange={e => { setDescription(e.target.value); setDescriptionEdited(true); }} className="crud-form-input" required />
              {descriptionEdited && <button type="button" className="link-btn" onClick={() => setDescriptionEdited(false)}>Use automatic description</button>}
            </div>
            <div className="crud-form-field">
              <label className="crud-form-label">Remarks (Optional)</label>
              <input type="text" placeholder="Internal notes" value={remarks} onChange={e => setRemarks(e.target.value)} className="crud-form-input" />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={isSubmitting || !selectedParty || toNum(payAmount) <= 0} className="btn btn-teal btn-lg">
              <CheckCircle size={18} /> {isSubmitting ? 'Posting…' : 'Generate & Post Voucher'}
            </button>
          </div>
        </form>
      </div>

      {/* Charges logged for the party */}
      {!isTripParty && partySummary.entries.length > 0 && (
        <div className="crud-table-card">
          <div className="table-card-head">
            <h3><CreditCard size={16} /> Bills logged for {selectedParty} ({partySummary.entries.length})</h3>
          </div>
          <div className="crud-table-wrapper">
            <table className="crud-table">
              <thead><tr><th>Ref</th><th>Date</th><th>Description</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
              <tbody>
                {[...partySummary.entries].reverse().map(item => (
                  <tr key={item.id + item.date}>
                    <td className="crud-td-code">{item.id}</td>
                    <td>{item.date}</td>
                    <td>{item.description}</td>
                    <td className="num-cell">{pkr(item.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent vouchers */}
      <div className="crud-table-card">
        <div className="table-card-head">
          <h3>Recent Payment Vouchers</h3>
          <span>{recentVouchers.length} vouchers</span>
        </div>
        <div className="crud-table-wrapper">
          <table className="crud-table">
            <thead>
              <tr>
                <th>Voucher</th><th>Date</th><th>Type</th><th>Paid To</th><th>Description</th>
                <th>Bank</th><th style={{ textAlign: 'right' }}>Amount</th><th style={{ textAlign: 'center' }}>Print</th>
              </tr>
            </thead>
            <tbody>
              {recentVouchers.length === 0 ? (
                <tr><td colSpan={8} className="empty-cell">No payment vouchers issued yet.</td></tr>
              ) : recentVouchers.slice(0, 25).map(v => (
                <tr key={v.id}>
                  <td className="crud-td-code">{v.voucher_no || v.id}</td>
                  <td>{v.payment_date || v.date}</td>
                  <td><span className={`badge ${v.payment_type === 'Advance' ? 'badge-blue' : v.payment_type === 'Settlement' ? 'badge-amber' : 'badge-teal'}`}>{v.payment_type || 'Payment'}</span></td>
                  <td><strong>{v.party_name || v.paid_to}</strong><div className="cell-sub">{v.party_category || ''}</div></td>
                  <td className="cell-desc">{v.description || v.remarks || '-'}</td>
                  <td>{v.bank_account || v.bank_name || v.source_name || '-'}</td>
                  <td className="num-cell">{pkr(v.amount)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button type="button" onClick={() => setVoucherToPrint(v)} className="btn btn-ghost btn-sm"><Printer size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <VoucherPrintModal voucher={voucherToPrint} kind="payment" onClose={() => { setVoucherToPrint(null); }} />

      {toast && (
        <div className={`toast-box ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="toast-close">✕</button>
        </div>
      )}
    </div>
  );
}
