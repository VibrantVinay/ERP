'use client';

import React, { useState, useEffect } from 'react';
import { posApi } from '../api';
import { PosItem, CartItem, PosCalculation, PosTicketRecord, OrderType, PaymentMethod } from '../types';
import { ReceiptModal } from './ReceiptModal';
import { PaymentModal } from './PaymentModal';
import { SplitBillModal } from './SplitBillModal';
import { ActiveTicketsDrawer } from './ActiveTicketsDrawer';

export function PosWorkspace() {
  const [menuItems, setMenuItems] = useState<PosItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('Dine-in');
  const [tableOrGuest, setTableOrGuest] = useState<string>('Table 01');
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Unpaid');
  const [calculation, setCalculation] = useState<PosCalculation>({
    subtotal: 0,
    discountPercentage: 0,
    discountAmount: 0,
    taxableAmount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    gstAmount: 0,
    gstRate: 0.05,
    total: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Modal states
  const [receiptTicket, setReceiptTicket] = useState<PosTicketRecord | null>(null);
  const [paymentTicket, setPaymentTicket] = useState<PosTicketRecord | null>(null);
  const [splitTicket, setSplitTicket] = useState<PosTicketRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Notes editing state for cart items
  const [activeNoteItemId, setActiveNoteItemId] = useState<string | null>(null);
  const [customNote, setCustomNote] = useState<string>('');

  useEffect(() => {
    async function loadMenu() {
      try {
        const items = await posApi.getMenuItems();
        setMenuItems(items);
      } catch (err: any) {
        console.error('Failed to load menu items:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, []);

  useEffect(() => {
    async function updateCalculations() {
      if (cart.length === 0) {
        setCalculation({
          subtotal: 0,
          discountPercentage: discount,
          discountAmount: 0,
          taxableAmount: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          gstAmount: 0,
          gstRate: 0.05,
          total: 0,
        });
        return;
      }
      try {
        const result = await posApi.calculate(cart, discount);
        setCalculation(result);
      } catch (err) {
        console.error('Calculation error:', err);
      }
    }
    updateCalculations();
  }, [cart, discount]);

  const addToCart = (item: PosItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => {
          if (i.id === id) {
            const nextQty = i.qty + delta;
            return nextQty > 0 ? { ...i, qty: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleSaveItemNote = (itemId: string) => {
    setCart(prev =>
      prev.map(i => (i.id === itemId ? { ...i, notes: customNote.trim() || undefined } : i))
    );
    setActiveNoteItemId(null);
    setCustomNote('');
  };

  const handleSendOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const ticket = await posApi.createTicket({
        orderType,
        tableOrGuest: tableOrGuest || (orderType === 'Dine-in' ? 'Table 01' : 'Takeaway Guest'),
        items: cart,
        discountPercentage: discount,
        paymentMethod,
      });

      setNotification(`✅ Ticket ${ticket.ticketNumber} created & routed to Kitchen!`);
      setCart([]);
      setReceiptTicket(ticket); // Automatically show receipt
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Error sending order');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ['All', ...new Set(menuItems.map(i => i.category))];

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.note && item.note.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      {/* Top Header */}
      <div className="page-header">
        <div>
          <div className="eyebrow">APP 2 · POINT OF SALE WORKSPACE</div>
          <h1>Point of Sale & Billing</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setIsDrawerOpen(true)} className="btn btn-outline">
            📋 Active Service Tickets ↗
          </button>
        </div>
      </div>

      {notification && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', padding: '0.9rem 1.25rem', borderRadius: 8, marginBottom: '1.5rem', color: '#166534', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} style={{ color: '#166534', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Main Grid: Menu vs Cart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
        {/* Menu Catalog Section */}
        <section className="card" style={{ padding: '1.5rem' }}>
          {/* Search & Categories Bar */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <input
                type="text"
                placeholder="🔍 Search dishes, ingredients, drinks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Dish Grid */}
          {loading ? (
            <p>Loading fresh dishes...</p>
          ) : filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <p>No dishes match your query "{searchQuery}".</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1rem' }}>
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  style={{
                    background: '#faf8f5',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '140px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>
                      {item.category}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', margin: '0.25rem 0' }}>{item.name}</h3>
                    {item.note && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.note}</p>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--primary)' }}>₹{item.price}</strong>
                    <span style={{ background: 'var(--accent-light)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                      ＋ ADD
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Live Cart & Checkout Aside */}
        <aside className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1.5rem' }}>
          <div>
            <div className="eyebrow">ORDER CART</div>
            <h2 style={{ fontSize: '1.3rem' }}>Current Ticket</h2>
          </div>

          {/* Order Type Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
            {(['Dine-in', 'Takeaway', 'Delivery', 'QR order'] as OrderType[]).map(t => (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                className={`btn ${orderType === t ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.4rem 0.2rem', fontSize: '0.75rem' }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Table / Guest Name */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {orderType === 'Dine-in' ? 'ASSIGN TABLE' : 'CUSTOMER / PICKUP NAME'}
            </label>
            {orderType === 'Dine-in' ? (
              <select
                value={tableOrGuest}
                onChange={e => setTableOrGuest(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginTop: '0.25rem', fontSize: '0.9rem' }}
              >
                {['Table 01', 'Table 02', 'Table 03 (Patio)', 'Table 04 (Patio)', 'Table 05 (Counter)', 'Table 06 (Private)'].map(tbl => (
                  <option key={tbl} value={tbl}>{tbl}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="e.g. Maya Patel"
                value={tableOrGuest}
                onChange={e => setTableOrGuest(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginTop: '0.25rem', fontSize: '0.9rem' }}
              />
            )}
          </div>

          {/* Cart Items List */}
          <div style={{ minHeight: '180px', maxHeight: '280px', overflowY: 'auto' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                <p style={{ fontWeight: 600 }}>Cart is empty</p>
                <small>Select dishes from the catalog to build an order.</small>
              </div>
            ) : (
              cart.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0.65rem 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.name}</div>
                      <small style={{ color: 'var(--text-muted)' }}>₹{item.price} each</small>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.75rem' }}>
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        style={{ background: 'var(--surface-alt)', width: 24, height: 24, borderRadius: 4, fontWeight: 700 }}
                      >
                        −
                      </button>
                      <span style={{ fontWeight: 700 }}>{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        style={{ background: 'var(--surface-alt)', width: 24, height: 24, borderRadius: 4, fontWeight: 700 }}
                      >
                        ＋
                      </button>
                    </div>
                    <div style={{ fontWeight: 700 }}>₹{item.price * item.qty}</div>
                  </div>

                  {/* Kitchen Special Note Input */}
                  {item.notes ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>📝 Kitchen Note: {item.notes}</span>
                      <button
                        onClick={() => { setActiveNoteItemId(item.id); setCustomNote(item.notes || ''); }}
                        style={{ color: 'var(--text-muted)', textDecoration: 'underline', fontSize: '0.7rem' }}
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    activeNoteItemId === item.id ? (
                      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem' }}>
                        <input
                          type="text"
                          placeholder="e.g. Less spicy, no onion"
                          value={customNote}
                          onChange={e => setCustomNote(e.target.value)}
                          style={{ flex: 1, padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid var(--border)', borderRadius: 4 }}
                        />
                        <button onClick={() => handleSaveItemNote(item.id)} className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setActiveNoteItemId(item.id); setCustomNote(''); }}
                        style={{ textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', textDecoration: 'underline' }}
                      >
                        + Add kitchen note
                      </button>
                    )
                  )}
                </div>
              ))
            )}
          </div>

          {/* Discount Field */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
            <span>Discount (%)</span>
            <input
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={e => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
              style={{ width: '60px', padding: '0.3rem', textAlign: 'right', border: '1px solid var(--border)', borderRadius: 4 }}
            />
          </div>

          {/* Indian Restaurant GST (5%) & Totals */}
          <div style={{ background: 'var(--surface-alt)', padding: '0.9rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>Subtotal:</span>
              <span>₹{calculation.subtotal}</span>
            </div>
            {calculation.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: 'var(--danger)' }}>
                <span>Discount ({calculation.discountPercentage}%):</span>
                <span>-₹{calculation.discountAmount}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
              <span>CGST (2.5%):</span>
              <span>₹{calculation.cgstAmount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              <span>SGST (2.5%):</span>
              <span>₹{calculation.sgstAmount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary)', borderTop: '1px solid var(--border)', paddingTop: '0.4rem' }}>
              <span>Total Due:</span>
              <span>₹{calculation.total}</span>
            </div>
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={handleSendOrder}
              disabled={cart.length === 0 || submitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
            >
              {submitting ? 'Routing to Kitchen...' : `Send to Kitchen · ₹${calculation.total} ➔`}
            </button>
          </div>
        </aside>
      </div>

      {/* Modals */}
      {receiptTicket && (
        <ReceiptModal ticket={receiptTicket} onClose={() => setReceiptTicket(null)} />
      )}

      {paymentTicket && (
        <PaymentModal
          ticket={paymentTicket}
          onClose={() => setPaymentTicket(null)}
          onPaymentSuccess={updated => {
            setPaymentTicket(null);
            setReceiptTicket(updated);
            setNotification(`Payment of ₹${updated.total} settled for ${updated.ticketNumber}`);
          }}
          onOpenSplitModal={() => {
            setSplitTicket(paymentTicket);
            setPaymentTicket(null);
          }}
        />
      )}

      {splitTicket && (
        <SplitBillModal
          ticket={splitTicket}
          onClose={() => setSplitTicket(null)}
          onSplitSuccess={subTickets => {
            setSplitTicket(null);
            setNotification(`Successfully split into ${subTickets.length} sub-checks!`);
            setIsDrawerOpen(true);
          }}
        />
      )}

      {/* Active Service Tickets Drawer */}
      <ActiveTicketsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectTicketForPayment={ticket => setPaymentTicket(ticket)}
        onSelectTicketForReceipt={ticket => setReceiptTicket(ticket)}
      />
    </div>
  );
}
