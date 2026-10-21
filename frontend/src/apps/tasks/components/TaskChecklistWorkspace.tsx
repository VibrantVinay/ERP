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
      setTasks(fetchedTasks || []);
      setTempLogs(fetchedLogs || []);
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

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical':
        return { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'high':
        return { bg: 'rgba(249, 115, 22, 0.12)', color: '#f97316', border: 'rgba(249, 115, 22, 0.3)' };
      case 'medium':
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
      case 'low':
      default:
        return { bg: 'var(--surface-muted)', color: 'var(--text-muted)', border: 'var(--border)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        paddingBottom: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#10b981',
            fontSize: '1.25rem',
            border: '1px solid rgba(16, 185, 129, 0.25)',
          }}>
            📋
          </span>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              Operational Checklists & HACCP Safety
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Opening/closing shift routines, critical sanitization logs, and continuous cold-chain temperature verification
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNewTaskModal(true)}
          style={{
            padding: '0.6rem 1.2rem',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
          }}
        >
          <span>+</span> New Checklist Task
        </button>
      </div>

      {/* Metrics Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
      }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.1rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em' }}>
            Completion Rate
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', margin: '0.35rem 0 0.15rem' }}>
            {completionRate}% <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>({completedTasks}/{totalTasks})</span>
          </p>
          <div style={{ marginTop: '0.5rem', background: 'var(--bg)', borderRadius: '9999px', height: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ width: `${completionRate}%`, height: '100%', background: '#10b981', transition: 'width 0.3s' }} />
          </div>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.1rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em' }}>
            Critical Safety Audits
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: criticalPending > 0 ? '#ef4444' : '#10b981', margin: '0.35rem 0 0.15rem' }}>
            {criticalPending} {criticalPending > 0 ? 'Pending' : 'Cleared'}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Requires immediate supervisor sign-off
          </span>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.1rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em' }}>
            Cold Chain Status
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: outOfRangeTemps > 0 ? '#f59e0b' : '#10b981', margin: '0.35rem 0 0.15rem' }}>
            {outOfRangeTemps > 0 ? `⚠️ ${outOfRangeTemps} Out of Spec` : '✓ All In Range'}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Based on active temperature probes
          </span>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.1rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em' }}>
            Current Signer
          </p>
          <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', margin: '0.35rem 0 0.15rem' }}>
            {user?.name || 'Chef on Duty'}
          </p>
          <span style={{ fontSize: '0.75rem', color: '#f97316', fontWeight: 600, textTransform: 'capitalize' }}>
            Role: {user?.role || 'staff'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('checklists')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'checklists' ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid transparent',
              background: activeTab === 'checklists' ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
              color: activeTab === 'checklists' ? '#f97316' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            📝 Scheduled Checklists ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('temperatures')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'temperatures' ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid transparent',
              background: activeTab === 'temperatures' ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
              color: activeTab === 'temperatures' ? '#f97316' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            🌡️ HACCP Temperature Logs ({tempLogs.length})
          </button>
        </div>

        {activeTab === 'checklists' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Category:</span>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text)',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              >
                <option value="all">All Categories</option>
                <option value="opening">🌅 Opening Routines</option>
                <option value="shift_change">🔄 Shift Change</option>
                <option value="closing">🌙 Closing Routines</option>
                <option value="hygiene">🧼 Hygiene & Sanitation</option>
                <option value="safety">🛡️ Food Safety (HACCP)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text)',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: Operational Checklists */}
      {activeTab === 'checklists' && (
        <div>
          {loading ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}>
              Loading operational checklists...
            </div>
          ) : tasks.length === 0 ? (
            <div style={{
              padding: '2.5rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}>
              No tasks found matching current filter criteria.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {tasks.map(task => {
                const isDone = task.status === 'completed';
                const priorityStyle = getPriorityStyle(task.priority);
                return (
                  <div
                    key={task.id}
                    style={{
                      background: 'var(--surface)',
                      border: `1px solid ${task.priority === 'critical' && !isDone ? 'rgba(239, 68, 68, 0.4)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      flexWrap: 'wrap',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1, minWidth: '280px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: isDone ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg)',
                          color: isDone ? '#10b981' : 'var(--text-muted)',
                          border: isDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border)',
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
                          <span style={{
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            color: isDone ? 'var(--text-muted)' : 'var(--text)',
                            textDecoration: isDone ? 'line-through' : 'none',
                          }}>
                            {task.title}
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              background: 'rgba(59, 130, 246, 0.1)',
                              color: '#60a5fa',
                              textTransform: 'capitalize',
                              fontWeight: 600,
                              border: '1px solid rgba(59, 130, 246, 0.25)',
                            }}
                          >
                            {task.category.replace('_', ' ')}
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              background: priorityStyle.bg,
                              color: priorityStyle.color,
                              fontWeight: 700,
                              border: `1px solid ${priorityStyle.border}`,
                            }}
                          >
                            {task.priority.toUpperCase()}
                          </span>
                        </div>
                        {task.description && (
                          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                            {task.description}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <span>Assigned Role: <strong style={{ textTransform: 'capitalize', color: 'var(--text)' }}>{task.assignedRole}</strong></span>
                          {task.completedBy && <span>Signed Off By: <strong style={{ color: '#10b981' }}>{task.completedBy}</strong></span>}
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
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          Sign & Complete
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
          {/* Submit New Probe Log */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)' }}>
              🌡️ Record HACCP Temperature
            </h3>
            <form onSubmit={handleLogTemperature} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Equipment / Holding Unit
                </label>
                <select
                  value={tempUnitName}
                  onChange={e => handlePresetUnitChange(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
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
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Min Target (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={targetMin}
                    onChange={e => setTargetMin(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.55rem 0.65rem',
                      color: 'var(--text)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Max Target (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={targetMax}
                    onChange={e => setTargetMax(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.55rem 0.65rem',
                      color: 'var(--text)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Recorded Digital Probe Temp (°C) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={recordedTemp}
                  onChange={e => setRecordedTemp(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.6rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Observations / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Defrost cycle normal, door gasket checked"
                  value={tempNotes}
                  onChange={e => setTempNotes(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingTemp}
                style={{
                  padding: '0.65rem',
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: submittingTemp ? 'not-allowed' : 'pointer',
                  marginTop: '0.25rem',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                }}
              >
                {submittingTemp ? 'Saving Probe Log...' : 'Submit HACCP Log'}
              </button>
            </form>
          </div>

          {/* Historical Logs List */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)' }}>
              📋 Cold Chain Audit History
            </h3>
            {tempLogs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No temperature logs recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '520px', overflowY: 'auto' }}>
                {tempLogs.map(log => (
                  <div
                    key={log.id}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${log.isOutOfRange ? 'rgba(239, 68, 68, 0.4)' : 'var(--border)'}`,
                      background: log.isOutOfRange ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: log.isOutOfRange ? '#f87171' : 'var(--text)' }}>
                        {log.unitName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Spec: {log.targetMinTemp}°C to {log.targetMaxTemp}°C • {log.recordedBy}
                      </div>
                      {log.notes && (
                        <div style={{ fontSize: '0.75rem', fontStyle: 'italic', marginTop: '0.2rem', color: 'var(--text-muted)' }}>
                          "{log.notes}"
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: log.isOutOfRange ? '#ef4444' : '#10b981',
                          fontFamily: 'monospace',
                        }}
                      >
                        {log.recordedTemp}°{log.unit}
                      </div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '3px',
                          background: log.isOutOfRange ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: log.isOutOfRange ? '#ef4444' : '#10b981',
                          fontWeight: 700,
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
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            background: 'var(--surface)',
            width: '100%',
            maxWidth: '500px',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
              Create Operational Checklist Item
            </h3>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sanitize deli slicer blade"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as TaskCategory)}
                    style={{
                      width: '100%',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.55rem 0.65rem',
                      color: 'var(--text)',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="opening">Opening</option>
                    <option value="shift_change">Shift Change</option>
                    <option value="closing">Closing</option>
                    <option value="hygiene">Hygiene</option>
                    <option value="safety">Food Safety</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as TaskPriority)}
                    style={{
                      width: '100%',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.55rem 0.65rem',
                      color: 'var(--text)',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Assigned Operational Role
                </label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="chef">Chef / Cook</option>
                  <option value="server">Server</option>
                  <option value="cleaner">Cleaner</option>
                  <option value="cashier">Cashier</option>
                  <option value="bartender">Bartender</option>
                  <option value="host">Host</option>
                  <option value="driver">Driver</option>
                  <option value="manager">Manager</option>
                  <option value="accountant">Accountant</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Detailed SOP Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Specific standards or steps required..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  style={{
                    padding: '0.55rem 1rem',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.55rem 1.25rem',
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                  }}
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
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            background: 'var(--surface)',
            width: '100%',
            maxWidth: '450px',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
              Sign Off Operational Task
            </h3>
            <form onSubmit={handleCompleteTask} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Signer Name (Digital Verification) *
                </label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Completion Observations
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Filters rinsed, quat test strips read 200ppm"
                  value={completionNotes}
                  onChange={e => setCompletionNotes(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCompletingTaskId(null)}
                  style={{
                    padding: '0.55rem 1rem',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.55rem 1.25rem',
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  }}
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
