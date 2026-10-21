'use client';

import React, { useState, useEffect } from 'react';
import { equipmentApi } from '../api';
import { EquipmentAsset, BreakdownTicket, EquipmentStatus, MaintenancePriority } from '../types';
import { useAuth } from '@/apps/auth/context/AuthContext';

export function EquipmentWorkspace() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'assets' | 'tickets'>('assets');

  // State
  const [equipment, setEquipment] = useState<EquipmentAsset[]>([]);
  const [tickets, setTickets] = useState<BreakdownTicket[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Equipment Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Cooking');
  const [newLocation, setNewLocation] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [newInterval, setNewInterval] = useState('90');
  const [newTechContact, setNewTechContact] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Breakdown Ticket Modal
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [selectedEquipId, setSelectedEquipId] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [ticketPriority, setTicketPriority] = useState<MaintenancePriority>('high');

  // Log PM Modal
  const [pmEquipId, setPmEquipId] = useState<string | null>(null);
  const [pmTechName, setPmTechName] = useState('');
  const [pmCost, setPmCost] = useState('');
  const [pmNotes, setPmNotes] = useState('');

  // Resolve Ticket Modal
  const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);
  const [resolveTech, setResolveTech] = useState('');
  const [resolveCost, setResolveCost] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [resolveNotes, setResolveNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [categoryFilter, statusFilter]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [eqData, ticketData] = await Promise.all([
        equipmentApi.getEquipment({
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
        equipmentApi.getBreakdownTickets(),
      ]);
      setEquipment(eqData);
      setTickets(ticketData);
      if (eqData.length > 0 && !selectedEquipId) {
        setSelectedEquipId(eqData[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load equipment assets');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddEquipment(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newLocation.trim()) return;
    try {
      await equipmentApi.createEquipment({
        branchId: 'main-branch',
        name: newName.trim(),
        category: newCategory,
        location: newLocation.trim(),
        serialNumber: newSerial.trim() || undefined,
        serviceIntervalDays: parseInt(newInterval, 10) || 90,
        technicianContact: newTechContact.trim() || undefined,
        notes: newNotes.trim() || undefined,
      });
      setShowAddModal(false);
      setNewName('');
      setNewLocation('');
      setNewSerial('');
      await loadData();
    } catch (err: any) {
      alert(`Error creating asset: ${err.message}`);
    }
  }

  async function handleCreateBreakdown(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEquipId || !issueDesc.trim()) return;
    try {
      await equipmentApi.createBreakdownTicket({
        branchId: 'main-branch',
        equipmentId: selectedEquipId,
        reportedBy: user?.name || 'Kitchen Staff',
        issueDescription: issueDesc.trim(),
        priority: ticketPriority,
      });
      setShowBreakdownModal(false);
      setIssueDesc('');
      await loadData();
    } catch (err: any) {
      alert(`Error submitting breakdown: ${err.message}`);
    }
  }

  async function handleLogPM(e: React.FormEvent) {
    e.preventDefault();
    if (!pmEquipId || !pmTechName.trim()) return;
    try {
      await equipmentApi.logMaintenance(pmEquipId, {
        serviceDate: new Date().toISOString().slice(0, 10),
        technicianName: pmTechName.trim(),
        cost: pmCost ? parseFloat(pmCost) : undefined,
        notes: pmNotes.trim() || undefined,
      });
      setPmEquipId(null);
      setPmTechName('');
      setPmCost('');
      setPmNotes('');
      await loadData();
    } catch (err: any) {
      alert(`Error logging maintenance: ${err.message}`);
    }
  }

  async function handleResolveTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!resolvingTicketId || !resolveTech.trim()) return;
    try {
      await equipmentApi.resolveTicket(resolvingTicketId, {
        technicianName: resolveTech.trim(),
        serviceCost: resolveCost ? parseFloat(resolveCost) : undefined,
        partsReplaced: partsUsed.trim() || undefined,
        notes: resolveNotes.trim() || undefined,
      });
      setResolvingTicketId(null);
      setResolveTech('');
      setResolveCost('');
      setPartsUsed('');
      setResolveNotes('');
      await loadData();
    } catch (err: any) {
      alert(`Error resolving ticket: ${err.message}`);
    }
  }

  // Quick status toggle
  async function handleStatusChange(id: string, status: EquipmentStatus) {
    try {
      await equipmentApi.updateStatus(id, status);
      await loadData();
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  }

  // Metrics
  const totalAssets = equipment.length;
  const operationalAssets = equipment.filter(e => e.status === 'operational').length;
  const uptime = totalAssets > 0 ? Math.round((operationalAssets / totalAssets) * 100) : 100;
  const activeBreakdowns = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const totalCost = tickets.reduce((sum, t) => sum + (t.serviceCost || 0), 0);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            ⚙️ Kitchen Equipment Care & Maintenance
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Preventive service scheduling, breakdown dispatch, warranty tracking, and kitchen asset health.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowBreakdownModal(true)}
            style={{
              padding: '0.6rem 1rem',
              backgroundColor: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>🚨</span> Report Breakdown
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '0.6rem 1.2rem',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>+</span> Add Equipment
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.2rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fleet Health & Uptime</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.25rem', color: uptime >= 90 ? '#10b981' : '#f59e0b' }}>
            {uptime}% <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>({operationalAssets}/{totalAssets} online)</span>
          </div>
          <div style={{ marginTop: '0.5rem', background: '#e2e8f0', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${uptime}%`, height: '100%', background: uptime >= 90 ? '#10b981' : '#f59e0b', transition: 'width 0.3s' }} />
          </div>
        </div>

        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.2rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Breakdown Tickets</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.25rem', color: activeBreakdowns > 0 ? '#ef4444' : '#10b981' }}>
            {activeBreakdowns} {activeBreakdowns > 0 ? 'Action Required' : 'All Clear'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Under repair or waiting tech</div>
        </div>

        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.2rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Maintenance Spend</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
            ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Parts & specialized technician labour</div>
        </div>

        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.2rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active User</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
            {user?.name || 'Chef Operations'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'capitalize' }}>Role: {user?.role || 'staff'}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('assets')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'assets' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'assets' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'assets' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
          }}
        >
          🏭 Asset Fleet Inventory ({equipment.length})
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'tickets' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'tickets' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'tickets' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
          }}
        >
          🚨 Breakdown & Repair Tickets ({tickets.length})
        </button>
      </div>

      {/* Tab 1: Asset Catalog */}
      {activeTab === 'assets' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Category:</span>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
              >
                <option value="all">All Categories</option>
                <option value="Cooking">Cooking & Heat</option>
                <option value="Refrigeration">Cold Storage & Chilling</option>
                <option value="Warewashing">Dishwashing & Sanitizing</option>
                <option value="Beverage">Beverage & Espresso</option>
                <option value="HVAC">Ventilation & HVAC</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
              >
                <option value="all">All Statuses</option>
                <option value="operational">Operational</option>
                <option value="needs_maintenance">Needs Maintenance</option>
                <option value="under_repair">Under Repair</option>
                <option value="decommissioned">Decommissioned</option>
              </select>
            </div>
          </div>

          {/* Asset Grid */}
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading kitchen equipment...</div>
          ) : equipment.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>No equipment assets found.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
              {equipment.map(item => {
                const isOp = item.status === 'operational';
                const isUnderRepair = item.status === 'under_repair';
                const isNeedsMaint = item.status === 'needs_maintenance';

                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--card-bg, #fff)',
                      border: `1px solid ${isUnderRepair ? '#f87171' : isNeedsMaint ? '#fcd34d' : 'var(--border)'}`,
                      borderRadius: '8px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                            {item.category} • {item.location}
                          </div>
                          <h3 style={{ margin: '0.25rem 0 0.5rem', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.name}
                          </h3>
                        </div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                            background: isOp ? '#dcfce7' : isUnderRepair ? '#fee2e2' : '#fef3c7',
                            color: isOp ? '#15803d' : isUnderRepair ? '#b91c1c' : '#b45309',
                            textTransform: 'capitalize',
                          }}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>

                      {item.serialNumber && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          Serial: <code>{item.serialNumber}</code>
                        </div>
                      )}

                      <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: '#f8fafc', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <div>Last Service: <strong>{item.lastServiceDate || 'N/A'}</strong></div>
                        <div>Next Due: <strong style={{ color: '#d97706' }}>{item.nextServiceDate || 'N/A'}</strong> (every {item.serviceIntervalDays}d)</div>
                        {item.technicianContact && <div>Support: {item.technicianContact}</div>}
                      </div>

                      {item.notes && (
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          "{item.notes}"
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                      <button
                        onClick={() => {
                          setPmEquipId(item.id);
                          setPmTechName(item.technicianContact?.split('(')[0]?.trim() || 'Internal Tech');
                        }}
                        style={{
                          flex: 1,
                          padding: '0.45rem',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          backgroundColor: '#10b981',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                        }}
                      >
                        ✓ Log Service PM
                      </button>

                      <button
                        onClick={() => {
                          setSelectedEquipId(item.id);
                          setShowBreakdownModal(true);
                        }}
                        style={{
                          padding: '0.45rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                        }}
                      >
                        🚨 Breakdown
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Breakdown Tickets */}
      {activeTab === 'tickets' && (
        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Kitchen Asset Breakdown Log</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sorted newest first</span>
          </div>

          {tickets.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No breakdown tickets logged.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tickets.map(ticket => {
                const isResolved = ticket.status === 'resolved';

                return (
                  <div
                    key={ticket.id}
                    style={{
                      border: `1px solid ${ticket.priority === 'urgent' && !isResolved ? '#f87171' : 'var(--border)'}`,
                      borderRadius: '8px',
                      padding: '1rem',
                      background: ticket.priority === 'urgent' && !isResolved ? '#fef2f2' : 'transparent',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
                          {ticket.equipmentName}
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                            background: ticket.priority === 'urgent' ? '#fee2e2' : '#fef3c7',
                            color: ticket.priority === 'urgent' ? '#b91c1c' : '#b45309',
                          }}
                        >
                          {ticket.priority.toUpperCase()}
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                            background: isResolved ? '#dcfce7' : '#e0e7ff',
                            color: isResolved ? '#15803d' : '#3730a3',
                            textTransform: 'capitalize',
                          }}
                        >
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>

                      <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {ticket.issueDescription}
                      </p>

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>Reported by: <strong>{ticket.reportedBy}</strong></span>
                        {ticket.technicianName && <span>Assigned Tech: <strong>{ticket.technicianName}</strong></span>}
                        {ticket.serviceCost ? <span>Cost: <strong style={{ color: '#059669' }}>${ticket.serviceCost.toFixed(2)}</strong></span> : null}
                        {ticket.partsReplaced && <span>Parts: <em>{ticket.partsReplaced}</em></span>}
                      </div>
                    </div>

                    <div>
                      {!isResolved ? (
                        <button
                          onClick={() => {
                            setResolvingTicketId(ticket.id);
                            setResolveTech(ticket.technicianName || '');
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                        >
                          Mark Resolved
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 600 }}>
                          ✓ Resolved {ticket.resolvedAt ? `(${ticket.resolvedAt.slice(0, 10)})` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Equipment */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--card-bg, #fff)', width: '100%', maxWidth: '500px', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: 600 }}>Register New Kitchen Asset</h3>
            <form onSubmit={handleAddEquipment} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Equipment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rational iCombi Pro 6-Grid"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                  >
                    <option value="Cooking">Cooking</option>
                    <option value="Refrigeration">Refrigeration</option>
                    <option value="Warewashing">Warewashing</option>
                    <option value="Beverage">Beverage</option>
                    <option value="HVAC">HVAC</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Line Station 1"
                    value={newLocation}
                    onChange={e => setNewLocation(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Serial Number</label>
                  <input
                    type="text"
                    placeholder="SN-XXXX"
                    value={newSerial}
                    onChange={e => setNewSerial(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Service Cycle (Days)</label>
                  <input
                    type="number"
                    value={newInterval}
                    onChange={e => setNewInterval(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Authorized Technician / Support Contact</label>
                <input
                  type="text"
                  placeholder="e.g. Hobart Support (+1-800-555-1234)"
                  value={newTechContact}
                  onChange={e => setNewTechContact(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', background: 'transparent', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Report Breakdown */}
      {showBreakdownModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--card-bg, #fff)', width: '100%', maxWidth: '450px', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 600, color: '#dc2626' }}>🚨 Report Equipment Breakdown</h3>
            <form onSubmit={handleCreateBreakdown} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Select Impacted Asset *</label>
                <select
                  value={selectedEquipId}
                  onChange={e => setSelectedEquipId(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                >
                  {equipment.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Urgency Level</label>
                <select
                  value={ticketPriority}
                  onChange={e => setTicketPriority(e.target.value as MaintenancePriority)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                >
                  <option value="low">Low (Non-urgent cosmetic)</option>
                  <option value="medium">Medium (Reduced capacity)</option>
                  <option value="high">High (Station halted)</option>
                  <option value="urgent">Urgent (Entire service stopped)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Issue Description & Symptoms *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe error code, strange noise, failure to heat/cool..."
                  value={issueDesc}
                  onChange={e => setIssueDesc(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowBreakdownModal(false)}
                  style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', background: 'transparent', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Dispatch Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log PM Service */}
      {pmEquipId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--card-bg, #fff)', width: '100%', maxWidth: '450px', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 600 }}>Log Preventive Maintenance (PM)</h3>
            <form onSubmit={handleLogPM} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Technician / Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={pmTechName}
                  onChange={e => setPmTechName(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Service Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={pmCost}
                  onChange={e => setPmCost(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Service Check Details</label>
                <textarea
                  rows={2}
                  placeholder="Filter replaced, seals sanitized, calibration complete..."
                  value={pmNotes}
                  onChange={e => setPmNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setPmEquipId(null)}
                  style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', background: 'transparent', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Verify PM & Reset Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Resolve Ticket */}
      {resolvingTicketId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--card-bg, #fff)', width: '100%', maxWidth: '450px', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 600 }}>Resolve Breakdown Ticket</h3>
            <form onSubmit={handleResolveTicket} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Servicing Technician *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kevin Patel (Apex Tech)"
                  value={resolveTech}
                  onChange={e => setResolveTech(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Invoice Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    value={resolveCost}
                    onChange={e => setResolveCost(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Parts Replaced</label>
                  <input
                    type="text"
                    placeholder="Gasket, Solenoid..."
                    value={partsUsed}
                    onChange={e => setPartsUsed(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Resolution Notes</label>
                <textarea
                  rows={2}
                  placeholder="Diagnostic observations, warranty coverage..."
                  value={resolveNotes}
                  onChange={e => setResolveNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setResolvingTicketId(null)}
                  style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', background: 'transparent', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Confirm & Reopen Machine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

