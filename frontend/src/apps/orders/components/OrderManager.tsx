'use client';

import React, { useState, useEffect } from 'react';
import { ordersApi } from '../api';
import { OrderRecord, OrderStatus, OrderType } from '../types';

export function OrderManager() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  // Modals state
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [mergeModalOpen, setMergeModalOpen] = useState<boolean>(false);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string>('');

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.getOrders();
      setOrders(data);
      if (selectedOrder) {
        const updated = data.find(o => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err: any) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000); // 10s live poll
    return () => clearInterval(interval);
  }, []);

  const handleStatusTransition = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      setActionError('');
      const updated = await ordersApi.updateStatus(orderId, {
        status: nextStatus,
        changedBy: 'Staff',
        reason: `Advanced to ${nextStatus}`,
      });
      setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) setSelectedOrder(updated);
    } catch (err: any) {
      setActionError(err.message || 'Status transition failed');
    }
  };

  const handleCancelSubmit = async () => {
    if (!selectedOrder || !cancelReason.trim()) return;
    try {
      setActionError('');
      const updated = await ordersApi.cancelOrder(selectedOrder.id, {
        reason: cancelReason,
        cancelledBy: 'Staff',
      });
      setOrders(prev => prev.map(o => (o.id === selectedOrder.id ? updated : o)));
      setSelectedOrder(updated);
      setCancelModalOpen(false);
      setCancelReason('');
    } catch (err: any) {
      setActionError(err.message || 'Cancellation failed');
    }
  };

  const handleMergeSubmit = async () => {
    if (!selectedOrder || selectedForMerge.length === 0) return;
    try {
      setActionError('');
      const updated = await ordersApi.mergeOrders({
        targetOrderId: selectedOrder.id,
        sourceOrderIds: selectedForMerge,
        mergedBy: 'Staff',
      });
      setMergeModalOpen(false);
      setSelectedForMerge([]);
      await loadOrders();
      setSelectedOrder(updated);
    } catch (err: any) {
      setActionError(err.message || 'Merge failed');
    }
  };

  // Filtered orders list
  const filteredOrders = orders.filter(o => {
    if (statusFilter !== 'all' && o.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (typeFilter !== 'all' && o.type.toLowerCase() !== typeFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTicket = o.ticket.toLowerCase().includes(q);
      const matchGuest = o.tableOrGuest.toLowerCase().includes(q);
      const matchSummary = o.itemsSummary.toLowerCase().includes(q);
      if (!matchTicket && !matchGuest && !matchSummary) return false;
    }
    return true;
  });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'New': return { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' };
      case 'Accepted': return { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' };
      case 'Preparing': return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      case 'Ready': return { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' };
      case 'Served':
      case 'Dispatched': return { bg: '#ccfbf1', text: '#115e59', border: '#99f6e4' };
      case 'Completed': return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };
      case 'Cancelled': return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
      case 'Merged': return { bg: '#f5f3ff', text: '#5b21b6', border: '#ddd6fe' };
      default: return { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      {/* Top Header & Metrics */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Order Management Lifecycle
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Real-time pipeline across Dine-in, Takeaway, Delivery, and QR channels
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={loadOrders}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {actionError && (
        <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', border: '1px solid #f87171', borderRadius: '8px', color: '#991b1b', fontSize: '0.875rem' }}>
          ⚠️ {actionError}
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', background: 'var(--surface)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search ticket, table, guest or item..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            flex: '1 1 200px',
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            fontSize: '0.875rem',
          }}
        />

        {/* Status Pills */}
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
          {['all', 'New', 'Accepted', 'Preparing', 'Ready', 'Served', 'Completed', 'Cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: statusFilter === st ? '1px solid var(--primary)' : '1px solid var(--border)',
                background: statusFilter === st ? 'var(--primary)' : 'var(--bg)',
                color: statusFilter === st ? '#fff' : 'var(--text-main)',
              }}
            >
              {st === 'all' ? 'All Statuses' : st}
            </button>
          ))}
        </div>

        {/* Order Type Dropdown */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{
            padding: '0.45rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          <option value="all">All Channels</option>
          <option value="Dine-in">Dine-in</option>
          <option value="Takeaway">Takeaway</option>
          <option value="Delivery">Delivery</option>
          <option value="QR order">QR Order</option>
        </select>
      </div>

      {/* Main View: Split Left (Orders Cards List) & Right (Order Inspector Drawer) */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedOrder ? '1fr 420px' : '1fr', gap: '1.25rem', flex: 1, minHeight: 0 }}>
        {/* Orders Card Grid */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading && orders.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading live orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              No orders found matching the filter criteria.
            </div>
          ) : (
            filteredOrders.map(order => {
              const sc = getStatusColor(order.status);
              const isSelected = selectedOrder?.id === order.id;

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  style={{
                    padding: '1rem 1.25rem',
                    background: 'var(--surface)',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>{order.ticket}</span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: 'rgba(0,0,0,0.05)',
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                        }}
                      >
                        {order.type}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                        {order.tableOrGuest}
                      </span>
                    </div>

                    <span
                      style={{
                        padding: '0.2rem 0.65rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: sc.bg,
                        color: sc.text,
                        border: `1px solid ${sc.border}`,
                      }}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                    {order.itemsSummary || 'No items listed'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border)', paddingTop: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <span>Payment: <strong style={{ color: order.payment === 'Unpaid' ? '#e11d48' : '#16a34a' }}>{order.payment}</strong></span>
                      <span>Total: <strong style={{ color: 'var(--text-main)' }}>₹{order.total.toFixed(2)}</strong></span>
                    </div>
                    <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Drawer: Active Order Details & Actions */}
        {selectedOrder && (
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              overflowY: 'auto',
              boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{selectedOrder.ticket}</h2>
                  <span
                    style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      background: getStatusColor(selectedOrder.status).bg,
                      color: getStatusColor(selectedOrder.status).text,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {selectedOrder.type} · {selectedOrder.tableOrGuest}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            {/* Quick Status Action Buttons */}
            {selectedOrder.status !== 'Completed' && selectedOrder.status !== 'Cancelled' && selectedOrder.status !== 'Merged' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Lifecycle Actions
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {selectedOrder.status === 'New' && (
                    <button
                      onClick={() => handleStatusTransition(selectedOrder.id, 'Accepted')}
                      style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                    >
                      ✓ Accept Order
                    </button>
                  )}
                  {selectedOrder.status === 'Accepted' && (
                    <button
                      onClick={() => handleStatusTransition(selectedOrder.id, 'Preparing')}
                      style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', background: '#f59e0b', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                    >
                      🍳 Send to Prep
                    </button>
                  )}
                  {selectedOrder.status === 'Preparing' && (
                    <button
                      onClick={() => handleStatusTransition(selectedOrder.id, 'Ready')}
                      style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                    >
                      🛎️ Mark Ready
                    </button>
                  )}
                  {selectedOrder.status === 'Ready' && (
                    <button
                      onClick={() => handleStatusTransition(selectedOrder.id, selectedOrder.type === 'Delivery' ? 'Dispatched' : 'Served')}
                      style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', background: '#0d9488', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                    >
                      🍽️ Mark {selectedOrder.type === 'Delivery' ? 'Dispatched' : 'Served'}
                    </button>
                  )}
                  {(selectedOrder.status === 'Served' || selectedOrder.status === 'Dispatched') && (
                    <button
                      onClick={() => handleStatusTransition(selectedOrder.id, 'Completed')}
                      style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', background: '#4b5563', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                    >
                      🏁 Complete Order
                    </button>
                  )}

                  <button
                    onClick={() => setCancelModalOpen(true)}
                    style={{ padding: '0.6rem 0.85rem', borderRadius: '6px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #f87171', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => {
                      setSelectedForMerge([]);
                      setMergeModalOpen(true);
                    }}
                    style={{ padding: '0.6rem 0.85rem', borderRadius: '6px', background: 'var(--bg)', border: '1px solid var(--border)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Merge
                  </button>
                </div>
              </div>
            )}

            {/* Items Breakdown */}
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Itemized Order
              </span>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '0.35rem', borderBottom: '1px dashed var(--border)' }}>
                    <span>
                      <strong>{it.name}</strong> × {it.quantity}
                    </span>
                    <span>₹{(it.unitPrice * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Bill Totals */}
              <div style={{ marginTop: '0.75rem', background: 'var(--bg)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>GST (5%)</span>
                  <span>₹{selectedOrder.gstAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.95rem', borderTop: '1px solid var(--border)', paddingTop: '0.35rem' }}>
                  <span>Grand Total</span>
                  <span style={{ color: 'var(--primary)' }}>₹{selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Status Audit History Timeline */}
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Lifecycle Audit Trail
              </span>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {selectedOrder.history?.map((h, i) => (
                  <div key={h.id || i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', marginTop: '4px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ color: 'var(--text-main)' }}>{h.toStatus}</strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        by {h.changedBy} {h.reason ? `· ${h.reason}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Order Modal */}
      {cancelModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', width: '100%', maxWidth: '420px', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#991b1b' }}>Cancel Order {selectedOrder?.ticket}</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Please provide the official reason for cancellation (e.g. Guest walked out, wrong item sent).
            </p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Enter reason..."
              rows={3}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', fontSize: '0.875rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={() => setCancelModalOpen(false)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}
              >
                Dismiss
              </button>
              <button
                onClick={handleCancelSubmit}
                disabled={!cancelReason.trim()}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: '#dc2626', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Orders Modal */}
      {mergeModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', width: '100%', maxWidth: '460px', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Merge into {selectedOrder?.ticket}</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Select open active orders to combine into {selectedOrder?.ticket}:
            </p>
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {orders
                .filter(o => o.id !== selectedOrder?.id && o.status !== 'Completed' && o.status !== 'Cancelled' && o.status !== 'Merged')
                .map(o => {
                  const isChecked = selectedForMerge.includes(o.id);
                  return (
                    <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem', background: 'var(--bg)', borderRadius: '6px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedForMerge(prev =>
                            isChecked ? prev.filter(x => x !== o.id) : [...prev, o.id]
                          );
                        }}
                      />
                      <span style={{ fontWeight: 700 }}>{o.ticket}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({o.tableOrGuest} · ₹{o.total})</span>
                    </label>
                  );
                })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={() => setMergeModalOpen(false)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleMergeSubmit}
                disabled={selectedForMerge.length === 0}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                Merge Selected Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

