'use client';

import React, { useState } from 'react';
import { PosTicketRecord, PaymentMethod } from '../types';
import { posApi } from '../api';

interface PaymentModalProps {
  ticket: PosTicketRecord;
  onClose: () => void;
  onPaymentSuccess: (updated: PosTicketRecord) => void;
  onOpenSplitModal: () => void;
}

export function PaymentModal({ ticket, onClose, onPaymentSuccess, onOpenSplitModal }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [cashTendered, setCashTendered] = useState<number>(ticket.total);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeDue = Math.max(0, cashTendered - ticket.total);

  const handlePay = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const updated = await posApi.payTicket(ticket.id, method, ticket.total);
      onPaymentSuccess(updated);
    } catch (err: any) {
      setError(err.message || 'Payment settlement failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div className="eyebrow">BILL SETTLEMENT</div>
            <h2 style={{ fontSize: '1.4rem' }}>{ticket.ticketNumber} · {ticket.tableOrGuest}</h2>
          </div>
          <button onClick={onClose} style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>✕</button>
        </div>

        {/* Amount Due Card */}
        <div style={{ background: 'var(--surface-alt)', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL AMOUNT DUE</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)', margin: '0.25rem 0' }}>₹{ticket.total}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>Includes GST (5%) & Applied Discounts</div>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '0.6rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Payment Methods */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            SELECT PAYMENT METHOD
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {(['Cash', 'Card', 'UPI', 'Online'] as PaymentMethod[]).map(m => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`btn ${method === m ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.5rem 0.2rem', fontSize: '0.85rem' }}
              >
                {m === 'Cash' ? '💵 Cash' : m === 'Card' ? '💳 Card' : m === 'UPI' ? '📱 UPI' : '🌐 Web'}
              </button>
            ))}
          </div>
        </div>

        {/* Cash Tendered & Change Calculator */}
        {method === 'Cash' && (
          <div style={{ background: '#fdfcf9', border: '1px solid var(--border)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Cash Tendered:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>₹</span>
                <input
                  type="number"
                  min={ticket.total}
                  value={cashTendered}
                  onChange={e => setCashTendered(Number(e.target.value) || 0)}
                  style={{ width: '90px', padding: '0.35rem', textAlign: 'right', border: '1px solid var(--border)', borderRadius: 4, fontWeight: 700 }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: changeDue > 0 ? '#166534' : 'var(--text-muted)', fontWeight: 700 }}>
              <span>Change Due:</span>
              <span>₹{changeDue}</span>
            </div>
          </div>
        )}

        {/* UPI Simulator */}
        {method === 'UPI' && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', marginBottom: '1.25rem', color: '#166534' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>📲 QR Scanner Active</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>UPI ID: <code>rift.goa@upi</code></div>
            <small style={{ color: '#15803d' }}>Prompt guest to scan QR on terminal or enter UPI VPA.</small>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={handlePay}
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
          >
            {submitting ? 'Settling Payment...' : `Confirm Payment (₹${ticket.total})`}
          </button>

          <button
            onClick={() => { onClose(); onOpenSplitModal(); }}
            className="btn btn-outline"
            style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
          >
            ✂️ Split This Bill Between Guests
          </button>
        </div>
      </div>
    </div>
  );
}

