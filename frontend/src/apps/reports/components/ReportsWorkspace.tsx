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
      setSales(salesData);
      setMenuMix(mixData);
      setFoodCost(costData);
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
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            📈 Restaurant Intelligence & Analytics
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Executive sales performance, hourly peak traffic, Kasavana-Smith menu engineering, and food cost variances.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleExport(activeTab === 'menumix' ? 'menu_mix' : activeTab === 'foodcost' ? 'food_cost' : 'sales', 'csv')}
            disabled={exporting}
            style={{
              padding: '0.6rem 1.1rem',
              backgroundColor: '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: exporting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>📥</span> Export CSV
          </button>
          <button
            onClick={() => handleExport(activeTab === 'menumix' ? 'menu_mix' : activeTab === 'foodcost' ? 'food_cost' : 'sales', 'json')}
            disabled={exporting}
            style={{
              padding: '0.6rem 1.1rem',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: exporting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>💾</span> Export JSON
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {sales && foodCost && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.2rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gross Revenue ({sales.period})</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.25rem', color: '#16a34a' }}>
              ${sales.totalGrossSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{sales.totalOrders} total covers served</div>
          </div>

          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.2rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average Order Value (AOV)</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
              ${sales.averageOrderValue.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Per guest table ticket size</div>
          </div>

          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.2rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Food Cost Percentage</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.25rem', color: foodCost.foodCostPercentage > foodCost.targetFoodCostPercentage ? '#f59e0b' : '#10b981' }}>
              {foodCost.foodCostPercentage}%
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                (Target {foodCost.targetFoodCostPercentage}%)
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Variance: +${foodCost.varianceTotal.toFixed(0)}
            </div>
          </div>

          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.2rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Menu Performance Mix</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
              ⭐ {starCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Stars</span> • 🐴 {plowhorseCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Plow</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              🧩 {puzzleCount} Puzzles • 🐕 {dogCount} Dogs
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('sales')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'sales' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'sales' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'sales' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
          }}
        >
          📊 Sales Traffic & Hourly Heatmap
        </button>
        <button
          onClick={() => setActiveTab('menumix')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'menumix' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'menumix' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'menumix' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
          }}
        >
          🎯 Kasavana-Smith Menu Engineering Matrix ({menuMix.length})
        </button>
        <button
          onClick={() => setActiveTab('foodcost')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'foodcost' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'foodcost' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'foodcost' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
          }}
        >
          ⚖️ Theoretical vs Actual Food Cost Variance
        </button>
      </div>

      {/* Tab 1: Sales Trends & Hourly Heatmap */}
      {activeTab === 'sales' && sales && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Hourly Traffic Bar Chart */}
          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Hourly Sales Volume & Kitchen Rush Windows</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Peaks at 1:00 PM (Lunch) and 8:00 PM (Dinner)</p>
              </div>
              <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 600 }}>Peak: $1,680.00 @ 20:00</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '220px', paddingBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
              {sales.hourlyTrends.map(h => {
                const maxVal = 1800;
                const barHeight = Math.max(12, Math.round((h.sales / maxVal) * 180));
                const isPeak = h.sales >= 1300;

                return (
                  <div key={h.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isPeak ? '#ea580c' : 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      ${h.sales}
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
                      title={`${h.hour}: $${h.sales} (${h.orderCount} orders)`}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 500 }}>
                      {h.hour}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Breakdown Grids */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Payment Distribution */}
            <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600 }}>💳 Payment Method Split</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {sales.paymentDistribution.map(p => (
                  <div key={p.method}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 500 }}>{p.method}</span>
                      <span style={{ fontWeight: 600 }}>${p.total.toLocaleString()} ({p.percentage}%)</span>
                    </div>
                    <div style={{ background: '#f1f5f9', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                      <div style={{ width: `${p.percentage}%`, height: '100%', background: '#6366f1' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Channels Split */}
            <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600 }}>🛵 Service Channel Share</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {sales.channelDistribution.map(c => {
                  const share = sales.totalGrossSales > 0 ? Math.round((c.total / sales.totalGrossSales) * 100) : 0;
                  return (
                    <div key={c.channel}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 500 }}>{c.channel}</span>
                        <span style={{ fontWeight: 600 }}>${c.total.toLocaleString()} ({c.orders} orders)</span>
                      </div>
                      <div style={{ background: '#f1f5f9', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
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
        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem' }}>
          {/* Quadrant Legend & Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Kasavana & Smith Menu Engineering Quadrants</h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Evaluates item contribution margin vs volume popularity.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setMatrixFilter('all')}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '5px',
                  border: '1px solid var(--border)',
                  background: matrixFilter === 'all' ? 'var(--primary)' : 'transparent',
                  color: matrixFilter === 'all' ? '#fff' : 'inherit',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}
              >
                All ({menuMix.length})
              </button>
              <button
                onClick={() => setMatrixFilter('star')}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '5px',
                  border: '1px solid var(--border)',
                  background: matrixFilter === 'star' ? '#16a34a' : 'transparent',
                  color: matrixFilter === 'star' ? '#fff' : '#16a34a',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                ⭐ Stars ({starCount})
              </button>
              <button
                onClick={() => setMatrixFilter('plowhorse')}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '5px',
                  border: '1px solid var(--border)',
                  background: matrixFilter === 'plowhorse' ? '#2563eb' : 'transparent',
                  color: matrixFilter === 'plowhorse' ? '#fff' : '#2563eb',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                🐴 Plowhorses ({plowhorseCount})
              </button>
              <button
                onClick={() => setMatrixFilter('puzzle')}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '5px',
                  border: '1px solid var(--border)',
                  background: matrixFilter === 'puzzle' ? '#d97706' : 'transparent',
                  color: matrixFilter === 'puzzle' ? '#fff' : '#d97706',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                🧩 Puzzles ({puzzleCount})
              </button>
              <button
                onClick={() => setMatrixFilter('dog')}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '5px',
                  border: '1px solid var(--border)',
                  background: matrixFilter === 'dog' ? '#dc2626' : 'transparent',
                  color: matrixFilter === 'dog' ? '#fff' : '#dc2626',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                🐕 Dogs ({dogCount})
              </button>
            </div>
          </div>

          {/* Matrix Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
                  <th style={{ padding: '0.75rem' }}>Menu Item</th>
                  <th style={{ padding: '0.75rem' }}>Category</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Units Sold</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Menu Price</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Unit Cost</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Gross Revenue</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total Margin</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Food Cost %</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Classification</th>
                </tr>
              </thead>
              <tbody>
                {filteredMenuMix.map(item => {
                  const getBadge = (c: MenuMatrixClassification) => {
                    switch (c) {
                      case 'star':
                        return { label: '⭐ Star (High Profit / High Pop)', bg: '#dcfce7', text: '#15803d' };
                      case 'plowhorse':
                        return { label: '🐴 Plowhorse (High Pop / Low Margin)', bg: '#dbeafe', text: '#1d4ed8' };
                      case 'puzzle':
                        return { label: '🧩 Puzzle (High Margin / Low Pop)', bg: '#fef3c7', text: '#b45309' };
                      case 'dog':
                        return { label: '🐕 Dog (Low Margin / Low Pop)', bg: '#fee2e2', text: '#b91c1c' };
                    }
                  };
                  const badge = getBadge(item.classification);

                  return (
                    <tr key={item.itemId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{item.itemName}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{item.category}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>{item.unitsSold}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>${item.unitPrice.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>${item.unitCost.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>${item.totalRevenue.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>
                        ${item.totalMargin.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{item.foodCostPercent}%</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                            background: badge.bg,
                            color: badge.text,
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
        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Ingredient Consumption Variance Ledger</h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Theoretical usage calculated from POS sales recipes (BOM) vs actual pantry stock depletion.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Cost Leakage: </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#dc2626' }}>+${foodCost.varianceTotal.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
                  <th style={{ padding: '0.75rem' }}>Raw Ingredient</th>
                  <th style={{ padding: '0.75rem' }}>Unit</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Theoretical BOM</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actual Depletion</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Variance Qty</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Unit Cost</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Dollar Impact</th>
                  <th style={{ padding: '0.75rem' }}>Operational Root Cause</th>
                </tr>
              </thead>
              <tbody>
                {foodCost.topVariances.map((v, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{v.ingredientName}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{v.unit}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{v.theoreticalQty}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{v.actualQty}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                      +{v.varianceQty}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>${v.unitCost.toFixed(2)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                      +${v.varianceCost.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem', fontStyle: 'italic', color: '#4b5563', fontSize: '0.85rem' }}>
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

