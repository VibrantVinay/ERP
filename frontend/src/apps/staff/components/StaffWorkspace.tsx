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
      const [staffData, shiftData, attendData, payrollData] = await Promise.all([
        staffApi.getStaff(selectedRole),
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
      // Refresh attendance and payroll
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
    try {
      const created = await staffApi.createStaff(newStaff);
      setStaff(prev => [...prev, created]);
      setShowStaffModal(false);
      setNewStaff({ name: '', role: 'server', phone: '', email: '', hourlyWage: 200 });
      const pay = await staffApi.getPayrollSummary();
      setPayroll(pay);
    } catch (err: any) {
      alert('Failed to add staff: ' + err.message);
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

  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case 'chef': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'manager': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'owner': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'server': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'cashier': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'driver': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'cleaner': return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
      default: return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  // Selected staff status check
  const activeSession = attendance.find(a => a.staffId === selectedStaffId && !a.clockOut);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              👔
            </span>
            Staff, Shifts & Attendance
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time punch clock attendance, weekly station rostering & wage payroll readiness
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowShiftModal(true)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2"
          >
            <span>📅</span> Schedule Shift
          </button>
          <button
            onClick={() => setShowStaffModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-orange-950/40 flex items-center gap-2"
          >
            <span>+</span> Add Employee
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Clocked In Now</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-400">{payroll?.clockedInNow || 0}</span>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">Active on floor & kitchen</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Staff Team</p>
          <p className="text-2xl font-bold text-white mt-1">{payroll?.totalStaff || 0}</p>
          <p className="text-xs text-zinc-500 mt-1">Across 8 operational roles</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Hours Logged (Week)</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{payroll?.totalHoursWorked || 0}h</p>
          <p className="text-xs text-amber-400 mt-1">Overtime: {payroll?.totalOvertimeHours || 0}h</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Gross Payroll (Est.)</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">₹{payroll?.estimatedGrossPayroll.toLocaleString('en-IN') || 0}</p>
          <p className="text-xs text-zinc-500 mt-1">Based on hourly base + OT</p>
        </div>
      </div>

      {/* Interactive Punch Clock Terminal Widget */}
      <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>⏱️</span> Live Terminal Punch Clock (Clock-In / Clock-Out)
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Quick punch for on-duty staff arrivals and shift departures</p>
          </div>
          <span className="text-xs text-emerald-400 font-mono font-semibold">
            {new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select
            value={selectedStaffId}
            onChange={e => setSelectedStaffId(e.target.value)}
            className="w-full sm:w-72 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500 font-medium"
          >
            {staff.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.role} · ₹{s.hourlyWage}/h)
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-zinc-400">Break:</span>
            <input
              type="number"
              min="0"
              step="5"
              placeholder="Break mins"
              value={breakMinutes}
              onChange={e => setBreakMinutes(Number(e.target.value))}
              className="w-24 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 text-center"
            />
            <span className="text-xs text-zinc-500">mins</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!activeSession ? (
              <button
                onClick={() => handleClockPunch('clock_in')}
                className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2"
              >
                <span>🟢</span> Punch Clock-In
              </button>
            ) : (
              <button
                onClick={() => handleClockPunch('clock_out')}
                className="flex-1 sm:flex-none px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-950/40 transition-all flex items-center justify-center gap-2"
              >
                <span>🔴</span> Clock-Out (Active: {Math.round((Date.now() - new Date(activeSession.clockIn).getTime()) / 360000) / 10}h)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'attendance'
              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          ⏱️ Attendance & Clock Logs ({attendance.length})
        </button>
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'roster'
              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          📋 Weekly Shift Roster ({shifts.length})
        </button>
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'directory'
              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          👥 Staff Directory ({staff.length})
        </button>
      </div>

      {/* Main Tab Views */}
      {loading ? (
        <div className="p-12 text-center text-zinc-500 animate-pulse">Loading staff records...</div>
      ) : activeTab === 'attendance' ? (
        /* Attendance Table */
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 uppercase text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4">Break (mins)</th>
                <th className="py-3 px-4">Hours Worked</th>
                <th className="py-3 px-4">Overtime</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {attendance.map(a => (
                <tr key={a.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{a.staffName}</td>
                  <td className="py-3 px-4 text-zinc-400">{a.date}</td>
                  <td className="py-3 px-4 font-mono text-zinc-300">
                    {new Date(a.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-300">
                    {a.clockOut ? new Date(a.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '— In Session —'}
                  </td>
                  <td className="py-3 px-4">{a.breakMinutes}m</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">{a.hoursWorked}h</td>
                  <td className="py-3 px-4 text-amber-400">{a.overtimeHours > 0 ? `+${a.overtimeHours}h` : '0h'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${
                      a.status === 'Clocked In'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map(sh => (
            <div key={sh.id} className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{sh.staffName}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] border font-medium mt-1 inline-block ${getRoleBadge(sh.role)}`}>
                    {sh.role}
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-xs rounded-lg font-mono">
                  {sh.date}
                </span>
              </div>

              <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Shift Hours</span>
                  <span className="font-mono font-bold text-white">{sh.startTime} → {sh.endTime}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Station / Section</span>
                  <span className="font-medium text-orange-400">{sh.station}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-medium">● {sh.status}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Staff Directory Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map(s => (
            <div key={s.id} className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{s.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] border font-medium mt-1 inline-block ${getRoleBadge(s.role)}`}>
                    {s.role}
                  </span>
                </div>
                <span className="text-sm font-bold text-emerald-400">₹{s.hourlyWage}/h</span>
              </div>

              <div className="space-y-1 text-xs text-zinc-400">
                <p>📞 {s.phone}</p>
                <p>✉️ {s.email}</p>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-zinc-500">Status: {s.status}</span>
                <button
                  onClick={() => {
                    setSelectedStaffId(s.id);
                    setActiveTab('attendance');
                  }}
                  className="text-orange-400 hover:text-orange-300 font-medium"
                >
                  Punch Clock →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>👤</span> Add Team Member
              </h3>
              <button onClick={() => setShowStaffModal(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Full Name</label>
                <input
                  required
                  placeholder="e.g. Maya Shenoy"
                  value={newStaff.name}
                  onChange={e => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Operational Role</label>
                  <select
                    value={newStaff.role}
                    onChange={e => setNewStaff(prev => ({ ...prev, role: e.target.value as StaffRole }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  >
                    <option value="chef">Chef / Cook</option>
                    <option value="server">Server / Host</option>
                    <option value="cashier">Cashier</option>
                    <option value="bartender">Bartender</option>
                    <option value="driver">Delivery Driver</option>
                    <option value="cleaner">Table Busser / Cleaner</option>
                    <option value="manager">Manager</option>
                    <option value="accountant">Accountant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Hourly Wage (₹)</label>
                  <input
                    type="number"
                    required
                    value={newStaff.hourlyWage}
                    onChange={e => setNewStaff(prev => ({ ...prev, hourlyWage: Number(e.target.value) }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Phone Number</label>
                <input
                  required
                  placeholder="98200 88776"
                  value={newStaff.phone}
                  onChange={e => setNewStaff(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="maya@rift.example"
                  value={newStaff.email}
                  onChange={e => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-medium shadow-lg"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📅</span> Assign Work Shift
              </h3>
              <button onClick={() => setShowShiftModal(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateShift} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Staff Member</label>
                <select
                  required
                  value={newShift.staffId}
                  onChange={e => setNewShift(prev => ({ ...prev, staffId: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                >
                  <option value="">Select Employee...</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={newShift.date}
                  onChange={e => setNewShift(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newShift.startTime}
                    onChange={e => setNewShift(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={newShift.endTime}
                    onChange={e => setNewShift(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Station / Assignment</label>
                <input
                  required
                  placeholder="e.g. Hot Line Grill, Patio Section, Bar Counter"
                  value={newShift.station}
                  onChange={e => setNewShift(prev => ({ ...prev, station: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-medium shadow-lg"
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

