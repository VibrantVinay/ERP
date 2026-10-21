'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UserRecord, UserSummary, CreateUserDTO, UpdateUserDTO, UserAccountStatus } from '../types';
import { userApi } from '../api';

const ALL_ROLES = [
  'owner',
  'manager',
  'cashier',
  'chef',
  'server',
  'driver',
  'accountant',
  'cleaner',
  'bartender',
  'host',
];

const ROLE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  owner: { bg: '#fdf2f8', color: '#9d174d', border: '#fbcfe8' },
  manager: { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  chef: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  cashier: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  server: { bg: '#faf5ff', color: '#6b21a8', border: '#e9d5ff' },
  driver: { bg: '#fefce8', color: '#854d0e', border: '#fef08a' },
  accountant: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  cleaner: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  bartender: { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
  host: { bg: '#eef2ff', color: '#3730a3', border: '#c7d2fe' },
};

export function UserWorkspace() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Invite Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('server');
  const [branchId, setBranchId] = useState('branch-ind');

  const loadData = async () => {
    try {
      setLoading(true);
      const [userList, summaryData] = await Promise.all([
        userApi.getUsers({ role: roleFilter, status: statusFilter }),
        userApi.getSummary(),
      ]);
      setUsers(userList);
      setSummary(summaryData);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to load user accounts' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleFilter, statusFilter]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !role || !branchId) {
      showToast('Please fill out all required fields', 'error');
      return;
    }

    try {
      const dto: CreateUserDTO = {
        name,
        email,
        phone,
        role,
        branchId,
        branchName:
          branchId === 'branch-ind'
            ? 'Indiranagar Flagship'
            : branchId === 'branch-kor'
            ? 'Koramangala Bistro'
            : 'Whitefield Express',
      };

      await userApi.createUser(dto);
      showToast(`User account for "${name}" created successfully!`);
      setIsInviteOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create user', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const dto: UpdateUserDTO = {
        name: editingUser.name,
        phone: editingUser.phone,
        role: editingUser.role,
        branchId: editingUser.branchId,
        branchName:
          editingUser.branchId === 'branch-ind'
            ? 'Indiranagar Flagship'
            : editingUser.branchId === 'branch-kor'
            ? 'Koramangala Bistro'
            : 'Whitefield Express',
        status: editingUser.status,
      };

      await userApi.updateUser(editingUser.id, dto);
      showToast(`Updated user profile for "${editingUser.name}".`);
      setEditingUser(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user', 'error');
    }
  };

  const handleToggleStatus = async (user: UserRecord) => {
    const nextStatus: UserAccountStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await userApi.updateUser(user.id, { status: nextStatus });
      showToast(`Account "${user.name}" marked as ${nextStatus}.`);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user status', 'error');
    }
  };

  const handleDelete = async (user: UserRecord) => {
    if (!confirm(`Are you sure you want to remove user "${user.name}"?`)) return;
    try {
      await userApi.deleteUser(user.id);
      showToast(`User "${user.name}" removed from organization.`);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user', 'error');
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        u.branchName.toLowerCase().includes(q);
      return matchSearch;
    });
  }, [users, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.6rem' }}>👤</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
              Users, RBAC & Permissions
            </h1>
          </div>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Enterprise staff directory, granular role-based route governance, and security credentials.
          </p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '0.65rem 1.25rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          <span>＋</span> Add New Staff Account
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            padding: '0.85rem 1.2rem',
            borderRadius: 'var(--radius-md)',
            background: notification.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: notification.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${notification.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            fontSize: '0.9rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <span>{notification.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Personnel
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--text)' }}>
            {summary ? summary.totalUsers : '—'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Enrolled organization accounts
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Active Accounts
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.4rem', color: '#10b981' }}>
            {summary ? summary.activeUsers : '—'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Authorized & active credentials
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Suspended / Inactive
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.4rem', color: '#ef4444' }}>
            {summary ? summary.suspendedUsers : '0'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Access temporarily revoked
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Active Roles
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--primary)' }}>
            {summary ? summary.rolesCount : '—'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Configured RBAC permissions
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 300px' }}>
          <input
            type="text"
            placeholder="Search team member name, email, phone, or outlet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '0.9rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: '0.5rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              <option value="all">All Roles</option>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.5rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading user directory...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No users match the criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    User / Identity
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    RBAC Role
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    Assigned Outlet
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    Contact Phone
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    Status
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'right' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const roleStyle = ROLE_COLORS[u.role] || { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
                  const isSuspended = u.status === 'suspended';

                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: isSuspended ? 'rgba(239,68,68,0.03)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: 'var(--primary)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                            }}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text)' }}>{u.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '999px',
                            background: roleStyle.bg,
                            color: roleStyle.color,
                            border: `1px solid ${roleStyle.border}`,
                          }}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text)' }}>
                        <div style={{ fontWeight: 500 }}>{u.branchName}</div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)' }}>
                        {u.phone}
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '999px',
                            background: u.status === 'active' ? '#ecfdf5' : '#fef2f2',
                            color: u.status === 'active' ? '#059669' : '#dc2626',
                            border: `1px solid ${u.status === 'active' ? '#a7f3d0' : '#fecaca'}`,
                          }}
                        >
                          {u.status}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => setEditingUser(u)}
                            title="Edit User"
                            style={{
                              padding: '0.35rem 0.7rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border)',
                              background: 'var(--surface)',
                              color: 'var(--text)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            ✏️ Edit
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            title={u.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                            style={{
                              padding: '0.35rem 0.7rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid',
                              borderColor: u.status === 'active' ? '#fca5a5' : '#86efac',
                              background: u.status === 'active' ? '#fef2f2' : '#ecfdf5',
                              color: u.status === 'active' ? '#dc2626' : '#16a34a',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {u.status === 'active' ? '⛔ Suspend' : '✓ Activate'}
                          </button>

                          <button
                            onClick={() => handleDelete(u)}
                            title="Delete User"
                            style={{
                              padding: '0.35rem 0.6rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border)',
                              background: 'transparent',
                              color: 'var(--text-muted)',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add New User */}
      {isInviteOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: '520px',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>
                👤 Add Staff Account & RBAC
              </h2>
              <button
                onClick={() => setIsInviteOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh@rift-erp.internal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98450 11099"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>RBAC Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem', textTransform: 'capitalize' }}
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Assigned Outlet *</label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  >
                    <option value="branch-ind">Indiranagar Flagship</option>
                    <option value="branch-kor">Koramangala Bistro</option>
                    <option value="branch-whf">Whitefield Express</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.4rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {editingUser && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: '520px',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>
                ✏️ Edit Staff Account: {editingUser.name}
              </h2>
              <button
                onClick={() => setEditingUser(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Full Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Phone Number</label>
                <input
                  type="text"
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>RBAC Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem', textTransform: 'capitalize' }}
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Outlet</label>
                  <select
                    value={editingUser.branchId}
                    onChange={(e) => setEditingUser({ ...editingUser, branchId: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  >
                    <option value="branch-ind">Indiranagar Flagship</option>
                    <option value="branch-kor">Koramangala Bistro</option>
                    <option value="branch-whf">Whitefield Express</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Account Status</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as UserAccountStatus })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                >
                  <option value="active">Active (Access Allowed)</option>
                  <option value="suspended">Suspended (Access Revoked)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.4rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
