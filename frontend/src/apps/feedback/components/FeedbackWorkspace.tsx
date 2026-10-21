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
  const [compensationOffered, setCompensationOffered] = useState('20% Goodwill Voucher on next dining visit');

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
      setError(null);
      const [listData, summaryData] = await Promise.all([
        feedbackApi.getFeedback({
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          sentiment: selectedSentiment !== 'all' ? selectedSentiment : undefined,
        }),
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

  const handleCreateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedback.customerName.trim()) {
      alert('Guest name is required');
      return;
    }
    try {
      const created = await feedbackApi.createFeedback(newFeedback);
      setFeedbacks(prev => [created, ...prev]);
      setSelectedFeedback(created);
      setShowAddModal(false);
      setNewFeedback({
        ticketNumber: `GH-${Math.floor(1000 + Math.random() * 9000)}`,
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
      setDishesInput('');
      const updatedMetrics = await feedbackApi.getSummaryMetrics();
      setMetrics(updatedMetrics);
    } catch (err: any) {
      alert('Failed to submit feedback: ' + err.message);
    }
  };

  const handleResolveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedback) return;
    try {
      const updated = await feedbackApi.resolveFeedback(selectedFeedback.id, {
        resolutionNotes,
        compensationOffered: compensationOffered.trim() || undefined,
        resolvedBy: 'Duty Manager',
      });
      setSelectedFeedback(updated);
      setFeedbacks(prev => prev.map(f => (f.id === updated.id ? updated : f)));
      setShowResolveModal(false);
      setResolutionNotes('');
    } catch (err: any) {
      alert('Failed to resolve ticket: ' + err.message);
    }
  };

  const getSentimentStyle = (sentiment: FeedbackSentiment) => {
    switch (sentiment) {
      case 'Positive':
        return { bg: '#dcfce7', text: '#15803d', border: '#86efac' };
      case 'Neutral':
        return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
      case 'Negative':
        return { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' };
    }
  };

  const renderStars = (rating: number) => {
    const full = Math.min(5, Math.max(0, Math.round(rating)));
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  };

  const escalatedCount = feedbacks.filter(f => f.status === 'Escalated').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
            💬 Guest Ratings, Reviews & Care
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Real-time table sentiment, multi-attribute star ratings, and automatic manager escalation for poor ratings.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
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
          <span>✍️</span> Collect Guest Review
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', padding: '1.2rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Overall Satisfaction
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706', marginTop: '0.25rem' }}>
            ★ {metrics?.averageOverall?.toFixed(1) || '4.8'} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 5.0</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{metrics?.totalReviews || feedbacks.length} verified reviews</div>
        </div>

        <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', padding: '1.2rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Multi-Attribute Breakdown
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div>Food: <strong style={{ color: '#16a34a' }}>★ {metrics?.averageFood?.toFixed(1) || '4.9'}</strong></div>
            <div>Service: <strong style={{ color: '#0284c7' }}>★ {metrics?.averageService?.toFixed(1) || '4.7'}</strong></div>
            <div>Ambiance: <strong style={{ color: '#8b5cf6' }}>★ {metrics?.averageAmbiance?.toFixed(1) || '4.8'}</strong></div>
          </div>
        </div>

        <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', padding: '1.2rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Escalated (&lt;3 Stars)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: escalatedCount > 0 ? '#dc2626' : '#16a34a', marginTop: '0.25rem' }}>
            {escalatedCount} {escalatedCount > 0 ? 'Urgent' : 'Cleared'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manager recovery tickets</div>
        </div>

        <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', padding: '1.2rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Positive Sentiment Ratio
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>
            {metrics?.positivePercentage || 92}%
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Guest promoter index</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Status:</span>
          {(['all', 'Pending', 'Escalated', 'Resolved'] as const).map(st => {
            const isSel = selectedStatus === st;
            return (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: isSel ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: isSel ? 'var(--primary)' : 'var(--surface-alt, #f1ede4)',
                  color: isSel ? '#ffffff' : 'var(--text)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {st === 'all' ? 'All Reviews' : st}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Sentiment:</span>
          {(['all', 'Positive', 'Neutral', 'Negative'] as const).map(sn => {
            const isSel = selectedSentiment === sn;
            return (
              <button
                key={sn}
                onClick={() => setSelectedSentiment(sn)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: isSel ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: isSel ? 'var(--primary)' : 'var(--surface-alt, #f1ede4)',
                  color: isSel ? '#ffffff' : 'var(--text)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {sn === 'all' ? 'All' : sn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Feed & Detail Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 1.2fr) minmax(380px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Feedback Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--surface, #fff)', borderRadius: 'var(--radius-md, 10px)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              Loading guest feedback...
            </div>
          ) : feedbacks.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--surface, #fff)', borderRadius: 'var(--radius-md, 10px)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              No feedback reviews matching filter criteria.
            </div>
          ) : (
            feedbacks.map(f => {
              const isSelected = selectedFeedback?.id === f.id;
              const sentiment = getSentimentStyle(f.sentiment);

              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedFeedback(f)}
                  style={{
                    background: 'var(--surface, #fff)',
                    border: `1px solid ${f.status === 'Escalated' ? '#f87171' : isSelected ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md, 10px)',
                    padding: '1.1rem 1.25rem',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>{f.customerName}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {f.tableOrChannel}</span>
                        {f.status === 'Escalated' && (
                          <span style={{ padding: '0.15rem 0.5rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
                            ⚠️ ESCALATED
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#d97706', fontSize: '1rem', letterSpacing: '1px', marginTop: '0.2rem' }}>
                        {renderStars(f.overallRating)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({f.overallRating}/5)</span>
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: sentiment.bg,
                        color: sentiment.text,
                        border: `1px solid ${sentiment.border}`,
                      }}
                    >
                      {f.sentiment}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    "{f.comments}"
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{f.createdAt ? f.createdAt.slice(0, 10) : 'Recent'}</span>
                    <span style={{ fontWeight: 600, color: f.status === 'Resolved' ? '#16a34a' : 'inherit' }}>
                      Status: {f.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Review & Care Inspector */}
        {selectedFeedback ? (
          <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {selectedFeedback.customerName}
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {selectedFeedback.tableOrChannel} • Ticket #{selectedFeedback.ticketNumber}
                  </div>
                </div>

                <span
                  style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    ...getSentimentStyle(selectedFeedback.sentiment),
                  }}
                >
                  {selectedFeedback.sentiment}
                </span>
              </div>
            </div>

            {/* Scorecard Bars */}
            <div style={{ background: 'var(--surface-alt, #f1ede4)', padding: '1rem', borderRadius: 'var(--radius-sm, 6px)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Overall Star Score</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d97706' }}>
                  {renderStars(selectedFeedback.overallRating)} ({selectedFeedback.overallRating}/5)
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Food Quality</div>
                  <div style={{ fontWeight: 700, color: '#16a34a' }}>★ {selectedFeedback.foodRating}/5</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Staff Service</div>
                  <div style={{ fontWeight: 700, color: '#0284c7' }}>★ {selectedFeedback.serviceRating}/5</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Ambiance</div>
                  <div style={{ fontWeight: 700, color: '#8b5cf6' }}>★ {selectedFeedback.ambianceRating}/5</div>
                </div>
              </div>
            </div>

            {/* Comment Section */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Guest Comment & Observations
              </div>
              <div style={{ padding: '0.85rem', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm, 6px)', fontSize: '0.9rem', fontStyle: 'italic', lineHeight: 1.5 }}>
                "{selectedFeedback.comments}"
              </div>
            </div>

            {/* Dish Mentions */}
            {selectedFeedback.dishMentions && selectedFeedback.dishMentions.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Referenced Menu Dishes
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {selectedFeedback.dishMentions.map((d, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '0.2rem 0.6rem',
                        background: '#e0e7ff',
                        color: '#3730a3',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      🍽️ {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution History / Actions */}
            {selectedFeedback.status === 'Resolved' ? (
              <div style={{ padding: '0.85rem', background: '#dcfce7', border: '1px solid #86efac', borderRadius: 'var(--radius-sm, 6px)', fontSize: '0.85rem', color: '#166534' }}>
                <div style={{ fontWeight: 700 }}>✓ Resolved by Management</div>
                {selectedFeedback.resolutionNotes && <div style={{ marginTop: '0.25rem' }}>Note: "{selectedFeedback.resolutionNotes}"</div>}
                {selectedFeedback.compensationOffered && (
                  <div style={{ marginTop: '0.25rem', fontWeight: 600 }}>Goodwill: {selectedFeedback.compensationOffered}</div>
                )}
              </div>
            ) : (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setShowResolveModal(true)}
                  style={{
                    flex: 1,
                    padding: '0.65rem 1rem',
                    background: '#16a34a',
                    color: '#fff',
                    borderRadius: 'var(--radius-sm, 6px)',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  ✓ Take Care & Resolve Ticket
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select a feedback review from the feed to inspect and resolve.
          </div>
        )}
      </div>

      {/* Modal: Add Feedback */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--surface, #fff)', width: '100%', maxWidth: '520px', borderRadius: 'var(--radius-md, 10px)', padding: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.25rem', fontWeight: 700 }}>Collect Guest Review & Rating</h3>
            <form onSubmit={handleCreateFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Guest Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya Deshmukh"
                    value={newFeedback.customerName}
                    onChange={e => setNewFeedback({ ...newFeedback, customerName: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Table / Channel</label>
                  <input
                    type="text"
                    required
                    placeholder="Table 04 or Takeaway"
                    value={newFeedback.tableOrChannel}
                    onChange={e => setNewFeedback({ ...newFeedback, tableOrChannel: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>
              </div>

              {/* Star Ratings Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'var(--surface-alt, #f1ede4)', padding: '0.75rem', borderRadius: '6px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Overall Star Rating (1-5)</label>
                  <select
                    value={newFeedback.overallRating}
                    onChange={e => setNewFeedback({ ...newFeedback, overallRating: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)' }}
                  >
                    <option value={5}>★★★★★ (5 - Excellent)</option>
                    <option value={4}>★★★★☆ (4 - Good)</option>
                    <option value={3}>★★★☆☆ (3 - Average)</option>
                    <option value={2}>★★☆☆☆ (2 - Poor - Auto Escalate)</option>
                    <option value={1}>★☆☆☆☆ (1 - Very Bad - Auto Escalate)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Food Rating (1-5)</label>
                  <select
                    value={newFeedback.foodRating}
                    onChange={e => setNewFeedback({ ...newFeedback, foodRating: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)' }}
                  >
                    <option value={5}>5 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={2}>2 Stars</option>
                    <option value={1}>1 Star</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Guest Comments</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Review comments, flavor notes, staff mentions..."
                  value={newFeedback.comments}
                  onChange={e => setNewFeedback({ ...newFeedback, comments: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Dish Mentions (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Risotto, Truffle Fries, Tiramisu"
                  value={dishesInput}
                  onChange={e => {
                    setDishesInput(e.target.value);
                    setNewFeedback({
                      ...newFeedback,
                      dishMentions: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                    });
                  }}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
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
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Resolve & Customer Recovery */}
      {showResolveModal && selectedFeedback && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--surface, #fff)', width: '100%', maxWidth: '480px', borderRadius: 'var(--radius-md, 10px)', padding: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 700 }}>
              Resolve Guest Ticket: #{selectedFeedback.ticketNumber}
            </h3>
            <form onSubmit={handleResolveFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Management Resolution Action Notes *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Reached out to guest via phone, apologized for delay, kitchen team debriefed."
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Goodwill Compensation / Recovery Voucher</label>
                <input
                  type="text"
                  value={compensationOffered}
                  onChange={e => setCompensationOffered(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', background: 'transparent', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Complete Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
