'use client';

import React, { useState, useEffect } from 'react';
import { reservationsApi } from '../api';
import { Reservation, ReservationStatus, CreateReservationDto } from '../types';

export function ReservationManager() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  // New Booking Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<CreateReservationDto>({
    guestName: '',
    phone: '',
    email: '',
    partySize: 2,
    reservationDate: new Date().toISOString().split('T')[0],
    reservationTime: '19:00',
    tablePreference: 'Main Room',
    occasion: 'Dinner',
    specialRequests: '',
    depositAmount: 0,
    depositStatus: 'None',
  });

  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await reservationsApi.getReservations({
        date: selectedDate,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setReservations(data);
    } catch (err) {
      console.error('Failed to load reservations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, [selectedDate, statusFilter]);

  const handleCheckIn = async (id: string) => {
    try {
      const updated = await reservationsApi.checkIn(id);
      setReservations(prev => prev.map(r => (r.id === id ? updated : r)));
    } catch (err) {
      console.error('Failed to check in', err);
    }
  };

  const handleStatusChange = async (id: string, status: ReservationStatus) => {
    try {
      const updated = await reservationsApi.updateStatus(id, status);
      setReservations(prev => prev.map(r => (r.id === id ? updated : r)));
    } catch (err) {
      console.error('Failed to change status', err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await reservationsApi.createReservation(formData);
      setReservations(prev => [...prev, created]);
      setModalOpen(false);
      setFormData({
        guestName: '',
        phone: '',
        email: '',
        partySize: 2,
        reservationDate: selectedDate,
        reservationTime: '19:00',
        tablePreference: 'Main Room',
        occasion: 'Dinner',
        specialRequests: '',
        depositAmount: 0,
        depositStatus: 'None',
      });
    } catch (err) {
      console.error('Failed to create reservation', err);
    }
  };

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'Confirmed': return { bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd' };
      case 'Arrived': return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' };
      case 'Seated': return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
      case 'Completed': return { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb' };
      case 'Cancelled': return { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
            Guest Bookings & Reservations
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Table reservations, advance deposits, party special occasions & 1-click check-in
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          style={{
            padding: '0.6rem 1.1rem',
            borderRadius: '8px',
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          + New Reservation
        </button>
      </div>

      {/* Date & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: 'var(--surface)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', fontSize: '0.85rem', fontWeight: 600 }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {['all', 'Confirmed', 'Arrived', 'Seated', 'Completed', 'Cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: statusFilter === st ? 'var(--primary)' : 'var(--bg)',
                color: statusFilter === st ? '#fff' : 'var(--text-main)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {st === 'all' ? 'All' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1rem',
          overflowY: 'auto',
          flex: 1,
          alignContent: 'start',
        }}
      >
        {loading && reservations.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading reservations...
          </div>
        ) : reservations.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '3.5rem', textAlign: 'center', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
            <h3 style={{ margin: 0, fontWeight: 700 }}>No reservations found for {selectedDate}</h3>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Click "+ New Reservation" to schedule a booking.</p>
          </div>
        ) : (
          reservations.map(res => {
            const badge = getStatusBadge(res.status);

            return (
              <div
                key={res.id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: '12px',
                  border: `1.5px solid ${badge.border}`,
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{res.guestName}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      📞 {res.phone} · {res.partySize} Guests
                    </span>
                  </div>

                  <span
                    style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: badge.bg,
                      color: badge.text,
                      border: `1px solid ${badge.border}`,
                    }}
                  >
                    {res.status}
                  </span>
                </div>

                <div style={{ background: 'var(--bg)', padding: '0.6rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Slot: <strong>{res.reservationTime}</strong></span>
                    <span>Pref: <strong>{res.tablePreference || 'Any Table'}</strong></span>
                  </div>
                  {res.occasion && (
                    <div style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      🎉 {res.occasion}
                    </div>
                  )}
                  {res.specialRequests && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                      "{res.specialRequests}"
                    </div>
                  )}
                  {res.depositAmount > 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 700, marginTop: '2px' }}>
                      💵 Deposit ₹{res.depositAmount} ({res.depositStatus})
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px dashed var(--border)' }}>
                  {res.status === 'Confirmed' && (
                    <button
                      onClick={() => handleCheckIn(res.id)}
                      style={{ flex: 1, padding: '0.55rem', borderRadius: '6px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      🛎️ Guest Arrived
                    </button>
                  )}
                  {res.status === 'Arrived' && (
                    <button
                      onClick={() => handleStatusChange(res.id, 'Seated')}
                      style={{ flex: 1, padding: '0.55rem', borderRadius: '6px', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      🪑 Seat Party
                    </button>
                  )}
                  {res.status !== 'Completed' && res.status !== 'Cancelled' && (
                    <button
                      onClick={() => handleStatusChange(res.id, 'Cancelled')}
                      style={{ padding: '0.55rem 0.75rem', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Reservation Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <form
            onSubmit={handleCreateSubmit}
            style={{
              background: 'var(--surface)',
              width: '100%',
              maxWidth: '460px',
              borderRadius: '12px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Book Table Reservation</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Guest Name *</label>
                <input
                  required
                  type="text"
                  value={formData.guestName}
                  onChange={e => setFormData({ ...formData, guestName: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Phone *</label>
                <input
                  required
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Date</label>
                <input
                  type="date"
                  value={formData.reservationDate}
                  onChange={e => setFormData({ ...formData, reservationDate: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Time Slot</label>
                <input
                  type="time"
                  value={formData.reservationTime}
                  onChange={e => setFormData({ ...formData, reservationTime: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Party Size</label>
                <input
                  type="number"
                  min={1}
                  value={formData.partySize}
                  onChange={e => setFormData({ ...formData, partySize: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Zone / Table Pref</label>
                <input
                  type="text"
                  placeholder="e.g. Patio or VIP"
                  value={formData.tablePreference}
                  onChange={e => setFormData({ ...formData, tablePreference: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Occasion</label>
                <input
                  type="text"
                  placeholder="Birthday, Date, etc."
                  value={formData.occasion}
                  onChange={e => setFormData({ ...formData, occasion: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Special Requests</label>
              <textarea
                rows={2}
                placeholder="High chair, window seat, allergies..."
                value={formData.specialRequests}
                onChange={e => setFormData({ ...formData, specialRequests: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Deposit (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.depositAmount}
                  onChange={e => setFormData({ ...formData, depositAmount: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Deposit Status</label>
                <select
                  value={formData.depositStatus}
                  onChange={e => setFormData({ ...formData, depositStatus: e.target.value as any })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                >
                  <option value="None">None</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                Confirm Booking
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

