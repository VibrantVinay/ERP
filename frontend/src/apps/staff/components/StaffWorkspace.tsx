'use client';

import React, { useState, useEffect } from 'react';
import { staffApi } from '../api';
import { StaffMember, ShiftSchedule, AttendanceRecord, PayrollSummary, StaffRole, CreateStaffMemberDto, CreateShiftDto } from '../types';

export const StaffWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'roster' | 'directory'>('attendance');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [shifts, setShifts] = useState<ShiftSchedule[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payroll, setPayroll] = useState<PayrollSummary | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Punch Clock State
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [breakMinutes, setBreakMinutes] = useState(0);

  // Modals
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);

  // New Staff Form
  const [newStaff, setNewStaff] = useState<CreateStaffMemberDto>({
    name: '',
    role: 'server',
    phone: '',
    email: '',
    hourlyWage: 200,
  });

  // New Shift Form
  const [newShift, setNewShift] = useState<CreateShiftDto>({
    staffId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '12:00',
    endTime: '22:00',
    station: 'Main Floor Section A',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [staffData, shiftData, attendData, payrollData] = await Promise.all([
        staffApi.getStaff(selectedRole !== 'all' ? selectedRole : undefined),
        staffApi.getShifts(),
        staffApi.getAttendance(),
        staffApi.getPayrollSummary(),
      ]);
      setStaff(staffData || []);
      setShifts(shiftData || []);
      setAttendance(attendData || []);
      setPayroll(payrollData || null);
      if (staffData && staffData.length > 0 && !selectedStaffId) {
        setSelectedStaffId(staffData[0].id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load staff records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedRole]);

  const handleClockPunch = async (action: 'clock_in' | 'clock_out') => {
    if (!selectedStaffId) {
      alert('Please select a staff member first');
      return;
    }
    try {
      await staffApi.clockPunch({
        staffId: selectedStaffId,
        action,
        breakMinutes,
      });
      const [attendData, payrollData] = await Promise.all([
        staffApi.getAttendance(),
        staffApi.getPayrollSummary(),
      ]);
      setAttendance(attendData);
      setPayroll(payrollData);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name.trim() || !newStaff.phone.trim()) {
      alert('Please enter staff name and phone');
      return;
    }
    try {
      const created = await staffApi.createStaff(newStaff);
      setStaff(prev => [...prev, created]);
      setShowStaffModal(false);
      setNewStaff({ name: '', role: 'server', phone: '', email: '', hourlyWage: 200 });
      const pay = await staffApi.getPayrollSummary();
      setPayroll(pay);
    } catch (err: any) {
      alert('Failed to register employee: ' + err.message);
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShift.staffId) {
      alert('Please select a staff member for the shift');
      return;
    }
    try {
      const created = await staffApi.createShift(newShift);
      setShifts(prev => [...prev, created]);
      setShowShiftModal(false);
    } catch (err: any) {
      alert('Failed to schedule shift: ' + err.message);
    }
  };

  const getRoleStyle = (role: StaffRole): { bg: string; color: string; border: string } => {
    switch (role) {
      case 'chef':
        return { bg: 'rgba(249, 115, 22, 0.12)', color: '#f97316', border: 'rgba(249, 115, 22, 0.3)' };
      case 'manager':
        return { bg: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
      case 'owner':
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
      case 'server':
        return { bg: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
      case 'cashier':
        return { bg: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
      case 'driver':
        return { bg: 'rgba(6, 182, 212, 0.12)', color: '#22d3ee', border: 'rgba(6, 182, 212, 0.3)' };
      case 'cleaner':
        return { bg: 'rgba(20, 184, 166, 0.12)', color: '#2dd4bf', border: 'rgba(20, 184, 166, 0.3)' };
      case 'bartender':
        return { bg: 'rgba(236, 72, 153, 0.12)', color: '#f472b6', border: 'rgba(236, 72, 153, 0.3)' };
      case 'host':
        return { bg: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa', border: 'rgba(139, 92, 246, 0.3)' };
      case 'accountant':
        return { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      default:
        return { bg: 'var(--surface-muted)', color: 'var(--text-muted)', border: 'var(--border)' };
    }
  };

  const activeSession = attendance.find(a => a.staffId === selectedStaffId && !a.clockOut);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', minHeight: '100%' }}>
      {/* Top Header */}
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
            background: 'rgba(168, 85, 247, 0.12)',
            color: '#a855f7',
            fontSize: '1.25rem',
            border: '1px solid rgba(168, 85, 247, 0.25)',
          }}>
            👔
          </span>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              Staff, Shifts & Attendance
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Real-time terminal punch clock, weekly roster management, and automated wage payroll calculation
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setShowShiftModal(true)}
            style={{
              padding: '0.6rem 1.1rem',
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>📅</span> Schedule Shift
          </button>
          <button
            onClick={() => setShowStaffModal(true)}
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
            <span>+</span> Add Employee
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
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
            Clocked In Now
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.35rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>
              {payroll?.clockedInNow || 0}
            </span>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981',
            }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Active on floor & kitchen
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
            Total Staff Team
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', margin: '0.35rem 0 0.15rem' }}>
            {payroll?.totalStaff || staff.length}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Across 10 restaurant roles
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
            Hours Logged (Week)
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#60a5fa', margin: '0.35rem 0 0.15rem' }}>
            {payroll?.totalHoursWorked || 0}h
          </p>
          <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 500 }}>
            Overtime: {payroll?.totalOvertimeHours || 0}h
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
            Estimated Payroll
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', margin: '0.35rem 0 0.15rem' }}>
            ₹{payroll?.estimatedGrossPayroll.toLocaleString('en-IN') || 0}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Base rate + overtime compensation
          </span>
        </div>
      </div>

      {/* Interactive Punch Clock Terminal Widget */}
      <div style={{
        padding: '1.25rem',
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0.75rem',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⏱️</span> Live Terminal Punch Clock (Clock-In / Clock-Out)
            </h3>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Quick punch terminal for shift arrivals, scheduled breaks, and departures
            </p>
          </div>
          <span style={{
            fontSize: '0.8rem',
            color: '#10b981',
            fontFamily: 'monospace',
            fontWeight: 600,
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '0.2rem 0.6rem',
            borderRadius: 'var(--radius-sm)',
          }}>
            {new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <select
            value={selectedStaffId}
            onChange={e => setSelectedStaffId(e.target.value)}
            style={{
              flex: '1 1 240px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.55rem 0.75rem',
              color: 'var(--text)',
              fontSize: '0.85rem',
              outline: 'none',
              fontWeight: 500,
            }}
          >
            {staff.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.role} · ₹{s.hourlyWage}/h)
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Break:</span>
            <input
              type="number"
              min="0"
              step="5"
              placeholder="Break mins"
              value={breakMinutes}
              onChange={e => setBreakMinutes(Number(e.target.value))}
              style={{
                width: '75px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem 0.5rem',
                color: 'var(--text)',
                fontSize: '0.85rem',
                textAlign: 'center',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>mins</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!activeSession ? (
              <button
                onClick={() => handleClockPunch('clock_in')}
                style={{
                  padding: '0.55rem 1.25rem',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                }}
              >
                <span>🟢</span> Punch Clock-In
              </button>
            ) : (
              <button
                onClick={() => handleClockPunch('clock_out')}
                style={{
                  padding: '0.55rem 1.25rem',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                }}
              >
                <span>🔴</span> Clock-Out (Active: {Math.round((Date.now() - new Date(activeSession.clockIn).getTime()) / 360000) / 10}h)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('attendance')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'attendance' ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid transparent',
              background: activeTab === 'attendance' ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
              color: activeTab === 'attendance' ? '#f97316' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            ⏱️ Attendance Logs ({attendance.length})
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'roster' ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid transparent',
              background: activeTab === 'roster' ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
              color: activeTab === 'roster' ? '#f97316' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            📋 Weekly Roster ({shifts.length})
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'directory' ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid transparent',
              background: activeTab === 'directory' ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
              color: activeTab === 'directory' ? '#f97316' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            👥 Staff Directory ({staff.length})
          </button>
        </div>

        {activeTab === 'directory' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Role Filter:</span>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
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
              <option value="all">All Roles</option>
              <option value="chef">Chef / Cook</option>
              <option value="server">Server</option>
              <option value="cashier">Cashier</option>
              <option value="bartender">Bartender</option>
              <option value="host">Host</option>
              <option value="driver">Driver</option>
              <option value="cleaner">Cleaner</option>
              <option value="manager">Manager</option>
              <option value="accountant">Accountant</option>
              <option value="owner">Owner</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Tab Views */}
      {loading ? (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
        }}>
          Loading staff and attendance records...
        </div>
      ) : activeTab === 'attendance' ? (
        /* Attendance Table */
        <div style={{
          overflowX: 'auto',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Staff Member</th>
                <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                <th style={{ padding: '0.75rem 1rem' }}>Clock In</th>
                <th style={{ padding: '0.75rem 1rem' }}>Clock Out</th>
                <th style={{ padding: '0.75rem 1rem' }}>Break (mins)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Hours Worked</th>
                <th style={{ padding: '0.75rem 1rem' }}>Overtime</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((a, idx) => (
                <tr
                  key={a.id}
                  style={{
                    borderBottom: idx === attendance.length - 1 ? 'none' : '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                >
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{a.staffName}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{a.date}</td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>
                    {new Date(a.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>
                    {a.clockOut ? (
                      new Date(a.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    ) : (
                      <span style={{ color: '#10b981', fontWeight: 600 }}>— Active Now —</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{a.breakMinutes}m</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#10b981' }}>{a.hoursWorked}h</td>
                  <td style={{ padding: '0.75rem 1rem', color: a.overtimeHours > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                    {a.overtimeHours > 0 ? `+${a.overtimeHours}h` : '0h'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      background: a.status === 'Clocked In' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg)',
                      color: a.status === 'Clocked In' ? '#10b981' : 'var(--text-muted)',
                      border: a.status === 'Clocked In' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border)',
                    }}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'roster' ? (
        /* Shift Roster Cards */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}>
          {shifts.map(sh => {
            const roleStyle = getRoleStyle(sh.role);
            return (
              <div
                key={sh.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                      {sh.staffName}
                    </h3>
                    <span style={{
                      display: 'inline-block',
                      margin: '0.25rem 0 0',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      background: roleStyle.bg,
                      color: roleStyle.color,
                      border: `1px solid ${roleStyle.border}`,
                    }}>
                      {sh.role}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.5rem',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-muted)',
                  }}>
                    {sh.date}
                  </span>
                </div>

                <div style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  fontSize: '0.8rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Shift Hours</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text)' }}>
                      {sh.startTime} → {sh.endTime}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Station / Area</span>
                    <span style={{ fontWeight: 600, color: '#f97316' }}>{sh.station}</span>
                  </div>
                </div>

                <div style={{
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem',
                }}>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>● {sh.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Staff Directory Grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}>
          {staff.map(s => {
            const roleStyle = getRoleStyle(s.role);
            return (
              <div
                key={s.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                      {s.name}
                    </h3>
                    <span style={{
                      display: 'inline-block',
                      margin: '0.25rem 0 0',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      background: roleStyle.bg,
                      color: roleStyle.color,
                      border: `1px solid ${roleStyle.border}`,
                    }}>
                      {s.role}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10b981' }}>
                    ₹{s.hourlyWage}/h
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <p style={{ margin: 0 }}>📞 {s.phone}</p>
                  <p style={{ margin: 0 }}>✉️ {s.email}</p>
                </div>

                <div style={{
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem',
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status: {s.status}</span>
                  <button
                    onClick={() => {
                      setSelectedStaffId(s.id);
                      setActiveTab('attendance');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f97316',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                    }}
                  >
                    Punch Clock →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Staff Modal */}
      {showStaffModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
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
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '460px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>👤</span> Register Team Member
              </h3>
              <button
                onClick={() => setShowStaffModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Full Name *
                </label>
                <input
                  required
                  placeholder="e.g. Maya Shenoy"
                  value={newStaff.name}
                  onChange={e => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
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
                    Role *
                  </label>
                  <select
                    value={newStaff.role}
                    onChange={e => setNewStaff(prev => ({ ...prev, role: e.target.value as StaffRole }))}
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
                    <option value="chef">Chef / Cook</option>
                    <option value="server">Server</option>
                    <option value="cashier">Cashier</option>
                    <option value="bartender">Bartender</option>
                    <option value="host">Host</option>
                    <option value="driver">Delivery Driver</option>
                    <option value="cleaner">Table Busser / Cleaner</option>
                    <option value="manager">Manager</option>
                    <option value="accountant">Accountant</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Hourly Wage (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={newStaff.hourlyWage}
                    onChange={e => setNewStaff(prev => ({ ...prev, hourlyWage: Number(e.target.value) }))}
                    style={{
                      width: '100%',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.55rem 0.65rem',
                      color: 'var(--text)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Phone Number *
                </label>
                <input
                  required
                  placeholder="98200 88776"
                  value={newStaff.phone}
                  onChange={e => setNewStaff(prev => ({ ...prev, phone: e.target.value }))}
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
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="staff@rift.example"
                  value={newStaff.email}
                  onChange={e => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  style={{
                    padding: '0.55rem 1rem',
                    background: 'transparent',
                    border: '1px solid var(--border)',
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
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                  }}
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Shift Modal */}
      {showShiftModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
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
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '460px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📅</span> Assign Work Shift
              </h3>
              <button
                onClick={() => setShowShiftModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateShift} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Staff Member *
                </label>
                <select
                  required
                  value={newShift.staffId}
                  onChange={e => setNewShift(prev => ({ ...prev, staffId: e.target.value }))}
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
                  <option value="">Select Employee...</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Shift Date *
                </label>
                <input
                  type="date"
                  required
                  value={newShift.date}
                  onChange={e => setNewShift(prev => ({ ...prev, date: e.target.value }))}
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
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={newShift.startTime}
                    onChange={e => setNewShift(prev => ({ ...prev, startTime: e.target.value }))}
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
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={newShift.endTime}
                    onChange={e => setNewShift(prev => ({ ...prev, endTime: e.target.value }))}
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
                  Station / Assignment *
                </label>
                <input
                  required
                  placeholder="e.g. Hot Line Grill, Patio Section A, Bar Counter"
                  value={newShift.station}
                  onChange={e => setNewShift(prev => ({ ...prev, station: e.target.value }))}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  style={{
                    padding: '0.55rem 1rem',
                    background: 'transparent',
                    border: '1px solid var(--border)',
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
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                  }}
                >
                  Schedule Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
