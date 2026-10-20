'use client';

import React, { useState, useEffect } from 'react';
import { kitchenApi } from '../api';
import { KitchenTicket, KitchenStation, KitchenTicketStatus } from '../types';

export function KitchenWorkspace() {
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [station, setStation] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await kitchenApi.getTickets(station);
      setTickets(data);
    } catch (err) {
      console.error('Failed to fetch kitchen tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 15000);
    return () => clearInterval(interval);
  }, [station]);

  const handleBumpStatus = async (ticket: KitchenTicket) => {
    let nextStatus: KitchenTicketStatus = 'Preparing';
    if (ticket.status === 'New') nextStatus = 'Preparing';
    else if (ticket.status === 'Preparing') nextStatus = 'Ready';
    else if (ticket.status === 'Ready') nextStatus = 'Served';

    try {
      await kitchenApi.updateStatus(ticket.id, nextStatus);
      fetchTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket status');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">KITCHEN · KDS & KOT QUEUE</div>
          <h1>Kitchen Display System</h1>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['All', 'Hot line', 'Cold prep', 'Bar', 'Dessert'].map(st => (
          <button
            key={st}
            onClick={() => setStation(st)}
            className={`btn ${station === st ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.35rem 0.8rem', fontSize: '0.85rem' }}
          >
            {st}
          </button>
        ))}
      </div>

      {loading && tickets.length === 0 ? (
        <p>Loading active tickets...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {tickets.map(ticket => (
            <div
              key={ticket.id}
              className="card"
              style={{
                borderTop: `4px solid ${ticket.status === 'Delayed' ? 'var(--danger)' : ticket.status === 'Ready' ? '#16a34a' : 'var(--accent)'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)' }}>{ticket.ticket}</strong>
                  <span className={`badge ${ticket.status === 'Ready' ? 'badge-success' : ticket.status === 'Delayed' ? 'badge-danger' : 'badge-warning'}`}>
                    {ticket.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', gap: '0.75rem' }}>
                  <span>📍 {ticket.station}</span>
                  <span>⏱ {ticket.elapsedMinutes}m ago</span>
                  {ticket.priority !== 'Normal' && <span style={{ color: 'var(--danger)', fontWeight: 700 }}>⚠️ {ticket.priority}</span>}
                </div>
                <div style={{ background: 'var(--surface-alt)', padding: '0.8rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontWeight: 600 }}>
                  {ticket.items}
                </div>
              </div>

              <button
                onClick={() => handleBumpStatus(ticket)}
                className={`btn ${ticket.status === 'Preparing' ? 'btn-primary' : 'btn-accent'}`}
                style={{ width: '100%', padding: '0.6rem' }}
              >
                {ticket.status === 'New' ? 'Start Prep ➔' : ticket.status === 'Preparing' ? 'Mark Ready ✓' : 'Complete / Bump'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

