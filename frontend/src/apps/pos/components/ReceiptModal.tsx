'use client';

import React from 'react';
import { PosTicketRecord } from '../types';

interface ReceiptModalProps {
  ticket: PosTicketRecord;
  onClose: () => void;
}

export function ReceiptModal({ ticket, onClose }: ReceiptModalProps) {
  const handlePrint = () => {
    window.print();
  };

  const subtotal = ticket.subtotal || 0;
  const discount = ticket.discountAmount || 0;
  const cgst = Math.round((subtotal - discount) * 0.025);
  const sgst = Math.round((subtotal - discount) * 0.025);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: '#fff', width: '380px', borderRadius: '12px', padding: '1.75rem', boxShadow: 'var(--shadow-md)', fontFamily: 'Courier, monospace', color: '#111' }}>
        {/* Receipt Header */}
        <div style={{ textAlign: 'center', borderBottom: '1px dashed #aaa', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: 0, color: 'var(--primary)' }}>RIFT RESTAURANT</h2>
          <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '0.25rem' }}>Fontainhas, Panaji, Goa · GSTIN: 30AABCR1234F1Z5</div>
          <div style={{ fontSize: '0.75rem', color: '#777', marginTop: '0.25rem' }}>Tax Invoice / Cash Receipt</div>
        </div>

        {/* Ticket Details */}
        <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <span>Ticket: <strong>{ticket.ticketNumber}</strong></span>
          <span>{ticket.orderType}</span>
        </div>
        <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span>Table/Guest: <strong>{ticket.tableOrGuest}</strong></span>
          <span>{new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {/* Items List */}
        <div style={{ borderTop: '1px dashed #aaa', borderBottom: '1px dashed #aaa', padding: '0.75rem 0', marginBottom: '0.75rem' }}>
          {ticket.items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
              <div style={{ flex: 1 }}>
                <div>{item.name} × {item.qty}</div>
                {item.notes && <div style={{ fontSize: '0.7rem', color: '#666', fontStyle: 'italic' }}>({item.notes})</div>}
              </div>
              <div>₹{item.price * item.qty}</div>
            </div>
          ))}
        </div>

        {/* Financial Breakdown */}
        <div style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>₹{subtotal}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b91c1c' }}>
              <span>Discount ({ticket.discountPercentage}%):</span>
              <span>-₹{discount}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
            <span>CGST (2.5%):</span>
            <span>₹{cgst}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
            <span>SGST (2.5%):</span>
            <span>₹{sgst}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.05rem', borderTop: '1px solid #222', marginTop: '0.4rem', paddingTop: '0.4rem' }}>
            <span>TOTAL:</span>
            <span>₹{ticket.total}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', color: '#444' }}>
            <span>Payment:</span>
            <span>{ticket.paymentMethod} ({ticket.paymentStatus.toUpperCase()})</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#666', marginTop: '1.25rem', borderTop: '1px dashed #aaa', paddingTop: '0.75rem' }}>
          Thank you for dining with Rift! Visit again.
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
          <button onClick={handlePrint} className="btn btn-primary" style={{ flex: 1, padding: '0.5rem' }}>
            Print Receipt 🖨️
          </button>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

