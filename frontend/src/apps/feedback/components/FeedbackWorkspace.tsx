'use client';

import React, { useState, useEffect } from 'react';
import { feedbackApi } from '../api';
import { GuestFeedback, FeedbackSummaryMetrics, FeedbackSentiment, FeedbackStatus, CreateFeedbackDto } from '../types';

export const FeedbackWorkspace: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<GuestFeedback[]>([]);
  const [metrics, setMetrics] = useState<FeedbackSummaryMetrics | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<GuestFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);

  // Resolution State
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [compensationOffered, setCompensationOffered] = useState('20% Discount Voucher on next visit');

  // New Feedback Form State
  const [newFeedback, setNewFeedback] = useState<CreateFeedbackDto>({
    ticketNumber: 'GH-1049',
    customerName: '',
    phone: '',
    tableOrChannel: 'Table 02',
    overallRating: 5,
    foodRating: 5,
    serviceRating: 5,
    ambianceRating: 5,
    comments: '',
    dishMentions: [],
  });
  const [dishesInput, setDishesInput] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [listData, summaryData] = await Promise.all([
        feedbackApi.getFeedback({ status: selectedStatus, sentiment: selectedSentiment }),
        feedbackApi.getSummaryMetrics(),
      ]);
      setFeedbacks(listData || []);
      setMetrics(summaryData || null);
      if (listData && listData.length > 0 && !selectedFeedback) {
        setSelectedFeedback(listData[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load guest feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedStatus, selectedSentiment]);

  const handleResolveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedback) return;
    try {
      const updated = await feedbackApi.resolveFeedback(selectedFeedback.id, {
        resolutionNotes,
        compensationOffered,
        resolvedBy: 'Mina D’Souza (Manager)',
      });
      setFeedbacks(prev => prev.map(f => f.id === updated.id ? updated : f));
      setSelectedFeedback(updated);
      setShowResolveModal(false);
      setResolutionNotes('');
      // Refresh metrics
      const sum = await feedbackApi.getSummaryMetrics();
      setMetrics(sum);
    } catch (err: any) {
      alert('Failed to resolve feedback: ' + err.message);
    }
  };

  const handleCreateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await feedbackApi.createFeedback(newFeedback);
      setFeedbacks(prev => [created, ...prev]);
      setSelectedFeedback(created);
      setShowAddModal(false);
      setNewFeedback({
        ticketNumber: `GH-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: '',
        phone: '',
        tableOrChannel: 'Table 04',
        overallRating: 5,
        foodRating: 5,
        serviceRating: 5,
        ambianceRating: 5,
        comments: '',
        dishMentions: [],
      });
      setDishesInput('');
      const sum = await feedbackApi.getSummaryMetrics();
      setMetrics(sum);
    } catch (err: any) {
      alert('Failed to record feedback: ' + err.message);
    }
  };

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case 'Escalated':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Under Review':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Resolved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'New':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              💬
            </span>
            Guest Ratings, Reviews & Care
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time table sentiment, multi-attribute star ratings & automatic manager escalation for poor ratings
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-orange-950/40 flex items-center gap-2 self-start sm:self-auto"
        >
          <span>✍️</span> Collect Guest Review
        </button>
      </div>

      {/* KPI Scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Overall Satisfaction</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-400">★ {metrics?.averageOverall || 5.0}</span>
            <span className="text-xs text-zinc-500">/ 5.0</span>
          </div>
          <p className="text-xs text-emerald-400 mt-1">{metrics?.positivePercentage || 100}% positive sentiment</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Culinary Rating</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-white">★ {metrics?.averageFood || 5.0}</span>
            <span className="text-xs text-zinc-500">food quality</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">Service: ★ {metrics?.averageService || 5.0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Escalated Complaints</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{metrics?.escalatedCount || 0}</p>
          <p className="text-xs text-zinc-500 mt-1">Auto-flagged (&lt;3 stars)</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Reviews</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{metrics?.totalReviews || 0}</p>
          <p className="text-xs text-zinc-500 mt-1">Dine-in, bar & delivery</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'Escalated', 'Under Review', 'New', 'Resolved'] as const).map(st => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedStatus === st
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              {st === 'all' ? 'All Statuses' : st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium">Sentiment:</span>
          <select
            value={selectedSentiment}
            onChange={e => setSelectedSentiment(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-orange-500"
          >
            <option value="all">All Sentiments</option>
            <option value="Positive">Positive (4-5★)</option>
            <option value="Neutral">Neutral (3★)</option>
            <option value="Negative">Negative (&lt;3★)</option>
          </select>
        </div>
      </div>

      {/* Workspace Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Feedback Review Cards */}
        <div className="lg:col-span-7 space-y-3">
          {loading ? (
            <div className="p-12 text-center text-zinc-500 animate-pulse">Loading guest reviews...</div>
          ) : feedbacks.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
              No feedback reviews matching this filter.
            </div>
          ) : (
            feedbacks.map(f => (
              <div
                key={f.id}
                onClick={() => setSelectedFeedback(f)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedFeedback?.id === f.id
                    ? 'bg-zinc-800/90 border-orange-500/50 shadow-lg'
                    : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{f.customerName}</h4>
                      <span className="font-mono text-zinc-500 text-xs">({f.ticketNumber} · {f.tableOrChannel})</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border font-medium ${getStatusBadge(f.status)}`}>
                        {f.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-amber-400 font-bold text-xs">{renderStars(f.overallRating)}</span>
                      <span className="text-[11px] text-zinc-500">{f.overallRating}/5.0</span>
                    </div>
                  </div>

                  <span className="text-[11px] text-zinc-500 whitespace-nowrap">
                    {new Date(f.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                    {new Date(f.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 mt-2.5 leading-relaxed bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/50">
                  "{f.comments}"
                </p>

                <div className="mt-3 pt-3 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap gap-1.5">
                    {f.dishMentions.map((dish, i) => (
                      <span key={i} className="px-2 py-0.5 bg-orange-500/10 text-orange-300 border border-orange-500/20 rounded-md text-[10px]">
                        🍽️ {dish}
                      </span>
                    ))}
                  </div>

                  {f.status === 'Resolved' && (
                    <span className="text-emerald-400 font-medium text-[11px]">
                      ✓ Resolved: {f.compensationOffered || 'Followed up'}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Review Inspector & Care Resolution Panel */}
        <div className="lg:col-span-5">
          {selectedFeedback ? (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-5 sticky top-6 shadow-xl">
              <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedFeedback.customerName}</h3>
                  <p className="text-xs text-zinc-400">{selectedFeedback.tableOrChannel} · Ticket {selectedFeedback.ticketNumber}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs border font-medium ${getStatusBadge(selectedFeedback.status)}`}>
                  {selectedFeedback.status}
                </span>
              </div>

              {/* Star Ratings Breakdown */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase font-semibold">Food</p>
                  <p className="text-sm font-bold text-amber-400 mt-0.5">★ {selectedFeedback.foodRating}</p>
                </div>
                <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase font-semibold">Service</p>
                  <p className="text-sm font-bold text-amber-400 mt-0.5">★ {selectedFeedback.serviceRating}</p>
                </div>
                <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase font-semibold">Ambiance</p>
                  <p className="text-sm font-bold text-amber-400 mt-0.5">★ {selectedFeedback.ambianceRating}</p>
                </div>
              </div>

              {/* Full Review Comment */}
              <div>
                <p className="text-xs font-semibold uppercase text-zinc-400 mb-1.5">Guest Feedback Details</p>
                <div className="p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800 text-xs text-zinc-200 leading-relaxed">
                  "{selectedFeedback.comments}"
                </div>
              </div>

              {/* Resolution Status & Recovery */}
              {selectedFeedback.status === 'Resolved' ? (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs space-y-1.5 text-emerald-300">
                  <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span>✓</span> Case Resolved & Closed
                  </p>
                  <p className="text-zinc-300"><span className="text-zinc-500">Handled By:</span> {selectedFeedback.assignedTo}</p>
                  {selectedFeedback.compensationOffered && (
                    <p className="text-zinc-300"><span className="text-zinc-500">Compensation:</span> {selectedFeedback.compensationOffered}</p>
                  )}
                  {selectedFeedback.resolutionNotes && (
                    <p className="text-zinc-300"><span className="text-zinc-500">Notes:</span> {selectedFeedback.resolutionNotes}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 pt-2 border-t border-zinc-800">
                  <p className="text-xs font-semibold text-zinc-400">Customer Care & Resolution:</p>
                  {selectedFeedback.status === 'Escalated' && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                      ⚠️ <span className="font-semibold">Manager Escalation:</span> Rating is below 3 stars. Immediate guest outreach recommended.
                    </div>
                  )}

                  <button
                    onClick={() => setShowResolveModal(true)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-xs transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <span>🤝</span> Resolve & Offer Recovery Care
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
              Select a review to inspect details.
            </div>
          )}
        </div>
      </div>

      {/* Resolve Feedback Modal */}
      {showResolveModal && selectedFeedback && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🤝</span> Guest Care Resolution
              </h3>
              <button onClick={() => setShowResolveModal(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-zinc-400">
              Customer: <span className="text-white font-semibold">{selectedFeedback.customerName}</span> ({selectedFeedback.tableOrChannel})
            </p>

            <form onSubmit={handleResolveFeedback} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Customer Compensation / Goodwill Offer</label>
                <input
                  required
                  value={compensationOffered}
                  onChange={e => setCompensationOffered(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Manager Resolution Notes</label>
                <textarea
                  required
                  placeholder="Details of manager outreach, table apology, kitchen briefing..."
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 resize-none h-20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium shadow-lg"
                >
                  Confirm & Mark Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Feedback Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>✍️</span> Record Guest Review
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateFeedback} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Guest Name</label>
                  <input
                    required
                    placeholder="Guest name"
                    value={newFeedback.customerName}
                    onChange={e => setNewFeedback(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Table / Channel</label>
                  <input
                    required
                    placeholder="Table 04 / Bar / Online"
                    value={newFeedback.tableOrChannel}
                    onChange={e => setNewFeedback(prev => ({ ...prev, tableOrChannel: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  />
                </div>
              </div>

              {/* 4 Ratings */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-zinc-400 mb-1">Overall (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.5"
                    required
                    value={newFeedback.overallRating}
                    onChange={e => setNewFeedback(prev => ({ ...prev, overallRating: Number(e.target.value) }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-zinc-400 mb-1">Food (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.5"
                    required
                    value={newFeedback.foodRating}
                    onChange={e => setNewFeedback(prev => ({ ...prev, foodRating: Number(e.target.value) }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-zinc-400 mb-1">Service (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.5"
                    required
                    value={newFeedback.serviceRating}
                    onChange={e => setNewFeedback(prev => ({ ...prev, serviceRating: Number(e.target.value) }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-zinc-400 mb-1">Ambiance</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.5"
                    required
                    value={newFeedback.ambianceRating}
                    onChange={e => setNewFeedback(prev => ({ ...prev, ambianceRating: Number(e.target.value) }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Guest Comments & Review</label>
                <textarea
                  required
                  placeholder="What did the customer share about their dining experience?"
                  value={newFeedback.comments}
                  onChange={e => setNewFeedback(prev => ({ ...prev, comments: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 resize-none h-20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Dishes Mentioned (Comma separated)</label>
                <input
                  placeholder="e.g. Wagyu Ribeye, Risotto, Tiramisu"
                  value={dishesInput}
                  onChange={e => {
                    setDishesInput(e.target.value);
                    const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    setNewFeedback(prev => ({ ...prev, dishMentions: list }));
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-medium shadow-lg"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

