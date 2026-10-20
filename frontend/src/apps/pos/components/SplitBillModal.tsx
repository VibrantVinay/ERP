'use client';

import React, { useState } from 'react';
import { PosTicketRecord } from '../types';
import { posApi } from '../api';

interface SplitBillModalProps {
  ticket: PosTicketRecord;
  onClose: () => void;
  onSplitSuccess: (subTickets: PosTicketRecord[]) => void;
}

export function SplitBillModal({ ticket, onClose, onSplitSuccess }: SplitBillModalProps) {
  const [parts, setParts] = useState<number>(2);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountPerPerson = Math.round(ticket.total / parts);

  const handleSplit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const subTickets = await posApi.splitTicket(ticket.id, parts);
      onSplitSuccess(subTickets);
    } catch (err: any) {
      setError(err.message || 'Failed to split ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div className="eyebrow">SPLIT BILL</div>
            <h2 style={{ fontSize: '1.3rem' }}>{ticket.ticketNumber} · {ticket.tableOrGuest}</h2>
          </div>
          <button onClick={onClose} style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>✕</button>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '0.6rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Total & Split Breakdown */}
        <div style={{ background: 'var(--surface-alt)', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ORIGINAL TOTAL: ₹{ticket.total}</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', margin: '0.35rem 0' }}>
            ₹{amountPerPerson} <small style={{ fontSize: '0.9rem', fontWeight: 600 }}>/ guest</small>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>Divided equally across {parts} checks</div>
        </div>

        {/* Number of Splits Selector */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            SPLIT HOW MANY WAYS?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {[2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setParts(n)}
                className={`btn ${parts === n ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.5rem', fontSize: '0.9rem', fontWeight: 700 }}
              >
                {n} Ways
              </button>
            ))}
          </div>
        </div>

        {/* Preview Sub Tickets */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            GENERATED SUB-CHECKS:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {Array.from({ length: parts }).map((_, i) => {
              const char = String.fromCharCode(65 + i);
              return (
                <div key={char} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.35rem 0.5rem', background: '#faf8f5', borderRadius: 4 }}>
                  <span>{ticket.ticketNumber}-{char} (Guest {i + 1})</span>
                  <strong>₹{amountPerPerson}</strong>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleSplit}
            disabled={submitting}
            className="btn btn-primary"
            style={{ flex: 1, padding: '0.75rem' }}
          >
            {submitting ? 'Splitting...' : `Confirm Split (${parts} checks)`}
          </button>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '0.75rem 1rem' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

