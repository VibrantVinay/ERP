'use client';

import React, { useState, useEffect } from 'react';
import { kitchenApi } from '../api';
import { KitchenTicket, KitchenStation, KitchenTicketStatus, StationStats } from '../types';

export function KitchenDisplay() {
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [stationStats, setStationStats] = useState<StationStats[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  const loadKdsData = async () => {
    try {
      const [ticketsData, statsData] = await Promise.all([
        kitchenApi.getTickets({
          station: selectedStation === 'all' ? undefined : selectedStation,
          activeOnly: false,
        }),
        kitchenApi.getStations(),
      ]);
      setTickets(ticketsData);
      setStationStats(statsData);
    } catch (err) {
      console.error('Failed to load KDS data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKdsData();
    const interval = setInterval(loadKdsData, 5000); // 5s KDS polling
    return () => clearInterval(interval);
  }, [selectedStation]);

  const handleBumpItem = async (ticketId: string, itemId: string) => {
    try {
      const updatedTicket = await kitchenApi.bumpItem(ticketId, itemId);
      setTickets(prev => prev.map(t => (t.id === ticketId ? updatedTicket : t)));
    } catch (err) {
      console.error('Failed to bump item', err);
    }
  };

  const handleTicketStatus = async (ticketId: string, nextStatus: KitchenTicketStatus) => {
    try {
      const updatedTicket = await kitchenApi.updateStatus(ticketId, nextStatus);
      setTickets(prev => prev.map(t => (t.id === ticketId ? updatedTicket : t)));
    } catch (err) {
      console.error('Failed to update ticket status', err);
    }
  };

  const getTimerStyles = (elapsed: number) => {
    if (elapsed > 15) {
      return { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5', label: 'DELAYED' };
    }
    if (elapsed > 10) {
      return { bg: '#fef3c7', text: '#b45309', border: '#fcd34d', label: 'WARN' };
    }
    return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', label: 'ON TIME' };
  };

  const activeTickets = tickets.filter(t => t.status !== 'Served');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      {/* KDS Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Kitchen Display System (KDS)
            </h1>
            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: '#dc2626', color: '#fff', borderRadius: '12px', fontWeight: 700 }}>
              LIVE KOT FEED
            </span>
          </div>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Station routing, item bump status, and SLA delay monitors
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setAudioEnabled(prev => !prev)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: audioEnabled ? '#ecfdf5' : 'var(--surface)',
              color: audioEnabled ? '#059669' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            {audioEnabled ? '🔔 Chime: ON' : '🔕 Chime: MUTE'}
          </button>
          <button
            onClick={loadKdsData}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Station Selector Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        <button
          onClick={() => setSelectedStation('all')}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            border: selectedStation === 'all' ? '2px solid var(--primary)' : '1px solid var(--border)',
            background: selectedStation === 'all' ? 'var(--primary)' : 'var(--surface)',
            color: selectedStation === 'all' ? '#fff' : 'var(--text-main)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          All Stations
          <span style={{ padding: '0.1rem 0.45rem', borderRadius: '10px', background: selectedStation === 'all' ? 'rgba(255,255,255,0.2)' : 'var(--bg)', fontSize: '0.75rem' }}>
            {activeTickets.length}
          </span>
        </button>

        {stationStats.map(stat => {
          const isSelected = selectedStation === stat.station;
          return (
            <button
              key={stat.station}
              onClick={() => setSelectedStation(stat.station)}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: isSelected ? 'var(--primary)' : 'var(--surface)',
                color: isSelected ? '#fff' : 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {stat.station}
              <span
                style={{
                  padding: '0.1rem 0.45rem',
                  borderRadius: '10px',
                  background: stat.delayedCount > 0 ? '#fee2e2' : isSelected ? 'rgba(255,255,255,0.2)' : 'var(--bg)',
                  color: stat.delayedCount > 0 ? '#dc2626' : 'inherit',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                }}
              >
                {stat.activeCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tickets Grid */}
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
        {loading && tickets.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading kitchen tickets...
          </div>
        ) : activeTickets.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🧑‍🍳✨</div>
            <h3 style={{ margin: 0, fontWeight: 700 }}>Kitchen board is all clear!</h3>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No active tickets awaiting preparation.</p>
          </div>
        ) : (
          activeTickets.map(ticket => {
            const elapsed = ticket.elapsedMinutes || 0;
            const timer = getTimerStyles(elapsed);
            const isDelayed = elapsed > 15;

            return (
              <div
                key={ticket.id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: '12px',
                  border: isDelayed ? '2px solid #ef4444' : '1px solid var(--border)',
                  boxShadow: isDelayed ? '0 0 14px rgba(239, 68, 68, 0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Ticket Top Header */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    background: isDelayed ? '#fee2e2' : 'rgba(0,0,0,0.03)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{ticket.ticketNumber}</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>
                        {ticket.tableNumber}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Station: {ticket.station}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        background: timer.bg,
                        color: timer.text,
                        border: `1px solid ${timer.border}`,
                        fontSize: '0.75rem',
                        fontWeight: 800,
                      }}
                    >
                      ⏱ {elapsed}m · {timer.label}
                    </span>

                    {ticket.priority !== 'Normal' && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          background: ticket.priority === 'Allergy' ? '#7f1d1d' : '#9a3412',
                          color: '#fff',
                        }}
                      >
                        {ticket.priority === 'Allergy' ? '⚠️ ALLERGY' : '🔥 RUSH'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Items Checklist */}
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                  {ticket.items.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleBumpItem(ticket.id, item.id)}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: '8px',
                        background: item.isBumped ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg)',
                        border: item.isBumped ? '1px solid #10b981' : '1px solid var(--border)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={item.isBumped}
                        onChange={() => {}} // handled by wrapper
                        style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#10b981' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            color: item.isBumped ? 'var(--text-muted)' : 'var(--text-main)',
                            textDecoration: item.isBumped ? 'line-through' : 'none',
                          }}
                        >
                          {item.name} <span style={{ color: 'var(--primary)', fontWeight: 800 }}>×{item.quantity}</span>
                        </div>
                        {item.notes && (
                          <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, marginTop: '2px' }}>
                            📝 {item.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ticket Action Footer */}
                <div style={{ padding: '0.75rem 1rem', background: 'var(--bg)', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
                  {ticket.status === 'New' && (
                    <button
                      onClick={() => handleTicketStatus(ticket.id, 'Preparing')}
                      style={{
                        flex: 1,
                        padding: '0.6rem',
                        borderRadius: '8px',
                        background: '#f59e0b',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                      }}
                    >
                      🍳 Start Cooking
                    </button>
                  )}
                  {ticket.status !== 'Ready' ? (
                    <button
                      onClick={() => handleTicketStatus(ticket.id, 'Ready')}
                      style={{
                        flex: 1,
                        padding: '0.6rem',
                        borderRadius: '8px',
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                      }}
                    >
                      🛎️ Bump Ready
                    </button>
                  ) : (
                    <button
                      onClick={() => handleTicketStatus(ticket.id, 'Served')}
                      style={{
                        flex: 1,
                        padding: '0.6rem',
                        borderRadius: '8px',
                        background: '#4b5563',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                      }}
                    >
                      🍽️ Mark Served
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

