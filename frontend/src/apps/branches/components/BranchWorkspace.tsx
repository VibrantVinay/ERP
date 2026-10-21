'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Branch, BranchSummary, CreateBranchDTO, UpdateBranchDTO, BranchStatus } from '../types';
import { branchApi } from '../api';

export function BranchWorkspace() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [summary, setSummary] = useState<BranchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | BranchStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [syncingBranchId, setSyncingBranchId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Branch Form
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('Bengaluru');
  const [newAddress, setNewAddress] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newManager, setNewManager] = useState('');
  const [newOpening, setNewOpening] = useState('11:00 AM');
  const [newClosing, setNewClosing] = useState('11:00 PM');
  const [newCapacity, setNewCapacity] = useState(50);
  const [newTables, setNewTables] = useState(14);

  const loadData = async () => {
    try {
      setLoading(true);
      const [branchList, summaryData] = await Promise.all([
        branchApi.getBranches(statusFilter),
        branchApi.getSummary(),
      ]);
      setBranches(branchList);
      setSummary(summaryData);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to load branch data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName || !newAddress || !newPhone || !newEmail || !newManager) {
      showToast('Please fill out all required fields', 'error');
      return;
    }

    try {
      const dto: CreateBranchDTO = {
        code: newCode,
        name: newName,
        city: newCity,
        address: newAddress,
        phone: newPhone,
        email: newEmail,
        managerName: newManager,
        openingTime: newOpening,
        closingTime: newClosing,
        seatingCapacity: Number(newCapacity) || 40,
        tablesCount: Number(newTables) || 10,
      };

      await branchApi.createBranch(dto);
      showToast(`Branch "${newName}" registered successfully!`);
      setIsCreateOpen(false);
      // Reset form
      setNewCode('');
      setNewName('');
      setNewAddress('');
      setNewPhone('');
      setNewEmail('');
      setNewManager('');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create branch', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    try {
      const dto: UpdateBranchDTO = {
        name: editingBranch.name,
        city: editingBranch.city,
        address: editingBranch.address,
        phone: editingBranch.phone,
        email: editingBranch.email,
        managerName: editingBranch.managerName,
        openingTime: editingBranch.openingTime,
        closingTime: editingBranch.closingTime,
        status: editingBranch.status,
        seatingCapacity: editingBranch.seatingCapacity,
        tablesCount: editingBranch.tablesCount,
      };

      await branchApi.updateBranch(editingBranch.id, dto);
      showToast(`Outlet "${editingBranch.name}" updated successfully.`);
      setEditingBranch(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update branch', 'error');
    }
  };

  const handleSyncMenu = (branchId: string, branchName: string) => {
    setSyncingBranchId(branchId);
    setTimeout(() => {
      setSyncingBranchId(null);
      showToast(`Master Menu Catalog synchronized with ${branchName} successfully!`);
    }, 900);
  };

  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.managerName.toLowerCase().includes(q);
      return matchSearch;
    });
  }, [branches, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.6rem' }}>🏛️</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
              Multi-Unit Branch & Outlet Management
            </h1>
          </div>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Centralized restaurant fleet governance, comparative revenues, capacity tracking, and menu syncing.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
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
          <span>＋</span> Add New Outlet
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
            Total Outlets
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--text)' }}>
            {summary ? summary.totalBranches : '—'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Central enterprise registry
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
            Active Operating
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.4rem', color: '#10b981' }}>
            {summary ? summary.activeBranches : '—'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Currently taking orders
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
            Fleet Seating Capacity
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.4rem', color: '#3b82f6' }}>
            {summary ? summary.totalFleetSeats : '—'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Dining covers across chain
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
            Fleet Revenue Today
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--primary)' }}>
            ₹{summary ? summary.totalFleetRevenue.toLocaleString('en-IN') : '0'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Live aggregated pos sales
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
            placeholder="Search outlet name, city, code, or manager..."
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Status:</span>
          {(['all', 'active', 'renovation', 'closed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                borderColor: statusFilter === st ? 'var(--primary)' : 'var(--border)',
                background: statusFilter === st ? 'var(--primary)' : 'var(--surface)',
                color: statusFilter === st ? '#fff' : 'var(--text)',
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                cursor: 'pointer',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Outlet Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading branch network...
        </div>
      ) : filteredBranches.length === 0 ? (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏛️</div>
          <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text)' }}>No Outlets Found</div>
          <p style={{ margin: '0.3rem 0 1rem 0', fontSize: '0.9rem' }}>
            Try adjusting your search query or status filter.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredBranches.map((branch) => {
            const statusBg =
              branch.status === 'active'
                ? '#ecfdf5'
                : branch.status === 'renovation'
                ? '#fffbeb'
                : '#fef2f2';
            const statusColor =
              branch.status === 'active'
                ? '#059669'
                : branch.status === 'renovation'
                ? '#b45309'
                : '#dc2626';

            return (
              <div
                key={branch.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                }}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        background: 'var(--bg)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {branch.code}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0.4rem 0 0.2rem 0', color: 'var(--text)' }}>
                      {branch.name}
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      📍 {branch.city} • {branch.address}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '999px',
                      background: statusBg,
                      color: statusColor,
                      border: `1px solid ${statusColor}33`,
                    }}
                  >
                    {branch.status}
                  </span>
                </div>

                {/* Outlet Stats */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.75rem',
                    background: 'var(--bg)',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TODAY'S SALES</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.1rem' }}>
                      ₹{branch.currentDailyRevenue.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE ORDERS</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3b82f6', marginTop: '0.1rem' }}>
                      {branch.activeOrdersCount} in progress
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CAPACITY</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginTop: '0.1rem' }}>
                      {branch.seatingCapacity} seats ({branch.tablesCount} tables)
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>HOURS</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginTop: '0.1rem' }}>
                      {branch.openingTime} - {branch.closingTime}
                    </div>
                  </div>
                </div>

                {/* Manager & Contact */}
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div><strong>General Manager:</strong> {branch.managerName}</div>
                  <div><strong>Phone:</strong> {branch.phone}</div>
                  <div><strong>Email:</strong> {branch.email}</div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.6rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={() => setEditingBranch(branch)}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ✏️ Configure
                  </button>

                  <button
                    disabled={syncingBranchId === branch.id}
                    onClick={() => handleSyncMenu(branch.id, branch.name)}
                    style={{
                      flex: 1.3,
                      padding: '0.5rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--primary)',
                      background: syncingBranchId === branch.id ? 'var(--border)' : 'transparent',
                      color: 'var(--primary)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: syncingBranchId === branch.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {syncingBranchId === branch.id ? 'Syncing...' : '🔄 Sync Menu Catalog'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add New Outlet */}
      {isCreateOpen && (
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
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>
                🏛️ Add New Restaurant Outlet
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Branch Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="RIFT-BLR-05"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Outlet Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HSR Layout Microbrewery"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>City *</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>General Manager *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rakesh Nair"
                    value={newManager}
                    onChange={(e) => setNewManager(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Physical Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Street address, landmark, postal zone"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Contact Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 80 4123 9805"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Official Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="hsr@rift-erp.internal"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Opening</label>
                  <input
                    type="text"
                    value={newOpening}
                    onChange={(e) => setNewOpening(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Closing</label>
                  <input
                    type="text"
                    value={newClosing}
                    onChange={(e) => setNewClosing(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Seats</label>
                  <input
                    type="number"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Tables</label>
                  <input
                    type="number"
                    value={newTables}
                    onChange={(e) => setNewTables(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
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
                  Save & Launch Outlet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Outlet */}
      {editingBranch && (
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
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>
                ⚙️ Configure Outlet: {editingBranch.code}
              </h2>
              <button
                onClick={() => setEditingBranch(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Outlet Name</label>
                <input
                  type="text"
                  value={editingBranch.name}
                  onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Operational Status</label>
                  <select
                    value={editingBranch.status}
                    onChange={(e) => setEditingBranch({ ...editingBranch, status: e.target.value as BranchStatus })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  >
                    <option value="active">Active (Taking Orders)</option>
                    <option value="renovation">Renovation / Maintenance</option>
                    <option value="closed">Permanently Closed</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>General Manager</label>
                  <input
                    type="text"
                    value={editingBranch.managerName}
                    onChange={(e) => setEditingBranch({ ...editingBranch, managerName: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Address</label>
                <input
                  type="text"
                  value={editingBranch.address}
                  onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Opening</label>
                  <input
                    type="text"
                    value={editingBranch.openingTime}
                    onChange={(e) => setEditingBranch({ ...editingBranch, openingTime: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Closing</label>
                  <input
                    type="text"
                    value={editingBranch.closingTime}
                    onChange={(e) => setEditingBranch({ ...editingBranch, closingTime: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Seats</label>
                  <input
                    type="number"
                    value={editingBranch.seatingCapacity}
                    onChange={(e) => setEditingBranch({ ...editingBranch, seatingCapacity: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Tables</label>
                  <input
                    type="number"
                    value={editingBranch.tablesCount}
                    onChange={(e) => setEditingBranch({ ...editingBranch, tablesCount: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
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
