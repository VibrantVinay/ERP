'use client';

import React, { useState, useEffect } from 'react';
import { customerApi } from '../api';
import { CustomerProfile, CustomerHistoryEntry, CustomerSegment, CreateCustomerDto } from '../types';

export const CustomerWorkspace: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [history, setHistory] = useState<CustomerHistoryEntry[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [newCustomer, setNewCustomer] = useState<CreateCustomerDto>({
    name: '',
    phone: '',
    email: '',
    segment: 'New',
    dietaryConstraints: [],
    preferredTable: 'Table 01',
    marketingOptIn: true,
    tags: ['First Time Guest'],
    notes: '',
  });

  const [dietaryInput, setDietaryInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerApi.getCustomers({
        segment: selectedSegment !== 'all' ? selectedSegment : undefined,
        search: searchQuery || undefined,
      });
      setCustomers(data || []);
      if (data && data.length > 0 && !selectedCustomer) {
        handleSelectCustomer(data[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load guest profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSegment]);

  const handleSelectCustomer = async (cust: CustomerProfile) => {
    setSelectedCustomer(cust);
    try {
      const hist = await customerApi.getCustomerHistory(cust.id);
      setHistory(hist || []);
    } catch (e) {
      setHistory([]);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      alert('Name and phone number are required');
      return;
    }
    try {
      const created = await customerApi.createCustomer(newCustomer);
      setCustomers(prev => [created, ...prev]);
      handleSelectCustomer(created);
      setShowAddModal(false);
      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        segment: 'New',
        dietaryConstraints: [],
        preferredTable: 'Table 01',
        marketingOptIn: true,
        tags: ['First Time Guest'],
        notes: '',
      });
    } catch (err: any) {
      alert('Failed to register customer: ' + err.message);
    }
  };

  const handleToggleMarketing = async () => {
    if (!selectedCustomer) return;
    try {
      const updated = await customerApi.updateCustomer(selectedCustomer.id, {
        marketingOptIn: !selectedCustomer.marketingOptIn,
      });
      setSelectedCustomer(updated);
      setCustomers(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    } catch (err: any) {
      alert('Failed to update marketing consent: ' + err.message);
    }
  };

  const getSegmentStyle = (segment: CustomerSegment) => {
    switch (segment) {
      case 'VIP':
        return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
      case 'Regular':
        return { bg: '#dcfce7', text: '#15803d', border: '#86efac' };
      case 'Corporate':
        return { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' };
      case 'Occasional':
        return { bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe' };
      case 'New':
        return { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' };
      default:
        return { bg: '#f1ede4', text: '#4b5563', border: '#d1d5db' };
    }
  };

  // KPIs
  const vipCount = customers.filter(c => c.segment === 'VIP').length;
  const corporateCount = customers.filter(c => c.segment === 'Corporate').length;
  const totalLTV = customers.reduce((sum, c) => sum + (c.totalSpend || 0), 0);
  const avgVisits = customers.length
    ? Math.round((customers.reduce((sum, c) => sum + (c.totalVisits || 0), 0) / customers.length) * 10) / 10
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
            👥 Guest CRM & Customer Profiles
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Guest hospitality preferences, dining visit ledger, lifetime value, and dietary restrictions.
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
          <span>+</span> New Guest Profile
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', padding: '1.2rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Registered Guests
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>
            {customers.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Avg {avgVisits} visits / guest</div>
        </div>

        <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', padding: '1.2rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            VIP Members
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706', marginTop: '0.25rem' }}>
            {vipCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Priority seating & executive care</div>
        </div>

        <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', padding: '1.2rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Corporate Accounts
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7', marginTop: '0.25rem' }}>
            {corporateCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>PDR dining & company billing</div>
        </div>

        <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', padding: '1.2rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Tracked Lifetime Spend
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>
            ${totalLTV.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Direct dining hospitality revenue</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {(['all', 'VIP', 'Regular', 'Corporate', 'Occasional', 'New'] as const).map(seg => {
            const isSel = selectedSegment === seg;
            return (
              <button
                key={seg}
                onClick={() => setSelectedSegment(seg)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: isSel ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: isSel ? 'var(--primary)' : 'var(--surface-alt, #f1ede4)',
                  color: isSel ? '#ffffff' : 'var(--text)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {seg === 'all' ? 'All Segments' : seg}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by name, phone or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchData()}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-sm, 6px)',
              border: '1px solid var(--border)',
              background: 'var(--bg, #f7f5f0)',
              fontSize: '0.85rem',
              width: '260px',
            }}
          />
          <button
            onClick={fetchData}
            style={{
              padding: '0.45rem 0.85rem',
              background: 'var(--surface-alt, #f1ede4)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm, 6px)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </div>
      </div>

      {/* Main 2-Column Master-Detail Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 1.2fr) minmax(380px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Customer Directory Table */}
        <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Guest Directory</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{customers.length} profiles listed</span>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading guest profiles...</div>
          ) : customers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No guests found matching criteria.</div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-alt, #f1ede4)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Guest</th>
                    <th style={{ padding: '0.75rem 0.75rem' }}>Segment</th>
                    <th style={{ padding: '0.75rem 0.75rem', textAlign: 'right' }}>Visits</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(cust => {
                    const isSelected = selectedCustomer?.id === cust.id;
                    const badge = getSegmentStyle(cust.segment);

                    return (
                      <tr
                        key={cust.id}
                        onClick={() => handleSelectCustomer(cust)}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: isSelected ? 'var(--accent-light, #eaf0e2)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text)' }}>{cust.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cust.phone}</div>
                        </td>
                        <td style={{ padding: '0.75rem 0.75rem' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: badge.bg,
                              color: badge.text,
                              border: `1px solid ${badge.border}`,
                            }}
                          >
                            {cust.segment}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>
                          {cust.totalVisits}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                          ${(cust.totalSpend || 0).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Selected Guest Profile & Dining History */}
        {selectedCustomer ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Guest Profile Card */}
            <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {selectedCustomer.name}
                    </h2>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        ...getSegmentStyle(selectedCustomer.segment),
                      }}
                    >
                      {selectedCustomer.segment}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    📞 {selectedCustomer.phone} • ✉️ {selectedCustomer.email || 'No email on record'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Lifetime Value</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a' }}>
                    ${(selectedCustomer.totalSpend || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Hospitality Preferences Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: 'var(--surface-alt, #f1ede4)', padding: '0.85rem', borderRadius: 'var(--radius-sm, 6px)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Preferred Table / Seating
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.2rem' }}>
                    📍 {selectedCustomer.preferredTable || 'Table 01 (Main Dining)'}
                  </div>
                </div>

                <div style={{ background: 'var(--surface-alt, #f1ede4)', padding: '0.85rem', borderRadius: 'var(--radius-sm, 6px)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Marketing Communication
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: selectedCustomer.marketingOptIn ? '#16a34a' : '#9ca3af' }}>
                      {selectedCustomer.marketingOptIn ? '✓ Subscribed (SMS/Email)' : '✕ Opted Out'}
                    </span>
                    <button
                      onClick={handleToggleMarketing}
                      style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none' }}
                    >
                      Toggle
                    </button>
                  </div>
                </div>
              </div>

              {/* Dietary Constraints */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  ⚠️ Dietary Constraints & Allergens
                </div>
                {selectedCustomer.dietaryConstraints && selectedCustomer.dietaryConstraints.length > 0 ? (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {selectedCustomer.dietaryConstraints.map((d, i) => (
                      <span
                        key={i}
                        style={{
                          padding: '0.2rem 0.6rem',
                          background: '#fee2e2',
                          color: '#b91c1c',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No dietary restrictions reported.
                  </span>
                )}
              </div>

              {/* Tags */}
              {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Guest Tags
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {selectedCustomer.tags.map((t, i) => (
                      <span
                        key={i}
                        style={{
                          padding: '0.2rem 0.6rem',
                          background: 'var(--accent-light, #eaf0e2)',
                          color: 'var(--accent, #556b2f)',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        🏷️ {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Hospitality Notes */}
              {selectedCustomer.notes && (
                <div style={{ padding: '0.75rem', background: '#fefce8', border: '1px solid #fef08a', borderRadius: 'var(--radius-sm, 6px)', fontSize: '0.85rem', color: '#854d0e' }}>
                  <strong>Server Notes:</strong> "{selectedCustomer.notes}"
                </div>
              )}
            </div>

            {/* Dining Visit History Ledger */}
            <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ margin: '0 0 0.85rem', fontSize: '1.05rem', fontWeight: 700 }}>
                Dining & Visit History ({history.length})
              </h3>
              {history.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No past dining orders recorded.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '250px', overflowY: 'auto' }}>
                  {history.map((h, idx) => (
                    <div
                      key={h.orderTicket || idx}
                      style={{
                        padding: '0.65rem 0.85rem',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm, 6px)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{h.orderDate} • {h.orderTicket}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {h.orderType} • {h.itemsSummary} ({h.paymentMethod})
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: '#16a34a' }}>
                        ₹{h.totalAmount?.toLocaleString('en-IN') || 0}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 10px)', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select a guest profile to view details.
          </div>
        )}
      </div>

      {/* Modal: New Guest Profile */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--surface, #fff)', width: '100%', maxWidth: '520px', borderRadius: 'var(--radius-md, 10px)', padding: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.25rem', fontWeight: 700 }}>Register New Guest Profile</h3>
            <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Kapoor"
                    value={newCustomer.name}
                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 98201 99881"
                    value={newCustomer.phone}
                    onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Email Address</label>
                  <input
                    type="email"
                    placeholder="guest@example.com"
                    value={newCustomer.email}
                    onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Segment</label>
                  <select
                    value={newCustomer.segment}
                    onChange={e => setNewCustomer({ ...newCustomer, segment: e.target.value as CustomerSegment })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  >
                    <option value="New">New</option>
                    <option value="Regular">Regular</option>
                    <option value="VIP">VIP</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Occasional">Occasional</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Dietary Constraints & Allergies (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Nut Allergy, Gluten-Free, Vegan"
                  value={dietaryInput}
                  onChange={e => {
                    setDietaryInput(e.target.value);
                    setNewCustomer({
                      ...newCustomer,
                      dietaryConstraints: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                    });
                  }}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Hospitality / Service Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Anniversary dinner coming up, prefers window booth seating"
                  value={newCustomer.notes}
                  onChange={e => setNewCustomer({ ...newCustomer, notes: e.target.value })}
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
                  Create Guest Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
