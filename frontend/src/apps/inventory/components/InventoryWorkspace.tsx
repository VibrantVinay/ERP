'use client';

import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../api';
import { InventoryItem } from '../types';

export function InventoryWorkspace() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [status, setStatus] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getAll(status);
      setItems(data);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [status]);

  const getStatusBadge = (st: InventoryItem['status']) => {
    switch (st) {
      case 'In stock': return 'badge-success';
      case 'Low stock': return 'badge-warning';
      case 'Expiring soon': return 'badge-warning';
      case 'Out of stock': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">STOCK & SUPPLY CHAIN · INVENTORY</div>
          <h1>Inventory & Batches</h1>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {['All', 'In stock', 'Low stock', 'Expiring soon'].map(st => (
            <button
              key={st}
              onClick={() => setStatus(st)}
              className={`btn ${status === st ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.35rem 0.8rem', fontSize: '0.85rem' }}
            >
              {st}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Loading stock levels...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Location</th>
                <th>On Hand</th>
                <th>Reorder At</th>
                <th>Batch / Expiry</th>
                <th>Unit Cost (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.ingredient}</strong></td>
                  <td>{item.location}</td>
                  <td>{item.onHand}</td>
                  <td>{item.reorderPoint}</td>
                  <td>{item.batchExpiry}</td>
                  <td>₹{item.unitCost}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
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

