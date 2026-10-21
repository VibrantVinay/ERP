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
  const [showEditModal, setShowEditModal] = useState(false);

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
      const data = await customerApi.getCustomers({
        segment: selectedSegment,
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
      setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
    } catch (err: any) {
      alert('Failed to update marketing consent: ' + err.message);
    }
  };

  const getSegmentBadge = (segment: CustomerSegment) => {
    switch (segment) {
      case 'VIP':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Regular':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Corporate':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Occasional':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'New':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  // KPIs
  const vipCount = customers.filter(c => c.segment === 'VIP').length;
  const corporateCount = customers.filter(c => c.segment === 'Corporate').length;
  const totalLTV = customers.reduce((sum, c) => sum + c.totalSpend, 0);
  const avgVisits = customers.length ? Math.round((customers.reduce((sum, c) => sum + c.totalVisits, 0) / customers.length) * 10) / 10 : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              👥
            </span>
            Guest CRM & Customer Profiles
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Guest hospitality preferences, dining history, lifetime value & dietary constraints
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-orange-950/40 flex items-center gap-2 self-start sm:self-auto"
        >
          <span>+</span> New Guest Profile
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Registered Guests</p>
          <p className="text-2xl font-bold text-white mt-1">{customers.length}</p>
          <p className="text-xs text-indigo-400 mt-1">Avg {avgVisits} visits / guest</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">VIP Guests</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{vipCount}</p>
          <p className="text-xs text-zinc-500 mt-1">Priority table seating</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Corporate Accounts</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{corporateCount}</p>
          <p className="text-xs text-zinc-500 mt-1">Executive & PDR dining</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tracked Lifetime Spend</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">₹{totalLTV.toLocaleString('en-IN')}</p>
          <p className="text-xs text-zinc-500 mt-1">Repeat restaurant loyalty</p>
        </div>
      </div>

      {/* Search & Segment Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'VIP', 'Regular', 'Corporate', 'Occasional', 'New'] as const).map(seg => (
            <button
              key={seg}
              onClick={() => setSelectedSegment(seg)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedSegment === seg
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              {seg === 'all' ? 'All Segments' : seg}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by name, phone or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchData()}
            className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-orange-500 w-64"
          />
          <button
            onClick={fetchData}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-xl font-medium"
          >
            Search
          </button>
        </div>
      </div>

      {/* Main CRM Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-7 space-y-3">
          {loading ? (
            <div className="p-12 text-center text-zinc-500 animate-pulse">Loading guest profiles...</div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
              No customer records found.
            </div>
          ) : (
            customers.map(c => (
              <div
                key={c.id}
                onClick={() => handleSelectCustomer(c)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedCustomer?.id === c.id
                    ? 'bg-zinc-800/90 border-orange-500/50 shadow-lg'
                    : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-bold text-sm flex items-center justify-center">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{c.name}</h4>
                        <span className={`px-2 py-0.2 rounded-full text-[10px] border font-medium ${getSegmentBadge(c.segment)}`}>
                          {c.segment}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">📞 {c.phone} {c.email ? `· ✉️ ${c.email}` : ''}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">₹{c.totalSpend.toLocaleString('en-IN')}</p>
                    <p className="text-[11px] text-zinc-500">{c.totalVisits} visits</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex flex-wrap gap-1.5">
                    {c.dietaryConstraints.map((d, i) => (
                      <span key={i} className="px-2 py-0.5 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-md text-[10px]">
                        🥗 {d}
                      </span>
                    ))}
                    {c.preferredTable && (
                      <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-md text-[10px]">
                        🪑 Prefers {c.preferredTable}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    {c.marketingOptIn ? '✓ Marketing Opt-in' : '✕ Opt-out'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Customer Profile Inspector */}
        <div className="lg:col-span-5">
          {selectedCustomer ? (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-5 sticky top-6 shadow-xl">
              {/* Profile Card Header */}
              <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-bold text-lg flex items-center justify-center shadow-lg">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedCustomer.name}</h3>
                    <p className="text-xs text-zinc-400">📞 {selectedCustomer.phone}</p>
                    {selectedCustomer.email && (
                      <p className="text-xs text-zinc-500">✉️ {selectedCustomer.email}</p>
                    )}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs border font-medium ${getSegmentBadge(selectedCustomer.segment)}`}>
                  {selectedCustomer.segment}
                </span>
              </div>

              {/* Guest Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase font-semibold">Total Spend</p>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">₹{selectedCustomer.totalSpend.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase font-semibold">Visits</p>
                  <p className="text-sm font-bold text-white mt-0.5">{selectedCustomer.totalVisits}</p>
                </div>
                <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase font-semibold">Avg / Visit</p>
                  <p className="text-sm font-bold text-zinc-300 mt-0.5">₹{selectedCustomer.averageSpend.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Preferences & Dietary Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase text-zinc-400">Dining Preferences & Constraints</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-zinc-950/40 rounded-xl border border-zinc-800/80">
                    <span className="text-zinc-400">Dietary Constraints:</span>
                    <span className="font-medium text-rose-400">
                      {selectedCustomer.dietaryConstraints.length > 0
                        ? selectedCustomer.dietaryConstraints.join(', ')
                        : 'None declared'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-950/40 rounded-xl border border-zinc-800/80">
                    <span className="text-zinc-400">Table Preference:</span>
                    <span className="font-medium text-zinc-200">
                      {selectedCustomer.preferredTable || 'No specific seating'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-950/40 rounded-xl border border-zinc-800/80">
                    <span className="text-zinc-400">Marketing Consent:</span>
                    <button
                      onClick={handleToggleMarketing}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                        selectedCustomer.marketingOptIn
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      }`}
                    >
                      {selectedCustomer.marketingOptIn ? 'Opted In ✓' : 'Opted Out ✕'}
                    </button>
                  </div>
                </div>

                {selectedCustomer.notes && (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-amber-200/90">
                    <span className="font-semibold text-amber-400">VIP Host Notes: </span>
                    {selectedCustomer.notes}
                  </div>
                )}
              </div>

              {/* Recent Orders History */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-zinc-400 mb-2">Recent Dining Visits</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {history.map((h, i) => (
                    <div key={i} className="p-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl text-xs flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-white">{h.orderTicket}</span>
                          <span className="text-zinc-500">· {h.orderType}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{h.itemsSummary}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-400">₹{h.totalAmount.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-zinc-500">{h.paymentMethod}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
              Select a guest profile to view details.
            </div>
          )}
        </div>
      </div>

      {/* New Guest Profile Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>👤</span> Register New Guest Profile
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Guest Full Name</label>
                <input
                  required
                  placeholder="e.g. Vikram Singhal"
                  value={newCustomer.name}
                  onChange={e => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Mobile Phone</label>
                  <input
                    required
                    placeholder="98200 12345"
                    value={newCustomer.phone}
                    onChange={e => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="guest@example.com"
                    value={newCustomer.email}
                    onChange={e => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Customer Segment</label>
                  <select
                    value={newCustomer.segment}
                    onChange={e => setNewCustomer(prev => ({ ...prev, segment: e.target.value as CustomerSegment }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  >
                    <option value="New">New Guest</option>
                    <option value="Regular">Regular</option>
                    <option value="VIP">VIP</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Occasional">Occasional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Preferred Seating</label>
                  <input
                    placeholder="e.g. Patio 02, Counter, Table 04"
                    value={newCustomer.preferredTable}
                    onChange={e => setNewCustomer(prev => ({ ...prev, preferredTable: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Dietary Constraints (Comma separated)</label>
                <input
                  placeholder="e.g. Vegetarian, Gluten-Free, Nut Allergy"
                  value={dietaryInput}
                  onChange={e => {
                    setDietaryInput(e.target.value);
                    const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    setNewCustomer(prev => ({ ...prev, dietaryConstraints: list }));
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">VIP Host / Service Notes</label>
                <textarea
                  placeholder="e.g. Prefers sparkling San Pellegrino on arrival. Celebrating birthday in November."
                  value={newCustomer.notes}
                  onChange={e => setNewCustomer(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 resize-none h-18"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="optin"
                  checked={newCustomer.marketingOptIn}
                  onChange={e => setNewCustomer(prev => ({ ...prev, marketingOptIn: e.target.checked }))}
                  className="rounded text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="optin" className="text-xs text-zinc-300">
                  Guest has consented to SMS / Email dining notifications (Opt-in)
                </label>
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
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

