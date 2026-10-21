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
      setTransactions(txns || []);
      setSummary(sum || null);
      setTaxData(taxes || null);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', minHeight: '100%' }}>
      {/* Header */}
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
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#10b981',
            fontSize: '1.25rem',
            border: '1px solid rgba(16, 185, 129, 0.25)',
          }}>
            📊
          </span>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              Financial Ledger & Tax Accounting
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              General ledger, multi-channel payment reconciliation, GST tax compliance, and restaurant net profit
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {selectedIds.length > 0 && (
            <button
              onClick={handleReconcileSelected}
              disabled={isReconciling}
              style={{
                padding: '0.6rem 1.1rem',
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: isReconciling ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              ✓ Reconcile Selected ({selectedIds.length})
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
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
            <span>+</span> Record Transaction
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {summary && (
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
              Gross Revenue
            </p>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', margin: '0.35rem 0 0.15rem' }}>
              ₹{summary.totalIncome.toLocaleString('en-IN')}
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Dine-In, Takeaway, Bar & Delivery
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
              Operating Expenses
            </p>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f87171', margin: '0.35rem 0 0.15rem' }}>
              ₹{summary.totalExpenses.toLocaleString('en-IN')}
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              COGS, payroll, utilities, vendor bills
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
              Net Profit (EBITDA)
            </p>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: summary.netProfit >= 0 ? 'var(--text)' : '#ef4444', margin: '0.35rem 0 0.15rem' }}>
              ₹{summary.netProfit.toLocaleString('en-IN')}
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: summary.netProfit >= 0 ? '#10b981' : '#ef4444', marginLeft: '0.4rem' }}>
                ({profitMargin}%)
              </span>
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Net operating margin
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
              Net GST Liability
            </p>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#60a5fa', margin: '0.35rem 0 0.15rem' }}>
              ₹{summary.netGstPayable.toLocaleString('en-IN')}
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Collected: ₹{summary.totalGstCollected.toLocaleString('en-IN')} • ITC: -₹{summary.inputTaxCredit.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
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
            onClick={() => setActiveTab('ledger')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'ledger' ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid transparent',
              background: activeTab === 'ledger' ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
              color: activeTab === 'ledger' ? '#f97316' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            📜 General Ledger ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('taxes')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'taxes' ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid transparent',
              background: activeTab === 'taxes' ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
              color: activeTab === 'taxes' ? '#f97316' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            🏛️ GST & Tax Schedule Breakdown
          </button>
        </div>

        {activeTab === 'ledger' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
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
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="refund">Refund</option>
            </select>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
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
              <option value="food_sales">Food Sales</option>
              <option value="beverage_sales">Beverage Sales</option>
              <option value="supplier_invoice">Supplier Invoices</option>
              <option value="payroll">Payroll</option>
              <option value="utilities">Utilities</option>
              <option value="equipment_maintenance">Equipment Maintenance</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
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
              <option value="reconciled">Reconciled</option>
              <option value="completed">Pending Audit</option>
            </select>

            <button
              onClick={handleSelectAllUnreconciled}
              style={{
                fontSize: '0.78rem',
                padding: '0.35rem 0.75rem',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              Select Unreconciled
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Ledger */}
      {activeTab === 'ledger' && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading financial ledger...
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No transactions found matching filter criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '0.75rem 0.5rem', width: '36px', textAlign: 'center' }}></th>
                    <th style={{ padding: '0.75rem 1rem' }}>Date & Ref</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Description</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Payment Method</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>GST ({5}% / {18}%)</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Audit Status</th>
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
                          background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                          color: 'var(--text)',
                        }}
                      >
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                          {!isReconciled && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectTxn(txn.id)}
                              style={{ cursor: 'pointer' }}
                            />
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 600 }}>{txn.date}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {txn.referenceNumber || txn.id}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 600 }}>{txn.description}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Recorded: {txn.recordedBy}</div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              background: 'rgba(59, 130, 246, 0.1)',
                              color: '#60a5fa',
                              border: '1px solid rgba(59, 130, 246, 0.25)',
                              textTransform: 'capitalize',
                              fontWeight: 600,
                            }}
                          >
                            {txn.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                          {txn.paymentMethod.replace('_', ' ')}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: isIncome ? '#10b981' : '#f87171' }}>
                          {isIncome ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                          ₹{txn.taxAmount.toLocaleString('en-IN')} <span style={{ fontSize: '0.7rem' }}>({txn.gstRate}%)</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              fontWeight: 600,
                              background: isReconciled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                              color: isReconciled ? '#10b981' : '#f59e0b',
                              border: `1px solid ${isReconciled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
              🏛️ GST Rate Schedule & Output Liability
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>5% GST: Restaurant Food Service & Takeaway</span>
                  <span style={{ fontWeight: 700, color: '#10b981', fontSize: '1rem' }}>₹{taxData.diningGst5.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Gross Turn: ₹{taxData.diningGrossSales.toLocaleString('en-IN')} (Standard food dining)
                </div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>18% GST: Alcoholic Beverages & Bar Events</span>
                  <span style={{ fontWeight: 700, color: '#10b981', fontSize: '1rem' }}>₹{taxData.alcoholGst18.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Gross Turn: ₹{taxData.alcoholGrossSales.toLocaleString('en-IN')} (Spirits, cocktails, cellar)
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
                <span>Total Output GST Collected:</span>
                <span style={{ color: '#10b981' }}>₹{taxData.totalGstCollected.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
              🛡️ Input Tax Credit (ITC) & Net Settlement
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#10b981' }}>Input Tax Credit (ITC Offset)</span>
                  <span style={{ fontWeight: 700, color: '#10b981', fontSize: '1rem' }}>-₹{taxData.eligibleInputCredit.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Verified supplier procurement invoices, commercial LPG, and equipment maintenance tax offsets.
                </div>
              </div>

              <div style={{ padding: '1.25rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                <div style={{ fontSize: '0.78rem', color: '#60a5fa', textTransform: 'uppercase', fontWeight: 700 }}>Final Net Tax Payable</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.25rem' }}>
                  ₹{taxData.netTaxDue.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Ready for electronic GST filing for {taxData.period}.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Record Transaction */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
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
            width: '100%',
            maxWidth: '500px',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
              Record Financial Ledger Transaction
            </h3>
            <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Transaction Type
                  </label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as TransactionType)}
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
                    <option value="expense">Expense (Payout / Bill)</option>
                    <option value="income">Income (Sales Revenue)</option>
                    <option value="refund">Refund</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as TransactionCategory)}
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
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.55rem 0.75rem',
                      color: 'var(--text)',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      outline: 'none',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    GST Rate (%)
                  </label>
                  <select
                    value={newGstRate}
                    onChange={e => setNewGstRate(e.target.value)}
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
                    <option value="5">5% (Dining)</option>
                    <option value="18">18% (Alcohol / Ops)</option>
                    <option value="0">0% (Exempt)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Payment Method
                  </label>
                  <select
                    value={newMethod}
                    onChange={e => setNewMethod(e.target.value as PaymentMethod)}
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
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="credit_card">Credit Card POS</option>
                    <option value="upi_qr">UPI / QR Code</option>
                    <option value="cash">Cash Register</option>
                    <option value="delivery_partner">Delivery Partner Settle</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Reference / Invoice #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2024-991"
                    value={newRef}
                    onChange={e => setNewRef(e.target.value)}
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

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wholesale dairy delivery payment"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '0.55rem 1rem',
                    border: '1px solid var(--border)',
                    background: 'transparent',
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
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                  }}
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
