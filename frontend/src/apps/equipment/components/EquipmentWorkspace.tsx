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
      setEquipment(eqData || []);
      setTickets(ticketData || []);
      if (eqData && eqData.length > 0 && !selectedEquipId) {
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

  // Metrics
  const totalAssets = equipment.length;
  const operationalAssets = equipment.filter(e => e.status === 'operational').length;
  const uptime = totalAssets > 0 ? Math.round((operationalAssets / totalAssets) * 100) : 100;
  const activeBreakdowns = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const totalCost = tickets.reduce((sum, t) => sum + (t.serviceCost || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        paddingBottom: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(59, 130, 246, 0.12)',
            color: '#3b82f6',
            fontSize: '1.25rem',
            border: '1px solid rgba(59, 130, 246, 0.25)',
          }}>
            ⚙️
          </span>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              Kitchen Equipment Care & Maintenance
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Preventive maintenance cycles, emergency breakdown dispatches, warranty tracking, and kitchen uptime
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setShowBreakdownModal(true)}
            style={{
              padding: '0.6rem 1.1rem',
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)',
            }}
          >
            <span>🚨</span> Report Breakdown
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '0.6rem 1.2rem',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
            }}
          >
            <span>+</span> Add Equipment
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
      }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.1rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em' }}>
            Kitchen Fleet Health
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: uptime >= 90 ? '#10b981' : '#f59e0b', margin: '0.35rem 0 0.15rem' }}>
            {uptime}% <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>({operationalAssets}/{totalAssets} online)</span>
          </p>
          <div style={{ marginTop: '0.5rem', background: 'var(--bg)', borderRadius: '9999px', height: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ width: `${uptime}%`, height: '100%', background: uptime >= 90 ? '#10b981' : '#f59e0b', transition: 'width 0.3s' }} />
          </div>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.1rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em' }}>
            Active Breakdown Tickets
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: activeBreakdowns > 0 ? '#ef4444' : '#10b981', margin: '0.35rem 0 0.15rem' }}>
            {activeBreakdowns} {activeBreakdowns > 0 ? 'Action Required' : 'All Clear'}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Under active repair or technician dispatch
          </span>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.1rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em' }}>
            Total Maintenance Cost
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f87171', margin: '0.35rem 0 0.15rem' }}>
            ₹{totalCost.toLocaleString('en-IN')}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Parts, technician labor & PM service
          </span>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.1rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em' }}>
            On-Duty Manager
          </p>
          <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', margin: '0.35rem 0 0.15rem' }}>
            {user?.name || 'Chef Operations'}
          </p>
          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, textTransform: 'capitalize' }}>
            ● Verified Active Session
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('assets')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'assets' ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid transparent',
              background: activeTab === 'assets' ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
              color: activeTab === 'assets' ? '#f97316' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            🏭 Equipment Catalog ({equipment.length})
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'tickets' ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid transparent',
              background: activeTab === 'tickets' ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
              color: activeTab === 'tickets' ? '#f97316' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            🚨 Breakdown & Repair Tickets ({tickets.length})
          </button>
        </div>

        {activeTab === 'assets' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Category:</span>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text)',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              >
                <option value="all">All Categories</option>
                <option value="Cooking">Cooking & Heat</option>
                <option value="Refrigeration">Cold Storage & Chilling</option>
                <option value="Warewashing">Dishwashing & Sanitizing</option>
                <option value="Beverage">Beverage & Espresso</option>
                <option value="HVAC">Ventilation & HVAC</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text)',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              >
                <option value="all">All Statuses</option>
                <option value="operational">Operational</option>
                <option value="needs_maintenance">Needs Maintenance</option>
                <option value="under_repair">Under Repair</option>
                <option value="decommissioned">Decommissioned</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: Asset Catalog */}
      {activeTab === 'assets' && (
        <div>
          {loading ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}>
              Loading kitchen equipment catalog...
            </div>
          ) : equipment.length === 0 ? (
            <div style={{
              padding: '2.5rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}>
              No equipment assets found matching criteria.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1rem',
            }}>
              {equipment.map(item => {
                const isOp = item.status === 'operational';
                const isUnderRepair = item.status === 'under_repair';
                const isNeedsMaint = item.status === 'needs_maintenance';

                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--surface)',
                      border: `1px solid ${isUnderRepair ? 'rgba(239, 68, 68, 0.4)' : isNeedsMaint ? 'rgba(245, 158, 11, 0.4)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: 'var(--shadow-sm)',
                      gap: '0.85rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                            {item.category} • {item.location}
                          </div>
                          <h3 style={{ margin: '0.25rem 0 0.35rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)' }}>
                            {item.name}
                          </h3>
                        </div>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            fontWeight: 600,
                            background: isOp ? 'rgba(16, 185, 129, 0.12)' : isUnderRepair ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: isOp ? '#10b981' : isUnderRepair ? '#ef4444' : '#f59e0b',
                            border: `1px solid ${isOp ? 'rgba(16, 185, 129, 0.3)' : isUnderRepair ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                            textTransform: 'capitalize',
                          }}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>

                      {item.serialNumber && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Serial: <span style={{ fontFamily: 'monospace', color: 'var(--text)' }}>{item.serialNumber}</span>
                        </div>
                      )}

                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.65rem',
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Last Service:</span>
                          <strong style={{ color: 'var(--text)' }}>{item.lastServiceDate || 'N/A'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Next Due:</span>
                          <strong style={{ color: '#f59e0b' }}>{item.nextServiceDate || 'N/A'} (every {item.serviceIntervalDays}d)</strong>
                        </div>
                        {item.technicianContact && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.25rem', borderTop: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Tech Support:</span>
                            <span style={{ color: 'var(--text)', fontWeight: 500 }}>{item.technicianContact}</span>
                          </div>
                        )}
                      </div>

                      {item.notes && (
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          "{item.notes}"
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
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
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
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
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
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
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)' }}>
              Kitchen Asset Breakdown Log
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sorted newest first</span>
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
                      border: `1px solid ${ticket.priority === 'urgent' && !isResolved ? 'rgba(239, 68, 68, 0.4)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '1rem',
                      background: ticket.priority === 'urgent' && !isResolved ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                          {ticket.equipmentName}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: 700,
                            background: ticket.priority === 'urgent' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: ticket.priority === 'urgent' ? '#ef4444' : '#f59e0b',
                            border: `1px solid ${ticket.priority === 'urgent' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                          }}
                        >
                          {ticket.priority.toUpperCase()}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                            background: isResolved ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                            color: isResolved ? '#10b981' : '#60a5fa',
                            border: `1px solid ${isResolved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                            textTransform: 'capitalize',
                          }}
                        >
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>

                      <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {ticket.issueDescription}
                      </p>

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>Reported by: <strong style={{ color: 'var(--text)' }}>{ticket.reportedBy}</strong></span>
                        {ticket.technicianName && <span>Assigned Tech: <strong style={{ color: 'var(--text)' }}>{ticket.technicianName}</strong></span>}
                        {ticket.serviceCost ? <span>Cost: <strong style={{ color: '#10b981' }}>₹{ticket.serviceCost.toLocaleString('en-IN')}</strong></span> : null}
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
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          Mark Resolved
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
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
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            background: 'var(--surface)',
            width: '100%',
            maxWidth: '500px',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
              Register New Kitchen Asset
            </h3>
            <form onSubmit={handleAddEquipment} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Equipment Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rational iCombi Pro 6-Grid"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.55rem 0.65rem',
                      color: 'var(--text)',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Cooking">Cooking</option>
                    <option value="Refrigeration">Refrigeration</option>
                    <option value="Warewashing">Warewashing</option>
                    <option value="Beverage">Beverage</option>
                    <option value="HVAC">HVAC</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Line Station 1"
                    value={newLocation}
                    onChange={e => setNewLocation(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.55rem 0.65rem',
                      color: 'var(--text)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Serial Number
                  </label>
                  <input
                    type="text"
                    placeholder="SN-XXXX"
                    value={newSerial}
                    onChange={e => setNewSerial(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.55rem 0.65rem',
                      color: 'var(--text)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Service Cycle (Days)
                  </label>
                  <input
                    type="number"
                    value={newInterval}
                    onChange={e => setNewInterval(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.55rem 0.65rem',
                      color: 'var(--text)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Authorized Technician / Support Contact
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hobart Support (+91 98200 12345)"
                  value={newTechContact}
                  onChange={e => setNewTechContact(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '0.55rem 1rem',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.55rem 1.25rem',
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                  }}
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
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            background: 'var(--surface)',
            width: '100%',
            maxWidth: '450px',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 700, color: '#dc2626' }}>
              🚨 Report Equipment Breakdown
            </h3>
            <form onSubmit={handleCreateBreakdown} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Select Impacted Asset *
                </label>
                <select
                  value={selectedEquipId}
                  onChange={e => setSelectedEquipId(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  {equipment.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Urgency Level
                </label>
                <select
                  value={ticketPriority}
                  onChange={e => setTicketPriority(e.target.value as MaintenancePriority)}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="low">Low (Non-urgent cosmetic)</option>
                  <option value="medium">Medium (Reduced capacity)</option>
                  <option value="high">High (Station halted)</option>
                  <option value="urgent">Urgent (Entire service stopped)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Issue Description & Symptoms *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe error code, smell, noise, or malfunction..."
                  value={issueDesc}
                  onChange={e => setIssueDesc(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowBreakdownModal(false)}
                  style={{
                    padding: '0.55rem 1rem',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.55rem 1.25rem',
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                  }}
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
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            background: 'var(--surface)',
            width: '100%',
            maxWidth: '450px',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
              Log Preventive Maintenance (PM)
            </h3>
            <form onSubmit={handleLogPM} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Technician / Engineer Name *
                </label>
                <input
                  type="text"
                  required
                  value={pmTechName}
                  onChange={e => setPmTechName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Service Invoiced Cost (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={pmCost}
                  onChange={e => setPmCost(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Maintenance Summary & Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Descaled boiler, replaced door seals, greased bearings"
                  value={pmNotes}
                  onChange={e => setPmNotes(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setPmEquipId(null)}
                  style={{
                    padding: '0.55rem 1rem',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.55rem 1.25rem',
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  Record PM Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Resolve Breakdown Ticket */}
      {resolvingTicketId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            background: 'var(--surface)',
            width: '100%',
            maxWidth: '450px',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
              Complete Repair & Resolve Ticket
            </h3>
            <form onSubmit={handleResolveTicket} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Servicing Technician *
                </label>
                <input
                  type="text"
                  required
                  value={resolveTech}
                  onChange={e => setResolveTech(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Total Repair / Invoice Cost (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={resolveCost}
                  onChange={e => setResolveCost(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Parts / Components Replaced
                </label>
                <input
                  type="text"
                  placeholder="e.g. Thermocouple, Magnetron, Filter element"
                  value={partsUsed}
                  onChange={e => setPartsUsed(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Resolution Notes & Verification
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Test cycle ran 45 mins with load, zero leakage observed"
                  value={resolveNotes}
                  onChange={e => setResolveNotes(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setResolvingTicketId(null)}
                  style={{
                    padding: '0.55rem 1rem',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.55rem 1.25rem',
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  Verify & Resolve Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
