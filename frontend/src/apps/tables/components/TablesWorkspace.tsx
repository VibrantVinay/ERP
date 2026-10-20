'use client';

import React, { useState, useEffect } from 'react';
import { tablesApi } from '../api';
import { TableRecord, TableStatus } from '../types';
import { useAuth } from '@/apps/auth/context/AuthContext';

export function TablesWorkspace() {
  const { user } = useAuth();
  const isCleaner = user?.role === 'cleaner';

  const [tables, setTables] = useState<TableRecord[]>([]);
  const [filterMode, setFilterMode] = useState<string>(isCleaner ? 'Needs cleaning' : 'All');
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const data = await tablesApi.getAll();
      setTables(data);
    } catch (err) {
      console.error('Failed to load tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleStatusChange = async (id: string, status: TableStatus) => {
    try {
      await tablesApi.updateStatus(id, status);
      fetchTables();
      if (status === 'Available') {
        setNotification(`✨ Table marked clean, sanitized & ready for new guests!`);
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update table');
    }
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'Available': return '#16a34a';
      case 'Dining':
      case 'Seated':
      case 'Ordering': return '#2563eb';
      case 'Reserved': return '#d97706';
      case 'Needs cleaning': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const needsCleaningCount = tables.filter(t => t.status === 'Needs cleaning').length;

  const filteredTables = tables.filter(t => {
    if (filterMode === 'All') return true;
    if (filterMode === 'Needs cleaning') return t.status === 'Needs cleaning';
    return t.zone === filterMode;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">
            {isCleaner ? 'SANITATION & BUSSING PORTAL' : 'FLOOR & GUESTS · TABLE MANAGEMENT'}
          </div>
          <h1>{isCleaner ? 'Table Sanitation Queue' : 'Tables & Floor Plan'}</h1>
        </div>
        {needsCleaningCount > 0 && (
          <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '0.45rem 1rem', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem' }}>
            ⚠️ {needsCleaningCount} Table{needsCleaningCount > 1 ? 's' : ''} Need Bussing & Sanitation
          </div>
        )}
      </div>

      {notification && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '0.75rem 1.25rem', borderRadius: 8, marginBottom: '1.25rem', fontWeight: 600 }}>
          {notification}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['All', 'Needs cleaning', 'Main room', 'Patio', 'Counter', 'Private dining'].map(z => (
          <button
            key={z}
            onClick={() => setFilterMode(z)}
            className={`btn ${filterMode === z ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
          >
            {z === 'Needs cleaning' ? `🧹 Needs Cleaning (${needsCleaningCount})` : z}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading floor layout...</p>
      ) : filteredTables.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✨</div>
          <h3>All tables in this view are clean & ready!</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>No dirty or vacated tables pending sanitation.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {filteredTables.map(table => (
            <div
              key={table.id}
              className="card"
              style={{
                borderLeft: `6px solid ${getStatusColor(table.status)}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: table.status === 'Needs cleaning' ? '#fffaf8' : '#fff',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.4rem' }}>Table {table.tableNumber}</h3>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: table.status === 'Needs cleaning' ? '#fee2e2' : 'var(--surface-alt)',
                      color: getStatusColor(table.status),
                    }}
                  >
                    {table.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {table.zone} · {table.seats} Seats
                </div>

                {table.status === 'Needs cleaning' ? (
                  <div style={{ marginTop: '0.85rem', background: '#fef2f2', border: '1px dashed #fca5a5', padding: '0.6rem', borderRadius: 6, fontSize: '0.85rem', color: '#991b1b' }}>
                    <strong>🍽️ Table Vacated:</strong>
                    <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>Please bus dishes, sanitize tabletop & reset cutlery.</div>
                  </div>
                ) : table.party ? (
                  <div style={{ marginTop: '0.75rem', background: 'var(--surface-alt)', padding: '0.5rem', borderRadius: 4, fontSize: '0.85rem' }}>
                    <strong>{table.party}</strong>
                    {table.seatedAt && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Seated at {table.seatedAt}</div>}
                  </div>
                ) : (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
                    ✓ Clean, sanitized & available
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {table.status === 'Needs cleaning' ? (
                  <button
                    onClick={() => handleStatusChange(table.id, 'Available')}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.6rem', background: '#15803d', borderColor: '#15803d' }}
                  >
                    ✨ Mark Clean & Ready
                  </button>
                ) : (
                  !isCleaner && (
                    <select
                      value={table.status}
                      onChange={e => handleStatusChange(table.id, e.target.value as TableStatus)}
                      style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border)', borderRadius: 4, fontSize: '0.85rem' }}
                    >
                      <option value="Available">Available</option>
                      <option value="Reserved">Reserved</option>
                      <option value="Seated">Seated</option>
                      <option value="Ordering">Ordering</option>
                      <option value="Dining">Dining</option>
                      <option value="Needs cleaning">Needs cleaning</option>
                    </select>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
