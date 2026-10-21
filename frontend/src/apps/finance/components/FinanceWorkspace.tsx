'use client';

import React, { useState, useEffect } from 'react';
import { financeApi } from '../api';
import {
  FinancialTransaction,
  FinanceSummary,
  TaxBreakdown,
  TransactionType,
  TransactionCategory,
  PaymentMethod,
} from '../types';
import { useAuth } from '@/apps/auth/context/AuthContext';

export function FinanceWorkspace() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ledger' | 'taxes'>('ledger');

  // State
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [taxData, setTaxData] = useState<TaxBreakdown | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected transactions for reconciliation
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isReconciling, setIsReconciling] = useState(false);

  // New Transaction Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState<TransactionType>('expense');
  const [newCategory, setNewCategory] = useState<TransactionCategory>('supplier_invoice');
  const [newAmount, setNewAmount] = useState('');
  const [newGstRate, setNewGstRate] = useState('5');
  const [newMethod, setNewMethod] = useState<PaymentMethod>('bank_transfer');
  const [newRef, setNewRef] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    loadData();
  }, [typeFilter, categoryFilter, statusFilter]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [txns, sum, taxes] = await Promise.all([
        financeApi.getTransactions({
          type: typeFilter !== 'all' ? typeFilter : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
        financeApi.getSummary(),
        financeApi.getTaxSummary(),
      ]);
      setTransactions(txns);
      setSummary(sum);
      setTaxData(taxes);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch financial ledger');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0 || !newDesc.trim()) return;

    try {
      await financeApi.createTransaction({
        branchId: 'main-branch',
        type: newType,
        category: newCategory,
        amount,
        gstRate: parseFloat(newGstRate) || 0,
        paymentMethod: newMethod,
        referenceNumber: newRef.trim() || undefined,
        description: newDesc.trim(),
        recordedBy: user?.name || 'Accountant',
      });
      setShowAddModal(false);
      setNewAmount('');
      setNewRef('');
      setNewDesc('');
      await loadData();
    } catch (err: any) {
      alert(`Error recording transaction: ${err.message}`);
    }
  }

  async function handleReconcileSelected() {
    if (selectedIds.length === 0) return;
    setIsReconciling(true);
    try {
      await financeApi.reconcile({
        transactionIds: selectedIds,
        reconciledBy: user?.name || 'Authorized Auditor',
      });
      setSelectedIds([]);
      await loadData();
    } catch (err: any) {
      alert(`Error reconciling entries: ${err.message}`);
    } finally {
      setIsReconciling(false);
    }
  }

  function toggleSelectTxn(id: string) {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }

  function handleSelectAllUnreconciled() {
    const unreconciled = transactions.filter(t => t.status !== 'reconciled').map(t => t.id);
    setSelectedIds(unreconciled);
  }

  const profitMargin =
    summary && summary.totalIncome > 0 ? Math.round((summary.netProfit / summary.totalIncome) * 100) : 0;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            📊 Financial Ledger & Tax Accounting
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            General journal, card & UPI payment settlement, GST compliance reconciliation, and operating profit.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {selectedIds.length > 0 && (
            <button
              onClick={handleReconcileSelected}
              disabled={isReconciling}
              style={{
                padding: '0.6rem 1rem',
                backgroundColor: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: isReconciling ? 'not-allowed' : 'pointer',
              }}
            >
              ✓ Reconcile Selected ({selectedIds.length})
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '0.6rem 1.2rem',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>+</span> Record Transaction
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.2rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gross Revenue</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.25rem', color: '#16a34a' }}>
              ${summary.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Food + Bar + Delivery revenue</div>
          </div>

          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.2rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Operating Expenses</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.25rem', color: '#dc2626' }}>
              ${summary.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>COGS, wages, utilities, repairs</div>
          </div>

          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.2rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Profit (Margin)</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.25rem', color: summary.netProfit >= 0 ? 'var(--text-primary)' : '#dc2626' }}>
              ${summary.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.4rem' }}>({profitMargin}%)</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>EBITDA baseline</div>
          </div>

          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.2rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net GST Liability</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.25rem', color: '#2563eb' }}>
              ${summary.netGstPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Collected: ${summary.totalGstCollected.toFixed(0)} • ITC: -${summary.inputTaxCredit.toFixed(0)}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('ledger')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'ledger' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'ledger' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'ledger' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
          }}
        >
          📜 General Ledger Transactions ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('taxes')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'taxes' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'taxes' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'taxes' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
          }}
        >
          🏛️ GST & Tax Schedule Breakdown
        </button>
      </div>

      {/* Tab 1: Ledger */}
      {activeTab === 'ledger' && (
        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
          {/* Filters Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Type:</span>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                >
                  <option value="all">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="refund">Refund</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Category:</span>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                >
                  <option value="all">All Categories</option>
                  <option value="food_sales">Food Sales</option>
                  <option value="beverage_sales">Beverage Sales</option>
                  <option value="supplier_invoice">Supplier Invoices</option>
                  <option value="payroll">Payroll</option>
                  <option value="utilities">Utilities</option>
                  <option value="equipment_maintenance">Equipment Maintenance</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                >
                  <option value="all">All Statuses</option>
                  <option value="reconciled">Reconciled</option>
                  <option value="completed">Unreconciled / Completed</option>
                </select>
              </div>
            </div>

            <div>
              <button
                onClick={handleSelectAllUnreconciled}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.35rem 0.75rem',
                  background: '#f1f5f9',
                  border: '1px solid var(--border)',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  color: '#475569',
                }}
              >
                Select All Pending Reconciliation
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading financial ledger...</div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>No transactions found.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
                    <th style={{ padding: '0.75rem 0.5rem', width: '36px' }}></th>
                    <th style={{ padding: '0.75rem' }}>Date & Ref</th>
                    <th style={{ padding: '0.75rem' }}>Description</th>
                    <th style={{ padding: '0.75rem' }}>Category</th>
                    <th style={{ padding: '0.75rem' }}>Method</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>GST ({5}% / {18}%)</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(txn => {
                    const isIncome = txn.type === 'income';
                    const isReconciled = txn.status === 'reconciled';
                    const isSelected = selectedIds.includes(txn.id);

                    return (
                      <tr
                        key={txn.id}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: isSelected ? '#f0fdf4' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                          {!isReconciled && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectTxn(txn.id)}
                            />
                          )}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 600 }}>{txn.date}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{txn.referenceNumber || txn.id}</div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 500 }}>{txn.description}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>By: {txn.recordedBy}</div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              background: '#e0e7ff',
                              color: '#3730a3',
                              textTransform: 'capitalize',
                            }}
                          >
                            {txn.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>
                          {txn.paymentMethod.replace('_', ' ')}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: isIncome ? '#16a34a' : '#dc2626' }}>
                          {isIncome ? '+' : '-'}${txn.amount.toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                          ${txn.taxAmount.toFixed(2)} <span style={{ fontSize: '0.75rem' }}>({txn.gstRate}%)</span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontWeight: 600,
                              background: isReconciled ? '#dcfce7' : '#fef3c7',
                              color: isReconciled ? '#15803d' : '#b45309',
                              textTransform: 'capitalize',
                            }}
                          >
                            {isReconciled ? '✓ Reconciled' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: GST & Taxes */}
      {activeTab === 'taxes' && taxData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 600 }}>🏛️ GST Rate Schedule & Output Liability</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>5% GST: Restaurant Dine-In & Takeaway</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>${taxData.diningGst5.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Gross Turn: ${taxData.diningGrossSales.toFixed(2)} (Standard food service)
                </div>
              </div>

              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>18% GST: Alcoholic Beverages & Premium Bar</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>${taxData.alcoholGst18.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Gross Turn: ${taxData.alcoholGrossSales.toFixed(2)} (Spirits, wine, beer, cocktail events)
                </div>
              </div>

              <div style={{ borderTop: '2px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem' }}>
                <span>Total Output GST Collected:</span>
                <span>${taxData.totalGstCollected.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 600 }}>🛡️ Input Tax Credit (ITC) & Net Settlement</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#15803d' }}>Input Tax Credit (ITC Offset)</span>
                  <span style={{ fontWeight: 700, color: '#15803d' }}>-${taxData.eligibleInputCredit.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#166534', marginTop: '0.25rem' }}>
                  Verified supplier procurement invoices, commercial gas, and equipment repair tax offsets.
                </div>
              </div>

              <div style={{ padding: '1.25rem', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '0.85rem', color: '#1e40af', textTransform: 'uppercase', fontWeight: 600 }}>Final Net Tax Payable</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1d4ed8', marginTop: '0.25rem' }}>
                  ${taxData.netTaxDue.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#1e40af', marginTop: '0.5rem' }}>
                  Ready for electronic GST filing for {taxData.period}.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Record Transaction */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--card-bg, #fff)', width: '100%', maxWidth: '500px', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: 600 }}>Record Financial Ledger Transaction</h3>
            <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Transaction Type</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as TransactionType)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                  >
                    <option value="expense">Expense (Payout / Bill)</option>
                    <option value="income">Income (Sales Revenue)</option>
                    <option value="refund">Refund</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as TransactionCategory)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                  >
                    <option value="supplier_invoice">Supplier Invoice</option>
                    <option value="food_sales">Food Sales</option>
                    <option value="beverage_sales">Beverage Sales</option>
                    <option value="payroll">Payroll</option>
                    <option value="utilities">Utilities</option>
                    <option value="equipment_maintenance">Equipment Care</option>
                    <option value="marketing">Marketing</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', fontSize: '1.05rem', fontWeight: 600 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>GST Rate (%)</label>
                  <select
                    value={newGstRate}
                    onChange={e => setNewGstRate(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                  >
                    <option value="5">5% (Dining)</option>
                    <option value="18">18% (Alcohol / Ops)</option>
                    <option value="0">0% (Exempt)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Payment Method</label>
                  <select
                    value={newMethod}
                    onChange={e => setNewMethod(e.target.value as PaymentMethod)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit_card">Credit Card POS</option>
                    <option value="upi_qr">UPI / QR Code</option>
                    <option value="cash">Cash Register</option>
                    <option value="delivery_partner">Delivery Partner Settle</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Reference / Invoice #</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2024-991"
                    value={newRef}
                    onChange={e => setNewRef(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wholesale dairy delivery payment"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', background: 'transparent', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Post to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

