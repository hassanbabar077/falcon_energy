import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Eye, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, X, Check, AlertTriangle, FileText, Clock } from 'lucide-react';
import { dbService } from '../services/db';

const ROWS_PER_PAGE = 10;

// Toast notification component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const toastClass = type === 'success' ? 'toast-box toast-success' : 'toast-box toast-error';

  return (
    <div className={toastClass}>
      {type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: 'auto' }}>
        <X size={14} />
      </button>
    </div>
  );
}

// Confirm delete dialog
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e11d48' }}>
            <AlertTriangle size={22} />
            <span className="modal-title" style={{ color: '#e11d48' }}>Confirm Delete</span>
          </div>
          <button onClick={onCancel} className="modal-close-btn"><X size={16} /></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.6' }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button onClick={onCancel} className="btn btn-ghost">Cancel</button>
          <button onClick={onConfirm} className="btn btn-rose">Delete Record</button>
        </div>
      </div>
    </div>
  );
}

// Dynamic form field renderer
function FormField({ field, value, onChange, formData, vehicles, transporters, fuelPumps, vendors, tyreBrands, maintenanceHeads, workshops, trips }) {
  if (field.type === 'select') {
    const optionsList = typeof field.options === 'function' ? field.options() : (field.options || []);
    return (
      <select value={value || ''} onChange={e => onChange(field.key, e.target.value)} className="crud-form-select" required={field.required}>
        <option value="">Select {field.label}</option>
        {optionsList.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'vehicle_dropdown') {
    return (
      <select value={value || ''} onChange={e => onChange(field.key, e.target.value)} className="crud-form-select" required={field.required}>
        <option value="">Select Vehicle</option>
        {vehicles.map(v => (
          <option key={v.code} value={v.number}>{v.number} ({v.code})</option>
        ))}
      </select>
    );
  }

  if (field.type === 'trip_dropdown') {
    const selectedVehicle = formData?.vehicle || '';
    const filteredTrips = selectedVehicle
      ? (trips || []).filter(t => t.vehicle && String(t.vehicle).trim().toLowerCase() === String(selectedVehicle).trim().toLowerCase())
      : (trips || []);

    return (
      <select value={value || ''} onChange={e => onChange(field.key, e.target.value)} className="crud-form-select" required={field.required}>
        <option value="">{selectedVehicle ? `-- Select Trip for ${selectedVehicle} --` : 'Select Vehicle First to Filter Trips'}</option>
        {filteredTrips.map(t => (
          <option key={t.id} value={t.id}>
            {t.id} - {t.source || 'Dispatch'} → {t.destination || 'Pending'} ({t.loading_date})
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'tanker_dropdown') {
    // Filter vehicles that have a valid tanker number
    const tankers = vehicles.filter(v => v.tanker_number && v.tanker_number.trim() !== '');
    return (
      <select value={value || ''} onChange={e => onChange(field.key, e.target.value)} className="crud-form-select" required={field.required}>
        <option value="">Select Tanker Number</option>
        {tankers.map(v => (
          <option key={v.code} value={v.tanker_number}>{v.tanker_number} ({v.number})</option>
        ))}
      </select>
    );
  }

  if (field.type === 'vendor_dropdown') {
    return (
      <select value={value || ''} onChange={e => onChange(field.key, e.target.value)} className="crud-form-select" required={field.required}>
        <option value="">Select Vendor</option>
        {(vendors || []).map(v => (
          <option key={v.id} value={v.business_name || v.name}>
            {v.business_name || v.name} ({v.vendor_type || 'Vendor'})
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'tyre_brand_dropdown') {
    return (
      <select value={value || ''} onChange={e => onChange(field.key, e.target.value)} className="crud-form-select" required={field.required}>
        <option value="">Select Tyre Brand</option>
        {(tyreBrands || []).map(b => (
          <option key={b.id} value={b.name}>
            {b.name} ({b.category || 'Local'})
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'maintenance_head_dropdown') {
    return (
      <select value={value || ''} onChange={e => onChange(field.key, e.target.value)} className="crud-form-select" required={field.required}>
        <option value="">Select Maintenance Head</option>
        {(maintenanceHeads || []).map(h => (
          <option key={h.id || h.name} value={h.name}>{h.name} ({h.category || 'Both'})</option>
        ))}
      </select>
    );
  }

  if (field.type === 'workshop_dropdown') {
    return (
      <select value={value || ''} onChange={e => onChange(field.key, e.target.value)} className="crud-form-select" required={field.required}>
        <option value="">Select Workshop</option>
        {(workshops || []).map(w => (
          <option key={w.id || w.name} value={w.name || w.business_name}>{w.name || w.business_name}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'transporter_dropdown') {
    return (
      <select value={value || ''} onChange={e => onChange(field.key, e.target.value)} className="crud-form-select" required={field.required}>
        <option value="">Select Transporter</option>
        {(transporters || []).map(t => (
          <option key={t.id} value={t.business_name}>{t.business_name} ({t.city || t.contact_person})</option>
        ))}
      </select>
    );
  }

  if (field.type === 'fuel_pump_dropdown') {
    return (
      <select value={value || ''} onChange={e => onChange(field.key, e.target.value)} className="crud-form-select" required={field.required}>
        <option value="">Select Fuel Pump</option>
        {(fuelPumps || []).map(p => (
          <option key={p.id} value={p.name}>{p.name} ({p.location})</option>
        ))}
      </select>
    );
  }

  if (field.type === 'vehicle_category_dropdown') {
    const categories = dbService.getLookupOptions('Vehicle Category');
    return (
      <select value={value || ''} onChange={e => onChange(field.key, e.target.value)} className="crud-form-select" required={field.required}>
        <option value="">Select Category</option>
        {categories.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'tanker_ownership_dropdown') {
    const ownerships = dbService.getLookupOptions('Tanker Ownership');
    return (
      <select value={value || ''} onChange={e => onChange(field.key, e.target.value)} className="crud-form-select" required={field.required}>
        <option value="">Select Ownership</option>
        {ownerships.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'engine_oil_dropdown') {
    const oils = dbService.getTable('engine_oil_defination');
    const oilNames = oils.length > 0 ? oils.map(o => o.oil_name || o.name || o.title) : dbService.getLookupOptions('Engine Oil Defination');
    return (
      <select value={value || ''} onChange={e => onChange(field.key, e.target.value)} className="crud-form-select" required={field.required}>
        <option value="">Select Engine Oil</option>
        {oilNames.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'textarea') {
    return (
      <textarea value={value || ''} onChange={e => onChange(field.key, e.target.value)} className="crud-form-textarea" placeholder={field.placeholder || ''} required={field.required} />
    );
  }

  return (
    <input
      type={field.type || 'text'}
      step={field.step}
      value={value ?? ''}
      onChange={e => onChange(field.key, e.target.value)}
      className="crud-form-input"
      placeholder={field.placeholder || ''}
      required={field.required}
    />
  );
}

export function CrudPage({ config }) {
  const {
    title, icon: Icon, description, tableName, idField = 'id', idPrefix,
    columns, formFields, defaultValues = {}, codeField
  } = config;

  const recordIdField = codeField || idField;

  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [formData, setFormData] = useState({ ...defaultValues });
  const [editData, setEditData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [fuelPumps, setFuelPumps] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [tyreBrands, setTyreBrands] = useState([]);
  const [maintenanceHeads, setMaintenanceHeads] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [trips, setTrips] = useState([]);

  const categoryFilter = config.category || config.categoryFilter;

  // Load records
  const loadMasterLists = () => {
    let rawRecords = dbService.getTable(tableName);
    if (categoryFilter) {
      rawRecords = rawRecords.filter(r => r && r.category && String(r.category).trim().toLowerCase() === String(categoryFilter).trim().toLowerCase());
    }
    setRecords(rawRecords);
    setVehicles(dbService.getTable('vehicles'));
    setTransporters(dbService.getTable('transporters'));
    setFuelPumps(dbService.getTable('fuel_pumps'));
    setVendors(dbService.getTable('vendors'));
    setTyreBrands(dbService.getTable('tyre_brands'));
    setMaintenanceHeads(dbService.getTable('maintenance_heads'));
    setWorkshops(dbService.getTable('workshops'));
    setTrips(dbService.getTable('trips'));
  };

  useEffect(() => {
    loadMasterLists();
    // Item 1: Auto-refresh tables when data changes
    const unsubscribe = dbService.subscribe(() => {
      loadMasterLists();
    });
    return () => unsubscribe();
  }, [tableName]);

  const refreshRecords = () => {
    loadMasterLists();
  };

  // Search filter
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const q = searchTerm.toLowerCase();
    return records.filter(r =>
      columns.some(col => {
        const val = r[col.key];
        return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
      })
    );
  }, [records, searchTerm, columns]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) {
      // Default view: Show newest records on top
      return [...filtered].sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        // Fallback to record ID or index comparison if code/id exists
        const aId = String(a.id || a.code || a.payment_id || a.bill_id || '');
        const bId = String(b.id || b.code || b.payment_id || b.bill_id || '');
        if (aId && bId) {
          return bId.localeCompare(aId, undefined, { numeric: true, sensitivity: 'base' });
        }
        return 0;
      });
    }
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const paginated = sorted.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleFormChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleEditChange = (key, value) => {
    setEditData(prev => ({ ...prev, [key]: value }));
  };

  const getVisibleFields = (data) => {
    return formFields.filter(f => {
      if (f.showWhen) return f.showWhen(data);
      return true;
    });
  };

  // ADD
  const handleAdd = (e) => {
    e.preventDefault();
    const newRecord = { ...formData };
    newRecord[recordIdField] = dbService.generateNextID(tableName, idPrefix, recordIdField);
    if (config.onBeforeSave) config.onBeforeSave(newRecord);
    dbService.insertRecord(tableName, newRecord);
    refreshRecords();
    setIsAddOpen(false);
    setFormData({ ...defaultValues });
    setToast({ message: `Record ${newRecord[recordIdField]} added successfully!`, type: 'success' });
  };

  // EDIT
  const handleEdit = (e) => {
    e.preventDefault();
    const updated = { ...editData };
    delete updated[recordIdField];
    delete updated.createdAt;
    if (config.onBeforeSave) config.onBeforeSave(updated);
    dbService.updateRecord(tableName, recordIdField, editData[recordIdField], updated);
    refreshRecords();
    setIsEditOpen(false);
    setEditData(null);
    setToast({ message: `Record updated successfully!`, type: 'success' });
  };

  // DELETE
  const confirmDelete = () => {
    if (deleteTarget) {
      dbService.deleteRecord(tableName, recordIdField, deleteTarget[recordIdField]);
      refreshRecords();
      setDeleteTarget(null);
      setToast({ message: `Record deleted successfully.`, type: 'success' });
    }
  };

  const openEdit = (record) => {
    const merged = { ...defaultValues };
    Object.keys(record).forEach(k => {
      merged[k] = (record[k] !== null && record[k] !== undefined) ? record[k] : '';
    });
    setEditData(merged);
    setIsEditOpen(true);
  };

  const renderCell = (record, col) => {
    if (col.render) {
      return col.render(record);
    }
    const val = record[col.key];
    if (col.badge) {
      const badgeMap = {
        'Active': 'badge badge-teal',
        'Valid': 'badge badge-teal',
        'Paid': 'badge badge-teal',
        'Completed': 'badge badge-teal',
        'New': 'badge badge-blue',
        'Inactive': 'badge badge-rose',
        'Suspended': 'badge badge-amber',
        'Maintenance': 'badge badge-amber',
        'Expired': 'badge badge-rose',
        'Old': 'badge badge-ghost',
        'Pending': 'badge badge-amber',
        'Unpaid': 'badge badge-rose',
      };
      const cls = badgeMap[val] || 'badge badge-teal';
      return <span className={cls}>{val || '-'}</span>;
    }
    if (col.format === 'currency') {
      return <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>PKR {(parseFloat(val) || 0).toLocaleString()}</span>;
    }
    if (col.format === 'mono') {
      return <span style={{ fontFamily: 'monospace' }}>{val || '-'}</span>;
    }
    if (col.format === 'bold') {
      return <strong style={{ color: '#0f172a' }}>{val || '-'}</strong>;
    }
    return val || '-';
  };

  const handleDeleteRequest = (record) => {
    const usage = dbService.checkMasterDataUsage(tableName, record);
    if (usage) {
      setToast({
        message: `Cannot delete record! This information is currently used in ${usage}.`,
        type: 'error'
      });
      return;
    }
    setDeleteTarget(record);
  };

  return (
    <div className="crud-container">
      {/* Header Banner Card */}
      <div className="crud-header-card">
        <div className="crud-header-left">
          <div className="crud-header-icon">
            {Icon ? <Icon size={24} /> : <FileText size={24} />}
          </div>
          <div>
            <h2 className="crud-header-title">{title}</h2>
            <p className="crud-header-sub">{description}</p>
          </div>
        </div>
        <button onClick={() => { setFormData({ ...defaultValues }); setIsAddOpen(true); }} className="btn btn-teal">
          <Plus size={16} />
          <span>Add New Record</span>
        </button>
      </div>

      {/* Toolbar (Search + Count) */}
      <div className="crud-toolbar">
        <div className="crud-search-box">
          <Search size={16} className="crud-search-icon" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="crud-search-input"
          />
        </div>
        <div className="crud-count-badge">
          {filtered.length} record{filtered.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* DataTable Card */}
      <div className="crud-table-card">
        <div className="crud-table-wrapper">
          <table className="crud-table">
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{col.label}</span>
                      {sortKey === col.key
                        ? (sortDir === 'asc' ? <ArrowUp size={12} color="#0d9488" /> : <ArrowDown size={12} color="#0d9488" />)
                        : <ArrowUpDown size={12} style={{ opacity: 0.3 }} />
                      }
                    </div>
                  </th>
                ))}
                <th style={{ textAlign: 'center', width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No matching records found.
                  </td>
                </tr>
              ) : (
                paginated.map((record, idx) => (
                  <tr key={record[recordIdField] || idx}>
                    {columns.map(col => (
                      <td key={col.key} className={col.key === recordIdField ? 'crud-td-code' : ''}>
                        {renderCell(record, col)}
                      </td>
                    ))}
                    <td>
                      <div className="crud-actions-cell">
                        <button onClick={() => setViewData(record)} className="crud-btn-action crud-btn-view" title="View Details">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => openEdit(record)} className="crud-btn-action crud-btn-edit" title="Edit Record">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDeleteRequest(record)} className="crud-btn-action crud-btn-delete" title="Delete Record">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="crud-pagination">
            <span>
              Page <strong>{currentPage}</strong> of {totalPages} ({filtered.length} total)
            </span>
            <div className="crud-page-btns">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="crud-page-btn"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="crud-page-btn"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VIEW DETAILS Modal */}
      {viewData && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <span className="badge badge-teal" style={{ marginBottom: '4px' }}>Record Details</span>
                <div className="modal-title">{viewData[recordIdField] || 'Details'}</div>
              </div>
              <button onClick={() => setViewData(null)} className="modal-close-btn"><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="crud-view-grid">
                {Object.entries(viewData).map(([key, val]) => {
                  if (key === 'createdAt' || key === 'updatedAt') return null;
                  return (
                    <div key={key} className="crud-view-item">
                      <span className="crud-view-label">{key.replace(/_/g, ' ')}</span>
                      <span className="crud-view-val">{val === null || val === undefined || val === '' ? '-' : String(val)}</span>
                    </div>
                  );
                })}
              </div>

              {(viewData.createdAt || viewData.updatedAt) && (
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '16px', fontSize: '11px', color: '#94a3b8' }}>
                  {viewData.createdAt && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> Created: {new Date(viewData.createdAt).toLocaleString()}
                    </span>
                  )}
                  {viewData.updatedAt && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> Updated: {new Date(viewData.updatedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setViewData(null)} className="btn btn-ghost">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD Modal */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">Add New Record</span>
              <button onClick={() => setIsAddOpen(false)} className="modal-close-btn"><X size={16} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="crud-form">
                  <div className="crud-form-row">
                    {getVisibleFields(formData).map(field => (
                      <div key={field.key} className="crud-form-field" style={field.halfWidth ? { flex: '1 1 calc(50% - 7px)' } : { flex: '1 1 100%' }}>
                        <label className="crud-form-label">
                          <span>{field.label}</span>
                          {field.required ? <span className="crud-required-star">*</span> : <span className="crud-optional-tag">(Optional)</span>}
                        </label>
                        <FormField field={field} value={formData[field.key]} onChange={handleFormChange} formData={formData} vehicles={vehicles} transporters={transporters} fuelPumps={fuelPumps} vendors={vendors} tyreBrands={tyreBrands} maintenanceHeads={maintenanceHeads} workshops={workshops} trips={trips} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsAddOpen(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-teal">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT Modal */}
      {isEditOpen && editData && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">Edit Record – <span style={{ fontFamily: 'monospace', color: '#0d9488' }}>{editData[recordIdField]}</span></span>
              <button onClick={() => setIsEditOpen(false)} className="modal-close-btn"><X size={16} /></button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                <div className="crud-form">
                  <div className="crud-form-row">
                    {getVisibleFields(editData).map(field => (
                      <div key={field.key} className="crud-form-field" style={field.halfWidth ? { flex: '1 1 calc(50% - 7px)' } : { flex: '1 1 100%' }}>
                        <label className="crud-form-label">
                          <span>{field.label}</span>
                          {field.required ? <span className="crud-required-star">*</span> : <span className="crud-optional-tag">(Optional)</span>}
                        </label>
                        <FormField field={field} value={editData[field.key]} onChange={handleEditChange} formData={editData} vehicles={vehicles} transporters={transporters} fuelPumps={fuelPumps} vendors={vendors} tyreBrands={tyreBrands} maintenanceHeads={maintenanceHeads} workshops={workshops} trips={trips} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsEditOpen(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-teal">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          message={`Are you sure you want to delete record "${deleteTarget[recordIdField]}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Toast Alert */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
