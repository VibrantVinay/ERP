'use client';

import React, { useState, useEffect } from 'react';
import { stockMovementApi } from '../api';
import { StockMovement, VarianceSummary, MovementType, MovementLocation, WasteReason, CreateStockMovementDto } from '../types';

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
    performedBy: 'Current Staff',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [movData, sumData] = await Promise.all([
        stockMovementApi.getMovements(selectedType),
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
    try {
      const created = await stockMovementApi.createMovement(newMovement);
      setMovements(prev => [created, ...prev]);
      setShowMovementModal(false);
      // Refresh summary
      const updatedSummary = await stockMovementApi.getVarianceSummary();
      setSummary(updatedSummary);
    } catch (err: any) {
      alert('Failed to log stock movement: ' + err.message);
    }
  };

  const getTypeBadge = (type: MovementType) => {
    switch (type) {
      case 'Waste':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Transfer':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Adjustment':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'CountVariance':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Action Launchers */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              ⚖️
            </span>
            Stock Movements, Waste & Transfers
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Kitchen spoilage tracking, inter-department station transfers & inventory count adjustments
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenModal('Waste')}
            className="px-3.5 py-2 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl font-medium text-xs transition-all shadow-md shadow-rose-950/40 flex items-center gap-1.5"
          >
            <span>🗑️</span> Log Waste / Spoilage
          </button>
          <button
            onClick={() => handleOpenModal('Transfer')}
            className="px-3.5 py-2 bg-blue-600/90 hover:bg-blue-500 text-white rounded-xl font-medium text-xs transition-all shadow-md shadow-blue-950/40 flex items-center gap-1.5"
          >
            <span>🔄</span> Internal Transfer
          </button>
          <button
            onClick={() => handleOpenModal('CountVariance')}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl font-medium text-xs transition-all flex items-center gap-1.5"
          >
            <span>📊</span> Count Variance
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Waste Loss</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">₹{summary?.totalWasteCost.toLocaleString('en-IN') || 0}</p>
          <p className="text-xs text-zinc-500 mt-1">Spoilage & prep discards</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Variance Discrepancy</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">₹{summary?.totalAdjustmentCost.toLocaleString('en-IN') || 0}</p>
          <p className="text-xs text-zinc-500 mt-1">Physical audit reconciliations</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Station Transfers</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{summary?.totalTransfersCount || 0}</p>
          <p className="text-xs text-zinc-500 mt-1">Dry store & walk-in handoffs</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Movement Audit</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{summary?.recentMovementsCount || 0}</p>
          <p className="text-xs text-zinc-500 mt-1">Recorded audit entries</p>
        </div>
      </div>

      {/* Spoilage Breakdown Pills */}
      {summary?.wasteByReason && Object.keys(summary.wasteByReason).length > 0 && (
        <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
          <p className="text-xs font-semibold uppercase text-zinc-400 mb-2.5">Wastage Root Cause Attribution:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.wasteByReason).map(([reason, data]) => (
              <span
                key={reason}
                className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-2"
              >
                <span className="font-medium text-rose-400">{reason}</span>
                <span className="text-zinc-500">·</span>
                <span>{data.count} items</span>
                <span className="font-semibold text-white">₹{data.cost.toLocaleString('en-IN')}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        {(['all', 'Waste', 'Transfer', 'Adjustment', 'CountVariance'] as const).map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedType === type
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            {type === 'all' ? 'All Movements' : type}
          </button>
        ))}
      </div>

      {/* Movements Audit Table */}
      {loading ? (
        <div className="p-12 text-center text-zinc-500 animate-pulse">Loading stock movement logs...</div>
      ) : movements.length === 0 ? (
        <div className="p-8 text-center text-zinc-500 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
          No stock movements recorded for this filter.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 uppercase text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Movement #</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Ingredient / Item</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Financial Impact</th>
                <th className="py-3 px-4">From → To</th>
                <th className="py-3 px-4">Reason & Notes</th>
                <th className="py-3 px-4">Staff</th>
                <th className="py-3 px-4">Logged At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {movements.map(m => (
                <tr key={m.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-white">{m.movementNumber}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${getTypeBadge(m.type)}`}>
                      {m.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-white">{m.itemName}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{m.sku}</p>
                  </td>
                  <td className="py-3 px-4 font-semibold text-zinc-200">
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.unit}
                  </td>
                  <td className="py-3 px-4 font-semibold text-rose-400">
                    ₹{m.totalCost.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-zinc-400">
                    <span className="text-zinc-300">{m.fromLocation}</span>
                    <span className="text-zinc-600 mx-1.5">→</span>
                    <span className="text-zinc-300">{m.toLocation}</span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-zinc-200 font-medium">{m.reason}</p>
                    {m.notes && <p className="text-[10px] text-zinc-500 mt-0.5">{m.notes}</p>}
                  </td>
                  <td className="py-3 px-4 text-zinc-400">{m.performedBy}</td>
                  <td className="py-3 px-4 text-zinc-500 text-[11px] whitespace-nowrap">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                    {new Date(m.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Log Stock Movement Modal */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{modalMode === 'Waste' ? '🗑️' : modalMode === 'Transfer' ? '🔄' : '📊'}</span>
                Record {modalMode} Entry
              </h3>
              <button onClick={() => setShowMovementModal(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateMovement} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Ingredient / Item Name</label>
                <input
                  required
                  placeholder="e.g. Heirloom Vine Tomatoes, Mascarpone, A5 Wagyu"
                  value={newMovement.itemName}
                  onChange={e => setNewMovement(prev => ({ ...prev, itemName: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newMovement.quantity}
                    onChange={e => setNewMovement(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Unit</label>
                  <input
                    required
                    value={newMovement.unit}
                    onChange={e => setNewMovement(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newMovement.unitCost}
                    onChange={e => setNewMovement(prev => ({ ...prev, unitCost: Number(e.target.value) }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Origin Location</label>
                  <select
                    value={newMovement.fromLocation}
                    onChange={e => setNewMovement(prev => ({ ...prev, fromLocation: e.target.value as MovementLocation }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
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
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Destination Location</label>
                  <select
                    value={newMovement.toLocation}
                    onChange={e => setNewMovement(prev => ({ ...prev, toLocation: e.target.value as MovementLocation }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
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
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Primary Reason</label>
                {modalMode === 'Waste' ? (
                  <select
                    value={newMovement.reason}
                    onChange={e => setNewMovement(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  >
                    <option value="Overripe">Overripe / Spoilage</option>
                    <option value="Spillage">Spillage / Dropped</option>
                    <option value="Burnt">Burnt / Overcooked</option>
                    <option value="Expired">Passed Expiration Date</option>
                    <option value="Damaged Packaging">Damaged Packaging</option>
                    <option value="Quality Standard Rejection">Quality Standard Rejection</option>
                  </select>
                ) : (
                  <input
                    required
                    placeholder="e.g. Shift Restock, Physical Count Variance, Transfer to Bar"
                    value={newMovement.reason}
                    onChange={e => setNewMovement(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Incident Notes / Cause</label>
                <textarea
                  placeholder="Additional context on the root cause or destination..."
                  value={newMovement.notes}
                  onChange={e => setNewMovement(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 resize-none h-18"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-medium shadow-lg"
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

