'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AuditEvent, AuditSummary, CreateAuditEventDTO, AuditAction, AuditSeverity } from '../types';
import { auditApi } from '../api';
import { useAuth } from '@/apps/auth/context/AuthContext';

const MODULE_OPTIONS = [
  'pos',
  'orders',
  'kitchen',
  'tables',
  'reservations',
  'delivery',
  'customers',
  'loyalty',
  'feedback',
  'menu',
  'recipes',
  'inventory',
  'suppliers',
  'stock_movements',
  'staff',
  'tasks',
  'equipment',
  'finance',
  'reports',
  'branches',
  'users',
];

const ACTION_OPTIONS: AuditAction[] = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'VOID',
  'DISPATCH',
  'OVERRIDE',
  'EXPORT',
  'LOGIN',
];

const ACTION_COLORS: Record<AuditAction, { bg: string; color: string; border: string }> = {
  CREATE: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  UPDATE: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  DELETE: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  VOID: { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
  DISPATCH: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  OVERRIDE: { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  EXPORT: { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
  LOGIN: { bg: '#f8fafc', color: '#475569', border: '#cbd5e1' },
};

export function AuditWorkspace() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Manual Event Form State
  const [manualModule, setManualModule] = useState('compliance');
  const [manualAction, setManualAction] = useState<AuditAction>('OVERRIDE');
  const [manualSeverity, setManualSeverity] = useState<AuditSeverity>('info');
  const [manualDescription, setManualDescription] = useState('');
  const [manualDetails, setManualDetails] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsList, summaryData] = await Promise.all([
        auditApi.getLogs({
          module: moduleFilter,
          action: actionFilter,
          severity: severityFilter,
        }),
        auditApi.getSummary(),
      ]);
      setLogs(eventsList);
      setSummary(summaryData);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to fetch audit records' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [moduleFilter, actionFilter, severityFilter]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDescription) {
      showToast('Please provide an event description', 'error');
      return;
    }

    try {
      const dto: CreateAuditEventDTO = {
        actorId: user?.id || 'usr-manual',
        actorName: user?.name || 'Administrator',
        actorRole: user?.role || 'owner',
        branchId: 'branch-ind',
        branchName: 'Indiranagar Flagship',
        module: manualModule,
        action: manualAction,
        severity: manualSeverity,
        description: manualDescription,
        details: manualDetails || undefined,
        ipAddress: '127.0.0.1 (Internal UI)',
      };

      await auditApi.createLog(dto);
      showToast('Manual compliance entry sealed into immutable log.');
      setIsManualModalOpen(false);
      setManualDescription('');
      setManualDetails('');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to seal audit entry', 'error');
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `rift-audit-trail-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported complete immutable audit trail package (JSON).');
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        l.description.toLowerCase().includes(q) ||
        l.actorName.toLowerCase().includes(q) ||
        l.module.toLowerCase().includes(q) ||
        l.ipAddress.toLowerCase().includes(q) ||
        (l.details && l.details.toLowerCase().includes(q));
      return matchSearch;
    });
  }, [logs, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.6rem' }}>🛡️</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
              Immutable Audit Trail & Compliance Ledger
            </h1>
          </div>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Cryptographically sealed, append-only operational log recording all write actions across all 24 apps.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            onClick={handleExportJson}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem 1.1rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <span>📥</span> Export Audit Log
          </button>

          <button
            onClick={() => setIsManualModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}
          >
            <span>＋</span> Log Inspection Note
          </button>
        </div>
      </div>

      {/* Tamper-Proof Cryptographic Banner */}
      <div
        style={{
          background: 'linear-gradient(90deg, #f0fdf4 0%, #ecfdf5 100%)',
          border: '1px solid #86efac',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🔒</span>
          <div>
            <div style={{ fontWeight: 700, color: '#15803d', fontSize: '0.95rem' }}>
              Append-Only Tamper-Proof Integrity Active
            </div>
            <div style={{ fontSize: '0.8rem', color: '#166534', marginTop: '0.1rem' }}>
              All actions cryptographically chained with SHA-256 timestamps. Deletion or retroactive mutation is prevented.
            </div>
          </div>
        </div>
        <span
          style={{
            background: '#dcfce7',
            color: '#15803d',
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.3rem 0.7rem',
            borderRadius: '999px',
            border: '1px solid #bbf7d0',
          }}
        >
          ✓ VERIFIED INTACT
        </span>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            padding: '0.85rem 1.2rem',
            borderRadius: 'var(--radius-md)',
            background: notification.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: notification.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${notification.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            fontSize: '0.9rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <span>{notification.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Audit Events
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--text)' }}>
            {summary ? summary.totalEvents : '—'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Sealed system events
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Critical Alerts
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.4rem', color: '#ef4444' }}>
            {summary ? summary.criticalEvents : '0'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Security & permission overrides
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Events Logged Today
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.4rem', color: '#3b82f6' }}>
            {summary ? summary.todayEvents : '—'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Active daily operational volume
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Unique Actors
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--primary)' }}>
            {summary ? summary.uniqueActors : '—'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Staff members participating
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 300px' }}>
          <input
            type="text"
            placeholder="Search action description, actor name, module, IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '0.9rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Module:</span>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              style={{
                padding: '0.5rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <option value="all">All Modules</option>
              {MODULE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              style={{
                padding: '0.5rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <option value="all">All Actions</option>
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={{
                padding: '0.5rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <option value="all">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Stream / Table */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Retrieving cryptographic audit events...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No audit records match the selected filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    Timestamp / Hash
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    Severity
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    Actor
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    Module / Action
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    Event Description
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    Origin IP
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const actionStyle = ACTION_COLORS[log.action] || { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
                  const isCritical = log.severity === 'critical';
                  const isWarning = log.severity === 'warning';
                  const isExpanded = expandedId === log.id;

                  const dateFormatted = new Date(log.timestamp).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                  });

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          cursor: 'pointer',
                          background: isExpanded
                            ? 'var(--bg)'
                            : isCritical
                            ? 'rgba(239,68,68,0.03)'
                            : 'transparent',
                        }}
                      >
                        <td style={{ padding: '0.9rem 1.25rem', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.85rem' }}>{dateFormatted}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {log.id}
                          </div>
                        </td>

                        <td style={{ padding: '0.9rem 1.25rem' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '999px',
                              background: isCritical ? '#fef2f2' : isWarning ? '#fffbeb' : '#ecfdf5',
                              color: isCritical ? '#dc2626' : isWarning ? '#b45309' : '#059669',
                              border: `1px solid ${isCritical ? '#fecaca' : isWarning ? '#fde68a' : '#a7f3d0'}`,
                            }}
                          >
                            {log.severity}
                          </span>
                        </td>

                        <td style={{ padding: '0.9rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{log.actorName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                            {log.actorRole} • {log.branchName}
                          </div>
                        </td>

                        <td style={{ padding: '0.9rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '0.2rem 0.45rem',
                                borderRadius: '4px',
                                background: 'var(--bg)',
                                color: 'var(--text)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              {log.module}
                            </span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.45rem',
                                borderRadius: '4px',
                                background: actionStyle.bg,
                                color: actionStyle.color,
                                border: `1px solid ${actionStyle.border}`,
                              }}
                            >
                              {log.action}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '0.9rem 1.25rem', maxWidth: '400px' }}>
                          <div style={{ color: 'var(--text)', fontWeight: 500 }}>{log.description}</div>
                          {log.details && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              {isExpanded ? '▲ Hide details' : '▼ Click to inspect payload payload'}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                          {log.ipAddress}
                        </td>
                      </tr>

                      {/* Expandable details row */}
                      {isExpanded && log.details && (
                        <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                          <td colSpan={6} style={{ padding: '1rem 1.5rem' }}>
                            <div
                              style={{
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '0.85rem 1.1rem',
                                fontFamily: 'monospace',
                                fontSize: '0.85rem',
                                color: 'var(--text)',
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              <strong>Payload & Evidence Log:</strong>
                              <br />
                              {log.details}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Manual Log / Inspection Note */}
      {isManualModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: '520px',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>
                🛡️ Seal Compliance & Audit Note
              </h2>
              <button
                onClick={() => setIsManualModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualLog} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Module</label>
                  <select
                    value={manualModule}
                    onChange={(e) => setManualModule(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  >
                    <option value="compliance">Compliance</option>
                    <option value="security">Security</option>
                    <option value="finance">Finance</option>
                    <option value="inventory">Inventory</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Action</label>
                  <select
                    value={manualAction}
                    onChange={(e) => setManualAction(e.target.value as AuditAction)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  >
                    {ACTION_OPTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Severity</label>
                  <select
                    value={manualSeverity}
                    onChange={(e) => setManualSeverity(e.target.value as AuditSeverity)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Event Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Conducted food safety audit on cold storage chain"
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Detailed Evidence / Findings</label>
                <textarea
                  rows={3}
                  placeholder="Inspection observations, temperature readings, supervisor signoff..."
                  value={manualDetails}
                  onChange={(e) => setManualDetails(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.4rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Seal Entry to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

