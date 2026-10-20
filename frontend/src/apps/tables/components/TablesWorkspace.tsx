'use client';

import React, { useState, useEffect } from 'react';
import { tablesApi } from '../api';
import { TableRecord, TableStatus } from '../types';

export function TablesWorkspace() {
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [zone, setZone] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const data = await tablesApi.getAll(zone);
      setTables(data);
    } catch (err) {
      console.error('Failed to load tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [zone]);

  const handleStatusChange = async (id: string, status: TableStatus) => {
    try {
      await tablesApi.updateStatus(id, status);
      fetchTables();
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

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">FLOOR & GUESTS · TABLE MANAGEMENT</div>
          <h1>Tables & Floor Plan</h1>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['All', 'Main room', 'Patio', 'Counter', 'Private dining'].map(z => (
          <button
            key={z}
            onClick={() => setZone(z)}
            className={`btn ${zone === z ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.35rem 0.8rem', fontSize: '0.85rem' }}
          >
            {z}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading floor layout...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {tables.map(table => (
            <div
              key={table.id}
              className="card"
              style={{
                borderLeft: `5px solid ${getStatusColor(table.status)}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.4rem' }}>Table {table.tableNumber}</h3>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: getStatusColor(table.status) }}>
                    {table.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {table.zone} · {table.seats} Seats
                </div>
                {table.party ? (
                  <div style={{ marginTop: '0.75rem', background: 'var(--surface-alt)', padding: '0.5rem', borderRadius: 4, fontSize: '0.85rem' }}>
                    <strong>{table.party}</strong>
                    {table.seatedAt && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Seated at {table.seatedAt}</div>}
                  </div>
                ) : (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Empty & ready for seating
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <select
                  value={table.status}
                  onChange={e => handleStatusChange(table.id, e.target.value as TableStatus)}
                  style={{ width: '100%', padding: '0.4rem', border: '1px solid var(--border)', borderRadius: 4 }}
                >
                  <option value="Available">Available</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Seated">Seated</option>
                  <option value="Ordering">Ordering</option>
                  <option value="Dining">Dining</option>
                  <option value="Needs cleaning">Needs cleaning</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

