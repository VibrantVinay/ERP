'use client';

import React, { useState, useEffect } from 'react';
import { supplierApi } from '../api';
import { Supplier, PurchaseOrder, SupplierCategory, POStatus, CreateSupplierDto } from '../types';

export const SupplierWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'directory'>('orders');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals
  const [showPOModal, setShowPOModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  // New PO State
  const [newPOSupplierId, setNewPOSupplierId] = useState('');
  const [newPOExpectedDate, setNewPOExpectedDate] = useState('');
  const [newPONotes, setNewPONotes] = useState('');
  const [newPOItems, setNewPOItems] = useState<Array<{ ingredientName: string; quantityOrdered: number; unit: string; unitPrice: number }>>([
    { ingredientName: '', quantityOrdered: 10, unit: 'kg', unitPrice: 100 },
  ]);

  // New Supplier State
  const [newSupplier, setNewSupplier] = useState<CreateSupplierDto>({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    category: 'Produce',
    paymentTerms: 'Net 15',
    address: '',
    rating: 5,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [suppData, poData] = await Promise.all([
        supplierApi.getSuppliers(selectedCategory),
        supplierApi.getPurchaseOrders(selectedStatus),
      ]);
      setSuppliers(suppData || []);
      setOrders(poData || []);
      if (poData && poData.length > 0 && !selectedPO) {
        setSelectedPO(poData[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load supplier records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, selectedStatus]);

  const handleUpdatePOStatus = async (poId: string, status: POStatus) => {
    try {
      const updated = await supplierApi.updatePOStatus(poId, {
        status,
        actionBy: 'Current Manager',
      });
      setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
      if (selectedPO?.id === updated.id) {
        setSelectedPO(updated);
      }
    } catch (err: any) {
      alert('Failed to update PO status: ' + err.message);
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPOSupplierId) {
      alert('Please select a supplier');
      return;
    }
    try {
      const created = await supplierApi.createPurchaseOrder({
        supplierId: newPOSupplierId,
        expectedDeliveryDate: newPOExpectedDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        notes: newPONotes,
        items: newPOItems.filter(it => it.ingredientName.trim() !== ''),
      });
      setOrders(prev => [created, ...prev]);
      setSelectedPO(created);
      setShowPOModal(false);
      setNewPOItems([{ ingredientName: '', quantityOrdered: 10, unit: 'kg', unitPrice: 100 }]);
    } catch (err: any) {
      alert('Failed to create purchase order: ' + err.message);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await supplierApi.createSupplier(newSupplier);
      setSuppliers(prev => [...prev, created]);
      setShowSupplierModal(false);
      setNewSupplier({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        category: 'Produce',
        paymentTerms: 'Net 15',
        address: '',
        rating: 5,
      });
    } catch (err: any) {
      alert('Failed to register supplier: ' + err.message);
    }
  };

  // Metrics
  const pendingApprovalCount = orders.filter(o => o.status === 'Draft').length;
  const inTransitCount = orders.filter(o => o.status === 'Ordered').length;
  const receivedCount = orders.filter(o => o.status === 'Received').length;
  const totalSpend = orders.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? o.totalAmount : 0), 0);

  const getStatusColor = (status: POStatus) => {
    switch (status) {
      case 'Draft': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Approved': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Ordered': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Partially Received': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'Received': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Cancelled': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default: return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              🏢
            </span>
            Procurement & Supplier Management
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Supplier registry, automated purchase orders, delivery receiving & ingredient verification
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSupplierModal(true)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2"
          >
            <span>+</span> Add Supplier
          </button>
          <button
            onClick={() => setShowPOModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-orange-950/40 flex items-center gap-2"
          >
            <span>📄</span> New Purchase Order
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Suppliers</p>
          <p className="text-2xl font-bold text-white mt-1">{suppliers.length}</p>
          <p className="text-xs text-emerald-400 mt-1">100% verified vendors</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pending Approval</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{pendingApprovalCount}</p>
          <p className="text-xs text-zinc-400 mt-1">Requires manager sign-off</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">In-Transit Orders</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{inTransitCount}</p>
          <p className="text-xs text-zinc-400 mt-1">Awaiting kitchen dock delivery</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total PO Volume</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">₹{totalSpend.toLocaleString('en-IN')}</p>
          <p className="text-xs text-zinc-400 mt-1">{receivedCount} successfully fulfilled</p>
        </div>
      </div>

      {/* Workspace Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'orders'
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            📋 Purchase Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'directory'
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            🏢 Supplier Directory ({suppliers.length})
          </button>
        </div>

        {activeTab === 'orders' ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Approved">Approved</option>
              <option value="Ordered">Ordered (In Transit)</option>
              <option value="Received">Received</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Categories</option>
              <option value="Produce">Produce</option>
              <option value="Dairy & Cheese">Dairy & Cheese</option>
              <option value="Meat & Seafood">Meat & Seafood</option>
              <option value="Dry Goods">Dry Goods</option>
              <option value="Beverages & Spirits">Beverages & Spirits</option>
              <option value="Packaging">Packaging</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Workspace Body */}
      {loading ? (
        <div className="p-12 text-center text-zinc-500 animate-pulse">Loading procurement records...</div>
      ) : activeTab === 'orders' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* PO List */}
          <div className="lg:col-span-7 space-y-3">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
                No purchase orders found matching this filter.
              </div>
            ) : (
              orders.map(po => (
                <div
                  key={po.id}
                  onClick={() => setSelectedPO(po)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedPO?.id === po.id
                      ? 'bg-zinc-800/90 border-orange-500/50 shadow-lg'
                      : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">{po.poNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${getStatusColor(po.status)}`}>
                          {po.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 font-medium">{po.supplierName}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-white">₹{po.totalAmount.toLocaleString('en-IN')}</p>
                      <p className="text-[11px] text-zinc-500">Exp: {po.expectedDeliveryDate}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                    <span>{po.items.length} line items</span>
                    <span>Order Date: {po.orderDate}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* PO Detail Inspector */}
          <div className="lg:col-span-5">
            {selectedPO ? (
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-5 sticky top-6 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedPO.poNumber}</h3>
                    <p className="text-xs text-zinc-400">{selectedPO.supplierName}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs border font-medium ${getStatusColor(selectedPO.status)}`}>
                    {selectedPO.status}
                  </span>
                </div>

                {/* Line Items Table */}
                <div>
                  <h4 className="text-xs font-semibold uppercase text-zinc-400 mb-2">Ordered Ingredients</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedPO.items.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl text-xs flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{item.ingredientName}</p>
                          <p className="text-[11px] text-zinc-500">
                            {item.quantityOrdered} {item.unit} @ ₹{item.unitPrice}/{item.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-zinc-200">₹{item.totalPrice.toLocaleString('en-IN')}</p>
                          {selectedPO.status === 'Received' && (
                            <p className="text-[10px] text-emerald-400">✓ Received full</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span>₹{selectedPO.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>GST (5%)</span>
                    <span>₹{selectedPO.taxAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-white pt-1.5 border-t border-zinc-800">
                    <span>Total Amount</span>
                    <span className="text-emerald-400">₹{selectedPO.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {selectedPO.notes && (
                  <div className="text-xs text-zinc-400 bg-zinc-950/30 p-2.5 rounded-xl border border-zinc-800/60">
                    <span className="font-semibold text-zinc-300">Delivery Notes: </span>
                    {selectedPO.notes}
                  </div>
                )}

                {/* Action Pipeline Buttons */}
                <div className="pt-2 border-t border-zinc-800 space-y-2">
                  <p className="text-xs font-semibold text-zinc-400 mb-2">Status Workflow Actions:</p>
                  {selectedPO.status === 'Draft' && (
                    <button
                      onClick={() => handleUpdatePOStatus(selectedPO.id, 'Approved')}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <span>✓</span> Approve Purchase Order
                    </button>
                  )}
                  {selectedPO.status === 'Approved' && (
                    <button
                      onClick={() => handleUpdatePOStatus(selectedPO.id, 'Ordered')}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <span>📦</span> Dispatch & Mark as Ordered
                    </button>
                  )}
                  {selectedPO.status === 'Ordered' && (
                    <button
                      onClick={() => handleUpdatePOStatus(selectedPO.id, 'Received')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <span>📥</span> Receive Goods & Verify Delivery
                    </button>
                  )}
                  {selectedPO.status !== 'Received' && selectedPO.status !== 'Cancelled' && (
                    <button
                      onClick={() => handleUpdatePOStatus(selectedPO.id, 'Cancelled')}
                      className="w-full py-2 bg-zinc-800 hover:bg-rose-950/50 hover:text-rose-400 text-zinc-400 border border-zinc-700/60 rounded-xl text-xs transition-all"
                    >
                      Cancel Purchase Order
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
                Select a purchase order to inspect details.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Supplier Directory Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(sup => (
            <div key={sup.id} className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{sup.name}</h3>
                  <p className="text-xs text-orange-400 font-medium mt-0.5">{sup.category}</p>
                </div>
                <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-xs rounded-lg">
                  {sup.code}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-zinc-400">
                <p className="flex items-center gap-2">
                  <span className="text-zinc-500">👤 Contact:</span> {sup.contactPerson}
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-zinc-500">📞 Phone:</span> {sup.phone}
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-zinc-500">✉️ Email:</span> {sup.email}
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-zinc-500">💳 Terms:</span>
                  <span className="px-2 py-0.5 bg-zinc-800 text-amber-300 font-semibold rounded text-[11px]">
                    {sup.paymentTerms}
                  </span>
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-zinc-500">Rating: ⭐ {sup.rating}/5.0</span>
                <span className="text-emerald-400 font-medium">● {sup.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Purchase Order Modal */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📄</span> Create Purchase Order
              </h3>
              <button onClick={() => setShowPOModal(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">Supplier</label>
                <select
                  required
                  value={newPOSupplierId}
                  onChange={e => setNewPOSupplierId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="">Select Supplier...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category} · {s.paymentTerms})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">Expected Delivery Date</label>
                <input
                  type="date"
                  required
                  value={newPOExpectedDate}
                  onChange={e => setNewPOExpectedDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Items Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase text-zinc-400">Order Items</label>
                  <button
                    type="button"
                    onClick={() => setNewPOItems(prev => [...prev, { ingredientName: '', quantityOrdered: 5, unit: 'kg', unitPrice: 100 }])}
                    className="text-xs text-orange-400 hover:text-orange-300 font-medium"
                  >
                    + Add Row
                  </button>
                </div>

                <div className="space-y-2">
                  {newPOItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        placeholder="Ingredient / Item Name"
                        required
                        value={item.ingredientName}
                        onChange={e => {
                          const val = e.target.value;
                          setNewPOItems(prev => prev.map((it, i) => i === idx ? { ...it, ingredientName: val } : it));
                        }}
                        className="col-span-5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        required
                        min="1"
                        value={item.quantityOrdered}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setNewPOItems(prev => prev.map((it, i) => i === idx ? { ...it, quantityOrdered: val } : it));
                        }}
                        className="col-span-2 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-200"
                      />
                      <input
                        placeholder="Unit"
                        required
                        value={item.unit}
                        onChange={e => {
                          const val = e.target.value;
                          setNewPOItems(prev => prev.map((it, i) => i === idx ? { ...it, unit: val } : it));
                        }}
                        className="col-span-2 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-200"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        required
                        value={item.unitPrice}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setNewPOItems(prev => prev.map((it, i) => i === idx ? { ...it, unitPrice: val } : it));
                        }}
                        className="col-span-2 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-200"
                      />
                      {newPOItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewPOItems(prev => prev.filter((_, i) => i !== idx))}
                          className="col-span-1 text-zinc-500 hover:text-rose-400 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">Delivery Notes</label>
                <textarea
                  placeholder="e.g. Refrigerated delivery required, delivery dock open 8am-11am"
                  value={newPONotes}
                  onChange={e => setNewPONotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-orange-500 resize-none h-20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowPOModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-medium shadow-lg"
                >
                  Generate Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🏢</span> Register New Supplier
              </h3>
              <button onClick={() => setShowSupplierModal(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Company / Vendor Name</label>
                <input
                  required
                  placeholder="e.g. Sunrise Organic Dairy"
                  value={newSupplier.name}
                  onChange={e => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Contact Person</label>
                  <input
                    required
                    placeholder="Contact full name"
                    value={newSupplier.contactPerson}
                    onChange={e => setNewSupplier(prev => ({ ...prev, contactPerson: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Phone</label>
                  <input
                    required
                    placeholder="Mobile / Office"
                    value={newSupplier.phone}
                    onChange={e => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Category</label>
                  <select
                    value={newSupplier.category}
                    onChange={e => setNewSupplier(prev => ({ ...prev, category: e.target.value as SupplierCategory }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  >
                    <option value="Produce">Produce</option>
                    <option value="Dairy & Cheese">Dairy & Cheese</option>
                    <option value="Meat & Seafood">Meat & Seafood</option>
                    <option value="Dry Goods">Dry Goods</option>
                    <option value="Beverages & Spirits">Beverages & Spirits</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Payment Terms</label>
                  <select
                    value={newSupplier.paymentTerms}
                    onChange={e => setNewSupplier(prev => ({ ...prev, paymentTerms: e.target.value as any }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  >
                    <option value="COD">COD</option>
                    <option value="Net 7">Net 7</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="orders@vendor.example"
                  value={newSupplier.email}
                  onChange={e => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Address / Warehouse</label>
                <input
                  required
                  placeholder="Full warehouse or delivery origin address"
                  value={newSupplier.address}
                  onChange={e => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-medium shadow-lg"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
