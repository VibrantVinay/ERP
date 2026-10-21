'use client';

import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../api';
import { InventoryItem, StorageLocation, CreateInventoryItemDto } from '../types';

export function InventoryStockManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [alerts, setAlerts] = useState<{ lowStock: InventoryItem[]; expiringSoon: InventoryItem[] }>({
    lowStock: [],
    expiringSoon: [],
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('Stock reconciliation count');

  const [batchModalItem, setBatchModalItem] = useState<InventoryItem | null>(null);
  const [newBatchNo, setNewBatchNo] = useState<string>('');
  const [newBatchQty, setNewBatchQty] = useState<number>(5);
  const [newBatchExp, setNewBatchExp] = useState<string>('');

  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState<CreateInventoryItemDto>({
    name: '',
    sku: '',
    category: 'Pantry',
    location: 'Dry store',
    currentStock: 10,
    unit: 'kg',
    reorderLevel: 3,
    unitCost: 150,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, locsData, alertsData] = await Promise.all([
        inventoryApi.getItems({
          location: selectedLocation === 'all' ? undefined : selectedLocation,
          status: selectedStatus === 'all' ? undefined : selectedStatus,
        }),
        inventoryApi.getLocations(),
        inventoryApi.getAlerts(),
      ]);
      setItems(itemsData);
      setLocations(locsData);
      setAlerts(alertsData);
    } catch (err) {
      console.error('Failed to load inventory data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedLocation, selectedStatus]);

  const handleAdjustSubmit = async () => {
    if (!adjustItem) return;
    try {
      const updated = await inventoryApi.adjustStock(adjustItem.id, {
        quantityDelta: adjustDelta,
        reason: adjustReason,
      });
      setItems(prev => prev.map(i => (i.id === adjustItem.id ? updated : i)));
      setAdjustItem(null);
      const refreshedAlerts = await inventoryApi.getAlerts();
      setAlerts(refreshedAlerts);
    } catch (err) {
      console.error('Failed to adjust stock', err);
    }
  };

  const handleAddBatchSubmit = async () => {
    if (!batchModalItem || !newBatchNo.trim() || !newBatchExp) return;
    try {
      await inventoryApi.addBatch({
        itemId: batchModalItem.id,
        batchNumber: newBatchNo,
        quantity: newBatchQty,
        expirationDate: newBatchExp,
      });
      setBatchModalItem(null);
      setNewBatchNo('');
      setNewBatchExp('');
      await loadData();
    } catch (err) {
      console.error('Failed to add batch', err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.sku.trim()) return;
    try {
      const created = await inventoryApi.createItem(createForm);
      setItems(prev => [created, ...prev]);
      setCreateModalOpen(false);
      setCreateForm({
        name: '',
        sku: '',
        category: 'Pantry',
        location: 'Dry store',
        currentStock: 10,
        unit: 'kg',
        reorderLevel: 3,
        unitCost: 150,
      });
      const refreshedAlerts = await inventoryApi.getAlerts();
      setAlerts(refreshedAlerts);
    } catch (err) {
      console.error('Failed to create inventory item', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'In stock': return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'Low stock': return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
      case 'Expiring soon': return { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' };
      case 'Out of stock': return { bg: '#f3f4f6', text: '#dc2626', border: '#e5e7eb' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
            Inventory & Stock Control
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Multi-location stock on hand, batch expiry monitoring & low-stock reorder triggers
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setCreateModalOpen(true)}
            style={{
              padding: '0.6rem 1.1rem',
              borderRadius: '8px',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            + Register Stock Item
          </button>
        </div>
      </div>

      {/* Alerts Banner (Low Stock & Expiring) */}
      {(alerts.lowStock.length > 0 || alerts.expiringSoon.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {alerts.lowStock.length > 0 && (
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <div>
                <strong style={{ color: '#92400e', fontSize: '0.85rem' }}>
                  {alerts.lowStock.length} Low-Stock Reorder Triggers:
                </strong>
                <div style={{ fontSize: '0.75rem', color: '#b45309' }}>
                  {alerts.lowStock.map(i => `${i.name} (${i.currentStock} ${i.unit})`).join(', ')}
                </div>
              </div>
            </div>
          )}

          {alerts.expiringSoon.length > 0 && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.25rem' }}>⏳</span>
              <div>
                <strong style={{ color: '#991b1b', fontSize: '0.85rem' }}>
                  {alerts.expiringSoon.length} Batches Expiring in &lt; 7 Days:
                </strong>
                <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>
                  {alerts.expiringSoon.map(i => i.name).join(', ')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: 'var(--surface)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
        {/* Locations */}
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
          <button
            onClick={() => setSelectedLocation('all')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              border: selectedLocation === 'all' ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: selectedLocation === 'all' ? 'var(--primary)' : 'var(--bg)',
              color: selectedLocation === 'all' ? '#fff' : 'var(--text-main)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            All Locations
          </button>
          {locations.map(loc => (
            <button
              key={loc}
              onClick={() => setSelectedLocation(loc)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                border: selectedLocation === loc ? '1px solid var(--primary)' : '1px solid var(--border)',
                background: selectedLocation === loc ? 'var(--primary)' : 'var(--bg)',
                color: selectedLocation === loc ? '#fff' : 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {loc}
            </button>
          ))}
        </div>

        {/* Status */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {['all', 'In stock', 'Low stock', 'Expiring soon', 'Out of stock'].map(st => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: selectedStatus === st ? 'var(--border)' : 'var(--bg)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Item & SKU</th>
                <th style={{ padding: '0.85rem 1rem' }}>Location</th>
                <th style={{ padding: '0.85rem 1rem' }}>Stock on Hand</th>
                <th style={{ padding: '0.85rem 1rem' }}>Reorder Level</th>
                <th style={{ padding: '0.85rem 1rem' }}>Batches & Expiry</th>
                <th style={{ padding: '0.85rem 1rem' }}>Unit Cost</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading inventory records...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No inventory items found.
                  </td>
                </tr>
              ) : (
                items.map(item => {
                  const sb = getStatusBadge(item.status);
                  const isLow = item.currentStock <= item.reorderLevel;

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {item.sku} · {item.category}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 600 }}>
                          {item.location}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong style={{ fontSize: '0.95rem', color: isLow ? '#dc2626' : 'var(--text-main)' }}>
                          {item.currentStock} {item.unit}
                        </strong>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                        {item.reorderLevel} {item.unit}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {item.batches.length === 0 ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No batch record</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {item.batches.map(b => (
                              <span
                                key={b.id}
                                style={{
                                  fontSize: '0.75rem',
                                  color: b.isExpiringSoon ? '#dc2626' : 'var(--text-main)',
                                  fontWeight: b.isExpiringSoon ? 700 : 500,
                                }}
                              >
                                {b.batchNumber}: exp {b.expirationDate}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>
                        ₹{item.unitCost.toFixed(2)} / {item.unit}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: sb.bg,
                            color: sb.text,
                            border: `1px solid ${sb.border}`,
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button
                            onClick={() => {
                              setAdjustItem(item);
                              setAdjustDelta(1);
                            }}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              background: 'var(--bg)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            ± Adjust
                          </button>
                          <button
                            onClick={() => setBatchModalItem(item)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              background: 'var(--bg)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            + Batch
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', width: '100%', maxWidth: '380px', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Adjust Stock: {adjustItem.name}</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Current on hand: <strong>{adjustItem.currentStock} {adjustItem.unit}</strong>
            </p>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Quantity Delta (+ to restock, - to deduct)</label>
              <input
                type="number"
                step="0.1"
                value={adjustDelta}
                onChange={e => setAdjustDelta(Number(e.target.value))}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', marginTop: '0.25rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Adjustment Reason</label>
              <input
                type="text"
                value={adjustReason}
                onChange={e => setAdjustReason(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', marginTop: '0.25rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => setAdjustItem(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustSubmit}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                Confirm Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Batch Modal */}
      {batchModalItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', width: '100%', maxWidth: '380px', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Receive New Batch: {batchModalItem.name}</h3>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Batch Lot Number *</label>
              <input
                type="text"
                placeholder="e.g. B-901"
                value={newBatchNo}
                onChange={e => setNewBatchNo(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', marginTop: '0.25rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Received Quantity ({batchModalItem.unit})</label>
              <input
                type="number"
                min={0.1}
                step="0.1"
                value={newBatchQty}
                onChange={e => setNewBatchQty(Number(e.target.value))}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', marginTop: '0.25rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Expiration Date *</label>
              <input
                type="date"
                value={newBatchExp}
                onChange={e => setNewBatchExp(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', marginTop: '0.25rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => setBatchModalItem(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddBatchSubmit}
                disabled={!newBatchNo.trim() || !newBatchExp}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                Log Batch Shipment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Item Modal */}
      {createModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <form
            onSubmit={handleCreateSubmit}
            style={{
              background: 'var(--surface)',
              width: '100%',
              maxWidth: '460px',
              borderRadius: '12px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Register Inventory Item</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Item Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Maldon Sea Salt"
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>SKU *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. SLT-100"
                  value={createForm.sku}
                  onChange={e => setCreateForm({ ...createForm, sku: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Storage Location</label>
                <select
                  value={createForm.location}
                  onChange={e => setCreateForm({ ...createForm, location: e.target.value as any })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                >
                  {locations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Category</label>
                <input
                  type="text"
                  placeholder="Pantry, Dairy..."
                  value={createForm.category}
                  onChange={e => setCreateForm({ ...createForm, category: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Initial Stock</label>
                <input
                  type="number"
                  step="0.1"
                  value={createForm.currentStock}
                  onChange={e => setCreateForm({ ...createForm, currentStock: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Unit</label>
                <input
                  type="text"
                  placeholder="kg, L, pcs"
                  value={createForm.unit}
                  onChange={e => setCreateForm({ ...createForm, unit: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Reorder Level</label>
                <input
                  type="number"
                  step="0.1"
                  value={createForm.reorderLevel}
                  onChange={e => setCreateForm({ ...createForm, reorderLevel: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Unit Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                value={createForm.unitCost}
                onChange={e => setCreateForm({ ...createForm, unitCost: Number(e.target.value) })}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                Register Item
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

