'use client';

import React, { useState, useEffect } from 'react';
import { loyaltyApi } from '../api';
import { PromoCampaign, LoyaltyMember, ValidateCouponResult, CreateCampaignDto, TierName, DiscountType } from '../types';

export const LoyaltyWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'members'>('campaigns');
  const [campaigns, setCampaigns] = useState<PromoCampaign[]>([]);
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live Coupon Validator State
  const [testCouponCode, setTestCouponCode] = useState('WEEKEND20');
  const [testOrderAmount, setTestOrderAmount] = useState('1200');
  const [validationResult, setValidationResult] = useState<ValidateCouponResult | null>(null);
  const [validating, setValidating] = useState(false);

  // Modals
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<LoyaltyMember | null>(null);
  const [pointsDelta, setPointsDelta] = useState('100');
  const [pointsReason, setPointsReason] = useState('Hospitality goodwill bonus');

  // New Campaign Form
  const [newCampaign, setNewCampaign] = useState<CreateCampaignDto>({
    code: '',
    title: '',
    discountType: 'Percentage',
    discountValue: 15,
    minSpend: 800,
    maxDiscount: 300,
    usageLimit: 500,
    validTo: '2026-12-31',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [campData, memData] = await Promise.all([
        loyaltyApi.getCampaigns(),
        loyaltyApi.getMembers(),
      ]);
      setCampaigns(campData || []);
      setMembers(memData || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load loyalty data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleValidateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCouponCode.trim()) return;
    setValidating(true);
    try {
      const res = await loyaltyApi.validateCoupon({
        code: testCouponCode.trim(),
        orderTotal: parseFloat(testOrderAmount) || 0,
      });
      setValidationResult(res);
    } catch (err: any) {
      alert('Validation error: ' + err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.code.trim() || !newCampaign.title.trim()) {
      alert('Code and title are required');
      return;
    }
    try {
      const created = await loyaltyApi.createCampaign({
        ...newCampaign,
        code: newCampaign.code.toUpperCase().trim(),
      });
      setCampaigns(prev => [created, ...prev]);
      setShowCampaignModal(false);
      setNewCampaign({
        code: '',
        title: '',
        discountType: 'Percentage',
        discountValue: 15,
        minSpend: 800,
        maxDiscount: 300,
        usageLimit: 500,
        validTo: '2026-12-31',
      });
    } catch (err: any) {
      alert('Failed to create campaign: ' + err.message);
    }
  };

  const handleAwardPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    const delta = parseInt(pointsDelta, 10);
    if (isNaN(delta) || delta === 0) return;
    try {
      const updated = await loyaltyApi.adjustPoints(selectedMember.id, {
        points: delta,
        type: 'Adjustment',
        description: pointsReason || 'Goodwill balance adjustment',
      });
      setMembers(prev => prev.map(m => (m.id === updated.id ? updated : m)));
      setShowPointsModal(false);
    } catch (err: any) {
      alert('Failed to adjust points: ' + err.message);
    }
  };

  const getTierStyle = (tier: TierName) => {
    switch (tier) {
      case 'Platinum':
        return { bg: '#e0e7ff', text: '#3730a3', border: '#818cf8' };
      case 'Gold':
        return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
      case 'Silver':
        return { bg: '#f1ede4', text: '#475569', border: '#cbd5e1' };
    }
  };

  // Metrics
  const activeCount = campaigns.filter(c => c.isActive).length;
  const totalRedemptions = campaigns.reduce((sum, c) => sum + (c.usedCount || 0), 0);
  const totalMembers = members.length;
  const platinumMembers = members.filter(m => m.tier === 'Platinum').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
            🎁 Promotions & Loyalty Rewards
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Dynamic promotional campaigns, automated coupon redemption rules, and tier rewards.
          </p>
        </div>

        <button
          onClick={() => setShowCampaignModal(true)}
          style={{
            padding: '0.6rem 1.25rem',
            background: 'var(--primary)',
            color: '#ffffff',
            borderRadius: 'var(--radius-sm, 6px)',
            fontWeight: 600,
            fontSize: '0.875rem',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <span>🏷️</span> New Promo Campaign
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', padding: '1.2rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Active Promo Campaigns
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>
            {activeCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Live coupon discounts active</div>
        </div>

        <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', padding: '1.2rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Redemptions
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7', marginTop: '0.25rem' }}>
            {totalRedemptions}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Guest coupon applications</div>
        </div>

        <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', padding: '1.2rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Loyalty Club Members
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706', marginTop: '0.25rem' }}>
            {totalMembers}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{platinumMembers} Platinum VIPs</div>
        </div>

        <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', padding: '1.2rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Point Earning Multiplier
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>
            1.5x - 2.5x
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Tier-accelerated rewards</div>
        </div>
      </div>

      {/* Live Coupon Simulator Bar */}
      <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
          ⚡ Cashier / Live Coupon Engine Test Bench
        </div>
        <form onSubmit={handleValidateCoupon} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Coupon Code (e.g. WEEKEND20)"
            value={testCouponCode}
            onChange={e => setTestCouponCode(e.target.value.toUpperCase())}
            style={{ padding: '0.5rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', fontWeight: 700, width: '180px' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Order Bill: $</span>
            <input
              type="number"
              placeholder="1200"
              value={testOrderAmount}
              onChange={e => setTestOrderAmount(e.target.value)}
              style={{ padding: '0.5rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', width: '110px' }}
            />
          </div>
          <button
            type="submit"
            disabled={validating}
            style={{
              padding: '0.5rem 1.1rem',
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {validating ? 'Testing...' : 'Validate Coupon'}
          </button>

          {validationResult && (
            <div
              style={{
                marginLeft: 'auto',
                padding: '0.45rem 1rem',
                borderRadius: '6px',
                background: validationResult.isValid ? '#dcfce7' : '#fee2e2',
                border: `1px solid ${validationResult.isValid ? '#86efac' : '#fca5a5'}`,
                color: validationResult.isValid ? '#166534' : '#991b1b',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              {validationResult.isValid
                ? `✓ VALID: Discount Applied -₹${(validationResult.calculatedDiscount || 0).toFixed(2)} (Final: ₹${(validationResult.finalTotal || 0).toFixed(2)})`
                : `✕ REJECTED: ${validationResult.message}`}
            </div>
          )}
        </form>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setActiveTab('campaigns')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'campaigns' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'campaigns' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'campaigns' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
          }}
        >
          🏷️ Promotional Campaigns ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('members')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'members' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'members' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'members' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
          }}
        >
          👑 Loyalty Club Members ({members.length})
        </button>
      </div>

      {/* Tab 1: Campaigns */}
      {activeTab === 'campaigns' && (
        <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading promo campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No promotional campaigns found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-alt, #f1ede4)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Coupon Code</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Campaign Title</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Discount Structure</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Min Spend</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Redemptions</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Valid Until</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(c => {
                    const usagePct = c.usageLimit > 0 ? Math.round((c.usedCount / c.usageLimit) * 100) : 0;
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              padding: '0.25rem 0.55rem',
                              background: '#fef3c7',
                              color: '#92400e',
                              borderRadius: '4px',
                              border: '1px dashed #d97706',
                              letterSpacing: '0.05em',
                            }}
                          >
                            {c.code}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{c.title}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontWeight: 700, color: '#16a34a' }}>
                            {c.discountType === 'Percentage' ? `${c.discountValue}% OFF` : `$${c.discountValue} FLAT`}
                          </span>
                          {c.maxDiscount ? <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> (Max ${c.maxDiscount})</span> : null}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                          ${c.minSpend.toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{c.usedCount} / {c.usageLimit}</div>
                          <div style={{ width: '80px', height: '5px', background: '#e2e8f0', borderRadius: '3px', margin: '3px auto 0', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, usagePct)}%`, height: '100%', background: '#0284c7' }} />
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{c.validTo}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: c.isActive ? '#dcfce7' : '#fee2e2',
                              color: c.isActive ? '#15803d' : '#b91c1c',
                            }}
                          >
                            {c.isActive ? 'Active' : 'Expired'}
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

      {/* Tab 2: Members */}
      {activeTab === 'members' && (
        <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface-alt, #f1ede4)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Member Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Phone</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Rewards Tier</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Points Balance</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Lifetime Points</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => {
                  const badge = getTierStyle(m.tier);
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{m.customerName}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{m.phone}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: badge.bg,
                            color: badge.text,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          ★ {m.tier}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, color: '#d97706' }}>
                        {m.currentPoints.toLocaleString()} pts
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                        {m.lifetimePoints.toLocaleString()} pts
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            setSelectedMember(m);
                            setShowPointsModal(true);
                          }}
                          style={{
                            padding: '0.3rem 0.65rem',
                            background: 'var(--surface-alt, #f1ede4)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          + Goodwill Points
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: New Campaign */}
      {showCampaignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--surface, #fff)', width: '100%', maxWidth: '500px', borderRadius: 'var(--radius-md, 10px)', padding: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.25rem', fontWeight: 700 }}>Create Promotional Campaign</h3>
            <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FESTIVE25"
                    value={newCampaign.code}
                    onChange={e => setNewCampaign({ ...newCampaign, code: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Campaign Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 25% Off Weekend Dinners"
                    value={newCampaign.title}
                    onChange={e => setNewCampaign({ ...newCampaign, title: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Discount Type</label>
                  <select
                    value={newCampaign.discountType}
                    onChange={e => setNewCampaign({ ...newCampaign, discountType: e.target.value as DiscountType })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  >
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Fixed">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Discount Value</label>
                  <input
                    type="number"
                    required
                    value={newCampaign.discountValue}
                    onChange={e => setNewCampaign({ ...newCampaign, discountValue: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Min Order Spend ($)</label>
                  <input
                    type="number"
                    value={newCampaign.minSpend}
                    onChange={e => setNewCampaign({ ...newCampaign, minSpend: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Max Discount Cap ($)</label>
                  <input
                    type="number"
                    value={newCampaign.maxDiscount || ''}
                    placeholder="Optional cap"
                    onChange={e => setNewCampaign({ ...newCampaign, maxDiscount: parseFloat(e.target.value) || undefined })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Redemption Cap</label>
                  <input
                    type="number"
                    value={newCampaign.usageLimit}
                    onChange={e => setNewCampaign({ ...newCampaign, usageLimit: parseInt(e.target.value, 10) || 100 })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Expiry Date</label>
                  <input
                    type="date"
                    value={newCampaign.validTo}
                    onChange={e => setNewCampaign({ ...newCampaign, validTo: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', background: 'transparent', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Launch Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Award Points */}
      {showPointsModal && selectedMember && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--surface, #fff)', width: '100%', maxWidth: '440px', borderRadius: 'var(--radius-md, 10px)', padding: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: 700 }}>
              Award Goodwill Points: {selectedMember.customerName}
            </h3>
            <form onSubmit={handleAwardPoints} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Points Delta (Add/Deduct)</label>
                <input
                  type="number"
                  required
                  value={pointsDelta}
                  onChange={e => setPointsDelta(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', fontWeight: 700, fontSize: '1.1rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Reason / Authorization Note</label>
                <input
                  type="text"
                  required
                  value={pointsReason}
                  onChange={e => setPointsReason(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowPointsModal(false)}
                  style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', background: 'transparent', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Confirm Points
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
