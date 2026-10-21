'use client';

import React, { useState, useEffect } from 'react';
import { tablesApi } from '../api';
import { DiningTable, TableStatus, FloorZone, WaitlistEntry } from '../types';

export function TableFloorManager() {
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [zones, setZones] = useState<FloorZone[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals & Action Drawers
  const [seatModalTable, setSeatModalTable] = useState<DiningTable | null>(null);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [serverName, setServerName] = useState<string>('Server Ananya');
  const [showWaitlistModal, setShowWaitlistModal] = useState<boolean>(false);
  const [newWaitName, setNewWaitName] = useState<string>('');
  const [newWaitPhone, setNewWaitPhone] = useState<string>('');
  const [newWaitSize, setNewWaitSize] = useState<number>(2);
  const [newWaitZone, setNewWaitZone] = useState<string>('Any');

  const loadData = async () => {
    try {
      const [tData, zData, wData] = await Promise.all([
        tablesApi.getTables(),
        tablesApi.getZones(),
        tablesApi.getWaitlist(),
      ]);
      setTables(tData);
      setZones(zData);
      setWaitlist(wData);
    } catch (err) {
      console.error('Failed to load table data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000); // 8s refresh
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async (id: string, status: TableStatus) => {
    try {
      const updated = await tablesApi.updateStatus(id, status);
      setTables(prev => prev.map(t => (t.id === id ? updated : t)));
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleSeatSubmit = async () => {
    if (!seatModalTable) return;
    try {
      const updated = await tablesApi.seatTable(seatModalTable.id, {
        guestCount,
        serverName,
      });
      setTables(prev => prev.map(t => (t.id === seatModalTable.id ? updated : t)));
      setSeatModalTable(null);
    } catch (err) {
      console.error('Failed to seat table', err);
    }
  };

  const handleClearTable = async (id: string) => {
    try {
      const updated = await tablesApi.clearTable(id);
      setTables(prev => prev.map(t => (t.id === id ? updated : t)));
    } catch (err) {
      console.error('Failed to clear table', err);
    }
  };

  const handleAddWaitlist = async () => {
    if (!newWaitName.trim() || !newWaitPhone.trim()) return;
    try {
      const entry = await tablesApi.addToWaitlist({
        guestName: newWaitName,
        phone: newWaitPhone,
        partySize: newWaitSize,
        zonePreference: newWaitZone as any,
      });
      setWaitlist(prev => [...prev, entry]);
      setShowWaitlistModal(false);
      setNewWaitName('');
      setNewWaitPhone('');
    } catch (err) {
      console.error('Failed to add waitlist', err);
    }
  };

  const handleWaitlistStatus = async (id: string, status: 'Notified' | 'Seated' | 'Cancelled') => {
    try {
      await tablesApi.updateWaitlistStatus(id, status);
      setWaitlist(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      console.error('Failed to update waitlist', err);
    }
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'Available': return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'Needs Cleaning': return { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' };
      case 'Dining': return { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe' };
      case 'Ordering':
      case 'Seated': return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
      case 'Reserved': return { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };
    }
  };

  // Filtered tables
  const filteredTables = tables.filter(t => {
    if (selectedZone !== 'all' && t.zone !== selectedZone) return false;
    if (selectedStatus === 'cleaning' && t.status !== 'Needs Cleaning') return false;
    if (selectedStatus === 'available' && t.status !== 'Available') return false;
    if (selectedStatus === 'occupied' && !['Seated', 'Ordering', 'Dining'].includes(t.status)) return false;
    if (selectedStatus === 'reserved' && t.status !== 'Reserved') return false;
    return true;
  });

  const dirtyTables = tables.filter(t => t.status === 'Needs Cleaning');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
            Floor & Table Management
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Multi-zone floor layout, real-time seated duration, busser queue & waitlist
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowWaitlistModal(true)}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            📋 Waitlist ({waitlist.length})
          </button>
          <button
            onClick={loadData}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Dirty Tables Quick Alert for Busser / Cleaner */}
      {dirtyTables.length > 0 && (
        <div
          style={{
            background: '#fff1f2',
            border: '2px dashed #f43f5e',
            borderRadius: '10px',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🧹</span>
            <div>
              <strong style={{ color: '#9f1239', fontSize: '0.9rem' }}>
                {dirtyTables.length} Table{dirtyTables.length > 1 ? 's' : ''} Need Busser / Sanitizing:
              </strong>
              <span style={{ fontSize: '0.85rem', color: '#be123c', marginLeft: '0.5rem' }}>
                {dirtyTables.map(d => `${d.name} (${d.zone})`).join(', ')}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {dirtyTables.map(d => (
              <button
                key={d.id}
                onClick={() => handleClearTable(d.id)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  background: '#e11d48',
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ✨ Clean {d.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Zone Tabs & Status Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: 'var(--surface)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
        {/* Zones */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto' }}>
          <button
            onClick={() => setSelectedZone('all')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              border: selectedZone === 'all' ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: selectedZone === 'all' ? 'var(--primary)' : 'var(--bg)',
              color: selectedZone === 'all' ? '#fff' : 'var(--text-main)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            All Zones ({tables.length})
          </button>
          {zones.map(z => {
            const count = tables.filter(t => t.zone === z).length;
            const isSel = selectedZone === z;
            return (
              <button
                key={z}
                onClick={() => setSelectedZone(z)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  border: isSel ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: isSel ? 'var(--primary)' : 'var(--bg)',
                  color: isSel ? '#fff' : 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                {z} ({count})
              </button>
            );
          })}
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'available', label: 'Available' },
            { id: 'occupied', label: 'Occupied' },
            { id: 'cleaning', label: 'Cleaning' },
            { id: 'reserved', label: 'Reserved' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedStatus(f.id)}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: selectedStatus === f.id ? 'var(--border)' : 'var(--bg)',
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Floor Plan Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
          overflowY: 'auto',
          flex: 1,
          alignContent: 'start',
        }}
      >
        {filteredTables.map(table => {
          const sc = getStatusColor(table.status);
          const isOccupied = ['Seated', 'Ordering', 'Dining'].includes(table.status);

          return (
            <div
              key={table.id}
              style={{
                background: 'var(--surface)',
                borderRadius: '12px',
                border: `1.5px solid ${sc.border}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                padding: '1.15rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{table.name}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {table.zone} · Up to {table.capacity} guests
                  </span>
                </div>

                <span
                  style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: sc.bg,
                    color: sc.text,
                    border: `1px solid ${sc.border}`,
                  }}
                >
                  {table.status}
                </span>
              </div>

              {/* Seated Info */}
              {isOccupied && (
                <div style={{ background: 'var(--bg)', padding: '0.6rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Guests: <strong>{table.guestCount} seated</strong></span>
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>⏱ {table.seatedMinutes || 0}m turn</span>
                  </div>
                  {table.serverName && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      Server: {table.serverName}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px dashed var(--border)' }}>
                {table.status === 'Available' && (
                  <button
                    onClick={() => {
                      setGuestCount(table.capacity);
                      setSeatModalTable(table);
                    }}
                    style={{ flex: 1, padding: '0.55rem', borderRadius: '6px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    🪑 Seat Guests
                  </button>
                )}

                {table.status === 'Needs Cleaning' && (
                  <button
                    onClick={() => handleClearTable(table.id)}
                    style={{ flex: 1, padding: '0.55rem', borderRadius: '6px', background: '#e11d48', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    ✨ Mark Clean & Ready
                  </button>
                )}

                {isOccupied && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(table.id, table.status === 'Seated' ? 'Ordering' : 'Dining')}
                      style={{ flex: 1, padding: '0.45rem', borderRadius: '6px', background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {table.status === 'Seated' ? '📝 Ordering' : '🍽️ Dining'}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(table.id, 'Needs Cleaning')}
                      style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Depart
                    </button>
                  </>
                )}

                {table.status === 'Reserved' && (
                  <button
                    onClick={() => {
                      setGuestCount(table.capacity);
                      setSeatModalTable(table);
                    }}
                    style={{ flex: 1, padding: '0.55rem', borderRadius: '6px', background: '#7e22ce', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    Check-in & Seat
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Seat Guests Modal */}
      {seatModalTable && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', width: '100%', maxWidth: '380px', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Seat Guests at {seatModalTable.name}</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Zone: {seatModalTable.zone} · Table Capacity: {seatModalTable.capacity} guests
            </p>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Party Size</label>
              <input
                type="number"
                min={1}
                max={seatModalTable.capacity * 2}
                value={guestCount}
                onChange={e => setGuestCount(Number(e.target.value))}
                style={{ width: '100%', padding: '0.6rem', marginTop: '0.25rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Assigned Server</label>
              <input
                type="text"
                value={serverName}
                onChange={e => setServerName(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', marginTop: '0.25rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => setSeatModalTable(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSeatSubmit}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                Confirm Seating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waitlist Drawer Modal */}
      {showWaitlistModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', width: '100%', maxWidth: '480px', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Waitlist Management</h3>
              <button onClick={() => setShowWaitlistModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            {/* Quick Add Party */}
            <div style={{ background: 'var(--bg)', padding: '0.85rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Add Party to Queue</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Guest Name"
                  value={newWaitName}
                  onChange={e => setNewWaitName(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={newWaitPhone}
                  onChange={e => setNewWaitPhone(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.8rem' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem' }}>
                <input
                  type="number"
                  placeholder="Party Size"
                  min={1}
                  value={newWaitSize}
                  onChange={e => setNewWaitSize(Number(e.target.value))}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.8rem' }}
                />
                <select
                  value={newWaitZone}
                  onChange={e => setNewWaitZone(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.8rem' }}
                >
                  <option value="Any">Any Zone</option>
                  {zones.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
                <button
                  onClick={handleAddWaitlist}
                  style={{ padding: '0.5rem 0.85rem', borderRadius: '6px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Active Waitlist Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Waiting Parties ({waitlist.length})</span>
              {waitlist.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No guests currently waiting.
                </div>
              ) : (
                waitlist.map(w => (
                  <div key={w.id} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{w.guestName} ({w.partySize}p)</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        📞 {w.phone} · Pref: {w.zonePreference} {w.notes ? `· ${w.notes}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => handleWaitlistStatus(w.id, 'Notified')}
                        style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        🔔 Call
                      </button>
                      <button
                        onClick={() => handleWaitlistStatus(w.id, 'Cancelled')}
                        style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

