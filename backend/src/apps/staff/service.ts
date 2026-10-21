import { getDb } from '../../core/database';
import {
  StaffMember,
  ShiftSchedule,
  AttendanceRecord,
  CreateStaffMemberDto,
  CreateShiftDto,
  ClockPunchDto,
  PayrollSummary,
  StaffRole,
} from './types';
import { NotFoundError, ValidationError } from '../../core/errors';

export class StaffService {
  private schemaInitialized = false;

  public async initDatabaseSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;
    const db = getDb();
    const isSqlite = db.type === 'sqlite';

    const createStaffTable = isSqlite
      ? `CREATE TABLE IF NOT EXISTS staff_members (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          phone TEXT NOT NULL,
          email TEXT NOT NULL,
          hourly_wage REAL NOT NULL,
          branch_id TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      : `CREATE TABLE IF NOT EXISTS staff_members (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          role VARCHAR(32) NOT NULL,
          phone VARCHAR(32) NOT NULL,
          email VARCHAR(128) NOT NULL,
          hourly_wage NUMERIC(10, 2) NOT NULL,
          branch_id VARCHAR(64) NOT NULL,
          status VARCHAR(32) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`;

    const createShiftsTable = isSqlite
      ? `CREATE TABLE IF NOT EXISTS shift_schedules (
          id TEXT PRIMARY KEY,
          staff_id TEXT NOT NULL,
          staff_name TEXT NOT NULL,
          role TEXT NOT NULL,
          date TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          station TEXT NOT NULL,
          status TEXT NOT NULL,
          branch_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      : `CREATE TABLE IF NOT EXISTS shift_schedules (
          id VARCHAR(64) PRIMARY KEY,
          staff_id VARCHAR(64) NOT NULL,
          staff_name VARCHAR(128) NOT NULL,
          role VARCHAR(32) NOT NULL,
          date VARCHAR(32) NOT NULL,
          start_time VARCHAR(16) NOT NULL,
          end_time VARCHAR(16) NOT NULL,
          station VARCHAR(64) NOT NULL,
          status VARCHAR(32) NOT NULL,
          branch_id VARCHAR(64) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`;

    const createAttendanceTable = isSqlite
      ? `CREATE TABLE IF NOT EXISTS attendance_records (
          id TEXT PRIMARY KEY,
          staff_id TEXT NOT NULL,
          staff_name TEXT NOT NULL,
          date TEXT NOT NULL,
          clock_in TEXT NOT NULL,
          clock_out TEXT,
          break_minutes INTEGER DEFAULT 0,
          hours_worked REAL DEFAULT 0,
          overtime_hours REAL DEFAULT 0,
          status TEXT NOT NULL,
          branch_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      : `CREATE TABLE IF NOT EXISTS attendance_records (
          id VARCHAR(64) PRIMARY KEY,
          staff_id VARCHAR(64) NOT NULL,
          staff_name VARCHAR(128) NOT NULL,
          date VARCHAR(32) NOT NULL,
          clock_in VARCHAR(64) NOT NULL,
          clock_out VARCHAR(64),
          break_minutes INTEGER DEFAULT 0,
          hours_worked NUMERIC(5, 2) DEFAULT 0,
          overtime_hours NUMERIC(5, 2) DEFAULT 0,
          status VARCHAR(32) NOT NULL,
          branch_id VARCHAR(64) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`;

    await db.execute(createStaffTable);
    await db.execute(createShiftsTable);
    await db.execute(createAttendanceTable);

    const countRes = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM staff_members;`);
    if (Number(countRes[0]?.count || 0) === 0) {
      await this.seedInitialStaff();
    }
  }

  private async seedInitialStaff(): Promise<void> {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const staffSeed = [
      { id: 'stf_01', name: 'Aarav Mehta', role: 'owner', phone: '98201 11111', email: 'aarav@rift.example', hourlyWage: 500 },
      { id: 'stf_02', name: 'Mina D’Souza', role: 'manager', phone: '98201 22222', email: 'mina@rift.example', hourlyWage: 320 },
      { id: 'stf_03', name: 'Samira Khan', role: 'chef', phone: '98201 44444', email: 'samira@rift.example', hourlyWage: 280 },
      { id: 'stf_04', name: 'Ravi Naik', role: 'server', phone: '98201 55555', email: 'ravi@rift.example', hourlyWage: 180 },
      { id: 'stf_05', name: 'Neha Verma', role: 'cashier', phone: '98201 33333', email: 'neha@rift.example', hourlyWage: 200 },
      { id: 'stf_06', name: 'Kabir Shah', role: 'driver', phone: '98201 66666', email: 'kabir@rift.example', hourlyWage: 160 },
      { id: 'stf_07', name: 'Manoj Kumar', role: 'cleaner', phone: '98201 88888', email: 'manoj@rift.example', hourlyWage: 150 },
    ];

    for (const s of staffSeed) {
      await db.execute(
        `INSERT INTO staff_members (id, name, role, phone, email, hourly_wage, branch_id, status)
         VALUES (?, ?, ?, ?, ?, ?, 'branch-south-01', 'Active')`,
        [s.id, s.name, s.role, s.phone, s.email, s.hourlyWage]
      );
    }

    const shiftsSeed = [
      { id: 'shf_01', staffId: 'stf_03', staffName: 'Samira Khan', role: 'chef', date: today, startTime: '11:00', endTime: '22:00', station: 'Hot line & Expo', status: 'Scheduled' },
      { id: 'shf_02', staffId: 'stf_04', staffName: 'Ravi Naik', role: 'server', date: today, startTime: '12:00', endTime: '22:30', station: 'Floor Section A', status: 'Scheduled' },
      { id: 'shf_03', staffId: 'stf_05', staffName: 'Neha Verma', role: 'cashier', date: today, startTime: '12:00', endTime: '21:00', station: 'POS Counter 01', status: 'Scheduled' },
      { id: 'shf_04', staffId: 'stf_07', staffName: 'Manoj Kumar', role: 'cleaner', date: today, startTime: '14:00', endTime: '23:00', station: 'Floor Bussing & Sanitization', status: 'Scheduled' },
      { id: 'shf_05', staffId: 'stf_03', staffName: 'Samira Khan', role: 'chef', date: tomorrow, startTime: '11:00', endTime: '22:00', station: 'Hot line & Expo', status: 'Scheduled' },
    ];

    for (const sh of shiftsSeed) {
      await db.execute(
        `INSERT INTO shift_schedules (id, staff_id, staff_name, role, date, start_time, end_time, station, status, branch_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'branch-south-01')`,
        [sh.id, sh.staffId, sh.staffName, sh.role, sh.date, sh.startTime, sh.endTime, sh.station, sh.status]
      );
    }

    // Attendance (2 clocked in right now)
    const attendSeed = [
      {
        id: 'att_01',
        staffId: 'stf_03',
        staffName: 'Samira Khan',
        date: today,
        clockIn: new Date(Date.now() - 4.5 * 3600000).toISOString(),
        breakMinutes: 30,
        status: 'Clocked In',
      },
      {
        id: 'att_02',
        staffId: 'stf_04',
        staffName: 'Ravi Naik',
        date: today,
        clockIn: new Date(Date.now() - 3.2 * 3600000).toISOString(),
        breakMinutes: 15,
        status: 'Clocked In',
      },
    ];

    for (const a of attendSeed) {
      await db.execute(
        `INSERT INTO attendance_records (id, staff_id, staff_name, date, clock_in, break_minutes, status, branch_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'branch-south-01')`,
        [a.id, a.staffId, a.staffName, a.date, a.clockIn, a.breakMinutes, a.status]
      );
    }
  }

  public async getStaff(role?: string): Promise<StaffMember[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    let sql = `SELECT * FROM staff_members WHERE 1=1`;
    const params: any[] = [];
    if (role && role !== 'all') {
      sql += ` AND LOWER(role) = LOWER(?)`;
      params.push(role);
    }
    sql += ` ORDER BY name ASC;`;
    const rows = await db.query<any>(sql, params);
    return rows.map(r => this.hydrateStaff(r));
  }

  public async createStaff(dto: CreateStaffMemberDto): Promise<StaffMember> {
    await this.initDatabaseSchema();
    const db = getDb();
    const id = `stf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const branchId = dto.branchId || 'branch-south-01';
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO staff_members (id, name, role, phone, email, hourly_wage, branch_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', ?)`,
      [id, dto.name, dto.role, dto.phone, dto.email, dto.hourlyWage, branchId, now]
    );

    const rows = await db.query<any>(`SELECT * FROM staff_members WHERE id = ? LIMIT 1;`, [id]);
    return this.hydrateStaff(rows[0]);
  }

  public async getShifts(date?: string): Promise<ShiftSchedule[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    let sql = `SELECT * FROM shift_schedules WHERE 1=1`;
    const params: any[] = [];
    if (date) {
      sql += ` AND date = ?`;
      params.push(date);
    }
    sql += ` ORDER BY date ASC, start_time ASC;`;
    const rows = await db.query<any>(sql, params);
    return rows.map(r => this.hydrateShift(r));
  }

  public async createShift(dto: CreateShiftDto): Promise<ShiftSchedule> {
    await this.initDatabaseSchema();
    const db = getDb();
    const staffRows = await db.query<any>(`SELECT * FROM staff_members WHERE id = ? LIMIT 1;`, [dto.staffId]);
    if (staffRows.length === 0) throw new NotFoundError(`Staff member '${dto.staffId}' not found`);
    const staff = this.hydrateStaff(staffRows[0]);

    const id = `shf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const branchId = dto.branchId || 'branch-south-01';

    await db.execute(
      `INSERT INTO shift_schedules (id, staff_id, staff_name, role, date, start_time, end_time, station, status, branch_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled', ?)`,
      [id, staff.id, staff.name, staff.role, dto.date, dto.startTime, dto.endTime, dto.station, branchId]
    );

    const rows = await db.query<any>(`SELECT * FROM shift_schedules WHERE id = ? LIMIT 1;`, [id]);
    return this.hydrateShift(rows[0]);
  }

  public async getAttendance(date?: string): Promise<AttendanceRecord[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    let sql = `SELECT * FROM attendance_records WHERE 1=1`;
    const params: any[] = [];
    if (date) {
      sql += ` AND date = ?`;
      params.push(date);
    }
    sql += ` ORDER BY clock_in DESC;`;
    const rows = await db.query<any>(sql, params);
    return rows.map(r => this.hydrateAttendance(r));
  }

  public async clockPunch(dto: ClockPunchDto): Promise<AttendanceRecord> {
    await this.initDatabaseSchema();
    const db = getDb();
    const staffRows = await db.query<any>(`SELECT * FROM staff_members WHERE id = ? LIMIT 1;`, [dto.staffId]);
    if (staffRows.length === 0) throw new NotFoundError(`Staff member '${dto.staffId}' not found`);
    const staff = this.hydrateStaff(staffRows[0]);

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    if (dto.action === 'clock_in') {
      const active = await db.query<any>(
        `SELECT * FROM attendance_records WHERE staff_id = ? AND date = ? AND clock_out IS NULL LIMIT 1;`,
        [staff.id, today]
      );
      if (active.length > 0) {
        throw new ValidationError(`${staff.name} is already clocked in today.`);
      }

      const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await db.execute(
        `INSERT INTO attendance_records (id, staff_id, staff_name, date, clock_in, break_minutes, status, branch_id)
         VALUES (?, ?, ?, ?, ?, ?, 'Clocked In', 'branch-south-01')`,
        [id, staff.id, staff.name, today, now, dto.breakMinutes || 0]
      );

      const rows = await db.query<any>(`SELECT * FROM attendance_records WHERE id = ? LIMIT 1;`, [id]);
      return this.hydrateAttendance(rows[0]);
    } else {
      // Clock out
      const active = await db.query<any>(
        `SELECT * FROM attendance_records WHERE staff_id = ? AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1;`,
        [staff.id]
      );
      if (active.length === 0) {
        throw new ValidationError(`${staff.name} does not have an active clock-in session.`);
      }

      const record = active[0];
      const inTime = new Date(record.clock_in).getTime();
      const outTime = new Date(now).getTime();
      const totalMinutes = Math.max(0, (outTime - inTime) / 60000 - Number(record.break_minutes || 0));
      const hoursWorked = Math.round((totalMinutes / 60) * 10) / 10;
      const overtimeHours = Math.max(0, Math.round((hoursWorked - 8) * 10) / 10);

      await db.execute(
        `UPDATE attendance_records SET
          clock_out = ?,
          hours_worked = ?,
          overtime_hours = ?,
          status = 'Present'
         WHERE id = ?`,
        [now, hoursWorked, overtimeHours, record.id]
      );

      const rows = await db.query<any>(`SELECT * FROM attendance_records WHERE id = ? LIMIT 1;`, [record.id]);
      return this.hydrateAttendance(rows[0]);
    }
  }

  public async getPayrollSummary(): Promise<PayrollSummary> {
    await this.initDatabaseSchema();
    const db = getDb();
    const staff = await this.getStaff();
    const attendance = await this.getAttendance();

    let clockedInNow = 0;
    let totalHoursWorked = 0;
    let totalOvertimeHours = 0;
    let estimatedGrossPayroll = 0;

    for (const a of attendance) {
      if (!a.clockOut) clockedInNow += 1;
      totalHoursWorked += a.hoursWorked;
      totalOvertimeHours += a.overtimeHours;

      const member = staff.find(s => s.id === a.staffId);
      const wage = member?.hourlyWage || 200;
      estimatedGrossPayroll += a.hoursWorked * wage + a.overtimeHours * (wage * 0.5);
    }

    return {
      totalStaff: staff.length,
      clockedInNow,
      totalHoursWorked: Math.round(totalHoursWorked * 10) / 10,
      totalOvertimeHours: Math.round(totalOvertimeHours * 10) / 10,
      estimatedGrossPayroll: Math.round(estimatedGrossPayroll),
      period: 'Current Work Week',
    };
  }

  private hydrateStaff(row: any): StaffMember {
    return {
      id: row.id,
      name: row.name,
      role: row.role as StaffRole,
      phone: row.phone,
      email: row.email,
      hourlyWage: Number(row.hourly_wage),
      branchId: row.branch_id,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  private hydrateShift(row: any): ShiftSchedule {
    return {
      id: row.id,
      staffId: row.staff_id,
      staffName: row.staff_name,
      role: row.role as StaffRole,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      station: row.station,
      status: row.status,
      branchId: row.branch_id,
      createdAt: row.created_at,
    };
  }

  private hydrateAttendance(row: any): AttendanceRecord {
    return {
      id: row.id,
      staffId: row.staff_id,
      staffName: row.staff_name,
      date: row.date,
      clockIn: row.clock_in,
      clockOut: row.clock_out || undefined,
      breakMinutes: Number(row.break_minutes || 0),
      hoursWorked: Number(row.hours_worked || 0),
      overtimeHours: Number(row.overtime_hours || 0),
      status: row.status,
      branchId: row.branch_id,
      createdAt: row.created_at,
    };
  }
}

export const staffService = new StaffService();
