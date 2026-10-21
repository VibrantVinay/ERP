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
  const [testCouponCode, setTestCouponCode] = useState('');
  const [testOrderAmount, setTestOrderAmount] = useState(1200);
  const [validationResult, setValidationResult] = useState<ValidateCouponResult | null>(null);
  const [validating, setValidating] = useState(false);

  // Modals
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<LoyaltyMember | null>(null);
  const [pointsDelta, setPointsDelta] = useState(100);
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
    try {
      setValidating(true);
      const res = await loyaltyApi.validateCoupon({
        code: testCouponCode,
        orderTotal: testOrderAmount,
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
    try {
      const created = await loyaltyApi.createCampaign(newCampaign);
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
      alert('Failed to launch campaign: ' + err.message);
    }
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      const updated = await loyaltyApi.adjustPoints(selectedMember.id, {
        points: pointsDelta,
        type: pointsDelta > 0 ? 'Bonus' : 'Redeemed',
        description: pointsReason,
      });
      setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
      setSelectedMember(updated);
      setShowPointsModal(false);
    } catch (err: any) {
      alert('Failed to adjust points: ' + err.message);
    }
  };

  const getTierColor = (tier: TierName) => {
    switch (tier) {
      case 'Platinum':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'Gold':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'Silver':
        return 'bg-zinc-700/30 text-zinc-300 border-zinc-600/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              🎁
            </span>
            Promotions & Loyalty Rewards
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Dynamic coupon code campaigns, spend threshold validations & member loyalty rewards tiers
          </p>
        </div>

        <button
          onClick={() => setShowCampaignModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-orange-950/40 flex items-center gap-2 self-start sm:self-auto"
        >
          <span>🏷️</span> New Promo Campaign
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Campaigns</p>
          <p className="text-2xl font-bold text-white mt-1">{campaigns.filter(c => c.isActive).length}</p>
          <p className="text-xs text-emerald-400 mt-1">Live coupon rules active</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Loyalty Club Members</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{members.length}</p>
          <p className="text-xs text-zinc-500 mt-1">Earning rewards per ₹100</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Coupons Redeemed</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">
            {campaigns.reduce((sum, c) => sum + c.usedCount, 0)}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Tracked promotional redemptions</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Points Pool Outstanding</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {members.reduce((sum, m) => sum + m.currentPoints, 0).toLocaleString()} pts
          </p>
          <p className="text-xs text-zinc-500 mt-1">Active customer wallet balances</p>
        </div>
      </div>

      {/* Live Coupon Simulator & POS Validator Widget */}
      <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>⚡</span> POS Live Coupon Validator & Cart Discount Calculator
          </h3>
          <span className="text-[11px] text-zinc-500">Test promo code eligibility against cart subtotal</span>
        </div>

        <form onSubmit={handleValidateCoupon} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            required
            placeholder="Enter Coupon Code (e.g. WELCOME20, FLAT250, VIPROYAL)"
            value={testCouponCode}
            onChange={e => setTestCouponCode(e.target.value.toUpperCase())}
            className="w-full sm:w-80 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 uppercase font-mono tracking-wider focus:outline-none focus:border-orange-500"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-zinc-400 font-medium">Cart ₹:</span>
            <input
              type="number"
              required
              min="0"
              value={testOrderAmount}
              onChange={e => setTestOrderAmount(Number(e.target.value))}
              className="w-28 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
            />
          </div>
          <button
            type="submit"
            disabled={validating}
            className="w-full sm:w-auto px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-semibold transition-all"
          >
            {validating ? 'Verifying...' : 'Validate Code'}
          </button>
        </form>

        {validationResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
              validationResult.isValid
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              <span>{validationResult.isValid ? '✓' : '✕'}</span>
              <span>{validationResult.message}</span>
            </div>

            {validationResult.isValid && (
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="text-zinc-400">Discount: -₹{validationResult.calculatedDiscount}</span>
                <span className="text-white text-sm">Final Bill: ₹{validationResult.finalTotal}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'campaigns'
              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          🏷️ Promotional Campaigns ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'members'
              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          👑 VIP Loyalty Members ({members.length})
        </button>
      </div>

      {/* Main Workspace Body */}
      {loading ? (
        <div className="p-12 text-center text-zinc-500 animate-pulse">Loading promotions & loyalty...</div>
      ) : activeTab === 'campaigns' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map(camp => (
            <div key={camp.id} className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{camp.title}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {camp.discountType === 'Percentage'
                      ? `${camp.discountValue}% Off (Max ₹${camp.maxDiscount || 'Unlimited'})`
                      : `Flat ₹${camp.discountValue} Off`}
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono font-bold text-xs rounded-xl">
                  {camp.code}
                </span>
              </div>

              <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 space-y-1 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Min Spend Required</span>
                  <span className="font-semibold text-zinc-200">₹{camp.minSpend}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Redemptions Used</span>
                  <span className="font-semibold text-zinc-200">{camp.usedCount} / {camp.usageLimit}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Valid Period</span>
                  <span className="text-[11px] text-zinc-300">{camp.validFrom} → {camp.validTo}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-medium">
                  {camp.isActive ? '● Active Campaign' : '○ Paused'}
                </span>
                <button
                  onClick={() => {
                    setTestCouponCode(camp.code);
                    window.scrollTo({ top: 120, behavior: 'smooth' });
                  }}
                  className="text-orange-400 hover:text-orange-300 font-medium"
                >
                  Test in POS →
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Loyalty Members Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(m => (
            <div key={m.id} className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{m.customerName}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">📞 {m.phone}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-xl text-xs border font-semibold ${getTierColor(m.tier)}`}>
                  {m.tier}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase font-semibold">Available Points</p>
                  <p className="text-lg font-bold text-amber-400 mt-0.5">{m.currentPoints} pts</p>
                </div>
                <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase font-semibold">Lifetime Earned</p>
                  <p className="text-lg font-bold text-zinc-300 mt-0.5">{m.lifetimePoints} pts</p>
                </div>
              </div>

              {/* Recent Points History */}
              <div>
                <p className="text-[11px] font-semibold uppercase text-zinc-400 mb-1.5">Points Audit Trail</p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {m.transactions.map((t, idx) => (
                    <div key={idx} className="p-2 bg-zinc-950/40 rounded-lg border border-zinc-800/60 text-xs flex items-center justify-between">
                      <span className="text-zinc-300 truncate max-w-[180px]">{t.description}</span>
                      <span className={`font-mono font-bold ${t.points > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.points > 0 ? `+${t.points}` : t.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800/80">
                <button
                  onClick={() => {
                    setSelectedMember(m);
                    setShowPointsModal(true);
                  }}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-semibold transition-all"
                >
                  Adjust / Award Points
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🏷️</span> Launch Promotional Campaign
              </h3>
              <button onClick={() => setShowCampaignModal(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Coupon Code</label>
                  <input
                    required
                    placeholder="e.g. MONSOON25"
                    value={newCampaign.code}
                    onChange={e => setNewCampaign(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Discount Type</label>
                  <select
                    value={newCampaign.discountType}
                    onChange={e => setNewCampaign(prev => ({ ...prev, discountType: e.target.value as DiscountType }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  >
                    <option value="Percentage">Percentage (%)</option>
                    <option value="FixedAmount">Flat Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Campaign Title</label>
                <input
                  required
                  placeholder="e.g. Monsoon Special 25% Off Food Bill"
                  value={newCampaign.title}
                  onChange={e => setNewCampaign(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
                    {newCampaign.discountType === 'Percentage' ? 'Discount (%)' : 'Discount (₹)'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newCampaign.discountValue}
                    onChange={e => setNewCampaign(prev => ({ ...prev, discountValue: Number(e.target.value) }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Min Spend (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newCampaign.minSpend}
                    onChange={e => setNewCampaign(prev => ({ ...prev, minSpend: Number(e.target.value) }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Max Cap (₹)</label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={newCampaign.maxDiscount || ''}
                    onChange={e => setNewCampaign(prev => ({ ...prev, maxDiscount: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Usage Limit</label>
                  <input
                    type="number"
                    required
                    value={newCampaign.usageLimit}
                    onChange={e => setNewCampaign(prev => ({ ...prev, usageLimit: Number(e.target.value) }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Valid Until Date</label>
                  <input
                    type="date"
                    required
                    value={newCampaign.validTo}
                    onChange={e => setNewCampaign(prev => ({ ...prev, validTo: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-medium shadow-lg"
                >
                  Publish Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Points Modal */}
      {showPointsModal && selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>👑</span> Adjust Member Points
              </h3>
              <button onClick={() => setShowPointsModal(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-zinc-400">
              Member: <span className="text-white font-semibold">{selectedMember.customerName}</span> (Current balance: {selectedMember.currentPoints} pts)
            </p>

            <form onSubmit={handleAdjustPoints} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
                  Points Adjustment (Positive to Add, Negative to Deduct)
                </label>
                <input
                  type="number"
                  required
                  value={pointsDelta}
                  onChange={e => setPointsDelta(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Reason / Description</label>
                <input
                  required
                  value={pointsReason}
                  onChange={e => setPointsReason(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowPointsModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-medium shadow-lg"
                >
                  Save Points
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
