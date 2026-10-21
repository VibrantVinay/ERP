import { apiClient } from '../../core/api-client';
import { StaffMember, ShiftSchedule, AttendanceRecord, CreateStaffMemberDto, CreateShiftDto, ClockPunchDto, PayrollSummary } from './types';

export const staffApi = {
  async getStaff(role?: string): Promise<StaffMember[]> {
    const params = new URLSearchParams();
    if (role && role !== 'all') params.append('role', role);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await apiClient.get<StaffMember[]>(`/staff${qs}`);
    return res.data;
  },

  async createStaff(dto: CreateStaffMemberDto): Promise<StaffMember> {
    const res = await apiClient.post<StaffMember>('/staff', dto);
    return res.data;
  },

  async getShifts(date?: string): Promise<ShiftSchedule[]> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await apiClient.get<ShiftSchedule[]>(`/staff/shifts${qs}`);
    return res.data;
  },

  async createShift(dto: CreateShiftDto): Promise<ShiftSchedule> {
    const res = await apiClient.post<ShiftSchedule>('/staff/shifts', dto);
    return res.data;
  },

  async getAttendance(date?: string): Promise<AttendanceRecord[]> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await apiClient.get<AttendanceRecord[]>(`/staff/attendance${qs}`);
    return res.data;
  },

  async clockPunch(dto: ClockPunchDto): Promise<AttendanceRecord> {
    const res = await apiClient.post<AttendanceRecord>('/staff/attendance/clock', dto);
    return res.data;
  },

  async getPayrollSummary(): Promise<PayrollSummary> {
    const res = await apiClient.get<PayrollSummary>('/staff/payroll-summary');
    return res.data;
  },
};
