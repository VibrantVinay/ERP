import { getDb } from '../../core/database';
import { OperationalTask, TemperatureLog, CreateTaskDTO, CompleteTaskDTO, LogTemperatureDTO } from './types';

export class TasksService {
  private schemaInitialized = false;

  public async initDatabaseSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;

    const db = getDb();

    // Table: operational_tasks
    await db.execute(`
      CREATE TABLE IF NOT EXISTS operational_tasks (
        id VARCHAR(50) PRIMARY KEY,
        branch_id VARCHAR(50) NOT NULL,
        category VARCHAR(30) NOT NULL,
        title VARCHAR(150) NOT NULL,
        description TEXT,
        assigned_role VARCHAR(50) NOT NULL DEFAULT 'chef',
        assigned_staff_name VARCHAR(100),
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        priority VARCHAR(20) NOT NULL DEFAULT 'medium',
        due_date VARCHAR(30) NOT NULL,
        completed_at VARCHAR(30),
        completed_by VARCHAR(100),
        notes TEXT,
        created_at VARCHAR(30) NOT NULL,
        updated_at VARCHAR(30) NOT NULL
      )
    `);

    // Table: temperature_logs
    await db.execute(`
      CREATE TABLE IF NOT EXISTS temperature_logs (
        id VARCHAR(50) PRIMARY KEY,
        branch_id VARCHAR(50) NOT NULL,
        unit_name VARCHAR(100) NOT NULL,
        target_min_temp REAL NOT NULL,
        target_max_temp REAL NOT NULL,
        recorded_temp REAL NOT NULL,
        unit VARCHAR(5) NOT NULL DEFAULT 'C',
        is_out_of_range INTEGER NOT NULL DEFAULT 0,
        recorded_by VARCHAR(100) NOT NULL,
        notes TEXT,
        recorded_at VARCHAR(30) NOT NULL
      )
    `);

    await this.seedInitialData();
  }

  private async seedInitialData(): Promise<void> {
    const db = getDb();
    const existingTasks = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM operational_tasks`);
    const count = Number(existingTasks[0]?.count || 0);

    if (count === 0) {
      const now = new Date().toISOString();
      const today = now.slice(0, 10);

      // Seed tasks
      const sampleTasks = [
        {
          id: 'task-101',
          branchId: 'main-branch',
          category: 'opening',
          title: 'Morning Kitchen Line Calibration & Prep Check',
          description: 'Turn on exhaust hoods, calibrate digital probes, ensure sanitation buckets are at 200ppm quat.',
          assignedRole: 'chef',
          assignedStaffName: 'Chef Roberto Gomez',
          status: 'completed',
          priority: 'high',
          dueDate: `${today}T08:00:00Z`,
          completedAt: `${today}T07:45:00Z`,
          completedBy: 'Chef Roberto Gomez',
          notes: 'All burners operational. Sanitizer fresh at 200ppm.',
        },
        {
          id: 'task-102',
          branchId: 'main-branch',
          category: 'safety',
          title: 'Walk-in Chiller Temperature & Cross-Contamination Audit',
          description: 'Ensure raw poultry is on lowest shelf; probe internal air temp is ≤ 4°C.',
          assignedRole: 'chef',
          assignedStaffName: 'Chef Roberto Gomez',
          status: 'completed',
          priority: 'critical',
          dueDate: `${today}T10:00:00Z`,
          completedAt: `${today}T09:30:00Z`,
          completedBy: 'Chef Roberto Gomez',
          notes: 'Storage hierarchy verified. Raw proteins sealed and dated.',
        },
        {
          id: 'task-103',
          branchId: 'main-branch',
          category: 'shift_change',
          title: 'Midday Prep Station Wipe Down & Handwash Restock',
          description: 'Restock paper towels, antibacterial soap, and sanitize cutting boards.',
          assignedRole: 'cleaner',
          assignedStaffName: 'Marcus Vance',
          status: 'in_progress',
          priority: 'medium',
          dueDate: `${today}T15:00:00Z`,
          completedAt: null,
          completedBy: null,
          notes: 'Soap dispensers refilled at line stations.',
        },
        {
          id: 'task-104',
          branchId: 'main-branch',
          category: 'closing',
          title: 'End of Day Deep Fryer Boil-Out & Oil Filtration',
          description: 'Drain fry oil through micron filter. Scrub heating elements and wipe down exterior grease trays.',
          assignedRole: 'chef',
          assignedStaffName: 'Chef Roberto Gomez',
          status: 'pending',
          priority: 'high',
          dueDate: `${today}T23:30:00Z`,
          completedAt: null,
          completedBy: null,
          notes: null,
        },
        {
          id: 'task-105',
          branchId: 'main-branch',
          category: 'hygiene',
          title: 'Ice Machine Bin Clean & Descale Inspection',
          description: 'Empty ice hopper, sanitize scoop holder with food-grade sanitizing solution.',
          assignedRole: 'server',
          assignedStaffName: 'Elena Rostova',
          status: 'pending',
          priority: 'medium',
          dueDate: `${today}T22:00:00Z`,
          completedAt: null,
          completedBy: null,
          notes: null,
        },
      ];

      for (const t of sampleTasks) {
        await db.execute(
          `INSERT INTO operational_tasks (
            id, branch_id, category, title, description, assigned_role,
            assigned_staff_name, status, priority, due_date, completed_at,
            completed_by, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            t.id, t.branchId, t.category, t.title, t.description, t.assignedRole,
            t.assignedStaffName, t.status, t.priority, t.dueDate, t.completedAt,
            t.completedBy, t.notes, now, now
          ]
        );
      }

      // Seed standard refrigeration logs
      const sampleLogs = [
        {
          id: 'temp-101',
          branchId: 'main-branch',
          unitName: 'Walk-in Chiller #1 (Dairy & Produce)',
          targetMin: 1.0,
          targetMax: 4.0,
          recordedTemp: 2.8,
          unit: 'C',
          outOfRange: 0,
          by: 'Chef Roberto Gomez',
          notes: 'Normal cooling cycle active.',
          time: `${today}T07:30:00Z`,
        },
        {
          id: 'temp-102',
          branchId: 'main-branch',
          unitName: 'Deep Freeze Vault (Meats & Seafood)',
          targetMin: -24.0,
          targetMax: -18.0,
          recordedTemp: -20.5,
          unit: 'C',
          outOfRange: 0,
          by: 'Chef Roberto Gomez',
          notes: 'Defrost cycle completed overnight, temperatures rock solid.',
          time: `${today}T07:35:00Z`,
        },
        {
          id: 'temp-103',
          branchId: 'main-branch',
          unitName: 'Saute Line Under-counter Chiller',
          targetMin: 0.5,
          targetMax: 4.0,
          recordedTemp: 5.6,
          unit: 'C',
          outOfRange: 1,
          by: 'Elena Rostova',
          notes: 'Gasket door left slightly ajar during heavy rush. Reset door seal and monitored.',
          time: `${today}T12:15:00Z`,
        },
        {
          id: 'temp-104',
          branchId: 'main-branch',
          unitName: 'Hot Holding Bain-Marie (Soups & Sauces)',
          targetMin: 63.0,
          targetMax: 85.0,
          recordedTemp: 74.2,
          unit: 'C',
          outOfRange: 0,
          by: 'Chef Roberto Gomez',
          notes: 'Broth and demiglace maintained at safety temp.',
          time: `${today}T12:20:00Z`,
        },
      ];

      for (const l of sampleLogs) {
        await db.execute(
          `INSERT INTO temperature_logs (
            id, branch_id, unit_name, target_min_temp, target_max_temp,
            recorded_temp, unit, is_out_of_range, recorded_by, notes, recorded_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            l.id, l.branchId, l.unitName, l.targetMin, l.targetMax,
            l.recordedTemp, l.unit, l.outOfRange, l.by, l.notes, l.time
          ]
        );
      }
    }
  }

  public async getTasks(branchId?: string, category?: string, status?: string): Promise<OperationalTask[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    let query = `SELECT * FROM operational_tasks WHERE 1=1`;
    const params: any[] = [];

    if (branchId) {
      query += ` AND branch_id = ?`;
      params.push(branchId);
    }
    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }
    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY due_date ASC, created_at DESC`;
    const rows = await db.query<any>(query, params);

    return rows.map((r: any) => ({
      id: r.id,
      branchId: r.branch_id,
      category: r.category,
      title: r.title,
      description: r.description || undefined,
      assignedRole: r.assigned_role,
      assignedStaffName: r.assigned_staff_name || undefined,
      status: r.status,
      priority: r.priority,
      dueDate: r.due_date,
      completedAt: r.completed_at || undefined,
      completedBy: r.completed_by || undefined,
      notes: r.notes || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  public async createTask(dto: CreateTaskDTO): Promise<OperationalTask> {
    await this.initDatabaseSchema();
    const db = getDb();
    const now = new Date().toISOString();
    const id = `task-${Date.now()}`;
    const dueDate = dto.dueDate || now;

    await db.execute(
      `INSERT INTO operational_tasks (
        id, branch_id, category, title, description, assigned_role,
        assigned_staff_name, status, priority, due_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [
        id,
        dto.branchId || 'main-branch',
        dto.category,
        dto.title,
        dto.description || null,
        dto.assignedRole || 'chef',
        dto.assignedStaffName || null,
        dto.priority || 'medium',
        dueDate,
        now,
        now,
      ]
    );

    const tasks = await this.getTasks(dto.branchId || 'main-branch');
    const created = tasks.find(t => t.id === id);
    if (!created) throw new Error('Task creation failed');
    return created;
  }

  public async completeTask(id: string, dto: CompleteTaskDTO): Promise<OperationalTask> {
    await this.initDatabaseSchema();
    const db = getDb();
    const now = new Date().toISOString();
    const status = dto.status || 'completed';

    await db.execute(
      `UPDATE operational_tasks SET
        status = ?,
        completed_at = ?,
        completed_by = ?,
        notes = COALESCE(?, notes),
        updated_at = ?
      WHERE id = ?`,
      [status, status === 'completed' ? now : null, dto.completedBy, dto.notes || null, now, id]
    );

    const rows = await db.query<any>(`SELECT * FROM operational_tasks WHERE id = ?`, [id]);
    const r = rows[0];
    if (!r) throw new Error(`Task ${id} not found`);

    return {
      id: r.id,
      branchId: r.branch_id,
      category: r.category,
      title: r.title,
      description: r.description || undefined,
      assignedRole: r.assigned_role,
      assignedStaffName: r.assigned_staff_name || undefined,
      status: r.status,
      priority: r.priority,
      dueDate: r.due_date,
      completedAt: r.completed_at || undefined,
      completedBy: r.completed_by || undefined,
      notes: r.notes || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  public async logTemperature(dto: LogTemperatureDTO): Promise<TemperatureLog> {
    await this.initDatabaseSchema();
    const db = getDb();
    const now = new Date().toISOString();
    const id = `temp-${Date.now()}`;

    const min = dto.targetMinTemp !== undefined ? dto.targetMinTemp : 0;
    const max = dto.targetMaxTemp !== undefined ? dto.targetMaxTemp : 4;
    const isOutOfRange = dto.recordedTemp < min || dto.recordedTemp > max;

    await db.execute(
      `INSERT INTO temperature_logs (
        id, branch_id, unit_name, target_min_temp, target_max_temp,
        recorded_temp, unit, is_out_of_range, recorded_by, notes, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        dto.branchId || 'main-branch',
        dto.unitName,
        min,
        max,
        dto.recordedTemp,
        dto.unit || 'C',
        isOutOfRange ? 1 : 0,
        dto.recordedBy,
        dto.notes || null,
        now,
      ]
    );

    return {
      id,
      branchId: dto.branchId || 'main-branch',
      unitName: dto.unitName,
      targetMinTemp: min,
      targetMaxTemp: max,
      recordedTemp: dto.recordedTemp,
      unit: dto.unit || 'C',
      isOutOfRange,
      recordedBy: dto.recordedBy,
      notes: dto.notes,
      recordedAt: now,
    };
  }

  public async getTemperatureLogs(branchId?: string): Promise<TemperatureLog[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    let query = `SELECT * FROM temperature_logs WHERE 1=1`;
    const params: any[] = [];

    if (branchId) {
      query += ` AND branch_id = ?`;
      params.push(branchId);
    }
    query += ` ORDER BY recorded_at DESC LIMIT 50`;

    const rows = await db.query<any>(query, params);
    return rows.map((r: any) => ({
      id: r.id,
      branchId: r.branch_id,
      unitName: r.unit_name,
      targetMinTemp: Number(r.target_min_temp),
      targetMaxTemp: Number(r.target_max_temp),
      recordedTemp: Number(r.recorded_temp),
      unit: r.unit,
      isOutOfRange: Boolean(r.is_out_of_range),
      recordedBy: r.recorded_by,
      notes: r.notes || undefined,
      recordedAt: r.recorded_at,
    }));
  }
}

export const tasksService = new TasksService();
