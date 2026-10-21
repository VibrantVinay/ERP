'use client';

import React, { useState, useEffect } from 'react';
import { tasksApi } from '../api';
import { OperationalTask, TemperatureLog, TaskCategory, TaskPriority } from '../types';
import { useAuth } from '@/apps/auth/context/AuthContext';

export function TaskChecklistWorkspace() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'checklists' | 'temperatures'>('checklists');

  // Tasks state
  const [tasks, setTasks] = useState<OperationalTask[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New task form state
  const [showNewTaskModal, setShowNewTaskModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('opening');
  const [newRole, setNewRole] = useState('chef');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newDescription, setNewDescription] = useState('');

  // Complete task signature modal
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [signerName, setSignerName] = useState(user?.name || '');

  // Temperature logs state
  const [tempLogs, setTempLogs] = useState<TemperatureLog[]>([]);
  const [tempUnitName, setTempUnitName] = useState('Walk-in Chiller #1 (Dairy & Produce)');
  const [recordedTemp, setRecordedTemp] = useState<string>('2.5');
  const [targetMin, setTargetMin] = useState<string>('1.0');
  const [targetMax, setTargetMax] = useState<string>('4.0');
  const [tempNotes, setTempNotes] = useState('');
  const [submittingTemp, setSubmittingTemp] = useState(false);

  useEffect(() => {
    loadData();
  }, [categoryFilter, statusFilter]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [fetchedTasks, fetchedLogs] = await Promise.all([
        tasksApi.getTasks({
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
        tasksApi.getTemperatureLogs(),
      ]);
      setTasks(fetchedTasks);
      setTempLogs(fetchedLogs);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch operational data');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await tasksApi.createTask({
        branchId: 'main-branch',
        category: newCategory,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        assignedRole: newRole,
        assignedStaffName: user?.name,
        priority: newPriority,
      });
      setShowNewTaskModal(false);
      setNewTitle('');
      setNewDescription('');
      await loadData();
    } catch (err: any) {
      alert(`Error creating task: ${err.message}`);
    }
  }

  async function handleCompleteTask(e: React.FormEvent) {
    e.preventDefault();
    if (!completingTaskId) return;
    try {
      await tasksApi.completeTask(completingTaskId, {
        completedBy: signerName || user?.name || 'Staff Member',
        notes: completionNotes.trim() || undefined,
        status: 'completed',
      });
      setCompletingTaskId(null);
      setCompletionNotes('');
      await loadData();
    } catch (err: any) {
      alert(`Error completing task: ${err.message}`);
    }
  }

  async function handleLogTemperature(e: React.FormEvent) {
    e.preventDefault();
    const temp = parseFloat(recordedTemp);
    if (isNaN(temp)) return;
    setSubmittingTemp(true);
    try {
      await tasksApi.logTemperature({
        branchId: 'main-branch',
        unitName: tempUnitName,
        recordedTemp: temp,
        unit: 'C',
        targetMinTemp: targetMin ? parseFloat(targetMin) : 0,
        targetMaxTemp: targetMax ? parseFloat(targetMax) : 4,
        recordedBy: user?.name || 'Duty Chef',
        notes: tempNotes.trim() || undefined,
      });
      setTempNotes('');
      await loadData();
    } catch (err: any) {
      alert(`Error logging temperature: ${err.message}`);
    } finally {
      setSubmittingTemp(false);
    }
  }

  // Pre-configured unit defaults
  function handlePresetUnitChange(unit: string) {
    setTempUnitName(unit);
    if (unit.includes('Chiller') || unit.includes('Cooler')) {
      setTargetMin('1.0');
      setTargetMax('4.0');
    } else if (unit.includes('Freeze')) {
      setTargetMin('-24.0');
      setTargetMax('-18.0');
    } else if (unit.includes('Hot Holding') || unit.includes('Bain-Marie')) {
      setTargetMin('63.0');
      setTargetMax('85.0');
    }
  }

  // Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const criticalPending = tasks.filter(t => t.priority === 'critical' && t.status !== 'completed').length;
  const outOfRangeTemps = tempLogs.filter(t => t.isOutOfRange).length;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            📋 Operational Checklists & HACCP Safety
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Shift routines, critical food safety audits, and real-time cold-chain temperature monitoring.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowNewTaskModal(true)}
            style={{
              padding: '0.6rem 1.2rem',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>+</span> New Checklist Task
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.2rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Task Completion Rate</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
            {completionRate}% <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>({completedTasks}/{totalTasks})</span>
          </div>
          <div style={{ marginTop: '0.5rem', background: '#e2e8f0', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${completionRate}%`, height: '100%', background: '#10b981', transition: 'width 0.3s' }} />
          </div>
        </div>

        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.2rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Critical Safety Audits</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.25rem', color: criticalPending > 0 ? '#ef4444' : '#10b981' }}>
            {criticalPending} {criticalPending > 0 ? 'Pending' : 'Cleared'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Requires immediate chef sign-off</div>
        </div>

        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.2rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cold Chain Status</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.25rem', color: outOfRangeTemps > 0 ? '#f59e0b' : '#10b981' }}>
            {outOfRangeTemps > 0 ? `⚠️ ${outOfRangeTemps} Out of Spec` : '✓ All In Range'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Based on latest probe logs</div>
        </div>

        <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.2rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Staff Signer</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
            {user?.name || 'Chef on Duty'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'capitalize' }}>Role: {user?.role || 'staff'}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('checklists')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'checklists' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'checklists' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'checklists' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
          }}
        >
          📝 Scheduled Checklists & Hygiene
        </button>
        <button
          onClick={() => setActiveTab('temperatures')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'temperatures' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'temperatures' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'temperatures' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
          }}
        >
          🌡️ HACCP Temperature Logs ({tempLogs.length})
        </button>
      </div>

      {/* Tab 1: Operational Checklists */}
      {activeTab === 'checklists' && (
        <div>
          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Category:</span>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
              >
                <option value="all">All Categories</option>
                <option value="opening">🌅 Opening Routines</option>
                <option value="shift_change">🔄 Shift Change</option>
                <option value="closing">🌙 Closing Routines</option>
                <option value="hygiene">🧼 Hygiene & Sanitation</option>
                <option value="safety">🛡️ Food Safety (HACCP)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>
          </div>

          {/* Tasks Table / Card List */}
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading operational checklists...</div>
          ) : tasks.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>No tasks found matching current filter criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {tasks.map(task => {
                const isDone = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    style={{
                      background: 'var(--card-bg, #fff)',
                      border: `1px solid ${task.priority === 'critical' && !isDone ? '#fca5a5' : 'var(--border)'}`,
                      borderRadius: '8px',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1, minWidth: '300px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: isDone ? '#dcfce7' : '#f3f4f6',
                          color: isDone ? '#16a34a' : '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 700,
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        {isDone ? '✓' : '○'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: '1rem', color: isDone ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none' }}>
                            {task.title}
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              background: '#e0e7ff',
                              color: '#3730a3',
                              textTransform: 'capitalize',
                              fontWeight: 500,
                            }}
                          >
                            {task.category.replace('_', ' ')}
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              background: task.priority === 'critical' ? '#fee2e2' : task.priority === 'high' ? '#ffedd5' : '#f1f5f9',
                              color: task.priority === 'critical' ? '#b91c1c' : task.priority === 'high' ? '#c2410c' : '#475569',
                              fontWeight: 600,
                            }}
                          >
                            {task.priority.toUpperCase()}
                          </span>
                        </div>
                        {task.description && (
                          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{task.description}</p>
                        )}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <span>Assigned Role: <strong style={{ textTransform: 'capitalize' }}>{task.assignedRole}</strong></span>
                          {task.completedBy && <span>Signed Off By: <strong style={{ color: '#16a34a' }}>{task.completedBy}</strong></span>}
                          {task.notes && <span>Notes: <em>"{task.notes}"</em></span>}
                        </div>
                      </div>
                    </div>

                    <div>
                      {!isDone ? (
                        <button
                          onClick={() => {
                            setCompletingTaskId(task.id);
                            setSignerName(user?.name || '');
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                        >
                          Sign & Complete
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 600 }}>
                          ✓ Completed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: HACCP Temperature Logs */}
      {activeTab === 'temperatures' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {/* Submit New Probe Log */}
          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem', height: 'fit-content' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600 }}>🌡️ Record HACCP Temperature</h3>
            <form onSubmit={handleLogTemperature} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 500 }}>Equipment / Holding Unit</label>
                <select
                  value={tempUnitName}
                  onChange={e => handlePresetUnitChange(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                >
                  <option value="Walk-in Chiller #1 (Dairy & Produce)">Walk-in Chiller #1 (Dairy & Produce)</option>
                  <option value="Saute Line Under-counter Chiller">Saute Line Under-counter Chiller</option>
                  <option value="Deep Freeze Vault (Meats & Seafood)">Deep Freeze Vault (Meats & Seafood)</option>
                  <option value="Hot Holding Bain-Marie (Soups & Sauces)">Hot Holding Bain-Marie (Soups & Sauces)</option>
                  <option value="Custom Cooling Station">Custom Cooling Station</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 500 }}>Min Target (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={targetMin}
                    onChange={e => setTargetMin(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 500 }}>Max Target (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={targetMax}
                    onChange={e => setTargetMax(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 500 }}>Recorded Digital Probe Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={recordedTemp}
                  onChange={e => setRecordedTemp(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', fontSize: '1.1rem', fontWeight: 700, borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 500 }}>Observations / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Defrost cycle normal, door seal inspected"
                  value={tempNotes}
                  onChange={e => setTempNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingTemp}
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: submittingTemp ? 'not-allowed' : 'pointer',
                  marginTop: '0.5rem',
                }}
              >
                {submittingTemp ? 'Saving Probe Log...' : 'Submit HACCP Log'}
              </button>
            </form>
          </div>

          {/* Historical Logs List */}
          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600 }}>📋 Cold Chain Audit History</h3>
            {tempLogs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No temperature logs recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '550px', overflowY: 'auto' }}>
                {tempLogs.map(log => (
                  <div
                    key={log.id}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '6px',
                      border: `1px solid ${log.isOutOfRange ? '#f87171' : 'var(--border)'}`,
                      background: log.isOutOfRange ? '#fef2f2' : 'transparent',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: log.isOutOfRange ? '#991b1b' : 'inherit' }}>
                        {log.unitName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Spec: {log.targetMinTemp}°C to {log.targetMaxTemp}°C • Logged by {log.recordedBy}
                      </div>
                      {log.notes && (
                        <div style={{ fontSize: '0.8rem', fontStyle: 'italic', marginTop: '0.2rem', color: '#4b5563' }}>
                          "{log.notes}"
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: log.isOutOfRange ? '#dc2626' : '#16a34a',
                        }}
                      >
                        {log.recordedTemp}°{log.unit}
                      </div>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '3px',
                          background: log.isOutOfRange ? '#fee2e2' : '#dcfce7',
                          color: log.isOutOfRange ? '#991b1b' : '#166534',
                          fontWeight: 600,
                        }}
                      >
                        {log.isOutOfRange ? 'OUT OF SPEC' : 'PASS'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: New Checklist Task */}
      {showNewTaskModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--card-bg, #fff)', width: '100%', maxWidth: '500px', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: 600 }}>Create Operational Checklist Item</h3>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sanitize deli slicer blade"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as TaskCategory)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                  >
                    <option value="opening">Opening</option>
                    <option value="shift_change">Shift Change</option>
                    <option value="closing">Closing</option>
                    <option value="hygiene">Hygiene</option>
                    <option value="safety">Food Safety</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Priority</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as TaskPriority)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Assigned Role</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                >
                  <option value="chef">Chef / Cook</option>
                  <option value="server">Server</option>
                  <option value="cleaner">Cleaner</option>
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Detailed Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Specific standards or steps required..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', background: 'transparent', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Sign & Complete Task */}
      {completingTaskId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--card-bg, #fff)', width: '100%', maxWidth: '450px', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 600 }}>Sign Off Operational Task</h3>
            <form onSubmit={handleCompleteTask} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Signer Name (Digital Verification) *</label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Completion Observations</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Filters rinsed, quat test strips read 200ppm"
                  value={completionNotes}
                  onChange={e => setCompletionNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCompletingTaskId(null)}
                  style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', background: 'transparent', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Verify & Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

