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
      setError(null);
      const [suppData, poData] = await Promise.all([
        supplierApi.getSuppliers(selectedCategory !== 'all' ? selectedCategory : undefined),
        supplierApi.getPurchaseOrders(selectedStatus !== 'all' ? selectedStatus : undefined),
      ]);
      setSuppliers(suppData || []);
      setOrders(poData || []);
      if (poData && poData.length > 0 && !selectedPO) {
        setSelectedPO(poData[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load procurement records');
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
    const validItems = newPOItems.filter(it => it.ingredientName.trim() !== '');
    if (validItems.length === 0) {
      alert('Please add at least one line item');
      return;
    }
    try {
      const created = await supplierApi.createPurchaseOrder({
        supplierId: newPOSupplierId,
        expectedDeliveryDate: newPOExpectedDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        notes: newPONotes,
        items: validItems,
      });
      setOrders(prev => [created, ...prev]);
      setSelectedPO(created);
      setShowPOModal(false);
      setNewPOItems([{ ingredientName: '', quantityOrdered: 10, unit: 'kg', unitPrice: 100 }]);
      setNewPONotes('');
      setNewPOSupplierId('');
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

  const getStatusStyle = (status: POStatus): { bg: string; color: string; border: string } => {
    switch (status) {
      case 'Draft':
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
      case 'Approved':
        return { bg: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
      case 'Ordered':
        return { bg: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
      case 'Partially Received':
        return { bg: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' };
      case 'Received':
        return { bg: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
      case 'Cancelled':
        return { bg: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      default:
        return { bg: 'var(--surface-muted)', color: 'var(--text-muted)', border: 'var(--border)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', minHeight: '100%' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        paddingBottom: '0.5rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(249, 115, 22, 0.12)',
              color: '#f97316',
              fontSize: '1.25rem',
              border: '1px solid rgba(249, 115, 22, 0.25)',
            }}>
              🏢
            </span>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                Procurement & Supplier Management
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                Automated supplier registry, purchase order pipelines, and dock receiving inspection
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setShowSupplierModal(true)}
            style={{
              padding: '0.6rem 1.1rem',
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>+</span> Add Supplier
          </button>
          <button
            onClick={() => setShowPOModal(true)}
            style={{
              padding: '0.6rem 1.2rem',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
            }}
          >
            <span>📄</span> New Purchase Order
          </button>
        </div>
      </div>

      {/* KPI Cards */}
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
            Active Suppliers
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', margin: '0.35rem 0 0.15rem' }}>
            {suppliers.length}
          </p>
          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 500 }}>
            ● 100% verified food-grade vendors
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
            Pending Approval
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', margin: '0.35rem 0 0.15rem' }}>
            {pendingApprovalCount}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Requires head chef / manager sign-off
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
            In-Transit Orders
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#c084fc', margin: '0.35rem 0 0.15rem' }}>
            {inTransitCount}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Awaiting receiving dock verification
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
            Total Spend Volume
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', margin: '0.35rem 0 0.15rem' }}>
            ₹{totalSpend.toLocaleString('en-IN')}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {receivedCount} fulfilled POs
          </span>
        </div>
      </div>

      {/* Tabs and Filtering Navigation */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'orders' ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid transparent',
              background: activeTab === 'orders' ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
              color: activeTab === 'orders' ? '#f97316' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            📋 Purchase Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'directory' ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid transparent',
              background: activeTab === 'directory' ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
              color: activeTab === 'directory' ? '#f97316' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            🏢 Supplier Directory ({suppliers.length})
          </button>
        </div>

        {activeTab === 'orders' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Status:</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                padding: '0.35rem 0.65rem',
                fontSize: '0.8rem',
                outline: 'none',
              }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Category:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                padding: '0.35rem 0.65rem',
                fontSize: '0.8rem',
                outline: 'none',
              }}
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
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
        }}>
          Loading procurement data...
        </div>
      ) : activeTab === 'orders' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.25rem',
          alignItems: 'start',
        }}>
          {/* PO List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {orders.length === 0 ? (
              <div style={{
                padding: '2.5rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                background: 'var(--surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
              }}>
                No purchase orders found matching this filter.
              </div>
            ) : (
              orders.map(po => {
                const isSelected = selectedPO?.id === po.id;
                const statusStyle = getStatusStyle(po.status);
                return (
                  <div
                    key={po.id}
                    onClick={() => setSelectedPO(po)}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '1px solid #f97316' : '1px solid var(--border)',
                      background: isSelected ? 'rgba(249, 115, 22, 0.05)' : 'var(--surface)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>
                            {po.poNumber}
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            border: `1px solid ${statusStyle.border}`,
                          }}>
                            {po.status}
                          </span>
                        </div>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {po.supplierName}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                          ₹{po.totalAmount.toLocaleString('en-IN')}
                        </p>
                        <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Exp: {po.expectedDeliveryDate}
                        </p>
                      </div>
                    </div>

                    <div style={{
                      marginTop: '0.75rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                    }}>
                      <span>{po.items.length} line item(s)</span>
                      <span>Order Date: {po.orderDate}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* PO Detail Inspector */}
          <div>
            {selectedPO ? (
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'sticky',
                top: '1rem',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
                      {selectedPO.poNumber}
                    </h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Vendor: <strong style={{ color: 'var(--text)' }}>{selectedPO.supplierName}</strong>
                    </p>
                  </div>
                  {(() => {
                    const st = getStatusStyle(selectedPO.status);
                    return (
                      <span style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: st.bg,
                        color: st.color,
                        border: `1px solid ${st.border}`,
                      }}>
                        {selectedPO.status}
                      </span>
                    );
                  })()}
                </div>

                {/* Line Items */}
                <div>
                  <h4 style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    margin: '0 0 0.5rem',
                    letterSpacing: '0.04em',
                  }}>
                    Ordered Items Breakdown
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    maxHeight: '220px',
                    overflowY: 'auto',
                  }}>
                    {selectedPO.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          fontSize: '0.8rem',
                        }}
                      >
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>
                            {item.ingredientName}
                          </p>
                          <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {item.quantityOrdered} {item.unit} @ ₹{item.unitPrice}/{item.unit}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)' }}>
                            ₹{item.totalPrice.toLocaleString('en-IN')}
                          </p>
                          {selectedPO.status === 'Received' && (
                            <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>
                              ✓ Received Full
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Subtotal</span>
                    <span>₹{selectedPO.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>GST (5%)</span>
                    <span>₹{selectedPO.taxAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 700,
                    color: 'var(--text)',
                    paddingTop: '0.4rem',
                    borderTop: '1px solid var(--border)',
                    fontSize: '0.9rem',
                  }}>
                    <span>Total Cost</span>
                    <span style={{ color: '#10b981' }}>₹{selectedPO.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {selectedPO.notes && (
                  <div style={{
                    padding: '0.7rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                  }}>
                    <strong style={{ color: 'var(--text)' }}>Delivery Instructions: </strong>
                    {selectedPO.notes}
                  </div>
                )}

                {/* Status Actions */}
                <div style={{
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}>
                  <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Workflow Pipeline:
                  </p>
                  {selectedPO.status === 'Draft' && (
                    <button
                      onClick={() => handleUpdatePOStatus(selectedPO.id, 'Approved')}
                      style={{
                        padding: '0.65rem',
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <span>✓</span> Approve Purchase Order
                    </button>
                  )}
                  {selectedPO.status === 'Approved' && (
                    <button
                      onClick={() => handleUpdatePOStatus(selectedPO.id, 'Ordered')}
                      style={{
                        padding: '0.65rem',
                        background: '#9333ea',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <span>📦</span> Dispatch & Mark In-Transit
                    </button>
                  )}
                  {selectedPO.status === 'Ordered' && (
                    <button
                      onClick={() => handleUpdatePOStatus(selectedPO.id, 'Received')}
                      style={{
                        padding: '0.65rem',
                        background: '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <span>📥</span> Receive Goods & Post Stock
                    </button>
                  )}
                  {selectedPO.status !== 'Received' && selectedPO.status !== 'Cancelled' && (
                    <button
                      onClick={() => handleUpdatePOStatus(selectedPO.id, 'Cancelled')}
                      style={{
                        padding: '0.55rem',
                        background: 'transparent',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel Purchase Order
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                padding: '2.5rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                background: 'var(--surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
              }}>
                Select a purchase order to inspect its items and workflow actions.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Supplier Directory Grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem',
        }}>
          {suppliers.map(sup => (
            <div
              key={sup.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                    {sup.name}
                  </h3>
                  <span style={{
                    display: 'inline-block',
                    margin: '0.25rem 0 0',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#f97316',
                    background: 'rgba(249, 115, 22, 0.1)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    {sup.category}
                  </span>
                </div>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.5rem',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)',
                }}>
                  {sup.code}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <p style={{ margin: 0 }}>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>👤 Contact:</span> {sup.contactPerson}
                </p>
                <p style={{ margin: 0 }}>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>📞 Phone:</span> {sup.phone}
                </p>
                <p style={{ margin: 0 }}>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>✉️ Email:</span> {sup.email}
                </p>
                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>💳 Terms:</span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.45rem',
                    borderRadius: '4px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    color: '#f59e0b',
                  }}>
                    {sup.paymentTerms}
                  </span>
                </p>
              </div>

              <div style={{
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
              }}>
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>⭐ {sup.rating} / 5.0</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>● {sup.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Purchase Order Modal */}
      {showPOModal && (
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
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📄</span> Create New Purchase Order
              </h3>
              <button
                onClick={() => setShowPOModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePO} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Target Supplier *
                </label>
                <select
                  required
                  value={newPOSupplierId}
                  onChange={e => setNewPOSupplierId(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                >
                  <option value="">Select a registered supplier...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category} · {s.paymentTerms})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Expected Delivery Date *
                </label>
                <input
                  type="date"
                  required
                  value={newPOExpectedDate}
                  onChange={e => setNewPOExpectedDate(e.target.value)}
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

              {/* Order Items Rows */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Order Items Breakdown
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPOItems(prev => [...prev, { ingredientName: '', quantityOrdered: 5, unit: 'kg', unitPrice: 100 }])}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f97316',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    + Add Ingredient Row
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {newPOItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        placeholder="Ingredient / Item Name"
                        required
                        value={item.ingredientName}
                        onChange={e => {
                          const val = e.target.value;
                          setNewPOItems(prev => prev.map((it, i) => (i === idx ? { ...it, ingredientName: val } : it)));
                        }}
                        style={{
                          flex: 3,
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.45rem 0.6rem',
                          color: 'var(--text)',
                          fontSize: '0.8rem',
                          outline: 'none',
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        required
                        min="1"
                        value={item.quantityOrdered}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setNewPOItems(prev => prev.map((it, i) => (i === idx ? { ...it, quantityOrdered: val } : it)));
                        }}
                        style={{
                          width: '65px',
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.45rem 0.5rem',
                          color: 'var(--text)',
                          fontSize: '0.8rem',
                          outline: 'none',
                        }}
                      />
                      <input
                        placeholder="Unit"
                        required
                        value={item.unit}
                        onChange={e => {
                          const val = e.target.value;
                          setNewPOItems(prev => prev.map((it, i) => (i === idx ? { ...it, unit: val } : it)));
                        }}
                        style={{
                          width: '55px',
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.45rem 0.5rem',
                          color: 'var(--text)',
                          fontSize: '0.8rem',
                          outline: 'none',
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        required
                        value={item.unitPrice}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setNewPOItems(prev => prev.map((it, i) => (i === idx ? { ...it, unitPrice: val } : it)));
                        }}
                        style={{
                          width: '75px',
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.45rem 0.5rem',
                          color: 'var(--text)',
                          fontSize: '0.8rem',
                          outline: 'none',
                        }}
                      />
                      {newPOItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewPOItems(prev => prev.filter((_, i) => i !== idx))}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            padding: '0 0.25rem',
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Delivery Instructions & Notes
                </label>
                <textarea
                  placeholder="e.g. Temperature-controlled truck required, deliver to Dock 2 between 7am and 10am"
                  value={newPONotes}
                  onChange={e => setNewPONotes(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    minHeight: '70px',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setShowPOModal(false)}
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
                  Generate Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showSupplierModal && (
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
                <span>🏢</span> Register New Supplier
              </h3>
              <button
                onClick={() => setShowSupplierModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Company / Vendor Name *
                </label>
                <input
                  required
                  placeholder="e.g. Sunrise Organic Dairy"
                  value={newSupplier.name}
                  onChange={e => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Contact Person *
                  </label>
                  <input
                    required
                    placeholder="Contact name"
                    value={newSupplier.contactPerson}
                    onChange={e => setNewSupplier(prev => ({ ...prev, contactPerson: e.target.value }))}
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
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Phone *
                  </label>
                  <input
                    required
                    placeholder="Mobile / Office"
                    value={newSupplier.phone}
                    onChange={e => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Category
                  </label>
                  <select
                    value={newSupplier.category}
                    onChange={e => setNewSupplier(prev => ({ ...prev, category: e.target.value as SupplierCategory }))}
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
                    <option value="Produce">Produce</option>
                    <option value="Dairy & Cheese">Dairy & Cheese</option>
                    <option value="Meat & Seafood">Meat & Seafood</option>
                    <option value="Dry Goods">Dry Goods</option>
                    <option value="Beverages & Spirits">Beverages & Spirits</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Payment Terms
                  </label>
                  <select
                    value={newSupplier.paymentTerms}
                    onChange={e => setNewSupplier(prev => ({ ...prev, paymentTerms: e.target.value as any }))}
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
                    <option value="COD">COD (Cash on Delivery)</option>
                    <option value="Net 7">Net 7</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="orders@vendor.example"
                  value={newSupplier.email}
                  onChange={e => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
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

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Warehouse / Dispatch Address
                </label>
                <input
                  required
                  placeholder="Street, City, Warehouse Unit"
                  value={newSupplier.address}
                  onChange={e => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
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
