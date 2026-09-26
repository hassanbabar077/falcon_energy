import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { PERMISSION_MODULES } from '../services/permissionService';
import { Users, UserPlus, Shield, ShieldAlert, Edit, Trash2, CheckCircle2, XCircle, CheckSquare, Square, Key, Lock } from 'lucide-react';

export function UserMgmt() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form State
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Manager');
  const [status, setStatus] = useState('Active');
  const [permissions, setPermissions] = useState([]);
  const [formError, setFormError] = useState('');

  const loadUsers = () => {
    setUsers(dbService.getUsers());
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setUsername('');
    setName('');
    setPassword('');
    setRole('Manager');
    setStatus('Active');
    setPermissions([]);
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setUsername(user.username);
    setName(user.name || '');
    setPassword(user.password || '');
    setRole(user.role || 'Manager');
    setStatus(user.status || 'Active');
    setPermissions(user.permissions || []);
    setFormError('');
    setShowModal(true);
  };

  const handleTogglePermission = (permId) => {
    setPermissions(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleCategoryToggle = (categoryItems) => {
    const itemIds = categoryItems.map(item => item.id);
    const allSelected = itemIds.every(id => permissions.includes(id));

    if (allSelected) {
      // Remove all items in category
      setPermissions(prev => prev.filter(id => !itemIds.includes(id)));
    } else {
      // Add missing items in category
      const unique = Array.from(new Set([...permissions, ...itemIds]));
      setPermissions(unique);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!username.trim()) {
      setFormError('Username is required.');
      return;
    }

    if (!password) {
      setFormError('Password is required.');
      return;
    }

    // Check duplicate username
    const existing = dbService.getUserByUsername(username);
    if (existing && (!editingUser || existing.id !== editingUser.id)) {
      setFormError('Username already exists. Please choose a different username.');
      return;
    }

    try {
      await dbService.saveUser({
        id: editingUser ? editingUser.id : undefined,
        username: username.trim(),
        name: name.trim() || username.trim(),
        password: password,
        role: role,
        status: status,
        permissions: role === 'Admin' ? ['all'] : permissions
      });

      setShowModal(false);
      loadUsers();
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      setFormError(err.message || 'Error saving user.');
    }
  };

  const handleDelete = async (user) => {
    if (user.id === 'USR-001') {
      alert('Root admin user cannot be deleted.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      try {
        await dbService.deleteUser(user.id);
        loadUsers();
        setTimeout(() => window.location.reload(), 600);
      } catch (err) {
        alert(err.message || 'Error deleting user.');
      }
    }
  };

  return (
    <div className="page-container" style={{ padding: '24px' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '2px solid #e2e8f0'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} className="text-teal-600" />
            User & Role Permission Management
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: '4px 0 0 0' }}>
            Create system managers, assign usernames & passwords, and grant module-level access permissions.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="btn btn-teal"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: '700', borderRadius: '10px' }}
        >
          <UserPlus size={18} />
          <span>Add New Manager / User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', fontSize: '13px', color: '#475569' }}>
              <th style={{ padding: '14px 18px' }}>User Info</th>
              <th style={{ padding: '14px 18px' }}>Username</th>
              <th style={{ padding: '14px 18px' }}>Role</th>
              <th style={{ padding: '14px 18px' }}>Status</th>
              <th style={{ padding: '14px 18px' }}>Module Access & Permissions</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const isAdmin = u.role === 'Admin';
              const isInactive = u.status === 'Inactive';
              const permCount = isAdmin ? 'All Modules (Full Access)' : `${(u.permissions || []).length} Module(s) Granted`;

              return (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: isInactive ? 0.7 : 1 }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{u.name}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>ID: {u.id}</div>
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: '600', color: '#0d9488', fontFamily: 'monospace' }}>
                    @{u.username}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '700',
                      background: isAdmin ? '#eff6ff' : '#f0fdf4',
                      color: isAdmin ? '#2563eb' : '#16a34a',
                      border: `1px solid ${isAdmin ? '#bfdbfe' : '#bbf7d0'}`
                    }}>
                      <Shield size={13} />
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '700',
                      background: isInactive ? '#fef2f2' : '#f0fdfa',
                      color: isInactive ? '#dc2626' : '#0d9488',
                      border: `1px solid ${isInactive ? '#fecaca' : '#ccfbf1'}`
                    }}>
                      {isInactive ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                      {u.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '13px', color: '#475569' }}>
                    <span style={{ fontWeight: '600', color: isAdmin ? '#2563eb' : '#334155' }}>
                      {permCount}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="btn btn-ghost"
                        style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px' }}
                        title="Edit user & permissions"
                      >
                        <Edit size={15} /> Edit
                      </button>

                      {u.id !== 'USR-001' && (
                        <button
                          onClick={() => handleDelete(u)}
                          className="btn btn-ghost"
                          style={{ padding: '6px 10px', fontSize: '12px', color: '#dc2626', borderRadius: '6px' }}
                          title="Delete user"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '720px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                {editingUser ? `Edit User: @${editingUser.username}` : 'Add New Manager / User'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                {formError && (
                  <div style={{
                    padding: '12px 14px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    color: '#991b1b',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '18px'
                  }}>
                    {formError}
                  </div>
                )}

                {/* Grid Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Ali Khan"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Username *
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="e.g. ali_khan"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Password *
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Assign password"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      System Role *
                    </label>
                    <select
                      className="input"
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      disabled={editingUser?.id === 'USR-001'}
                    >
                      <option value="Manager">Manager (Custom Access)</option>
                      <option value="Admin">Admin (Full Access to All Modules)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Account Status *
                    </label>
                    <select
                      className="input"
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      disabled={editingUser?.id === 'USR-001'}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive (Deactivated)</option>
                    </select>
                  </div>
                </div>

                {/* Permission Matrix */}
                {role === 'Admin' ? (
                  <div style={{
                    padding: '16px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '10px',
                    color: '#1d4ed8',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <Shield size={20} />
                    <span>Admin role automatically grants full unrestricted permission to all current and future modules.</span>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '800',
                      color: '#0f172a',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span>Assign Module Access & Permissions</span>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        {permissions.length} Selected
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {PERMISSION_MODULES.filter(m => m.key !== 'system').map(category => {
                        const itemIds = category.items.map(i => i.id);
                        const isAllSelected = itemIds.every(id => permissions.includes(id));
                        const isSomeSelected = itemIds.some(id => permissions.includes(id));

                        return (
                          <div key={category.key} style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '14px 16px',
                            background: '#f8fafc'
                          }}>
                            {/* Category Header */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '12px',
                              paddingBottom: '8px',
                              borderBottom: '1px solid #cbd5e1'
                            }}>
                              <div>
                                <span style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b' }}>
                                  {category.label}
                                </span>
                                <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                                  ({category.description})
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleCategoryToggle(category.items)}
                                style={{
                                  background: isAllSelected ? '#ccfbf1' : '#ffffff',
                                  border: '1px solid #0d9488',
                                  color: '#0d9488',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                {isAllSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                                {isAllSelected ? 'Select None' : 'Select All'}
                              </button>
                            </div>

                            {/* Category Sub-items Grid */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                              gap: '10px'
                            }}>
                              {category.items.map(item => {
                                const checked = permissions.includes(item.id);
                                return (
                                  <label
                                    key={item.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      padding: '8px 10px',
                                      background: checked ? '#ffffff' : 'transparent',
                                      border: `1px solid ${checked ? '#0d9488' : '#e2e8f0'}`,
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      fontSize: '13px',
                                      fontWeight: checked ? '700' : '500',
                                      color: checked ? '#0f766e' : '#475569',
                                      transition: 'all 0.15s'
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => handleTogglePermission(item.id)}
                                      style={{ accentColor: '#0d9488', width: '16px', height: '16px' }}
                                    />
                                    <span>{item.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 24px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-teal"
                  style={{ padding: '8px 20px', fontWeight: '700' }}
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
