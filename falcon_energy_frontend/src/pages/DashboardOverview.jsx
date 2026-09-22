import React, { useEffect, useState } from 'react';
import { Truck, Clock, DollarSign, TrendingUp, ShieldCheck, CheckCircle, Wrench, Fuel, CreditCard, FileText, ClipboardList, BarChart3, ArrowRight } from 'lucide-react';
import { dbService } from '../services/db';

export function DashboardOverview({ onUpdateTrip, onNavigate }) {
  const [kpis, setKpis] = useState(dbService.getDashboardKPIs());
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const trips = dbService.getTable('trips');
  const oilDef = dbService.getTable('engine_oil_defination');
  const totalOilStock = oilDef.reduce((sum, oil) => sum + (oil.current_stock || 0), 0);
  const maintenanceCount = dbService.getTable('maintenance').length;
  const goTo = (id) => onNavigate?.(id);

  const shortcuts = [
    { id: 'vehicles', label: 'Vehicles', detail: 'Fleet status & records', icon: Truck },
    { id: 'trip_entry', label: 'Trip Entry', detail: 'Create a new dispatch', icon: ClipboardList },
    { id: 'payment_entry', label: 'Payment Entry', detail: 'Settle pending payables', icon: CreditCard },
    { id: 'fuel_entry', label: 'Fuel Entry', detail: 'Log fuel receipts', icon: Fuel },
    { id: 'rpt_daily_activity_report', label: 'Daily Activity', detail: 'Operations report', icon: BarChart3 },
    { id: 'rpt_trip_detailed_sheet', label: 'Trip Sheet', detail: 'Detailed trip report', icon: FileText },
  ];

  return (
    <div className="crud-container dashboard-overview" style={{ opacity: visible ? 1 : 0, transition: 'opacity .3s ease' }}>
      <div className="crud-header-card dashboard-header text-black">
        <div>
          <div className="dashboard-live"><span /> Live Fleet Operations</div>
          <h1>Operations Dashboard</h1>
          <p>Monitor active deliveries and access your daily transport tools.</p>
        </div>
        <div className="dashboard-date">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
      </div>

      <div className="dashboard-workspace">
        <section className="crud-table-card dashboard-active-trips">
          <div className="dashboard-panel-heading">
            <div className="dashboard-panel-title">
              <div className="dashboard-panel-icon"><Clock size={18} /></div>
              <div><h2>Active Trips</h2><p>Deliveries currently in transit.</p></div>
            </div>
            <span className="dashboard-count">{kpis.inprocessTrips?.length || 0} Active</span>
          </div>
          <div className="crud-table-wrapper">
            <table className="crud-table">
              <thead><tr><th>Trip ID</th><th>Vehicle</th><th>Source</th><th>Destination</th><th>Load</th><th>Status</th></tr></thead>
              <tbody>
                {!kpis.inprocessTrips?.length ? (
                  <tr><td colSpan="6" className="dashboard-empty"><CheckCircle size={26} /><strong>No active trips right now</strong><span>All dispatched deliveries have been completed.</span></td></tr>
                ) : kpis.inprocessTrips.map(trip => (
                  <tr key={trip.id}>
                    <td className="crud-td-code">{trip.id}</td><td><strong>{trip.vehicle}</strong></td><td>{trip.source}</td><td>{trip.destination || 'Pending'}</td>
                    <td><strong>{trip.load_weight} MT</strong></td><td><span className="badge badge-amber">IN TRANSIT</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="dashboard-view-all" onClick={() => goTo('trip_edit')}>View & update trips <ArrowRight size={15} /></button>
        </section>

        <aside className="dashboard-shortcuts">
          <div className="dashboard-shortcut-heading"><h2>Frequently Used</h2><p>Quick access to daily modules</p></div>
          <button className="dashboard-fleet-action" onClick={() => goTo('vehicles')}><Truck size={21} /><span><strong>Active Vehicles</strong><small>{kpis.activeVehicles} of {kpis.totalVehicles} fleet vehicles ready</small></span><ArrowRight size={16} /></button>
          <div className="dashboard-shortcut-list">
            {shortcuts.map(({ id, label, detail, icon: Icon }) => (
              <button key={id} onClick={() => goTo(id)} className="dashboard-shortcut"><Icon size={17} /><span><strong>{label}</strong><small>{detail}</small></span><ArrowRight size={14} /></button>
            ))}
          </div>
        </aside>
      </div>

      <div className="dashboard-metrics">
        <div className="dashboard-metric"><div><span>Active Fleet</span><strong>{kpis.activeVehicles}<small> / {kpis.totalVehicles}</small></strong><em><ShieldCheck size={14} /> Vehicles ready for dispatch</em></div><Truck /></div>
        <div className="dashboard-metric"><div><span>In-Transit Deliveries</span><strong>{kpis.inprocessCount}<small> Trips</small></strong><em><Clock size={14} /> Pending delivery updates</em></div><Clock /></div>
        <div className="dashboard-metric"><div><span>Gross Revenue</span><strong>PKR {(kpis.totalRevenue || 0).toLocaleString()}</strong><em><DollarSign size={14} /> Cumulative trip earnings</em></div><DollarSign /></div>
        <div className="dashboard-metric"><div><span>Net Operational Profit</span><strong>PKR {(kpis.netProfit || 0).toLocaleString()}</strong><em><TrendingUp size={14} /> After operating costs</em></div><TrendingUp /></div>
      </div>

      <div className="dashboard-summary-row">
        <span><Truck size={18} /><strong>{trips.length}</strong> Total Trips Registered</span>
        <span><Fuel size={18} /><strong>{totalOilStock} L</strong> Engine Oil Stock</span>
        <span><Wrench size={18} /><strong>{maintenanceCount}</strong> Maintenance Records</span>
      </div>
    </div>
  );
}
