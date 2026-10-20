'use client';

import React, { useState, useEffect } from 'react';
import { posApi } from '../api';
import { PosItem, CartItem, PosCalculation } from '../types';

export function PosWorkspace() {
  const [menuItems, setMenuItems] = useState<PosItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<string>('Dine-in');
  const [tableOrGuest, setTableOrGuest] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Unpaid');
  const [calculation, setCalculation] = useState<PosCalculation>({
    subtotal: 0,
    discountPercentage: 0,
    discountAmount: 0,
    gstAmount: 0,
    gstRate: 0.05,
    total: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

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
    setCart(prev => {
      return prev
        .map(i => {
          if (i.id === id) {
            const newQty = i.qty + delta;
            return newQty > 0 ? { ...i, qty: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleSendOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const ticket = await posApi.createTicket({
        orderType,
        tableOrGuest: tableOrGuest || (orderType === 'Dine-in' ? 'Table 01' : 'Walk-in'),
        items: cart,
        discountPercentage: discount,
        paymentMethod,
      });
      setNotification(`✅ Ticket ${ticket.ticket} created and sent to kitchen!`);
      setCart([]);
      setTableOrGuest('');
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error sending order');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ['All', ...new Set(menuItems.map(i => i.category))];
  const filteredItems = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter(i => i.category === selectedCategory);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">SERVICE · QUICK CHECKOUT</div>
          <h1>Point of Sale</h1>
        </div>
      </div>

      {notification && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem', color: '#166534', fontWeight: 600 }}>
          {notification}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
        {/* Menu Section */}
        <section className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <p>Loading fresh dishes...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
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
                    transition: 'transform 0.1s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {item.category}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', margin: '0.25rem 0' }}>{item.name}</h3>
                    {item.note && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.note}</p>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>₹{item.price}</strong>
                    <span style={{ background: 'var(--accent-light)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>＋</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Cart & Checkout Aside */}
        <aside className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <div className="eyebrow">NEW TICKET</div>
            <h2>Order Cart</h2>
          </div>

          {/* Order Type */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
            {['Dine-in', 'Takeaway', 'Delivery', 'QR order'].map(t => (
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
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {orderType === 'Dine-in' ? 'Table Number' : 'Customer Name'}
            </label>
            <input
              type="text"
              placeholder={orderType === 'Dine-in' ? 'e.g. Table 04' : 'e.g. Maya'}
              value={tableOrGuest}
              onChange={e => setTableOrGuest(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                marginTop: '0.25rem',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {/* Cart Items List */}
          <div style={{ minHeight: '160px', maxHeight: '280px', overflowY: 'auto' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <p>Cart is currently empty.</p>
                <small>Select dishes from the menu to build a ticket.</small>
              </div>
            ) : (
              cart.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.6rem 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
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
              ))
            )}
          </div>

          {/* Discount and Payment */}
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
            <span>Payment Method</span>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              style={{ padding: '0.3rem 0.5rem', border: '1px solid var(--border)', borderRadius: 4 }}
            >
              <option value="Unpaid">Unpaid</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
              <option value="Online">Online</option>
            </select>
          </div>

          {/* Totals Summary */}
          <div style={{ background: 'var(--surface-alt)', padding: '0.9rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <span>Subtotal:</span>
              <span>₹{calculation.subtotal}</span>
            </div>
            {calculation.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', color: 'var(--danger)' }}>
                <span>Discount:</span>
                <span>-₹{calculation.discountAmount}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
              <span>GST (5%):</span>
              <span>₹{calculation.gstAmount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
              <span>Total Due:</span>
              <span>₹{calculation.total}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSendOrder}
            disabled={cart.length === 0 || submitting}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem' }}
          >
            {submitting ? 'Sending to Kitchen...' : `Send Order · ₹${calculation.total}`}
          </button>
        </aside>
      </div>
    </div>
  );
}

