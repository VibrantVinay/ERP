'use client';

import React, { useState, useEffect } from 'react';
import { stockMovementApi } from '../api';
import { StockMovement, VarianceSummary, MovementType, MovementLocation, CreateStockMovementDto } from '../types';

export const StockMovementWorkspace: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [summary, setSummary] = useState<VarianceSummary | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [modalMode, setModalMode] = useState<MovementType>('Waste');

  // New Movement Form State
  const [newMovement, setNewMovement] = useState<CreateStockMovementDto>({
    type: 'Waste',
    itemId: 'inv_custom',
    itemName: '',
    sku: '',
    quantity: 1,
    unit: 'kg',
    unitCost: 100,
    fromLocation: 'Walk-in chiller',
    toLocation: 'Disposal / Waste Bin',
    reason: 'Overripe',
    notes: '',
    performedBy: 'Staff In-Charge',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [movData, sumData] = await Promise.all([
        stockMovementApi.getMovements(selectedType !== 'all' ? selectedType : undefined),
        stockMovementApi.getVarianceSummary(),
      ]);
      setMovements(movData || []);
      setSummary(sumData || null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedType]);

  const handleOpenModal = (type: MovementType) => {
    setModalMode(type);
    let defaultFrom: MovementLocation = 'Walk-in chiller';
    let defaultTo: MovementLocation = 'Disposal / Waste Bin';
    let defaultReason = 'Overripe';

    if (type === 'Transfer') {
      defaultFrom = 'Dry store';
      defaultTo = 'Hot line';
      defaultReason = 'Shift Restock';
    } else if (type === 'Adjustment' || type === 'CountVariance') {
      defaultFrom = 'Bar';
      defaultTo = 'Bar';
      defaultReason = 'Physical Count Reconciled';
    }

    setNewMovement({
      type,
      itemId: 'inv_custom',
      itemName: '',
      sku: `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
      quantity: 1,
      unit: 'kg',
      unitCost: 150,
      fromLocation: defaultFrom,
      toLocation: defaultTo,
      reason: defaultReason,
      notes: '',
      performedBy: 'Staff In-Charge',
    });
    setShowMovementModal(true);
  };

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMovement.itemName.trim()) {
      alert('Please specify an ingredient or item name');
      return;
    }
    try {
      const created = await stockMovementApi.createMovement(newMovement);
      setMovements(prev => [created, ...prev]);
      setShowMovementModal(false);
      const updatedSummary = await stockMovementApi.getVarianceSummary();
      setSummary(updatedSummary);
    } catch (err: any) {
      alert('Failed to log stock movement: ' + err.message);
    }
  };

  const getTypeStyle = (type: MovementType): { bg: string; color: string; border: string } => {
    switch (type) {
      case 'Waste':
        return { bg: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'Transfer':
        return { bg: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
      case 'Adjustment':
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
      case 'CountVariance':
        return { bg: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
      default:
        return { bg: 'var(--surface-muted)', color: 'var(--text-muted)', border: 'var(--border)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', minHeight: '100%' }}>
      {/* Top Header & Fast Action Launchers */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        paddingBottom: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            fontSize: '1.25rem',
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}>
            ⚖️
          </span>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              Stock Movements, Waste & Transfers
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Kitchen spoilage audit, departmental station transfers, and physical inventory variance tracking
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={() => handleOpenModal('Waste')}
            style={{
              padding: '0.55rem 1rem',
              background: 'rgba(239, 68, 68, 0.9)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            }}
          >
            <span>🗑️</span> Log Waste / Spoilage
          </button>
          <button
            onClick={() => handleOpenModal('Transfer')}
            style={{
              padding: '0.55rem 1rem',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            }}
          >
            <span>🔄</span> Station Transfer
          </button>
          <button
            onClick={() => handleOpenModal('CountVariance')}
            style={{
              padding: '0.55rem 1rem',
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>📊</span> Count Variance
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
      }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.1rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em' }}>
            Total Waste Loss
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f87171', margin: '0.35rem 0 0.15rem' }}>
            ₹{summary?.totalWasteCost.toLocaleString('en-IN') || 0}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Direct kitchen & prep discards
          </span>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.1rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em' }}>
            Variance Discrepancy
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', margin: '0.35rem 0 0.15rem' }}>
            ₹{summary?.totalAdjustmentCost.toLocaleString('en-IN') || 0}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Physical audit reconciliation cost
          </span>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.1rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em' }}>
            Station Transfers
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#60a5fa', margin: '0.35rem 0 0.15rem' }}>
            {summary?.totalTransfersCount || 0}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Dry store & prep line handoffs
          </span>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.1rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em' }}>
            Audit Movement Records
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', margin: '0.35rem 0 0.15rem' }}>
            {summary?.recentMovementsCount || 0}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Verified immutable audit entries
          </span>
        </div>
      </div>

      {/* Wastage Root Cause Breakdown Banner */}
      {summary?.wasteByReason && Object.keys(summary.wasteByReason).length > 0 && (
        <div style={{
          padding: '1rem 1.25rem',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <p style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            margin: '0 0 0.65rem 0',
            letterSpacing: '0.04em',
          }}>
            Wastage Root Cause Attribution:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {Object.entries(summary.wasteByReason).map(([reason, data]) => (
              <span
                key={reason}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  fontSize: '0.78rem',
                  color: 'var(--text)',
                }}
              >
                <span style={{ fontWeight: 600, color: '#f87171' }}>{reason}</span>
                <span style={{ color: 'var(--text-muted)' }}>·</span>
                <span style={{ color: 'var(--text-muted)' }}>{data.count} logged</span>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>₹{data.cost.toLocaleString('en-IN')}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '0.75rem',
      }}>
        {(['all', 'Waste', 'Transfer', 'Adjustment', 'CountVariance'] as const).map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: selectedType === type ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid transparent',
              background: selectedType === type ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
              color: selectedType === type ? '#f97316' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            {type === 'all' ? 'All Movements' : type}
          </button>
        ))}
      </div>

      {/* Movements Audit Table */}
      {loading ? (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
        }}>
          Loading stock movements...
        </div>
      ) : movements.length === 0 ? (
        <div style={{
          padding: '2.5rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
        }}>
          No stock movements recorded for this filter.
        </div>
      ) : (
        <div style={{
          overflowX: 'auto',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Movement #</th>
                <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                <th style={{ padding: '0.75rem 1rem' }}>Ingredient / Item</th>
                <th style={{ padding: '0.75rem 1rem' }}>Quantity</th>
                <th style={{ padding: '0.75rem 1rem' }}>Financial Impact</th>
                <th style={{ padding: '0.75rem 1rem' }}>From → To</th>
                <th style={{ padding: '0.75rem 1rem' }}>Reason & Notes</th>
                <th style={{ padding: '0.75rem 1rem' }}>Staff</th>
                <th style={{ padding: '0.75rem 1rem' }}>Logged At</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m, idx) => {
                const typeStyle = getTypeStyle(m.type);
                return (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: idx === movements.length - 1 ? 'none' : '1px solid var(--border)',
                      color: 'var(--text)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 700 }}>
                      {m.movementNumber}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        background: typeStyle.bg,
                        color: typeStyle.color,
                        border: `1px solid ${typeStyle.border}`,
                      }}>
                        {m.type}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>{m.itemName}</p>
                      <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {m.sku}
                      </p>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.unit}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: m.type === 'Waste' ? '#f87171' : 'var(--text)' }}>
                      ₹{m.totalCost.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text)' }}>{m.fromLocation}</span>
                      <span style={{ margin: '0 0.4rem', color: 'var(--text-muted)' }}>→</span>
                      <span style={{ color: 'var(--text)' }}>{m.toLocation}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <p style={{ margin: 0, fontWeight: 500 }}>{m.reason}</p>
                      {m.notes && <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.notes}</p>}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                      {m.performedBy}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                      {new Date(m.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Log Stock Movement Modal */}
      {showMovementModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '520px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{modalMode === 'Waste' ? '🗑️' : modalMode === 'Transfer' ? '🔄' : '📊'}</span>
                Record {modalMode} Entry
              </h3>
              <button
                onClick={() => setShowMovementModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMovement} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Ingredient / Item Name *
                </label>
                <input
                  required
                  placeholder="e.g. Heirloom Vine Tomatoes, Mascarpone, A5 Wagyu"
                  value={newMovement.itemName}
                  onChange={e => setNewMovement(prev => ({ ...prev, itemName: e.target.value }))}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newMovement.quantity}
                    onChange={e => setNewMovement(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    style={{
                      width: '100%',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.55rem 0.65rem',
                      color: 'var(--text)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Unit
                  </label>
                  <input
                    required
                    value={newMovement.unit}
                    onChange={e => setNewMovement(prev => ({ ...prev, unit: e.target.value }))}
                    style={{
                      width: '100%',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.55rem 0.65rem',
                      color: 'var(--text)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Unit Cost (₹)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newMovement.unitCost}
                    onChange={e => setNewMovement(prev => ({ ...prev, unitCost: Number(e.target.value) }))}
                    style={{
                      width: '100%',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.55rem 0.65rem',
                      color: 'var(--text)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Origin Station
                  </label>
                  <select
                    value={newMovement.fromLocation}
                    onChange={e => setNewMovement(prev => ({ ...prev, fromLocation: e.target.value as MovementLocation }))}
                    style={{
                      width: '100%',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.55rem 0.65rem',
                      color: 'var(--text)',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Dry store">Dry store</option>
                    <option value="Walk-in chiller">Walk-in chiller</option>
                    <option value="Produce prep">Produce prep</option>
                    <option value="Hot line">Hot line</option>
                    <option value="Bar">Bar</option>
                    <option value="Freezer">Freezer</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Destination Station
                  </label>
                  <select
                    value={newMovement.toLocation}
                    onChange={e => setNewMovement(prev => ({ ...prev, toLocation: e.target.value as MovementLocation }))}
                    style={{
                      width: '100%',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.55rem 0.65rem',
                      color: 'var(--text)',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Disposal / Waste Bin">Disposal / Waste Bin</option>
                    <option value="Hot line">Hot line</option>
                    <option value="Produce prep">Produce prep</option>
                    <option value="Bar">Bar</option>
                    <option value="Walk-in chiller">Walk-in chiller</option>
                    <option value="Dry store">Dry store</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Primary Cause / Reason
                </label>
                {modalMode === 'Waste' ? (
                  <select
                    value={newMovement.reason}
                    onChange={e => setNewMovement(prev => ({ ...prev, reason: e.target.value }))}
                    style={{
                      width: '100%',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.55rem 0.75rem',
                      color: 'var(--text)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Overripe">Overripe / Natural Spoilage</option>
                    <option value="Spillage">Spillage / Dropped Floor Contamination</option>
                    <option value="Burnt">Burnt / Cooking Error</option>
                    <option value="Expired">Passed Expiration Date</option>
                    <option value="Damaged Packaging">Damaged Inbound Packaging</option>
                    <option value="Quality Standard Rejection">Quality Standard Rejection</option>
                  </select>
                ) : (
                  <input
                    required
                    placeholder="e.g. Shift Restock, Physical Count Variance, Transfer to Bar"
                    value={newMovement.reason}
                    onChange={e => setNewMovement(prev => ({ ...prev, reason: e.target.value }))}
                    style={{
                      width: '100%',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.55rem 0.75rem',
                      color: 'var(--text)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Incident Notes & Root Cause Description
                </label>
                <textarea
                  placeholder="Additional context on the root cause or destination..."
                  value={newMovement.notes}
                  onChange={e => setNewMovement(prev => ({ ...prev, notes: e.target.value }))}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    minHeight: '65px',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  style={{
                    padding: '0.55rem 1rem',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.55rem 1.25rem',
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                  }}
                >
                  Submit Stock Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
