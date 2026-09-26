import React, { useState, useEffect, useMemo } from 'react';
import { Printer, Filter, Eye, RefreshCw, Landmark, BookOpen, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { dbService } from '../services/db';

export function ReportsPrinting({ defaultReport = 'pending_payables_overview' }) {
  const company = dbService.getCompanyInfo();
  const [reportType, setReportType] = useState(defaultReport);

  // Filters State
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterOwnership, setFilterOwnership] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [filterWorkshop, setFilterWorkshop] = useState('');
  const [filterPump, setFilterPump] = useState('');
  const [filterBank, setFilterBank] = useState('');

  useEffect(() => {
    if (defaultReport) setReportType(defaultReport);
  }, [defaultReport]);

  const isLedgerReport = (type) => {
    return ['cash_account_ledger', 'bank_ledger', 'vendor_ledger', 'workshop_ledger', 'fuel_pump_ledger', 'transporter_ledger', 'customer_ledger', 'universal_ledger'].includes(type);
  };

  // Master Data Lists for Select Dropdowns
  const vehiclesList = dbService.getTable('vehicles');
  const vendorsList = dbService.getTable('vendors');
  const workshopsList = dbService.getTable('workshops');
  const fuelPumpsList = dbService.getTable('fuel_pumps');
  const bankAccountsList = dbService.getTable('bank_accounts');
  const transportersList = dbService.getTable('transporters');
  const customersList = dbService.getTable('customers');

  // Raw Database Tables
  const trips = dbService.getTable('trips');
  const vehicles = dbService.getTable('vehicles');
  const drivers = dbService.getTable('drivers');
  const maintenance = dbService.getTable('maintenance');
  const fuel = dbService.getTable('fuel_entries');
  const banks = dbService.getTable('bank_accounts');
  const tyres = dbService.getTable('tyres_record');

  // Filter Reset
  const resetFilters = () => {
    setFromDate('');
    setToDate('');
    setFilterVehicle('');
    setFilterStatus('');
    setFilterCategory('');
    setFilterOwnership('');
    setFilterVendor('');
    setFilterWorkshop('');
    setFilterPump('');
    setFilterBank('');
  };

  // Dynamic Filtering Logic
  const filteredData = useMemo(() => {
    switch (reportType) {
      case 'trip_detailed_sheet':
        return dbService.getDetailedTripSheet(filterVehicle || '', filterStatus || '');

      case 'cash_account_ledger':
        return dbService.getCashAccountLedger(filterBank, fromDate, toDate);

      case 'bank_ledger':
        return dbService.getBankLedger(filterBank, fromDate, toDate);

      case 'vendor_ledger':
        return dbService.getPartyLedger('Vendors', filterVendor, fromDate, toDate);

      case 'workshop_ledger':
        return dbService.getPartyLedger('Workshops', filterWorkshop, fromDate, toDate);

      case 'universal_ledger':
        return dbService.getUniversalLedger(fromDate, toDate, filterCategory, filterVendor || filterPump || filterWorkshop);

      case 'daily_activity_report':
        return dbService.getDailyActivityReport(fromDate || new Date().toISOString().split('T')[0]);

      case 'fuel_pump_ledger':
      case 'fuel':
        return dbService.getPartyLedger('Fuel Pumps', filterPump || filterVendor, fromDate, toDate);

      case 'transporter_ledger':
        return dbService.getPartyLedger('Transporters', filterVendor, fromDate, toDate);

      case 'customer_ledger':
        return dbService.getPartyLedger('Customers', filterVendor, fromDate, toDate);

      case 'pending_payables_overview': {
        const payables = dbService.getPendingPayables();
        return payables.filter(p => {
          if (fromDate && p.date < fromDate) return false;
          if (toDate && p.date > toDate) return false;
          if (filterVendor && !p.party_name.toLowerCase().includes(filterVendor.toLowerCase())) return false;
          if (filterCategory && p.party_type !== filterCategory) return false;
          return true;
        });
      }

      case 'trip_payment_status':
      case 'trips':
        return trips.filter(t => {
          if (fromDate && t.loading_date < fromDate) return false;
          if (toDate && t.loading_date > toDate) return false;
          if (filterVehicle && t.vehicle !== filterVehicle) return false;
          if (filterStatus && (t.payment_status || 'Pending') !== filterStatus) return false;
          if (filterVendor && t.vendor !== filterVendor) return false;
          return true;
        });

      case 'vehicles':
        return vehicles.filter(v => {
          if (filterVehicle && v.number !== filterVehicle) return false;
          if (filterOwnership && v.ownership !== filterOwnership) return false;
          if (filterCategory && v.category !== filterCategory) return false;
          if (filterStatus && v.status !== filterStatus) return false;
          return true;
        });

      case 'drivers':
        return drivers.filter(d => {
          if (filterStatus && d.status !== filterStatus) return false;
          if (filterVehicle && d.assigned_vehicle !== filterVehicle) return false;
          return true;
        });

      case 'maintenance':
        return maintenance.filter(m => {
          if (fromDate && m.date < fromDate) return false;
          if (toDate && m.date > toDate) return false;
          if (filterVehicle && m.vehicle !== filterVehicle) return false;
          if (filterCategory && m.category !== filterCategory) return false;
          if (filterStatus && m.status !== filterStatus) return false;
          return true;
        });

      case 'fuel_trip_summary':
        return dbService.getTripVehicleFuelSummary(filterVehicle, '');

      case 'bank':
        return banks.filter(b => {
          if (filterBank && b.bank_name !== filterBank) return false;
          return true;
        });

      case 'tyre':
        return tyres.filter(t => {
          if (filterVehicle && t.vehicle !== filterVehicle) return false;
          if (filterStatus && t.status !== filterStatus) return false;
          return true;
        });

      default:
        return trips;
    }
  }, [reportType, fromDate, toDate, filterVehicle, filterStatus, filterCategory, filterOwnership, filterVendor, filterWorkshop, filterPump, filterBank, trips, vehicles, drivers, maintenance, fuel, banks, tyres]);

  // Open PDF Print Report in New Tab Window
  const handleOpenPdfNewTab = () => {
    const reportTitle = REPORT_OPTIONS.find(o => o.id === reportType)?.label || 'Executive General Ledger';
    const reportWin = window.open('', '_blank');
    if (!reportWin) {
      alert('Pop-up blocked! Please allow pop-ups to open PDF report in new tab.');
      return;
    }

    const appliedFiltersText = [
      fromDate && `From: ${fromDate}`,
      toDate && `To: ${toDate}`,
      filterVehicle && `Vehicle: ${filterVehicle}`,
      filterVendor && `Vendor/Party: ${filterVendor}`,
      filterWorkshop && `Workshop: ${filterWorkshop}`,
      filterPump && `Fuel Pump: ${filterPump}`,
      filterBank && `Bank Account: ${filterBank}`
    ].filter(Boolean).join(' | ') || 'All Transactions (No Date Filters)';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${company.name} - ${reportTitle}</title>
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Nunito', sans-serif; background: #fff; color: #0f172a; padding: 32px; font-size: 12px; line-height: 1.5; }
          .letterhead { text-align: center; border-bottom: 3px double #0d9488; padding-bottom: 16px; margin-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: 900; text-transform: uppercase; color: #0f172a; letter-spacing: -0.5px; }
          .system-name { font-size: 14px; font-weight: 800; color: #0d9488; margin-top: 2px; }
          .company-info { font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 600; }
          .report-meta { margin-top: 10px; background: #f0fdfa; border: 1px solid #ccfbf1; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 700; color: #0f766e; display: flex; justify-content: space-between; }
          .filter-bar { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; }
          th { background: #0f172a; color: #ffffff; text-align: left; padding: 8px 10px; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; border: 1px solid #0f172a; }
          td { padding: 8px 10px; border: 1px solid #cbd5e1; color: #1e293b; font-weight: 600; }
          tr:nth-child(even) { background: #f8fafc; }
          .amount { text-align: right; font-weight: 800; font-family: monospace; }
          .summary-card { display: flex; gap: 16px; margin-bottom: 20px; }
          .stat-box { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; text-align: center; }
          .stat-box-val { font-size: 18px; font-weight: 900; color: #0d9488; }
          .stat-box-lbl { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-top: 2px; }
          .signatures { margin-top: 48px; display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #475569; }
          .sig-line { border-top: 1px solid #94a3b8; width: 180px; text-align: center; padding-top: 4px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="letterhead">
          <div class="company-name">${company.name}</div>
          <div class="system-name">${company.system_name}</div>
          <div class="company-info">${company.address} | Contact: ${company.contact} | Email: ${company.email}</div>
          <div class="report-meta">
            <span>GENERAL LEDGER: ${reportTitle.toUpperCase()}</span>
            <span>Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        <div class="filter-bar">
          <strong>Applied Filter Parameters:</strong> ${appliedFiltersText}
        </div>

        ${renderTableHTML(reportType, filteredData)}

        <div class="signatures">
          <div class="sig-line">Prepared By (Accounts Officer)</div>
          <div class="sig-line">Verified By (Auditor)</div>
          <div class="sig-line">Approved By (Managing Director)</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          }
        </script>
      </body>
      </html>
    `;

    reportWin.document.write(htmlContent);
    reportWin.document.close();
  };

  const REPORT_OPTIONS = [
    { id: 'trip_detailed_sheet', label: 'Detailed Trip Sheet & Financial Report' },
    { id: 'cash_account_ledger', label: 'Cash Account General Ledger (Bank System Style)' },
    { id: 'daily_activity_report', label: 'Daily Activity Report (Executive Dashboard)' },
    { id: 'universal_ledger', label: 'Universal General Ledger (All Ledgers Combined)' },
    { id: 'pending_payables_overview', label: 'Pending Payment Report (All Payables)' },
    { id: 'fuel_trip_summary', label: 'Fuel Summary Report (Opening & Added Fuel by Trip & Vehicle)' },
    { id: 'bank_ledger', label: 'Bank & Cash General Ledger' },
    { id: 'vendor_ledger', label: 'Vendor General Ledger' },
    { id: 'workshop_ledger', label: 'Workshop General Ledger' },
    { id: 'fuel_pump_ledger', label: 'Fuel Pump General Ledger' },
    { id: 'transporter_ledger', label: 'Transporter Freight Ledger' },
    { id: 'customer_ledger', label: 'Customer Receivables Ledger' },
    { id: 'trip_payment_status', label: 'Trip Payment Status Report' },
    { id: 'trips', label: 'Trip Freight Report' },
    { id: 'vehicles', label: 'Vehicle Master Report' },
    { id: 'drivers', label: 'Driver Master Report' },
    { id: 'maintenance', label: 'Maintenance Expense Report' },
    { id: 'fuel', label: 'Fuel Ledger (Fuel Pump Accounts)' },
    { id: 'tyre', label: 'Tyre Inventory Report' },
  ];

  const countDisplay = isLedgerReport(reportType)
    ? (filteredData?.rows?.length || 0)
    : (Array.isArray(filteredData) ? filteredData.length : 0);

  return (
    <div className="crud-container">
      {/* Top Header Card */}
      <div className="crud-header-card">
        <div className="crud-header-left">
          <div className="crud-header-icon">
            <Printer size={24} />
          </div>
          <div>
            <h2 className="crud-header-title">Double-Entry Financial Ledgers & Reports</h2>
            <p className="crud-header-sub">Complete double-entry general ledger tracking with Date, Remarks, Dr, Cr, and running Balance for Banks, Vendors, Workshops, Fuel Pumps, and Transporters.</p>
          </div>
        </div>

        <button onClick={handleOpenPdfNewTab} className="btn btn-teal" style={{ height: '42px' }}>
          <Printer size={16} />
          <span>Print / Save PDF Report</span>
        </button>
      </div>

      {/* Filter Control Bar */}
      <div className="crud-table-card" style={{ padding: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} style={{ color: '#0d9488' }} /> Select Financial Ledger & Filters
        </div>

        <div className="crud-form-row" style={{ flexWrap: 'wrap', gap: '12px' }}>
          
          <div className="crud-form-field" style={{ flex: '1 1 260px' }}>
            <label className="crud-form-label">Report / Ledger Type</label>
            <select
              value={reportType}
              onChange={e => { setReportType(e.target.value); resetFilters(); }}
              className="crud-form-select"
              style={{ fontWeight: '800', color: '#0d9488' }}
            >
              {REPORT_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="crud-form-field" style={{ flex: '1 1 140px' }}>
            <label className="crud-form-label">From Date</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="crud-form-input" />
          </div>

          <div className="crud-form-field" style={{ flex: '1 1 140px' }}>
            <label className="crud-form-label">To Date</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="crud-form-input" />
          </div>

          {['vendor_ledger', 'trips', 'trip_payment_status', 'pending_payables_overview'].includes(reportType) && (
            <div className="crud-form-field" style={{ flex: '1 1 160px' }}>
              <label className="crud-form-label">Vendor Name</label>
              <select value={filterVendor} onChange={e => setFilterVendor(e.target.value)} className="crud-form-select">
                <option value="">All Vendors</option>
                {vendorsList.map(v => (
                  <option key={v.id} value={v.business_name || v.name}>{v.business_name || v.name}</option>
                ))}
              </select>
            </div>
          )}

          {['workshop_ledger'].includes(reportType) && (
            <div className="crud-form-field" style={{ flex: '1 1 160px' }}>
              <label className="crud-form-label">Workshop</label>
              <select value={filterWorkshop} onChange={e => setFilterWorkshop(e.target.value)} className="crud-form-select">
                <option value="">All Workshops</option>
                {workshopsList.map(w => (
                  <option key={w.id} value={w.name || w.business_name}>{w.name || w.business_name}</option>
                ))}
              </select>
            </div>
          )}

          {['fuel_pump_ledger', 'fuel'].includes(reportType) && (
            <div className="crud-form-field" style={{ flex: '1 1 160px' }}>
              <label className="crud-form-label">Fuel Pump Station</label>
              <select value={filterPump} onChange={e => setFilterPump(e.target.value)} className="crud-form-select">
                <option value="">All Fuel Pumps</option>
                {fuelPumpsList.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {['transporter_ledger'].includes(reportType) && (
            <div className="crud-form-field" style={{ flex: '1 1 160px' }}>
              <label className="crud-form-label">Transporter</label>
              <select value={filterVendor} onChange={e => setFilterVendor(e.target.value)} className="crud-form-select">
                <option value="">All Transporters</option>
                {transportersList.map(t => (
                  <option key={t.id} value={t.business_name}>{t.business_name}</option>
                ))}
              </select>
            </div>
          )}

          {['customer_ledger'].includes(reportType) && (
            <div className="crud-form-field" style={{ flex: '1 1 160px' }}>
              <label className="crud-form-label">Customer</label>
              <select value={filterVendor} onChange={e => setFilterVendor(e.target.value)} className="crud-form-select">
                <option value="">All Customers</option>
                {customersList.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {['cash_account_ledger', 'bank_ledger', 'bank'].includes(reportType) && (
            <div className="crud-form-field" style={{ flex: '1 1 160px' }}>
              <label className="crud-form-label">
                {reportType === 'cash_account_ledger' ? 'Cash Account / Recipient' : 'Bank / Cash Account'}
              </label>
              <select value={filterBank} onChange={e => setFilterBank(e.target.value)} className="crud-form-select">
                <option value="">{reportType === 'cash_account_ledger' ? 'All Cash Accounts / Heads' : 'All Bank Accounts'}</option>
                {reportType === 'cash_account_ledger'
                  ? ['Main Petty Cash', 'Driver Advances', 'Office Expenses', 'Cash Top-Up', 'Vehicle Expenses'].map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))
                  : bankAccountsList.map(b => (
                      <option key={b.id} value={b.bank_name}>{b.bank_name}</option>
                    ))
                }
              </select>
            </div>
          )}

          {['trip_detailed_sheet', 'trips', 'trip_payment_status', 'maintenance', 'vehicles'].includes(reportType) && (
            <div className="crud-form-field" style={{ flex: '1 1 150px' }}>
              <label className="crud-form-label">Vehicle</label>
              <select value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)} className="crud-form-select">
                <option value="">All Vehicles</option>
                {vehiclesList.map(v => (
                  <option key={v.code || v.id} value={v.number}>{v.number}</option>
                ))}
              </select>
            </div>
          )}

          {['trip_detailed_sheet'].includes(reportType) && (
            <div className="crud-form-field" style={{ flex: '1 1 200px' }}>
              <label className="crud-form-label">Select Specific Trip / Voucher</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="crud-form-select" style={{ fontWeight: '700', color: '#1e293b' }}>
                <option value="">Latest Trip Overall</option>
                {trips
                  .filter(t => !filterVehicle || String(t.vehicle || t.vehicle_no || '').toLowerCase().includes(filterVehicle.toLowerCase()))
                  .map(t => (
                    <option key={t.id || t.trip_id} value={t.id || t.trip_id}>
                      Trip #{t.id || t.trip_id} - {t.vehicle || 'Vehicle'} ({t.source || 'Src'} ➔ {t.destination || 'Dest'})
                    </option>
                  ))
                }
              </select>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-end', flex: '0 0 auto' }}>
            <button onClick={resetFilters} className="btn btn-ghost" style={{ height: '40px' }}>
              <RefreshCw size={14} /> Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Live On-Screen Report Preview Table */}
      <div className="crud-table-card">
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
            Ledger View: {REPORT_OPTIONS.find(o => o.id === reportType)?.label}
          </div>
          <span className="badge badge-teal">{countDisplay} Row(s)</span>
        </div>

        <div className="crud-table-wrapper" style={{ padding: '16px' }}>
          {renderPreviewTable(reportType, filteredData)}
        </div>
      </div>
    </div>
  );
}

function isLedgerReport(type) {
  return ['cash_account_ledger', 'bank_ledger', 'vendor_ledger', 'workshop_ledger', 'fuel_pump_ledger', 'transporter_ledger', 'customer_ledger', 'universal_ledger'].includes(type);
}

// Render Preview Table
function renderPreviewTable(type, data) {
  // A detailed trip sheet represents one trip, unlike the list reports below.
  // With a new database there may not be a trip to display yet; render a clear
  // empty state instead of allowing the generic table renderer to access null.
  if (type === 'trip_detailed_sheet' && !data) {
    return (
      <div style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b' }}>
        <FileText size={32} style={{ marginBottom: '10px', color: '#94a3b8' }} />
        <div style={{ fontWeight: '800', color: '#334155', marginBottom: '4px' }}>No trip is available for this report.</div>
        <div style={{ fontSize: '13px' }}>Create a trip first, or select a vehicle and trip voucher from the filters.</div>
      </div>
    );
  }

  if (type === 'universal_ledger') {
    const rows = data?.rows || [];
    return (
      <div className="space-y-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '14px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Ledger Category:</span>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginLeft: '8px' }}>Universal General Ledger (All Accounts)</span>
          </div>
          <div style={{ display: 'flex', gap: '24px', fontSize: '13px', fontFamily: 'monospace' }}>
            <div><span style={{ color: '#64748b' }}>Total Dr:</span> <strong style={{ color: '#2563eb' }}>PKR {(data?.totalDr || 0).toLocaleString()}</strong></div>
            <div><span style={{ color: '#64748b' }}>Total Cr:</span> <strong style={{ color: '#dc2626' }}>PKR {(data?.totalCr || 0).toLocaleString()}</strong></div>
          </div>
        </div>

        <table className="crud-table">
          <thead>
            <tr>
              <th style={{ width: '110px' }}>Date</th>
              <th style={{ width: '120px' }}>Ref / Vch No</th>
              <th style={{ width: '120px' }}>Category</th>
              <th style={{ width: '160px' }}>Party / Account</th>
              <th>Description / Remarks</th>
              <th style={{ textAlign: 'right', width: '140px' }}>Debit (Dr) (PKR)</th>
              <th style={{ textAlign: 'right', width: '140px' }}>Credit (Cr) (PKR)</th>
              <th style={{ textAlign: 'right', width: '160px' }}>Balance (PKR)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ fontFamily: 'monospace' }}>{r.date}</td>
                <td className="crud-td-code">{r.ref || '-'}</td>
                <td><span className="badge badge-blue">{r.category}</span></td>
                <td><strong>{r.party}</strong></td>
                <td style={{ fontSize: '12px' }}>{r.description}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.dr > 0 ? '#2563eb' : '#94a3b8', fontWeight: r.dr > 0 ? '700' : 'normal' }}>
                  {r.dr > 0 ? `PKR ${r.dr.toLocaleString()}` : '-'}
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.cr > 0 ? '#dc2626' : '#94a3b8', fontWeight: r.cr > 0 ? '700' : 'normal' }}>
                  {r.cr > 0 ? `PKR ${r.cr.toLocaleString()}` : '-'}
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>
                  PKR {(r.balance || 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (isLedgerReport(type)) {
    const rows = data?.rows || [];
    return (
      <div className="space-y-4">
        {/* Ledger Summary Cards Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '14px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Account / Party Ledger:</span>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginLeft: '8px' }}>{data?.accountName || data?.partyName || 'All Entities'}</span>
          </div>
          <div style={{ display: 'flex', gap: '24px', fontSize: '13px', fontFamily: 'monospace' }}>
            <div><span style={{ color: '#64748b' }}>Opening:</span> <strong style={{ color: '#0f172a' }}>PKR {(data?.openingBalance || 0).toLocaleString()}</strong></div>
            <div><span style={{ color: '#64748b' }}>Total Dr:</span> <strong style={{ color: '#2563eb' }}>PKR {(data?.totalDr || 0).toLocaleString()}</strong></div>
            <div><span style={{ color: '#64748b' }}>Total Cr:</span> <strong style={{ color: '#dc2626' }}>PKR {(data?.totalCr || 0).toLocaleString()}</strong></div>
            <div><span style={{ color: '#64748b' }}>Closing Bal:</span> <strong style={{ color: '#0d9488', fontWeight: '900' }}>PKR {(data?.closingBalance || 0).toLocaleString()}</strong></div>
          </div>
        </div>

        {/* Double Entry Rows Table */}
        <table className="crud-table">
          <thead>
            <tr>
              <th style={{ width: '110px' }}>Date</th>
              <th style={{ width: '120px' }}>Ref / Vch No</th>
              <th>Description / Remarks</th>
              <th style={{ textAlign: 'right', width: '140px' }}>Debit (Dr) (PKR)</th>
              <th style={{ textAlign: 'right', width: '140px' }}>Credit (Cr) (PKR)</th>
              <th style={{ textAlign: 'right', width: '160px' }}>Balance (PKR)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ background: r.isOpening ? '#f1f5f9' : 'transparent', fontWeight: r.isOpening ? '700' : 'normal' }}>
                <td style={{ fontFamily: 'monospace' }}>{r.date}</td>
                <td className="crud-td-code">{r.ref || '-'}</td>
                <td style={{ fontSize: '12px' }}>{r.description}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.dr > 0 ? '#2563eb' : '#94a3b8', fontWeight: r.dr > 0 ? '700' : 'normal' }}>
                  {r.dr > 0 ? `PKR ${r.dr.toLocaleString()}` : '-'}
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: r.cr > 0 ? '#dc2626' : '#94a3b8', fontWeight: r.cr > 0 ? '700' : 'normal' }}>
                  {r.cr > 0 ? `PKR ${r.cr.toLocaleString()}` : '-'}
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: '800', color: r.balance > 0 ? '#0d9488' : '#166534' }}>
                  PKR {(r.balance || 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === 'trip_detailed_sheet' && data) {
    const { vehicleNo, driverName, dates, route, diesel, summary, loading, advancesList, expensesBreakdown, journalExpenses } = data;

    return (
      <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', color: '#0f172a', fontFamily: 'sans-serif' }}>
        {/* Header Vehicle Banner */}
        <div style={{ textAlign: 'center', background: '#fef3c7', border: '2px solid #f59e0b', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#78350f', letterSpacing: '1px' }}>
            VEHICLE TRIP SHEET: {vehicleNo}
          </h2>
        </div>

        {/* Top 4 Panel Grid (Matching Urdu Excel Layout in English) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          
          {/* Panel 1: Expense Journal (Top Left) */}
          <div style={{ border: '1px solid #94a3b8', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ background: '#cbd5e1', padding: '8px', fontWeight: '800', textAlign: 'center', fontSize: '13px', textTransform: 'uppercase' }}>
              Daily Sub-Expenses / Journal
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>Sr</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'left' }}>Description</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {journalExpenses.filter(j => j.amount > 0).length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ border: '1px solid #e2e8f0', padding: '12px', textAlign: 'center', color: '#94a3b8' }}>
                      No optional sub-expenses entered.
                    </td>
                  </tr>
                ) : (
                  journalExpenses.filter(j => j.amount > 0).map((j, idx) => (
                    <tr key={j.sr}>
                      <td style={{ border: '1px solid #e2e8f0', padding: '4px', textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '4px' }}>{j.title}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '4px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '700', color: '#1e293b' }}>
                        {j.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
                <tr style={{ background: '#fef2f2', fontWeight: '800' }}>
                  <td colSpan="2" style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'right' }}>Sub-Total Expenses:</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'right', fontFamily: 'monospace', color: '#dc2626' }}>
                    PKR {expensesBreakdown.totalSubExpenses.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Panel 2: Total Expenses Breakdown (Top Center) */}
          <div style={{ border: '1px solid #94a3b8', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ background: '#cbd5e1', padding: '8px', fontWeight: '800', textAlign: 'center', fontSize: '13px', textTransform: 'uppercase' }}>
              Total Trip Expenses
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <tbody>
                {[
                  { label: 'Food & Allowance', amt: expensesBreakdown.foodExpense },
                  { label: 'Toll Tax', amt: expensesBreakdown.tollTax },
                  { label: 'Cash Diesel Bought', amt: expensesBreakdown.cashFuelAmt, color: '#f59e0b' },
                  { label: 'Workshop Repair', amt: expensesBreakdown.workshopRepair },
                  { label: 'Loading Charge', amt: expensesBreakdown.loadingCharge },
                  { label: 'Weighbridge / Kanda Fee', amt: expensesBreakdown.kandaScale },
                  { label: 'Munshiana / Misc', amt: expensesBreakdown.munshiana },
                  { label: 'Daily Sub-Expenses Sum', amt: expensesBreakdown.totalSubExpenses, color: '#2563eb' }
                ].filter(item => item.amt > 0).map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #e2e8f0', padding: '6px', fontWeight: '600' }}>{item.label}</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '6px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '700', color: item.color || '#1e293b' }}>
                      {item.amt.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {expensesBreakdown.totalExpensesExclDiesel === 0 && (
                  <tr>
                    <td colSpan="2" style={{ border: '1px solid #e2e8f0', padding: '12px', textAlign: 'center', color: '#94a3b8' }}>
                      No trip operating expenses recorded.
                    </td>
                  </tr>
                )}
                <tr style={{ background: '#fef2f2', fontWeight: '800' }}>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>Total Operating Expenses:</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right', fontFamily: 'monospace', color: '#dc2626', fontSize: '13px' }}>
                    PKR {expensesBreakdown.totalExpensesExclDiesel.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Panel 3: Financial Summary & Driver Balance */}
          <div style={{ border: '1px solid #94a3b8', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ background: '#1e293b', color: '#ffffff', padding: '8px', fontWeight: '800', textAlign: 'center', fontSize: '13px', textTransform: 'uppercase' }}>
              Trip Financial Summary
            </div>
            <div style={{ padding: '12px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0', background: '#dcfce7', borderRadius: '4px', paddingLeft: '8px', paddingRight: '8px' }}>
                <span style={{ fontWeight: '800', color: '#166534' }}>Advance Received:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '900', color: '#15803d', fontSize: '14px' }}>PKR {summary.advanceReceived.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0', marginTop: '6px' }}>
                <span style={{ fontWeight: '700', color: '#475569' }}>Total Trip Expenses:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#dc2626' }}>PKR {summary.totalExpenses.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9', marginTop: '6px', paddingLeft: '8px', paddingRight: '8px' }}>
                <span style={{ fontWeight: '800' }}>Current Trip Net Balance:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '900', color: summary.currentTripBalance >= 0 ? '#16a34a' : '#dc2626' }}>
                  PKR ({Math.abs(summary.currentTripBalance).toLocaleString()})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0', marginTop: '6px' }}>
                <span style={{ fontWeight: '700', color: '#475569' }}>Previous Balance:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#dc2626' }}>PKR ({Math.abs(summary.previousBalance).toLocaleString()})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 8px', background: '#0f172a', color: '#ffffff', borderRadius: '6px', marginTop: '12px' }}>
                <span style={{ fontWeight: '900', fontSize: '13px' }}>FINAL DUE / BALANCE:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '900', fontSize: '15px', color: '#f87171' }}>
                  PKR ({Math.abs(summary.finalBalanceDue).toLocaleString()})
                </span>
              </div>
            </div>

            {/* Vehicle & Driver Specs */}
            <div style={{ borderTop: '1px solid #cbd5e1', padding: '10px', background: '#e0f2fe', fontSize: '11px' }}>
              <div><strong>Driver:</strong> <span style={{ color: '#0369a1', fontWeight: 'bold' }}>{driverName}</span></div>
              <div><strong>Loading Plant:</strong> {loading.loadingPlant} (<strong>{loading.loadedWeight} T</strong>)</div>
              <div><strong>Unloading Plant:</strong> {loading.unloadingPlant} (<strong>{loading.unloadedWeight} T</strong>)</div>
              <div style={{ marginTop: '4px', background: '#ffffff', padding: '4px 6px', borderRadius: '4px', border: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between' }}>
                <span><strong>Weight Diff:</strong> <span style={{ color: loading.weightDifference < 0 ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>{loading.weightDifference} T</span></span>
                <span><strong>Load/Unload PSI:</strong> {loading.loadPressure} / {loading.unloadPressure}</span>
              </div>
            </div>
          </div>

          {/* Panel 4: Fuel Details & Travel Metrics (Top Right) */}
          <div style={{ border: '1px solid #94a3b8', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ background: '#0284c7', color: '#ffffff', padding: '8px', fontWeight: '800', textAlign: 'center', fontSize: '13px', textTransform: 'uppercase' }}>
              Diesel Details & Travel
            </div>

            <div style={{ padding: '6px 8px', background: '#f0f9ff', fontSize: '11px', borderBottom: '1px solid #e0f2fe', fontWeight: '600', color: '#0369a1' }}>
              Fuel Pump(s): {diesel.fuelPumps}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'left' }}>Type</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>Liters</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #e2e8f0', padding: '4px', fontWeight: '600' }}>Opening Diesel (Pre-filled Fuel)</td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '4px', textAlign: 'center' }}>{diesel.openingQty}</td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '4px', textAlign: 'right', fontFamily: 'monospace' }}>{diesel.openingAmt.toLocaleString()}</td>
                </tr>
                <tr style={{ background: '#e0f2fe' }}>
                  <td style={{ border: '1px solid #e2e8f0', padding: '4px', fontWeight: '600' }}>Credit Diesel (Purchased in Trip)</td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '4px', textAlign: 'center', fontWeight: 'bold' }}>{diesel.creditQty}</td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '4px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#0369a1' }}>{diesel.creditAmt.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #e2e8f0', padding: '4px', fontWeight: '600' }}>Cash Diesel</td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '4px', textAlign: 'center' }}>{diesel.cashQty}</td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '4px', textAlign: 'right', fontFamily: 'monospace' }}>{diesel.cashAmt.toLocaleString()}</td>
                </tr>
                <tr style={{ background: '#f1f5f9', fontWeight: '800' }}>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>Total Diesel Available:</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>{diesel.totalQty}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'right', fontFamily: 'monospace' }}>{diesel.totalAmt.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #e2e8f0', padding: '4px', fontWeight: '600' }}>Remaining Fuel (Carry-Forward):</td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '4px', textAlign: 'center' }}>{diesel.remainingQty}</td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '4px', textAlign: 'right', fontFamily: 'monospace' }}>{diesel.remainingAmt.toLocaleString()}</td>
                </tr>
                <tr style={{ background: '#fef3c7', fontWeight: '800' }}>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px', color: '#92400e' }}>Consumed Diesel (Charged to Trip):</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center', color: '#92400e' }}>{diesel.consumedQty}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'right', fontFamily: 'monospace', color: '#92400e' }}>{diesel.consumedAmt.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            {/* Travel Metrics Card */}
            <div style={{ padding: '10px', background: '#f8fafc', borderTop: '1px solid #cbd5e1' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>Route & Travel Summary</div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>{route.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px' }}>
                <span><strong>Distance:</strong> {route.distanceKm} KM</span>
                <span><strong>Duration:</strong> {dates.totalDays} Days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px' }}>
                <span><strong>Dates:</strong> {dates.startDate} to {dates.endDate}</span>
              </div>
              <div style={{ background: '#dc2626', color: '#ffffff', padding: '6px', borderRadius: '4px', marginTop: '8px', textAlign: 'center', fontWeight: '900', fontSize: '13px' }}>
                Diesel Average: {route.averageKml} KM / L
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Total Cost Banner */}
        <div style={{ background: '#0f172a', color: '#ffffff', padding: '16px 20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '900', fontSize: '15px' }}>
          <div>
            <div>WHOLE TOTAL TRIP COST (OPERATING + DAILY SUB-EXPENSES + DIESEL)</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginTop: '2px' }}>
              Operating & Sub-Expenses: PKR {expensesBreakdown.totalExpensesExclDiesel.toLocaleString()} | Diesel Cost: PKR {(expensesBreakdown.totalTripCostWithDiesel - expensesBreakdown.totalExpensesExclDiesel).toLocaleString()}
            </div>
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: '22px', color: '#38bdf8' }}>PKR {expensesBreakdown.totalTripCostWithDiesel.toLocaleString()}</span>
        </div>
      </div>
    );
  }

  if (type === 'daily_activity_report' && data) {
    const { vehicleLocations, vehiclesLoadedToday, vehiclesDecantedToday, advances, cashFueling, pumpSummaries, workshopSummary, payablesTotal, oilDetails } = data;
    return (
      <div style={{ padding: '16px', background: '#fff', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
        {/* Title Header */}
        <div style={{ textAlign: 'center', marginBottom: '16px', position: 'relative' }}>
          <div style={{ background: '#e2e8f0', display: 'inline-block', padding: '6px 24px', fontWeight: 'bold', fontSize: '18px', borderRadius: '4px' }}>
            Daily Activity Report
          </div>
          <div style={{ position: 'absolute', right: 0, top: 0, fontSize: '11px', textAlign: 'right' }}>
            <div>Date: <strong>{data.date}</strong></div>
            <div>Time: <strong>{data.time}</strong></div>
            <div style={{ background: '#fed7aa', padding: '2px 8px', borderRadius: '3px', marginTop: '2px' }}>Report # {data.reportNo}</div>
          </div>
        </div>

        {/* Top 4 Columns Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1.3fr', gap: '10px', marginBottom: '16px' }}>
          {/* Col 1: Vehicle Location 10:00 AM */}
          <div style={{ border: '1px solid #94a3b8' }}>
            <div style={{ background: '#f1f5f9', fontWeight: 'bold', padding: '4px', textAlign: 'center', borderBottom: '1px solid #94a3b8' }}>
              Vehicle Location 10:00 AM
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#e2e8f0' }}>
                  <th style={{ border: '1px solid #cbd5e1', padding: '2px 4px' }}>Number</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: '2px 4px' }}>Location</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: '2px 4px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicleLocations.slice(0, 10).map((v, i) => (
                  <tr key={i}>
                    <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px', fontWeight: '600' }}>{v.number}</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{v.location}</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{v.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Col 2: Vehicle Loaded & Decanted Today */}
          <div>
            <div style={{ border: '1px solid #94a3b8', marginBottom: '8px' }}>
              <div style={{ background: '#e2e8f0', fontWeight: 'bold', padding: '4px', textAlign: 'center', borderBottom: '1px solid #94a3b8' }}>
                Vehicle Loaded Today
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #cbd5e1', padding: '2px' }}>Number</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '2px' }}>Location</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '2px' }}>PSI</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiclesLoadedToday.length === 0 ? (
                    <tr><td colSpan="3" style={{ textAlign: 'center', color: '#94a3b8', padding: '6px' }}>- None -</td></tr>
                  ) : vehiclesLoadedToday.map((v, i) => (
                    <tr key={i}>
                      <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{v.number}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{v.location}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{v.psi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ border: '1px solid #94a3b8' }}>
              <div style={{ background: '#dcfce7', fontWeight: 'bold', padding: '4px', textAlign: 'center', borderBottom: '1px solid #94a3b8' }}>
                Vehicle Decanted Today
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #cbd5e1', padding: '2px' }}>Number</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '2px' }}>Location</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '2px' }}>PSI</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiclesDecantedToday.length === 0 ? (
                    <tr><td colSpan="3" style={{ textAlign: 'center', color: '#94a3b8', padding: '6px' }}>- None -</td></tr>
                  ) : vehiclesDecantedToday.map((v, i) => (
                    <tr key={i}>
                      <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{v.number}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{v.location}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{v.psi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Col 3: Advances From Plants */}
          <div style={{ border: '1px solid #94a3b8' }}>
            <div style={{ background: '#ea580c', color: '#fff', fontWeight: 'bold', padding: '4px', textAlign: 'center', borderBottom: '1px solid #94a3b8' }}>
              Advances From Plants / By Umair
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ border: '1px solid #cbd5e1', padding: '2px' }}>Vehicle</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: '2px' }}>Plant</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: '2px' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {advances.length === 0 ? (
                  <tr><td colSpan="3" style={{ textAlign: 'center', color: '#94a3b8', padding: '12px' }}>- No Advances -</td></tr>
                ) : advances.map((a, i) => (
                  <tr key={i}>
                    <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{a.vehicle}</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{a.plant}</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px', textAlign: 'right' }}>{a.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Col 4: Cash Fueling / Other Expenses */}
          <div style={{ border: '1px solid #94a3b8' }}>
            <div style={{ background: '#1d4ed8', color: '#fff', fontWeight: 'bold', padding: '4px', textAlign: 'center', borderBottom: '1px solid #94a3b8' }}>
              Cash Fueling / Other Expenses
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ border: '1px solid #cbd5e1', padding: '2px' }}>Vehicle</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: '2px' }}>Qty</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: '2px' }}>Amount</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: '2px' }}>Paid By</th>
                </tr>
              </thead>
              <tbody>
                {cashFueling.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '12px' }}>- None -</td></tr>
                ) : cashFueling.map((c, i) => (
                  <tr key={i}>
                    <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{c.vehicle}</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{c.qty}</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px', textAlign: 'right' }}>{c.amount ? c.amount.toLocaleString() : '-'}</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{c.paidBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom 2 Columns Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
          {/* Left Grid: Fuel Pump Ledgers & Workshop Details */}
          <div>
            {/* Fuel Pump Credit Summaries */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {pumpSummaries.map((p, i) => (
                <div key={i} style={{ border: '1px solid #16a34a' }}>
                  <div style={{ background: '#15803d', color: '#fff', fontWeight: 'bold', padding: '3px 6px', fontSize: '11px', textAlign: 'center' }}>
                    {p.pumpName}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                    <tbody>
                      <tr style={{ background: '#fef08a' }}>
                        <td style={{ padding: '2px 4px' }}>Opening Balance</td>
                        <td style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 'bold' }}>{p.openingCr.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '2px 4px', fontWeight: 'bold' }}>Closing Balance</td>
                        <td style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 'bold', background: '#bbf7d0' }}>{p.closingBalance.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {/* Workshop Details */}
            <div style={{ border: '1px solid #94a3b8' }}>
              <div style={{ background: '#e2e8f0', fontWeight: 'bold', padding: '4px 8px', fontSize: '11px' }}>WorkShop Details</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #cbd5e1', padding: '2px 4px' }}>Workshop</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '2px 4px', textAlign: 'right' }}>Amount Previous</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '2px 4px', textAlign: 'right' }}>Paid</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '2px 4px', textAlign: 'right' }}>Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {workshopSummary.map((w, idx) => (
                    <tr key={idx}>
                      <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{w.name}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px', textAlign: 'right' }}>{w.previousAmount.toLocaleString()}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px', textAlign: 'right' }}>{w.paid.toLocaleString()}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px', textAlign: 'right', color: '#dc2626', fontWeight: 'bold' }}>{w.remaining.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Grid: Payables Total & Mobil Oil details */}
          <div>
            {/* Payables Summary */}
            <div style={{ border: '1px solid #1e3a8a', marginBottom: '12px' }}>
              <div style={{ background: '#1e40af', color: '#fff', fontWeight: 'bold', padding: '4px 8px', fontSize: '11px', textAlign: 'center' }}>
                Payable Amounts Total
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <tbody>
                  <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                    <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Total Net Payables Outstanding</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'right', color: '#dc2626', background: '#bbf7d0', fontSize: '13px' }}>
                      PKR {payablesTotal.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobil Oil details */}
            <div style={{ border: '1px solid #94a3b8' }}>
              <div style={{ background: '#0284c7', color: '#fff', fontWeight: 'bold', padding: '4px 8px', fontSize: '11px', textAlign: 'center' }}>
                Mobil Oil details
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #cbd5e1', padding: '3px 6px' }}>Details</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '3px 6px', textAlign: 'right' }}>Qty (Liters)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px', background: '#38bdf8', color: '#fff', fontWeight: 'bold' }}>Opening Stock</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px', textAlign: 'right', fontWeight: 'bold' }}>{oilDetails.openingStock}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px' }}>Purchased Stock</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px', textAlign: 'right' }}>{oilDetails.purchasedStock}</td>
                  </tr>
                  <tr style={{ fontWeight: 'bold', background: '#f1f5f9' }}>
                    <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px' }}>Remaining Stock</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px', textAlign: 'right', color: '#0369a1' }}>{oilDetails.remainingStock}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'universal_ledger' && data?.rows) {
    return (
      <div>
        <div style={{ background: '#f8fafc', padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <div><strong>Ledger Category Filter:</strong> {filterCategory || 'All Categories Combined'}</div>
          <div>Total Dr: <strong style={{ color: '#16a34a' }}>PKR {data.totalDr.toLocaleString()}</strong> | Total Cr: <strong style={{ color: '#dc2626' }}>PKR {data.totalCr.toLocaleString()}</strong></div>
        </div>
        <table className="crud-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Ref No</th>
              <th>Category</th>
              <th>Party / Account</th>
              <th>Description</th>
              <th style={{ textAlign: 'right' }}>Debit (Dr)</th>
              <th style={{ textAlign: 'right' }}>Credit (Cr)</th>
              <th style={{ textAlign: 'right' }}>Running Balance</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, idx) => (
              <tr key={idx}>
                <td>{row.date}</td>
                <td className="crud-td-code">{row.ref}</td>
                <td><span className="badge badge-blue">{row.category}</span></td>
                <td><strong>{row.party}</strong></td>
                <td>{row.description}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#16a34a' }}>{row.dr ? `PKR ${row.dr.toLocaleString()}` : '-'}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#dc2626' }}>{row.cr ? `PKR ${row.cr.toLocaleString()}` : '-'}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>PKR {row.balance.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === 'fuel_trip_summary') {
    return (
      <table className="crud-table">
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Trip ID</th>
            <th style={{ textAlign: 'right' }}>Opening Fuel (1st Fill)</th>
            <th style={{ textAlign: 'right' }}>Added Fuel (Liters)</th>
            <th style={{ textAlign: 'right' }}>Total Fuel (Liters)</th>
            <th style={{ textAlign: 'right' }}>Total Fuel Expense</th>
            <th style={{ textAlign: 'center' }}>Fills Count</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx}>
              <td><strong>{item.vehicle}</strong></td>
              <td className="crud-td-code">{item.trip_id}</td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#0d9488', fontWeight: 'bold' }}>
                {item.opening_liters} L
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#2563eb' }}>
                +{item.added_liters} L
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: '800' }}>
                {item.total_liters} L
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>
                PKR {item.total_amount.toLocaleString()}
              </td>
              <td style={{ textAlign: 'center' }}>
                <span className="badge badge-teal">{item.entries_count} Refill{item.entries_count > 1 ? 's' : ''}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === 'pending_payables_overview') {
    return (
      <table className="crud-table">
        <thead>
          <tr>
            <th>Ref ID</th>
            <th>Party Type</th>
            <th>Party Name</th>
            <th>Description</th>
            <th style={{ textAlign: 'right' }}>Total Accrued Cost</th>
            <th style={{ textAlign: 'right' }}>Total Paid</th>
            <th style={{ textAlign: 'right' }}>Net Payable Balance</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map(p => (
            <tr key={p.id}>
              <td className="crud-td-code">{p.id}</td>
              <td><span className="badge badge-blue">{p.party_type}</span></td>
              <td><strong>{p.party_name}</strong></td>
              <td style={{ fontSize: '12px' }}>{p.description}</td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>PKR {p.total_amount.toLocaleString()}</td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#16a34a' }}>PKR {p.paid_amount.toLocaleString()}</td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#dc2626', fontWeight: '800' }}>
                PKR {p.remaining_amount.toLocaleString()}
              </td>
              <td><span className="badge badge-amber">{p.payment_status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === 'trip_payment_status') {
    return (
      <table className="crud-table">
        <thead>
          <tr>
            <th>Trip ID</th>
            <th>Loading Date</th>
            <th>Vehicle</th>
            <th>Customer</th>
            <th>Destination</th>
            <th style={{ textAlign: 'right' }}>Freight Amount</th>
            <th style={{ textAlign: 'right' }}>Other Expenses</th>
            <th style={{ textAlign: 'right' }}>Net Payable Amount</th>
            <th>Payment Status</th>
            <th>Trip Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map(t => (
            <tr key={t.id}>
              <td className="crud-td-code">{t.id}</td>
              <td>{t.loading_date}</td>
              <td><strong>{t.vehicle}</strong></td>
              <td>{t.customer || '-'}</td>
              <td>{t.destination || '-'}</td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#2563eb' }}>PKR {(t.amount || 0).toLocaleString()}</td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#dc2626' }}>PKR {(t.other_expenses || t.fine_amount || 0).toLocaleString()}</td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#059669' }}>
                PKR {(t.total_cost || 0).toLocaleString()}
              </td>
              <td>
                <span className={`badge ${t.payment_status === 'Completed' || t.payment_status === 'Paid' ? 'badge-green' : 'badge-amber'}`}>
                  {t.payment_status || 'Pending'}
                </span>
              </td>
              <td><span className="badge badge-teal">{t.status || 'Dispatched'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === 'trips') {
    return (
      <table className="crud-table">
        <thead>
          <tr>
            <th>Trip ID</th>
            <th>Date</th>
            <th>Vehicle</th>
            <th>Driver</th>
            <th>Source / Plant</th>
            <th>Destination</th>
            <th>Customer</th>
            <th style={{ textAlign: 'right' }}>Load Wt (Ton)</th>
            <th style={{ textAlign: 'right' }}>Unload Wt (Ton)</th>
            <th style={{ textAlign: 'right' }}>Diff (Short/Surplus)</th>
            <th style={{ textAlign: 'right' }}>Distance (KM)</th>
            <th style={{ textAlign: 'right' }}>Freight Rate</th>
            <th style={{ textAlign: 'right' }}>Freight Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map(t => (
            <tr key={t.id}>
              <td className="crud-td-code">{t.id}</td>
              <td>{t.loading_date}</td>
              <td><strong>{t.vehicle}</strong></td>
              <td>{t.driver || '-'}</td>
              <td>{t.source || t.plant || '-'}</td>
              <td>{t.destination || '-'}</td>
              <td>{t.customer || '-'}</td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{t.load_weight || 0}</td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{t.unload_weight || 0}</td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace', color: (t.difference || 0) < 0 ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>
                {t.difference || 0}
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{t.distance || '-'}</td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{t.freight_ton_rate ? `PKR ${t.freight_ton_rate}/Ton` : (t.freight_km_rate ? `PKR ${t.freight_km_rate}/KM` : 'Flat')}</td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#2563eb' }}>PKR {(t.amount || 0).toLocaleString()}</td>
              <td><span className="badge badge-teal">{t.status || 'Dispatched'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === 'vehicles') {
    return (
      <table className="crud-table">
        <thead>
          <tr>
            <th>Vehicle No</th>
            <th>Chassis No</th>
            <th>Engine No</th>
            <th>Model / Make</th>
            <th>Capacity (Tons)</th>
            <th>Ownership</th>
            <th>Category</th>
            <th>Transporter / Owner</th>
            <th>Status</th>
            <th>Current Location</th>
          </tr>
        </thead>
        <tbody>
          {data.map(v => (
            <tr key={v.id || v.number}>
              <td><strong>{v.number}</strong></td>
              <td className="crud-td-code">{v.chassis_no || '-'}</td>
              <td className="crud-td-code">{v.engine_no || '-'}</td>
              <td>{v.model || v.make || '-'}</td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{v.capacity || '-'}</td>
              <td><span className="badge badge-blue">{v.ownership || 'Company'}</span></td>
              <td>{v.category || 'Bowser'}</td>
              <td>{v.transporter || v.owner || 'Own Fleet'}</td>
              <td><span className={`badge ${v.status === 'Maintenance' ? 'badge-amber' : 'badge-green'}`}>{v.status || 'Active'}</span></td>
              <td>{v.location || 'Yard / Base'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === 'drivers') {
    return (
      <table className="crud-table">
        <thead>
          <tr>
            <th>Driver Code</th>
            <th>Full Name</th>
            <th>CNIC Number</th>
            <th>License Number</th>
            <th>License Issue Date</th>
            <th>License Expiry Date</th>
            <th>Mobile Phone</th>
            <th>Assigned Vehicle</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map(d => (
            <tr key={d.id}>
              <td className="crud-td-code">{d.id || d.code}</td>
              <td><strong>{d.name}</strong></td>
              <td style={{ fontFamily: 'monospace' }}>{d.cnic || '-'}</td>
              <td style={{ fontFamily: 'monospace' }}>{d.license_number || '-'}</td>
              <td>{d.license_issue_date || '-'}</td>
              <td>{d.license_expiry_date || '-'}</td>
              <td>{d.phone || d.mobile || '-'}</td>
              <td><strong>{d.assigned_vehicle || 'Unassigned'}</strong></td>
              <td><span className="badge badge-green">{d.status || 'Active'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === 'maintenance') {
    return (
      <table className="crud-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Ref / Job No</th>
            <th>Vehicle No</th>
            <th>Workshop</th>
            <th>Expense Category / Head</th>
            <th>Work Description / Repairs</th>
            <th>Meter Reading (KM)</th>
            <th style={{ textAlign: 'right' }}>Total Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map(m => (
            <tr key={m.id}>
              <td style={{ fontFamily: 'monospace' }}>{m.date}</td>
              <td className="crud-td-code">{m.id}</td>
              <td><strong>{m.vehicle}</strong></td>
              <td>{m.workshop || '-'}</td>
              <td><span className="badge badge-amber">{m.category || m.head || 'Repair'}</span></td>
              <td style={{ fontSize: '12px' }}>{m.description || m.remarks || '-'}</td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{m.meter_reading || '-'}</td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#dc2626' }}>
                PKR {(parseFloat(m.total_amount || m.amount || 0)).toLocaleString()}
              </td>
              <td><span className="badge badge-green">{m.status || 'Completed'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === 'tyre') {
    return (
      <table className="crud-table">
        <thead>
          <tr>
            <th>Serial Number</th>
            <th>Brand</th>
            <th>Size / Model</th>
            <th>Type</th>
            <th>Assigned Vehicle</th>
            <th>Position</th>
            <th style={{ textAlign: 'right' }}>Purchase Cost</th>
            <th>Purchase Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map(t => (
            <tr key={t.id || t.serial_no}>
              <td className="crud-td-code">{t.serial_no || t.id}</td>
              <td><strong>{t.brand}</strong></td>
              <td>{t.size || t.model || '-'}</td>
              <td>{t.type || 'New'}</td>
              <td><strong>{t.vehicle || 'In Stock'}</strong></td>
              <td>{t.position || '-'}</td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#2563eb' }}>
                {t.cost ? `PKR ${parseFloat(t.cost).toLocaleString()}` : '-'}
              </td>
              <td>{t.purchase_date || '-'}</td>
              <td><span className="badge badge-teal">{t.status || 'Mounted'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // Generic Fallback Table View
  return (
    <table className="crud-table">
      <thead>
        <tr>
          {Object.keys(data[0] || {}).slice(0, 12).map(k => <th key={k}>{k.replace(/_/g, ' ').toUpperCase()}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx}>
            {Object.keys(row).slice(0, 12).map((k, colIdx) => (
              <td key={colIdx}>
                {typeof row[k] === 'object' ? JSON.stringify(row[k]) : String(row[k] || '-')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// HTML Printer Generator
function renderTableHTML(type, data) {
  if (type === 'trip_detailed_sheet') {
    const { tripId, vehicleNo, driverName, dates, route, diesel, summary, loading, advancesList, expensesBreakdown, journalExpenses } = data || {};
    return `
      <div style="font-family: Arial, sans-serif; font-size: 11px;">
        <!-- Header Info Bar -->
        <div style="display: flex; justify-content: space-between; background: #0f172a; color: #ffffff; padding: 10px 14px; border-radius: 6px; margin-bottom: 12px; align-items: center;">
          <div>
            <div style="font-size: 16px; font-weight: bold; color: #38bdf8;">VOUCHER / TRIP NO: ${tripId || 'N/A'}</div>
            <div style="font-size: 11px; color: #94a3b8;">Vehicle: <strong>${vehicleNo || 'N/A'}</strong> | Driver: <strong>${driverName || 'N/A'}</strong></div>
          </div>
          <div style="text-align: right; font-size: 11px;">
            <div>Route: <strong>${route?.name || 'N/A'}</strong> (${route?.distanceKm || 0} KM)</div>
            <div>Dates: ${dates?.startDate || '-'} to ${dates?.endDate || '-'} (${dates?.totalDays || 0} Days)</div>
          </div>
        </div>

        <!-- 4-Panel Grid layout -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <!-- Panel 1: Daily Journal Sub Expenses -->
          <div style="border: 1px solid #94a3b8; border-radius: 6px; overflow: hidden;">
            <div style="background: #1e293b; color: white; padding: 6px; font-weight: bold; text-align: center; text-transform: uppercase;">1. Daily Sub-Expenses / Journal</div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; width: 30px;">#</th>
                  <th style="border: 1px solid #cbd5e1; padding: 4px; text-align: left;">Expense Description</th>
                  <th style="border: 1px solid #cbd5e1; padding: 4px; text-align: right; width: 90px;">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody>
                ${(journalExpenses || []).filter(item => (item.amount || 0) > 0).map((item, idx) => `
                  <tr>
                    <td style="border: 1px solid #e2e8f0; padding: 3px; text-align: center;">${idx + 1}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 3px;">${item.title}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 3px; text-align: right; font-family: monospace;">${(item.amount || 0).toLocaleString()}</td>
                  </tr>
                `).join('')}
                ${(journalExpenses || []).filter(item => (item.amount || 0) > 0).length === 0 ? `
                  <tr>
                    <td colspan="3" style="border: 1px solid #e2e8f0; padding: 8px; text-align: center; color: #94a3b8;">No sub-expenses entered</td>
                  </tr>
                ` : ''}
                <tr style="background: #fef2f2; font-weight: bold;">
                  <td colspan="2" style="border: 1px solid #cbd5e1; padding: 5px;">Total Sub-Expenses:</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: right; font-family: monospace; color: #dc2626;">PKR ${(expensesBreakdown?.totalSubExpenses || 0).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Panel 2: Summary of Operating Expenses */}
          <div style="border: 1px solid #94a3b8; border-radius: 6px; overflow: hidden;">
            <div style="background: #1e293b; color: white; padding: 6px; font-weight: bold; text-align: center; text-transform: uppercase;">2. Trip Operating Expenses</div>
            <table style="width: 100%; border-collapse: collapse;">
              <tbody>
                ${[
                  { label: 'Food & Allowance', amt: expensesBreakdown?.foodExpense },
                  { label: 'Toll Tax', amt: expensesBreakdown?.tollTax },
                  { label: 'Other Expenses (Misc/Fines)', amt: expensesBreakdown?.otherExpenses },
                  { label: 'Cash Diesel Bought', amt: expensesBreakdown?.cashFuelAmt, color: '#f59e0b' },
                  { label: 'Workshop Repair', amt: expensesBreakdown?.workshopRepair },
                  { label: 'Loading Charge', amt: expensesBreakdown?.loadingCharge },
                  { label: 'Weighbridge / Kanda Fee', amt: expensesBreakdown?.kandaScale },
                  { label: 'Munshiana / Misc', amt: expensesBreakdown?.munshiana }
                ].filter(item => (item.amt || 0) > 0).map(item => `
                  <tr>
                    <td style="border: 1px solid #e2e8f0; padding: 4px;">${item.label}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 4px; text-align: right; font-family: monospace; ${item.color ? `color: ${item.color};` : ''}">${(item.amt || 0).toLocaleString()}</td>
                  </tr>
                `).join('')}
                <tr style="background: #fef2f2; font-weight: bold;">
                  <td style="border: 1px solid #cbd5e1; padding: 6px;">Total Operating Expenses:</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: right; font-family: monospace; color: #dc2626;">PKR ${(expensesBreakdown?.totalExpensesExclDiesel || 0).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Panel 3: Financial Summary & Driver Balance -->
          <div style="border: 1px solid #94a3b8; border-radius: 6px; overflow: hidden;">
            <div style="background: #1e293b; color: white; padding: 6px; font-weight: bold; text-align: center; text-transform: uppercase;">3. Financial Settlement</div>
            <div style="padding: 10px; background: #f8fafc;">
              <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span>Advance Received:</span><strong style="color: #15803d;">PKR ${(summary?.advanceReceived || 0).toLocaleString()}</strong></div>
              <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span>Total Trip Expenses:</span><strong style="color: #dc2626;">PKR ${(summary?.totalExpenses || 0).toLocaleString()}</strong></div>
              <div style="display: flex; justify-content: space-between; padding: 4px 0; background: #f1f5f9;"><span>Trip Net Balance:</span><strong>PKR (${Math.abs(summary?.currentTripBalance || 0).toLocaleString()})</strong></div>
              <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span>Previous Balance:</span><strong>PKR (${Math.abs(summary?.previousBalance || 0).toLocaleString()})</strong></div>
              <div style="display: flex; justify-content: space-between; padding: 6px; background: #0f172a; color: white; border-radius: 4px; margin-top: 6px;">
                <strong>FINAL DUE / BALANCE:</strong><strong style="color: #f87171;">PKR (${Math.abs(summary?.finalBalanceDue || 0).toLocaleString()})</strong>
              </div>
            </div>
            <div style="border-top: 1px solid #cbd5e1; padding: 6px 10px; background: #e0f2fe; font-size: 10px;">
              <div>Driver: <strong>${driverName || 'N/A'}</strong></div>
              <div>Plant: ${loading?.loadingPlant || 'N/A'} (${loading?.loadedWeight || 0} T) -> ${loading?.unloadingPlant || 'N/A'} (${loading?.unloadedWeight || 0} T)</div>
              <div>Weight Diff: <strong style="color: ${(loading?.weightDifference || 0) < 0 ? '#dc2626' : '#16a34a'};">${loading?.weightDifference || 0} T</strong> | PSI: ${loading?.loadPressure || 0} / ${loading?.unloadPressure || 0}</div>
            </div>
          </div>

          <!-- Panel 4: Fuel Details & Travel Metrics -->
          <div style="border: 1px solid #94a3b8; border-radius: 6px; overflow: hidden;">
            <div style="background: #0284c7; color: white; padding: 6px; font-weight: bold; text-align: center; text-transform: uppercase;">4. Diesel & Fuel Pump Details</div>
            <div style="padding: 4px 6px; background: #f0f9ff; font-size: 10px; border-bottom: 1px solid #e0f2fe; font-weight: bold; color: #0369a1;">Pumps: ${diesel?.fuelPumps || 'N/A'}</div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="border: 1px solid #cbd5e1; padding: 3px; text-align: left;">Type</th>
                  <th style="border: 1px solid #cbd5e1; padding: 3px; text-align: center;">Liters</th>
                  <th style="border: 1px solid #cbd5e1; padding: 3px; text-align: right;">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style="border: 1px solid #e2e8f0; padding: 3px;">Opening Diesel (Pre-filled Fuel)</td><td style="border: 1px solid #e2e8f0; padding: 3px; text-align: center;">${diesel?.openingQty || 0}</td><td style="border: 1px solid #e2e8f0; padding: 3px; text-align: right; font-family: monospace;">${(diesel?.openingAmt || 0).toLocaleString()}</td></tr>
                <tr style="background: #e0f2fe; font-weight: bold;"><td style="border: 1px solid #e2e8f0; padding: 3px;">Credit Diesel (Purchased in Trip)</td><td style="border: 1px solid #e2e8f0; padding: 3px; text-align: center;">${diesel?.creditQty || 0}</td><td style="border: 1px solid #e2e8f0; padding: 3px; text-align: right; font-family: monospace; color: #0369a1;">${(diesel?.creditAmt || 0).toLocaleString()}</td></tr>
                <tr><td style="border: 1px solid #e2e8f0; padding: 3px;">Cash Diesel</td><td style="border: 1px solid #e2e8f0; padding: 3px; text-align: center;">${diesel?.cashQty || 0}</td><td style="border: 1px solid #e2e8f0; padding: 3px; text-align: right; font-family: monospace;">${(diesel?.cashAmt || 0).toLocaleString()}</td></tr>
                <tr style="background: #f0fdf4; font-weight: bold;"><td style="border: 1px solid #cbd5e1; padding: 3px;">Total Diesel Available</td><td style="border: 1px solid #cbd5e1; padding: 3px; text-align: center;">${diesel?.totalQty || 0}</td><td style="border: 1px solid #cbd5e1; padding: 3px; text-align: right; font-family: monospace; color: #16a34a;">PKR ${(diesel?.totalAmt || 0).toLocaleString()}</td></tr>
                <tr style="background: #fefce8;"><td style="border: 1px solid #e2e8f0; padding: 3px;">Remaining Fuel (Carry-Forward)</td><td style="border: 1px solid #e2e8f0; padding: 3px; text-align: center;">${diesel?.remainingQty || 0}</td><td style="border: 1px solid #e2e8f0; padding: 3px; text-align: right; font-family: monospace;">PKR ${(diesel?.remainingAmt || 0).toLocaleString()}</td></tr>
                <tr style="background: #fef3c7; font-weight: bold;"><td style="border: 1px solid #cbd5e1; padding: 3px; color: #92400e;">Consumed Diesel (Charged to Trip)</td><td style="border: 1px solid #cbd5e1; padding: 3px; text-align: center; color: #92400e;">${diesel?.consumedQty || 0}</td><td style="border: 1px solid #cbd5e1; padding: 3px; text-align: right; font-family: monospace; color: #92400e;">PKR ${(diesel?.consumedAmt || 0).toLocaleString()}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  if (type === 'daily_activity_report' && data) {
    const { vehicleLocations, vehiclesLoadedToday, vehiclesDecantedToday, advances, cashFueling, pumpSummaries, workshopSummary, payablesTotal, oilDetails } = data;
    return `
      <div style="font-family: Arial, sans-serif; font-size: 11px;">
        <div style="text-align: center; background: #0f172a; color: white; padding: 10px; border-radius: 6px; margin-bottom: 12px; font-size: 16px; font-weight: bold; text-transform: uppercase;">
          Executive Daily Activity Report
        </div>

        <!-- 4-Column Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px;">
          <!-- Col 1: Vehicle Location 10:00 AM -->
          <div style="border: 1px solid #94a3b8; border-radius: 4px; overflow: hidden;">
            <div style="background: #f1f5f9; font-weight: bold; padding: 4px; text-align: center; border-bottom: 1px solid #94a3b8;">Vehicle Location 10:00 AM</div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #e2e8f0;">
                  <th style="border: 1px solid #cbd5e1; padding: 3px;">Number</th>
                  <th style="border: 1px solid #cbd5e1; padding: 3px;">Location</th>
                  <th style="border: 1px solid #cbd5e1; padding: 3px;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${(vehicleLocations || []).slice(0, 10).map(v => `
                  <tr>
                    <td style="border: 1px solid #e2e8f0; padding: 3px; font-weight: bold;">${v.number}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 3px;">${v.location}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 3px;">${v.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Col 2: Loaded & Decanted Today -->
          <div style="border: 1px solid #94a3b8; border-radius: 4px; overflow: hidden;">
            <div style="background: #e2e8f0; font-weight: bold; padding: 4px; text-align: center; border-bottom: 1px solid #94a3b8;">Loaded / Decanted Today</div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="border: 1px solid #cbd5e1; padding: 3px;">Number</th>
                  <th style="border: 1px solid #cbd5e1; padding: 3px;">Type</th>
                  <th style="border: 1px solid #cbd5e1; padding: 3px;">PSI</th>
                </tr>
              </thead>
              <tbody>
                ${(vehiclesLoadedToday || []).map(v => `
                  <tr>
                    <td style="border: 1px solid #e2e8f0; padding: 3px; font-weight: bold;">${v.number}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 3px; color: #2563eb;">Loaded</td>
                    <td style="border: 1px solid #e2e8f0; padding: 3px;">${v.psi}</td>
                  </tr>
                `).join('')}
                ${(vehiclesDecantedToday || []).map(v => `
                  <tr>
                    <td style="border: 1px solid #e2e8f0; padding: 3px; font-weight: bold;">${v.number}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 3px; color: #16a34a;">Decanted</td>
                    <td style="border: 1px solid #e2e8f0; padding: 3px;">${v.psi}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Col 3: Advances From Plants -->
          <div style="border: 1px solid #94a3b8; border-radius: 4px; overflow: hidden;">
            <div style="background: #ea580c; color: white; font-weight: bold; padding: 4px; text-align: center;">Advances From Plants</div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="border: 1px solid #cbd5e1; padding: 3px;">Vehicle</th>
                  <th style="border: 1px solid #cbd5e1; padding: 3px;">Plant</th>
                  <th style="border: 1px solid #cbd5e1; padding: 3px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${(advances || []).map(a => `
                  <tr>
                    <td style="border: 1px solid #e2e8f0; padding: 3px;">${a.vehicle}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 3px;">${a.plant}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 3px; text-align: right; font-family: monospace;">${a.amount.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Col 4: Cash Fueling & Expenses -->
          <div style="border: 1px solid #94a3b8; border-radius: 4px; overflow: hidden;">
            <div style="background: #1d4ed8; color: white; font-weight: bold; padding: 4px; text-align: center;">Cash Fueling & Expenses</div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="border: 1px solid #cbd5e1; padding: 3px;">Vehicle</th>
                  <th style="border: 1px solid #cbd5e1; padding: 3px;">Qty</th>
                  <th style="border: 1px solid #cbd5e1; padding: 3px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${(cashFueling || []).map(c => `
                  <tr>
                    <td style="border: 1px solid #e2e8f0; padding: 3px;">${c.vehicle}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 3px;">${c.qty}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 3px; text-align: right; font-family: monospace;">${(c.amount || 0).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Bottom Grid: Pump Summaries, Workshop, Payables Total & Mobil Oil -->
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 10px;">
          <div>
            <!-- Fuel Pump Summaries -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
              ${(pumpSummaries || []).map(p => `
                <div style="border: 1px solid #16a34a; border-radius: 4px; overflow: hidden;">
                  <div style="background: #15803d; color: white; font-weight: bold; padding: 3px; text-align: center;">${p.pumpName}</div>
                  <div style="padding: 4px 6px; display: flex; justify-content: space-between; background: #fef08a;">
                    <span>Opening: <strong>${(p.openingCr || 0).toLocaleString()}</strong></span>
                    <span>Closing: <strong style="color: #16a34a;">${(p.closingBalance || 0).toLocaleString()}</strong></span>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Workshop Summary -->
            <div style="border: 1px solid #94a3b8; border-radius: 4px; overflow: hidden;">
              <div style="background: #e2e8f0; font-weight: bold; padding: 4px; text-align: center;">Workshop Details</div>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f1f5f9;">
                    <th style="border: 1px solid #cbd5e1; padding: 3px;">Workshop</th>
                    <th style="border: 1px solid #cbd5e1; padding: 3px; text-align: right;">Previous</th>
                    <th style="border: 1px solid #cbd5e1; padding: 3px; text-align: right;">Paid</th>
                    <th style="border: 1px solid #cbd5e1; padding: 3px; text-align: right;">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  ${(workshopSummary || []).map(w => `
                    <tr>
                      <td style="border: 1px solid #e2e8f0; padding: 3px;">${w.name}</td>
                      <td style="border: 1px solid #e2e8f0; padding: 3px; text-align: right;">${(w.previousAmount || 0).toLocaleString()}</td>
                      <td style="border: 1px solid #e2e8f0; padding: 3px; text-align: right;">${(w.paid || 0).toLocaleString()}</td>
                      <td style="border: 1px solid #e2e8f0; padding: 3px; text-align: right; color: #dc2626; font-weight: bold;">${(w.remaining || 0).toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <!-- Payables Total -->
            <div style="border: 1px solid #1e3a8a; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
              <div style="background: #1e40af; color: white; font-weight: bold; padding: 4px; text-align: center;">Payable Amounts Total</div>
              <div style="padding: 10px; background: #bbf7d0; color: #065f46; font-weight: bold; text-align: center; font-size: 14px;">
                PKR ${(payablesTotal || 0).toLocaleString()}
              </div>
            </div>

            <!-- Mobil Oil Details -->
            <div style="border: 1px solid #94a3b8; border-radius: 4px; overflow: hidden;">
              <div style="background: #0284c7; color: white; font-weight: bold; padding: 4px; text-align: center;">Mobil Oil Details</div>
              <table style="width: 100%; border-collapse: collapse;">
                <tbody>
                  <tr><td style="border: 1px solid #e2e8f0; padding: 3px;">Opening Stock</td><td style="border: 1px solid #e2e8f0; padding: 3px; text-align: right; font-weight: bold;">${oilDetails?.openingStock || 0} L</td></tr>
                  <tr><td style="border: 1px solid #e2e8f0; padding: 3px;">Purchased Stock</td><td style="border: 1px solid #e2e8f0; padding: 3px; text-align: right;">${oilDetails?.purchasedStock || 0} L</td></tr>
                  <tr style="background: #f0f9ff; font-weight: bold;"><td style="border: 1px solid #e2e8f0; padding: 3px;">Remaining Stock</td><td style="border: 1px solid #e2e8f0; padding: 3px; text-align: right; color: #0369a1;">${oilDetails?.remainingStock || 0} L</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (isLedgerReport(type)) {
    const rows = data?.rows || [];
    const rowsHTML = rows.map(r => `
      <tr style="${r.isOpening ? 'background: #f1f5f9; font-weight: bold;' : ''}">
        <td>${r.date}</td>
        <td>${r.ref || '-'}</td>
        <td>${r.description}</td>
        <td style="text-align: right; color: #2563eb;">${r.dr > 0 ? `PKR ${r.dr.toLocaleString()}` : '-'}</td>
        <td style="text-align: right; color: #dc2626;">${r.cr > 0 ? `PKR ${r.cr.toLocaleString()}` : '-'}</td>
        <td style="text-align: right; font-weight: bold;">PKR ${(r.balance || 0).toLocaleString()}</td>
      </tr>
    `).join('');

    return `
      <div style="margin-bottom: 16px; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #cbd5e1; display: flex; justify-content: space-between;">
        <div><strong>Account/Party:</strong> ${data.accountName || data.partyName || 'All Entities'}</div>
        <div>Opening: <strong>PKR ${(data.openingBalance || 0).toLocaleString()}</strong> | Total Dr: <strong>PKR ${(data.totalDr || 0).toLocaleString()}</strong> | Total Cr: <strong>PKR ${(data.totalCr || 0).toLocaleString()}</strong> | Closing Bal: <strong>PKR ${(data.closingBalance || 0).toLocaleString()}</strong></div>
      </div>
      <table>
        <thead>
          <tr>
            <th>DATE</th>
            <th>REF / VCH NO</th>
            <th>DESCRIPTION / REMARKS</th>
            <th style="text-align: right">DEBIT (DR) (PKR)</th>
            <th style="text-align: right">CREDIT (CR) (PKR)</th>
            <th style="text-align: right">BALANCE (PKR)</th>
          </tr>
        </thead>
        <tbody>${rowsHTML}</tbody>
      </table>
    `;
  }

  if (!Array.isArray(data) || data.length === 0) return '<p>No records found.</p>';
  const cols = Object.keys(data[0] || {}).filter(k => k !== 'createdAt' && k !== 'updatedAt').slice(0, 8);

  const headerHTML = cols.map(c => `<th>${c.replace(/_/g, ' ').toUpperCase()}</th>`).join('');
  const rowsHTML = data.map(row => {
    const cells = cols.map(c => {
      const val = row[c];
      const isNum = typeof val === 'number';
      return `<td class="${isNum ? 'amount' : ''}">${val !== undefined && val !== null ? val : '-'}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  return `
    <table>
      <thead><tr>${headerHTML}</tr></thead>
      <tbody>${rowsHTML}</tbody>
    </table>
  `;
}
