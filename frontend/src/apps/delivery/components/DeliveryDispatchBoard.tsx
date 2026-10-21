'use client';

import React, { useState, useEffect } from 'react';
import { deliveryApi } from '../api';
import { DeliveryDispatch, Driver, DeliveryStatus, DriverStatus } from '../types';

export function DeliveryDispatchBoard() {
  const [dispatches, setDispatches] = useState<DeliveryDispatch[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  // Assign Driver Modal
  const [assignDispatch, setAssignDispatch] = useState<DeliveryDispatch | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  const loadData = async () => {
    try {
      const [dispData, drvData] = await Promise.all([
        deliveryApi.getDispatches({
          status: statusFilter === 'all' ? undefined : statusFilter,
        }),
        deliveryApi.getDrivers(),
      ]);
      setDispatches(dispData);
      setDrivers(drvData);
    } catch (err) {
      console.error('Failed to load delivery data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000); // 8s polling
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleAssignDriver = async () => {
    if (!assignDispatch || !selectedDriverId) return;
    try {
      const updated = await deliveryApi.assignDriver(assignDispatch.id, selectedDriverId);
      setDispatches(prev => prev.map(d => (d.id === assignDispatch.id ? updated : d)));
      setAssignDispatch(null);
      setSelectedDriverId('');
      // Refresh driver status
      const drvs = await deliveryApi.getDrivers();
      setDrivers(drvs);
    } catch (err) {
      console.error('Failed to assign driver', err);
    }
  };

  const handleStatusTransition = async (id: string, nextStatus: DeliveryStatus) => {
    try {
      const updated = await deliveryApi.updateStatus(id, nextStatus);
      setDispatches(prev => prev.map(d => (d.id === id ? updated : d)));
      const drvs = await deliveryApi.getDrivers();
      setDrivers(drvs);
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleToggleDriverStatus = async (driverId: string, currentStatus: DriverStatus) => {
    const nextStatus: DriverStatus = currentStatus === 'Off Duty' ? 'Available' : 'Off Duty';
    try {
      const updated = await deliveryApi.updateDriverStatus(driverId, nextStatus);
      setDrivers(prev => prev.map(d => (d.id === driverId ? updated : d)));
    } catch (err) {
      console.error('Failed to toggle driver status', err);
    }
  };

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case 'Queued': return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };
      case 'Preparing': return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
      case 'Ready for pickup': return { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe' };
      case 'Picked up':
      case 'On the way': return { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe' };
      case 'Delivered': return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      default: return { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' };
    }
  };

  const activeDispatches = dispatches.filter(d => d.status !== 'Delivered');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
            Delivery Dispatch Operations
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Live fleet dispatching, promise time countdowns, SLA alerts & driver assignment
          </p>
        </div>

        <button
          onClick={loadData}
          style={{
            padding: '0.5rem 0.85rem',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Main Split: Dispatches (Left) & Driver Fleet (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', flex: 1, minHeight: 0 }}>
        {/* Left: Dispatch Board */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
          {/* Status Filters */}
          <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--surface)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', overflowX: 'auto' }}>
            {['all', 'Queued', 'Preparing', 'Ready for pickup', 'On the way', 'Delivered'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: statusFilter === st ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: statusFilter === st ? 'var(--primary)' : 'var(--bg)',
                  color: statusFilter === st ? '#fff' : 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                {st === 'all' ? 'All Dispatches' : st}
              </button>
            ))}
          </div>

          {/* Dispatches List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {loading && dispatches.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading dispatches...</div>
            ) : dispatches.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                No delivery dispatches in this view.
              </div>
            ) : (
              dispatches.map(disp => {
                const sc = getStatusColor(disp.status);
                const promisedAt = new Date(disp.promisedTime);
                const isOverdue = disp.isDelayed;

                return (
                  <div
                    key={disp.id}
                    style={{
                      background: 'var(--surface)',
                      borderRadius: '12px',
                      border: isOverdue ? '2px solid #ef4444' : '1px solid var(--border)',
                      padding: '1.15rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      boxShadow: isOverdue ? '0 0 10px rgba(239, 68, 68, 0.15)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{disp.orderTicket}</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {disp.customerName}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({disp.phone})</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          📍 {disp.address} · <strong style={{ color: 'var(--text-main)' }}>{disp.zone}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: sc.bg,
                            color: sc.text,
                            border: `1px solid ${sc.border}`,
                          }}
                        >
                          {disp.status}
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            color: isOverdue ? '#dc2626' : '#059669',
                          }}
                        >
                          {isOverdue ? '⚠️ DELAYED' : `ETA: ${promisedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', padding: '0.6rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                      <div>
                        Assigned Driver: <strong>{disp.driverName || 'Not Assigned Yet'}</strong>
                      </div>
                      <div>
                        Total: <strong style={{ color: 'var(--primary)' }}>₹{disp.orderTotal.toFixed(2)}</strong>
                      </div>
                    </div>

                    {/* Action Pipeline */}
                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px dashed var(--border)', paddingTop: '0.5rem' }}>
                      {!disp.driverId && disp.status !== 'Delivered' && (
                        <button
                          onClick={() => {
                            setSelectedDriverId(drivers.find(d => d.status === 'Available')?.id || '');
                            setAssignDispatch(disp);
                          }}
                          style={{ flex: 1, padding: '0.55rem', borderRadius: '6px', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          🛵 Assign Driver
                        </button>
                      )}

                      {disp.status === 'Queued' && (
                        <button
                          onClick={() => handleStatusTransition(disp.id, 'Preparing')}
                          style={{ flex: 1, padding: '0.55rem', borderRadius: '6px', background: '#f59e0b', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          🍳 Kitchen Prep
                        </button>
                      )}

                      {disp.status === 'Preparing' && (
                        <button
                          onClick={() => handleStatusTransition(disp.id, 'Ready for pickup')}
                          style={{ flex: 1, padding: '0.55rem', borderRadius: '6px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          📦 Ready for Pickup
                        </button>
                      )}

                      {disp.status === 'Ready for pickup' && disp.driverId && (
                        <button
                          onClick={() => handleStatusTransition(disp.id, 'On the way')}
                          style={{ flex: 1, padding: '0.55rem', borderRadius: '6px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          🚀 Driver Departed (On the Way)
                        </button>
                      )}

                      {disp.status === 'On the way' && (
                        <button
                          onClick={() => handleStatusTransition(disp.id, 'Delivered')}
                          style={{ flex: 1, padding: '0.55rem', borderRadius: '6px', background: '#059669', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          ✅ Confirm Delivered
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Driver Fleet Panel */}
        <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Delivery Fleet</h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Driver availability & active dispatches
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {drivers.map(driver => {
              const isAvail = driver.status === 'Available';
              const isOnDel = driver.status === 'On Delivery';

              return (
                <div
                  key={driver.id}
                  style={{
                    background: 'var(--bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    padding: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{driver.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        📞 {driver.phone} · 🛵 {driver.vehicleType}
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '0.15rem 0.45rem',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: isAvail ? '#ecfdf5' : isOnDel ? '#e0e7ff' : '#f3f4f6',
                        color: isAvail ? '#059669' : isOnDel ? '#4338ca' : '#6b7280',
                      }}
                    >
                      {driver.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', borderTop: '1px dashed var(--border)', paddingTop: '0.4rem' }}>
                    <span>Active Deliveries: <strong>{driver.activeDeliveriesCount}</strong></span>
                    <button
                      onClick={() => handleToggleDriverStatus(driver.id, driver.status)}
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    >
                      {driver.status === 'Off Duty' ? 'Go On-Duty' : 'Go Off-Duty'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Assign Driver Modal */}
      {assignDispatch && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', width: '100%', maxWidth: '400px', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Assign Driver to {assignDispatch.orderTicket}</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Delivery to {assignDispatch.customerName} ({assignDispatch.zone})
            </p>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Select Driver</label>
              <select
                value={selectedDriverId}
                onChange={e => setSelectedDriverId(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', marginTop: '0.35rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', fontWeight: 600 }}
              >
                <option value="">-- Choose on-duty driver --</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.vehicleType}) - {d.status} ({d.activeDeliveriesCount} active)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => setAssignDispatch(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignDriver}
                disabled={!selectedDriverId}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

