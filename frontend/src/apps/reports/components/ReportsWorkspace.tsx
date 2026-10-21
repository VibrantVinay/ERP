'use client';

import React, { useState, useEffect } from 'react';
import { reportsApi } from '../api';
import {
  SalesSummaryReport,
  MenuMixItem,
  FoodCostReport,
  MenuMatrixClassification,
} from '../types';
import { useAuth } from '@/apps/auth/context/AuthContext';

export function ReportsWorkspace() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sales' | 'menumix' | 'foodcost'>('sales');

  // State
  const [sales, setSales] = useState<SalesSummaryReport | null>(null);
  const [menuMix, setMenuMix] = useState<MenuMixItem[]>([]);
  const [foodCost, setFoodCost] = useState<FoodCostReport | null>(null);
  const [matrixFilter, setMatrixFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [salesData, mixData, costData] = await Promise.all([
        reportsApi.getSalesSummary(),
        reportsApi.getMenuMix(),
        reportsApi.getFoodCost(),
      ]);
      setSales(salesData || null);
      setMenuMix(mixData || []);
      setFoodCost(costData || null);
    } catch (err: any) {
      setError(err.message || 'Failed to generate operational reports');
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(reportType: 'sales' | 'menu_mix' | 'food_cost', format: 'csv' | 'json') {
    setExporting(true);
    try {
      await reportsApi.triggerExport({ reportType, format });
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    } finally {
      setExporting(false);
    }
  }

  const filteredMenuMix = matrixFilter === 'all' ? menuMix : menuMix.filter(m => m.classification === matrixFilter);

  const starCount = menuMix.filter(m => m.classification === 'star').length;
  const plowhorseCount = menuMix.filter(m => m.classification === 'plowhorse').length;
  const puzzleCount = menuMix.filter(m => m.classification === 'puzzle').length;
  const dogCount = menuMix.filter(m => m.classification === 'dog').length;

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
            background: 'rgba(2, 132, 199, 0.12)',
            color: '#0284c7',
            fontSize: '1.25rem',
            border: '1px solid rgba(2, 132, 199, 0.25)',
          }}>
            📈
          </span>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              Restaurant Intelligence & Analytics
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Sales performance, hourly rush volume, Kasavana-Smith menu engineering, and recipe food cost variance
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleExport(activeTab === 'menumix' ? 'menu_mix' : activeTab === 'foodcost' ? 'food_cost' : 'sales', 'csv')}
            disabled={exporting}
            style={{
              padding: '0.6rem 1.1rem',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: exporting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
            }}
          >
            <span>📥</span> Export CSV
          </button>
          <button
            onClick={() => handleExport(activeTab === 'menumix' ? 'menu_mix' : activeTab === 'foodcost' ? 'food_cost' : 'sales', 'json')}
            disabled={exporting}
            style={{
              padding: '0.6rem 1.1rem',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: exporting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
            }}
          >
            <span>💾</span> Export JSON
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {sales && foodCost && (
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
              Gross Revenue ({sales.period})
            </p>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', margin: '0.35rem 0 0.15rem' }}>
              ₹{sales.totalGrossSales.toLocaleString('en-IN')}
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {sales.totalOrders} total covers served
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
              Average Order Value (AOV)
            </p>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', margin: '0.35rem 0 0.15rem' }}>
              ₹{sales.averageOrderValue.toFixed(2)}
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Per guest dining ticket size
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
              Food Cost Percentage
            </p>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: foodCost.foodCostPercentage > foodCost.targetFoodCostPercentage ? '#f59e0b' : '#10b981', margin: '0.35rem 0 0.15rem' }}>
              {foodCost.foodCostPercentage}%
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                (Target {foodCost.targetFoodCostPercentage}%)
              </span>
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Variance: +₹{foodCost.varianceTotal.toLocaleString('en-IN')}
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
              Menu Engineering Mix
            </p>
            <p style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', margin: '0.35rem 0 0.15rem' }}>
              ⭐ {starCount} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Stars</span> • 🐴 {plowhorseCount} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Plow</span>
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              🧩 {puzzleCount} Puzzles • 🐕 {dogCount} Dogs
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
        gap: '0.75rem',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('sales')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'sales' ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid transparent',
              background: activeTab === 'sales' ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
              color: activeTab === 'sales' ? '#f97316' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            📊 Sales & Hourly Heatmap
          </button>
          <button
            onClick={() => setActiveTab('menumix')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'menumix' ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid transparent',
              background: activeTab === 'menumix' ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
              color: activeTab === 'menumix' ? '#f97316' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            🎯 Menu Engineering Matrix ({menuMix.length})
          </button>
          <button
            onClick={() => setActiveTab('foodcost')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'foodcost' ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid transparent',
              background: activeTab === 'foodcost' ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
              color: activeTab === 'foodcost' ? '#f97316' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            ⚖️ Food Cost & BOM Variance
          </button>
        </div>
      </div>

      {/* Tab 1: Sales Trends & Hourly Heatmap */}
      {activeTab === 'sales' && sales && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Hourly Traffic Bar Chart */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
                  Hourly Sales Volume & Kitchen Rush Windows
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Peak throughput observed during Lunch (1:00 PM) and Dinner (8:00 PM)
                </p>
              </div>
              <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700 }}>
                Peak: ₹1,68,000 @ 20:00
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '220px', paddingBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
              {sales.hourlyTrends.map(h => {
                const maxVal = 1800;
                const barHeight = Math.max(14, Math.round((h.sales / maxVal) * 180));
                const isPeak = h.sales >= 1300;

                return (
                  <div key={h.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isPeak ? '#f97316' : 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      ₹{h.sales}
                    </div>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '40px',
                        height: `${barHeight}px`,
                        background: isPeak ? 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)' : 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                      title={`${h.hour}: ₹${h.sales} (${h.orderCount} orders)`}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 600 }}>
                      {h.hour}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Breakdown Grids */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Payment Distribution */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)' }}>
                💳 Payment Method Split
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {sales.paymentDistribution.map(p => (
                  <div key={p.method}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{p.method}</span>
                      <span style={{ fontWeight: 700, color: '#10b981' }}>₹{p.total.toLocaleString('en-IN')} ({p.percentage}%)</span>
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: '4px', height: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <div style={{ width: `${p.percentage}%`, height: '100%', background: '#6366f1' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Channels Split */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)' }}>
                🛵 Service Channel Share
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {sales.channelDistribution.map(c => {
                  const share = sales.totalGrossSales > 0 ? Math.round((c.total / sales.totalGrossSales) * 100) : 0;
                  return (
                    <div key={c.channel}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{c.channel}</span>
                        <span style={{ fontWeight: 700, color: '#10b981' }}>₹{c.total.toLocaleString('en-IN')} ({c.orders} orders)</span>
                      </div>
                      <div style={{ background: 'var(--bg)', borderRadius: '4px', height: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <div style={{ width: `${share}%`, height: '100%', background: '#10b981' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Menu Engineering Matrix */}
      {activeTab === 'menumix' && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {/* Quadrant Legend & Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
                Kasavana & Smith Menu Engineering Quadrants
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Evaluates item contribution margin vs order popularity across entire dining catalog
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setMatrixFilter('all')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: matrixFilter === 'all' ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid var(--border)',
                  background: matrixFilter === 'all' ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
                  color: matrixFilter === 'all' ? '#f97316' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                All ({menuMix.length})
              </button>
              <button
                onClick={() => setMatrixFilter('star')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: matrixFilter === 'star' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border)',
                  background: matrixFilter === 'star' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                  color: matrixFilter === 'star' ? '#10b981' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                ⭐ Stars ({starCount})
              </button>
              <button
                onClick={() => setMatrixFilter('plowhorse')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: matrixFilter === 'plowhorse' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border)',
                  background: matrixFilter === 'plowhorse' ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                  color: matrixFilter === 'plowhorse' ? '#60a5fa' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                🐴 Plowhorses ({plowhorseCount})
              </button>
              <button
                onClick={() => setMatrixFilter('puzzle')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: matrixFilter === 'puzzle' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border)',
                  background: matrixFilter === 'puzzle' ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                  color: matrixFilter === 'puzzle' ? '#f59e0b' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                🧩 Puzzles ({puzzleCount})
              </button>
              <button
                onClick={() => setMatrixFilter('dog')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: matrixFilter === 'dog' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border)',
                  background: matrixFilter === 'dog' ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                  color: matrixFilter === 'dog' ? '#ef4444' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                🐕 Dogs ({dogCount})
              </button>
            </div>
          </div>

          {/* Matrix Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Menu Item</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Units Sold</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Unit Cost</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Revenue</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total Margin</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Food Cost %</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Classification</th>
                </tr>
              </thead>
              <tbody>
                {filteredMenuMix.map(item => {
                  const getBadge = (c: MenuMatrixClassification) => {
                    switch (c) {
                      case 'star':
                        return { label: '⭐ Star (High Profit / High Pop)', bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
                      case 'plowhorse':
                        return { label: '🐴 Plowhorse (High Pop / Low Margin)', bg: 'rgba(59, 130, 246, 0.12)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
                      case 'puzzle':
                        return { label: '🧩 Puzzle (High Margin / Low Pop)', bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
                      case 'dog':
                        return { label: '🐕 Dog (Low Margin / Low Pop)', bg: 'rgba(239, 68, 68, 0.12)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
                    }
                  };
                  const badge = getBadge(item.classification);

                  return (
                    <tr key={item.itemId} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{item.itemName}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{item.category}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>{item.unitsSold}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>₹{item.unitPrice.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>₹{item.unitCost.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>₹{item.totalRevenue.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#10b981', fontWeight: 700 }}>
                        ₹{item.totalMargin.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{item.foodCostPercent}%</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '9999px',
                            fontWeight: 600,
                            background: badge.bg,
                            color: badge.text,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Theoretical vs Actual Food Cost Variance */}
      {activeTab === 'foodcost' && foodCost && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
                Ingredient Consumption Variance Ledger
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Theoretical usage calculated from POS sales recipes (BOM) vs actual pantry stock depletion
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Cost Variance: </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171' }}>+₹{foodCost.varianceTotal.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Raw Ingredient</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Unit</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Theoretical BOM</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actual Depletion</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Variance Qty</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Unit Cost</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Rupee Impact</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Operational Root Cause</th>
                </tr>
              </thead>
              <tbody>
                {foodCost.topVariances.map((v, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{v.ingredientName}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{v.unit}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{v.theoreticalQty}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{v.actualQty}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#f87171' }}>
                      +{v.varianceQty}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>₹{v.unitCost.toFixed(2)}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#f87171' }}>
                      +₹{v.varianceCost.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      "{v.wasteReason || 'Unspecified variance'}"
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
