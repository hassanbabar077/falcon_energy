import React, { useState, useEffect } from 'react';
import { History, Printer, Search, RefreshCw, FileText, CheckCircle } from 'lucide-react';
import { dbService } from '../../services/db';

export function PaymentHistory() {
  const [vouchers, setVouchers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const loadData = () => {
    const list = dbService.getTable('payments');
    setVouchers([...list].reverse());
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredVouchers = vouchers.filter(v => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const vNo = (v.voucher_no || v.id || '').toLowerCase();
    const party = (v.party_name || '').toLowerCase();
    const source = (v.source_name || v.payment_source || '').toLowerCase();
    const category = (v.party_category || '').toLowerCase();
    return vNo.includes(q) || party.includes(q) || source.includes(q) || category.includes(q);
  });

  return (
    <div className="crud-container" style={{ paddingBottom: '80px' }}>
      {/* Header Banner */}
      <div className="crud-header-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff' }}>
        <div className="crud-header-left">
          <div className="crud-header-icon" style={{ background: '#0d9488', color: '#ffffff' }}>
            <History size={24} />
          </div>
          <div>
            <h2 className="crud-header-title" style={{ color: '#ffffff' }}>Payment Vouchers Audit History</h2>
            <p className="crud-header-sub" style={{ color: '#94a3b8' }}>
              Comprehensive audit log tracking all posted payment vouchers across Bank and Cash accounts.
            </p>
          </div>
        </div>
        <button onClick={loadData} className="btn btn-ghost" style={{ color: '#cbd5e1', borderColor: '#334155' }}>
          <RefreshCw size={16} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Toolbar Search */}
      <div className="crud-toolbar" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div className="crud-search-box" style={{ flex: '1', maxWidth: '400px' }}>
          <Search size={16} className="crud-search-icon" />
          <input
            type="text"
            placeholder="Search by Voucher No, Party Name, Bank/Cash source..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="crud-search-input"
          />
        </div>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
          Showing {filteredVouchers.length} of {vouchers.length} Payment Vouchers
        </span>
      </div>

      {/* History Table */}
      <div className="crud-table-card">
        <div className="crud-table-wrapper">
          <table className="crud-table">
            <thead>
              <tr>
                <th>Voucher No</th>
                <th>Date</th>
                <th>Payment Source</th>
                <th>Category</th>
                <th>Paid To (Party)</th>
                <th>Payment Method</th>
                <th style={{ textAlign: 'right' }}>Amount Paid</th>
                <th style={{ textAlign: 'right' }}>Balance After</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No payment vouchers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((v) => (
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
                        onClick={() => setSelectedVoucher(v)}
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
      {selectedVoucher && (
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
                    {selectedVoucher.voucher_no || selectedVoucher.id}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>
                    Date: {selectedVoucher.date}
                  </div>
                </div>
              </div>

              {/* Grid Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Paid From Source</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{selectedVoucher.source_name || selectedVoucher.payment_source}</div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>Method: {selectedVoucher.payment_method}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Paid To (Party)</div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#0d9488' }}>{selectedVoucher.party_name}</div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>Category: {selectedVoucher.party_category || 'Vendor'}</div>
                </div>
              </div>

              {/* Financial Totals Card */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#fafafa', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                  <span>Outstanding Balance Before Payment:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>
                    PKR {(parseFloat(selectedVoucher.outstanding_before) || 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: '#f0fdfa', borderBottom: '1px solid #ccfbf1', fontSize: '16px' }}>
                  <span style={{ fontWeight: '800', color: '#0d9488' }}>Amount Paid (Net Payment):</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '900', color: '#0d9488', fontSize: '18px' }}>
                    PKR {(parseFloat(selectedVoucher.amount) || 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#fafafa', fontSize: '13px' }}>
                  <span>Remaining Outstanding Balance:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#dc2626' }}>
                    PKR {(parseFloat(selectedVoucher.balance_after) || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Instrument & Remarks */}
              {selectedVoucher.remarks && (
                <div style={{ marginBottom: '24px', fontSize: '12.5px', color: '#475569', background: '#f1f5f9', padding: '10px 14px', borderRadius: '8px' }}>
                  <strong>Remarks:</strong> {selectedVoucher.remarks}
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
                onClick={() => setSelectedVoucher(null)}
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
    </div>
  );
}
