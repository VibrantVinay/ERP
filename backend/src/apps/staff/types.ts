export type StaffRole =
  | 'chef'
  | 'server'
  | 'cashier'
  | 'driver'
  | 'manager'
  | 'owner'
  | 'cleaner'
  | 'accountant'
  | 'bartender';

export type EmploymentStatus = 'Active' | 'On Leave' | 'Terminated';
export type ShiftStatus = 'Scheduled' | 'Completed' | 'Absent' | 'Swapped';
export type AttendanceStatus = 'Clocked In' | 'Present' | 'Late' | 'Half Day';

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  phone: string;
  email: string;
  hourlyWage: number;
  branchId: string;
  status: EmploymentStatus;
  createdAt: string;
}

export interface ShiftSchedule {
  id: string;
  staffId: string;
  staffName: string;
  role: StaffRole;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  station: string;
  status: ShiftStatus;
  branchId: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  breakMinutes: number;
  hoursWorked: number;
  overtimeHours: number;
  status: AttendanceStatus;
  branchId: string;
  createdAt: string;
}

export interface CreateStaffMemberDto {
  name: string;
  role: StaffRole;
  phone: string;
  email: string;
  hourlyWage: number;
  branchId?: string;
}

export interface CreateShiftDto {
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  station: string;
  branchId?: string;
}

export interface ClockPunchDto {
  staffId: string;
  action: 'clock_in' | 'clock_out';
  breakMinutes?: number;
  branchId?: string;
}

export interface PayrollSummary {
  totalStaff: number;
  clockedInNow: number;
  totalHoursWorked: number;
  totalOvertimeHours: number;
  estimatedGrossPayroll: number;
  period: string;
}
