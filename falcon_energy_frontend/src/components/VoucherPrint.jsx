import React from 'react';
import { Printer, X } from 'lucide-react';
import { dbService } from '../services/db';
import { escapeHTML as e, pkr, fmtDate, printHTML } from '../utils/print';

export const VOUCHER_CSS = `
  .vch { font-family: 'Nunito', 'Segoe UI', sans-serif; color: #0f172a; font-size: 12px; line-height: 1.45; }
  .vch-head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 14px; }
  .vch-company { font-size: 18px; font-weight: 900; letter-spacing: -.2px; }
  .vch-sub { font-size: 10.5px; color: #64748b; font-weight: 600; margin-top: 2px; }
  .vch-title { font-size: 11px; font-weight: 900; letter-spacing: 1.2px; color: #0f766e; text-transform: uppercase; }
  .vch-no { font-size: 18px; font-weight: 900; font-family: 'Consolas', monospace; text-align: right; }
  .vch-date { font-size: 11px; color: #475569; font-weight: 700; text-align: right; }
  .vch-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
  .vch-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
  .vch-lbl { font-size: 9.5px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; }
  .vch-val { font-size: 13px; font-weight: 800; margin-top: 1px; }
  .vch-small { font-size: 11px; color: #475569; margin-top: 2px; }
  .vch-desc { border-left: 3px solid #0d9488; background: #f0fdfa; padding: 8px 12px; border-radius: 0 8px 8px 0; margin-bottom: 12px; font-weight: 700; }
  .vch-amounts { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 12px; }
  .vch-amounts div { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
  .vch-amounts div:last-child { border-bottom: 0; }
  .vch-amounts .main { background: #f0fdfa; font-size: 15px; font-weight: 900; color: #0f766e; }
  .vch-amounts span:last-child { font-family: 'Consolas', monospace; font-weight: 800; }
  .vch-sign { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 44px; text-align: center; font-size: 10.5px; color: #475569; font-weight: 700; }
  .vch-sign div { border-top: 1px solid #94a3b8; padding-top: 4px; }
`;

// kind: 'payment' (payments table) or 'receipt' (payments_received table)
export function buildVoucherHTML(voucher, kind = 'payment') {
  const company = dbService.getCompanyInfo();
  const isReceipt = kind === 'receipt';
  const type = voucher.payment_type || 'Payment';
  const no = voucher.voucher_no || voucher.payment_id || voucher.id;
  const date = voucher.payment_date || voucher.date;

  const title = isReceipt ? 'Receipt Voucher'
    : type === 'Advance' ? 'Trip Advance Voucher'
    : type === 'Settlement' ? 'Final Due Settlement Voucher'
    : 'Payment Voucher';

  const balanceRows = isReceipt
    ? [['Customer receivable before', voucher.outstanding_before], ['Amount received', voucher.amount, true], ['Receivable remaining', voucher.balance_after]]
    : type === 'Advance'
      ? [['Trip advance before this voucher', voucher.outstanding_before], ['Advance paid', voucher.amount, true], ['Total trip advance after', voucher.balance_after]]
      : [['Outstanding before payment', voucher.outstanding_before], ['Amount paid', voucher.amount, true], ['Outstanding after payment', voucher.balance_after]];

  const partyLabel = isReceipt ? 'Received From (Customer)' : 'Paid To';
  const partyName = isReceipt ? (voucher.customer || voucher.party_name || 'Unassigned') : voucher.party_name;
  const partySub = isReceipt ? 'Customer' : `${voucher.party_category || ''}${voucher.trip_id ? ` · Trip ${voucher.trip_id}` : ''}`;
  const bankLabel = isReceipt ? 'Deposited Into' : 'Paid From';
  const bankName = isReceipt ? voucher.bank : (voucher.source_name || voucher.bank_account || voucher.payment_source);
  const ref = voucher.instrument_no || voucher.reference_number || voucher.cheque_no;

  return `
    <div class="vch">
      <div class="vch-head">
        <div>
          <div class="vch-company">${e(company.name)}</div>
          <div class="vch-sub">${e(company.address)} · ${e(company.contact)}</div>
          <div class="vch-title" style="margin-top:8px">${e(title)}</div>
        </div>
        <div>
          <div class="vch-no">${e(no)}</div>
          <div class="vch-date">${e(fmtDate(date))}</div>
        </div>
      </div>
      <div class="vch-grid">
        <div class="vch-box"><div class="vch-lbl">${partyLabel}</div><div class="vch-val">${e(partyName)}</div><div class="vch-small">${e(partySub)}</div></div>
        <div class="vch-box"><div class="vch-lbl">${bankLabel}</div><div class="vch-val">${e(bankName || '-')}</div><div class="vch-small">Method: ${e(voucher.payment_method || 'Bank Transfer')}${ref ? ` · Ref: ${e(ref)}` : ''}</div></div>
      </div>
      ${voucher.description ? `<div class="vch-desc">${e(voucher.description)}</div>` : ''}
      <div class="vch-amounts">
        ${balanceRows.map(([label, value, main]) => `<div class="${main ? 'main' : ''}"><span>${label}</span><span>${pkr(value)}</span></div>`).join('')}
      </div>
      ${voucher.remarks ? `<div class="vch-small"><strong>Remarks:</strong> ${e(voucher.remarks)}</div>` : ''}
      <div class="vch-sign"><div>Prepared By</div><div>Authorized Signatory</div><div>${isReceipt ? 'Received By (Accounts)' : 'Receiver Signature'}</div></div>
    </div>`;
}

export function VoucherPrintModal({ voucher, kind = 'payment', onClose }) {
  if (!voucher) return null;
  const html = buildVoucherHTML(voucher, kind);
  const handlePrint = () => printHTML({
    title: `${voucher.voucher_no || voucher.payment_id || voucher.id}`,
    html: `<div style="max-width:720px;margin:0 auto">${html}</div>`,
    css: VOUCHER_CSS
  });

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '720px' }}>
        <style>{VOUCHER_CSS}</style>
        <div className="modal-header">
          <span className="modal-title">Voucher Preview</span>
          <button onClick={onClose} className="modal-close-btn"><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-ghost">Close</button>
          <button type="button" onClick={handlePrint} className="btn btn-teal"><Printer size={16} /> Print Voucher</button>
        </div>
      </div>
    </div>
  );
}
