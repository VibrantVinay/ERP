import { getDb } from '../../core/database';
import { AuditEvent, CreateAuditEventDTO, AuditSummary, AuditAction, AuditSeverity } from './types';

export class AuditService {
  private schemaInitialized = false;

  public async initDatabaseSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;

    const db = getDb();

    await db.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(50) PRIMARY KEY,
        timestamp VARCHAR(30) NOT NULL,
        actor_id VARCHAR(50) NOT NULL,
        actor_name VARCHAR(100) NOT NULL,
        actor_role VARCHAR(30) NOT NULL,
        branch_id VARCHAR(50) NOT NULL,
        branch_name VARCHAR(100) NOT NULL,
        module VARCHAR(50) NOT NULL,
        action VARCHAR(20) NOT NULL,
        severity VARCHAR(20) NOT NULL DEFAULT 'info',
        description TEXT NOT NULL,
        details TEXT,
        ip_address VARCHAR(50) NOT NULL
      )
    `);

    await this.seedInitialData();
  }

  private async seedInitialData(): Promise<void> {
    const db = getDb();
    const existing = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM audit_logs`);
    const count = Number(existing[0]?.count || 0);

    if (count === 0) {
      const now = new Date();
      const minutesAgo = (mins: number) => new Date(now.getTime() - mins * 60000).toISOString();

      const sampleEvents = [
        {
          id: 'aud-001',
          timestamp: minutesAgo(8),
          actorId: 'usr-002',
          actorName: 'Priya Sharma',
          actorRole: 'manager',
          branchId: 'branch-ind',
          branchName: 'Indiranagar Flagship',
          module: 'pos',
          action: 'OVERRIDE' as AuditAction,
          severity: 'warning' as AuditSeverity,
          description: 'Manager approved 25% VIP promotional discount on Order #ORD-1092',
          details: 'Discount amount: ₹450. Reason: Regular corporate guest loyalty card comp.',
          ipAddress: '192.168.1.104',
        },
        {
          id: 'aud-002',
          timestamp: minutesAgo(24),
          actorId: 'usr-004',
          actorName: 'Rahul Verma',
          actorRole: 'cashier',
          branchId: 'branch-kor',
          branchName: 'Koramangala Bistro',
          module: 'pos',
          action: 'VOID' as AuditAction,
          severity: 'warning' as AuditSeverity,
          description: 'Voided item "Truffle Fries" on active Table #4 due to customer duplicate order',
          details: 'Voided item value: ₹280. Re-routed to kitchen KDS for cancellation.',
          ipAddress: '192.168.2.112',
        },
        {
          id: 'aud-003',
          timestamp: minutesAgo(42),
          actorId: 'usr-001',
          actorName: 'Vikram Malhotra',
          actorRole: 'owner',
          branchId: 'branch-ind',
          branchName: 'Indiranagar Flagship',
          module: 'users',
          action: 'UPDATE' as AuditAction,
          severity: 'critical' as AuditSeverity,
          description: 'Elevated RBAC permissions: Sunita Rao granted access to Ledger and Reports',
          details: 'Role updated to: accountant. Added permissions: [VIEW_FINANCE, EXPORT_LEDGER, AUDIT_TRAIL].',
          ipAddress: '10.0.0.1',
        },
        {
          id: 'aud-004',
          timestamp: minutesAgo(65),
          actorId: 'usr-003',
          actorName: 'Chef Sanjeev',
          actorRole: 'chef',
          branchId: 'branch-ind',
          branchName: 'Indiranagar Flagship',
          module: 'recipes',
          action: 'UPDATE' as AuditAction,
          severity: 'info' as AuditSeverity,
          description: 'Adjusted BOM yield for "Paneer Butter Masala" to reflect new amul cream pack',
          details: 'Updated ingredient ratio: Cream 40ml -> 45ml. Yield cost updated to ₹112.50.',
          ipAddress: '192.168.1.108',
        },
        {
          id: 'aud-005',
          timestamp: minutesAgo(90),
          actorId: 'usr-007',
          actorName: 'Sunita Rao',
          actorRole: 'accountant',
          branchId: 'branch-ind',
          branchName: 'Indiranagar Flagship',
          module: 'finance',
          action: 'EXPORT' as AuditAction,
          severity: 'info' as AuditSeverity,
          description: 'Exported Monthly GST-R1 Ledger Reconciliation Report for October 2026',
          details: 'Total records: 184 transactions. Output format: XLSX. Hash: SHA256-e9b42.',
          ipAddress: '192.168.1.115',
        },
        {
          id: 'aud-006',
          timestamp: minutesAgo(120),
          actorId: 'usr-002',
          actorName: 'Priya Sharma',
          actorRole: 'manager',
          branchId: 'branch-ind',
          branchName: 'Indiranagar Flagship',
          module: 'stock_movements',
          action: 'CREATE' as AuditAction,
          severity: 'warning' as AuditSeverity,
          description: 'Logged stock waste entry: 2.4kg Fresh Buffalo Mozzarella spoiled in dairy chiller',
          details: 'Estimated cost loss: ₹1,440. Incident report sent to procurement.',
          ipAddress: '192.168.1.104',
        },
        {
          id: 'aud-007',
          timestamp: minutesAgo(150),
          actorId: 'usr-006',
          actorName: 'Rohan Mehra',
          actorRole: 'driver',
          branchId: 'branch-whf',
          branchName: 'Whitefield Tech Express',
          module: 'delivery',
          action: 'DISPATCH' as AuditAction,
          severity: 'info' as AuditSeverity,
          description: 'Dispatched Order #DEL-404 to customer at Prestige Shantiniketan Tower 4',
          details: 'Trip assigned to delivery bike #KA-03-JK-9081.',
          ipAddress: '192.168.3.102',
        },
        {
          id: 'aud-008',
          timestamp: minutesAgo(200),
          actorId: 'usr-001',
          actorName: 'Vikram Malhotra',
          actorRole: 'owner',
          branchId: 'branch-ind',
          branchName: 'Indiranagar Flagship',
          module: 'branches',
          action: 'CREATE' as AuditAction,
          severity: 'critical' as AuditSeverity,
          description: 'Created new outlet configuration for Whitefield Tech Express',
          details: 'Branch code: RIFT-BLR-03. Seating: 44. POS terminals: 2.',
          ipAddress: '10.0.0.1',
        },
      ];

      for (const ev of sampleEvents) {
        await db.execute(
          `INSERT INTO audit_logs (
            id, timestamp, actor_id, actor_name, actor_role, branch_id, branch_name, module, action, severity, description, details, ip_address
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            ev.id,
            ev.timestamp,
            ev.actorId,
            ev.actorName,
            ev.actorRole,
            ev.branchId,
            ev.branchName,
            ev.module,
            ev.action,
            ev.severity,
            ev.description,
            ev.details,
            ev.ipAddress,
          ]
        );
      }
    }
  }

  private mapRowToEvent(row: any): AuditEvent {
    return {
      id: row.id,
      timestamp: row.timestamp,
      actorId: row.actor_id,
      actorName: row.actor_name,
      actorRole: row.actor_role,
      branchId: row.branch_id,
      branchName: row.branch_name,
      module: row.module,
      action: row.action as AuditAction,
      severity: row.severity as AuditSeverity,
      description: row.description,
      details: row.details || undefined,
      ipAddress: row.ip_address,
    };
  }

  public async getLogs(filter?: {
    module?: string;
    action?: string;
    severity?: string;
    actorId?: string;
    branchId?: string;
    limit?: number;
  }): Promise<AuditEvent[]> {
    const db = getDb();
    let query = `SELECT * FROM audit_logs`;
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter?.module && filter.module !== 'all') {
      conditions.push(`module = ?`);
      params.push(filter.module);
    }

    if (filter?.action && filter.action !== 'all') {
      conditions.push(`action = ?`);
      params.push(filter.action);
    }

    if (filter?.severity && filter.severity !== 'all') {
      conditions.push(`severity = ?`);
      params.push(filter.severity);
    }

    if (filter?.actorId && filter.actorId !== 'all') {
      conditions.push(`actor_id = ?`);
      params.push(filter.actorId);
    }

    if (filter?.branchId && filter.branchId !== 'all') {
      conditions.push(`branch_id = ?`);
      params.push(filter.branchId);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY timestamp DESC`;

    const limit = filter?.limit || 100;
    query += ` LIMIT ${Number(limit)}`;

    const rows = await db.query<any>(query, params);
    return rows.map((r) => this.mapRowToEvent(r));
  }

  public async getById(id: string): Promise<AuditEvent | null> {
    const db = getDb();
    const rows = await db.query<any>(`SELECT * FROM audit_logs WHERE id = ?`, [id]);
    if (rows.length === 0) return null;
    return this.mapRowToEvent(rows[0]);
  }

  public async createLog(dto: CreateAuditEventDTO): Promise<AuditEvent> {
    const db = getDb();
    const id = `aud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
    const now = new Date().toISOString();

    const event: AuditEvent = {
      id,
      timestamp: now,
      actorId: dto.actorId,
      actorName: dto.actorName,
      actorRole: dto.actorRole,
      branchId: dto.branchId,
      branchName: dto.branchName || 'Indiranagar Flagship',
      module: dto.module,
      action: dto.action,
      severity: dto.severity || 'info',
      description: dto.description,
      details: dto.details,
      ipAddress: dto.ipAddress || '127.0.0.1',
    };

    await db.execute(
      `INSERT INTO audit_logs (
        id, timestamp, actor_id, actor_name, actor_role, branch_id, branch_name, module, action, severity, description, details, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.id,
        event.timestamp,
        event.actorId,
        event.actorName,
        event.actorRole,
        event.branchId,
        event.branchName,
        event.module,
        event.action,
        event.severity,
        event.description,
        event.details || null,
        event.ipAddress,
      ]
    );

    return event;
  }

  public async getSummary(): Promise<AuditSummary> {
    const all = await this.getLogs({ limit: 1000 });
    const todayStr = new Date().toISOString().slice(0, 10);

    const totalEvents = all.length;
    const criticalEvents = all.filter((e) => e.severity === 'critical').length;
    const todayEvents = all.filter((e) => e.timestamp.startsWith(todayStr)).length;
    const uniqueActors = new Set(all.map((e) => e.actorId)).size;

    return {
      totalEvents,
      criticalEvents,
      todayEvents,
      uniqueActors,
    };
  }
}

export const auditService = new AuditService();

