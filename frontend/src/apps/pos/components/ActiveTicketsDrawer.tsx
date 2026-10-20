'use client';

import React, { useState, useEffect } from 'react';
import { PosTicketRecord } from '../types';
import { posApi } from '../api';

interface ActiveTicketsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTicketForPayment: (ticket: PosTicketRecord) => void;
  onSelectTicketForReceipt: (ticket: PosTicketRecord) => void;
}

export function ActiveTicketsDrawer({
  isOpen,
  onClose,
  onSelectTicketForPayment,
  onSelectTicketForReceipt,
}: ActiveTicketsDrawerProps) {
  const [tickets, setTickets] = useState<PosTicketRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await posApi.getActiveTickets();
      setTickets(data);
    } catch (err) {
      console.error('Error fetching active tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTickets();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 900, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ background: 'var(--surface)', width: '480px', height: '100%', padding: '1.75rem', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-md)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div className="eyebrow">ACTIVE SERVICE QUEUE</div>
            <h2 style={{ fontSize: '1.4rem' }}>Open Tickets ({tickets.length})</h2>
          </div>
          <button onClick={onClose} style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>✕</button>
        </div>

        {/* Tickets List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {loading ? (
            <p>Loading active tickets...</p>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</div>
              <p>No active unpaid tickets.</p>
              <small>All tables are currently settled.</small>
            </div>
          ) : (
            tickets.map(t => (
              <div
                key={t.id}
                className="card"
                style={{
                  padding: '1.1rem',
                  borderLeft: `4px solid ${t.paymentStatus === 'Paid' ? '#16a34a' : '#d97706'}`,
                  background: '#faf8f5',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <strong style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)' }}>{t.ticketNumber}</strong>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{t.status}</span>
                    <span className={`badge ${t.paymentStatus === 'Paid' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                      {t.paymentStatus}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  <span>📍 {t.tableOrGuest}</span> · <span>{t.orderType}</span> · <span>₹{t.total}</span>
                </div>

                <div style={{ fontSize: '0.8rem', background: '#fff', border: '1px solid var(--border)', borderRadius: 4, padding: '0.4rem 0.6rem', marginBottom: '0.75rem' }}>
                  {t.items.map(i => `${i.name} ×${i.qty}`).join(', ')}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {t.paymentStatus !== 'Paid' && (
                    <button
                      onClick={() => { onClose(); onSelectTicketForPayment(t); }}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}
                    >
                      💳 Settle / Pay Bill
                    </button>
                  )}
                  <button
                    onClick={() => { onClose(); onSelectTicketForReceipt(t); }}
                    className="btn btn-outline"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    🖨️ Receipt
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

