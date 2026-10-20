'use client';

import React, { useState, useEffect } from 'react';
import { ordersApi } from '../api';
import { OrderRecord, OrderStatus } from '../types';

export function OrdersWorkspace() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.getAll(filterStatus === 'All' ? undefined : { status: filterStatus });
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
    try {
      await ordersApi.updateStatus(id, newStatus);
      fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Ready':
      case 'Served':
      case 'Completed':
        return 'badge-success';
      case 'Preparing':
      case 'Accepted':
        return 'badge-info';
      case 'New':
        return 'badge-warning';
      default:
        return 'badge-danger';
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">SERVICE · ORDER REGISTER</div>
          <h1>Orders</h1>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {['All', 'New', 'Preparing', 'Ready', 'Completed'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`btn ${filterStatus === st ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.35rem 0.8rem', fontSize: '0.85rem' }}
            >
              {st}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Loading live orders...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Type</th>
                <th>Table / Guest</th>
                <th>Items</th>
                <th>Total (₹)</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td><strong>{order.ticket}</strong></td>
                  <td>{order.type}</td>
                  <td>{order.tableOrGuest}</td>
                  <td>{order.items}</td>
                  <td>₹{order.total}</td>
                  <td>{order.payment}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <select
                      value={order.status}
                      onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      style={{ padding: '0.25rem 0.5rem', borderRadius: 4, border: '1px solid var(--border)' }}
                    >
                      <option value="New">New</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Ready">Ready</option>
                      <option value="Served">Served</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

