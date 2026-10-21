import { getDb } from '../../core/database';
import { Branch, CreateBranchDTO, UpdateBranchDTO, BranchSummary, BranchStatus } from './types';

export class BranchService {
  private schemaInitialized = false;

  public async initDatabaseSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;

    const db = getDb();

    await db.execute(`
      CREATE TABLE IF NOT EXISTS branches (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(30) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        city VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        phone VARCHAR(30) NOT NULL,
        email VARCHAR(100) NOT NULL,
        manager_name VARCHAR(100) NOT NULL,
        opening_time VARCHAR(20) NOT NULL DEFAULT '09:00 AM',
        closing_time VARCHAR(20) NOT NULL DEFAULT '11:00 PM',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        seating_capacity INTEGER NOT NULL DEFAULT 40,
        tables_count INTEGER NOT NULL DEFAULT 10,
        current_daily_revenue REAL NOT NULL DEFAULT 0,
        active_orders_count INTEGER NOT NULL DEFAULT 0,
        created_at VARCHAR(30) NOT NULL,
        updated_at VARCHAR(30) NOT NULL
      )
    `);

    await this.seedInitialData();
  }

  private async seedInitialData(): Promise<void> {
    const db = getDb();
    const existing = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM branches`);
    const count = Number(existing[0]?.count || 0);

    if (count === 0) {
      const now = new Date().toISOString();
      const sampleBranches = [
        {
          id: 'branch-ind',
          code: 'RIFT-BLR-01',
          name: 'Indiranagar Flagship & Rooftop',
          city: 'Bengaluru',
          address: '100ft Road, HAL 2nd Stage, Indiranagar',
          phone: '+91 80 4123 9801',
          email: 'indiranagar@rift-erp.internal',
          managerName: 'Arun Varma',
          openingTime: '11:00 AM',
          closingTime: '11:30 PM',
          status: 'active' as BranchStatus,
          seatingCapacity: 84,
          tablesCount: 22,
          currentDailyRevenue: 68500,
          activeOrdersCount: 6,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'branch-kor',
          code: 'RIFT-BLR-02',
          name: 'Koramangala Bistro & Bar',
          city: 'Bengaluru',
          address: '5th Block, 80ft Road, Koramangala',
          phone: '+91 80 4123 9802',
          email: 'koramangala@rift-erp.internal',
          managerName: 'Sneha Patel',
          openingTime: '12:00 PM',
          closingTime: '01:00 AM',
          status: 'active' as BranchStatus,
          seatingCapacity: 60,
          tablesCount: 16,
          currentDailyRevenue: 49200,
          activeOrdersCount: 4,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'branch-whf',
          code: 'RIFT-BLR-03',
          name: 'Whitefield Tech Express',
          city: 'Bengaluru',
          address: 'ITPL Main Road, Prestige Shantiniketan',
          phone: '+91 80 4123 9803',
          email: 'whitefield@rift-erp.internal',
          managerName: 'Karthik Rao',
          openingTime: '08:30 AM',
          closingTime: '10:30 PM',
          status: 'active' as BranchStatus,
          seatingCapacity: 44,
          tablesCount: 12,
          currentDailyRevenue: 31800,
          activeOrdersCount: 3,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'branch-mg',
          code: 'RIFT-BLR-04',
          name: 'MG Road Heritage Lounge',
          city: 'Bengaluru',
          address: 'Church Street, Off MG Road',
          phone: '+91 80 4123 9804',
          email: 'mgroad@rift-erp.internal',
          managerName: 'Vikram Joshi',
          openingTime: '11:00 AM',
          closingTime: '11:00 PM',
          status: 'renovation' as BranchStatus,
          seatingCapacity: 50,
          tablesCount: 14,
          currentDailyRevenue: 0,
          activeOrdersCount: 0,
          createdAt: now,
          updatedAt: now,
        },
      ];

      for (const b of sampleBranches) {
        await db.execute(
          `INSERT INTO branches (
            id, code, name, city, address, phone, email, manager_name,
            opening_time, closing_time, status, seating_capacity, tables_count,
            current_daily_revenue, active_orders_count, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            b.id,
            b.code,
            b.name,
            b.city,
            b.address,
            b.phone,
            b.email,
            b.managerName,
            b.openingTime,
            b.closingTime,
            b.status,
            b.seatingCapacity,
            b.tablesCount,
            b.currentDailyRevenue,
            b.activeOrdersCount,
            b.createdAt,
            b.updatedAt,
          ]
        );
      }
    }
  }

  private mapRowToBranch(row: any): Branch {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      city: row.city,
      address: row.address,
      phone: row.phone,
      email: row.email,
      managerName: row.manager_name,
      openingTime: row.opening_time,
      closingTime: row.closing_time,
      status: row.status as BranchStatus,
      seatingCapacity: Number(row.seating_capacity),
      tablesCount: Number(row.tables_count),
      currentDailyRevenue: Number(row.current_daily_revenue || 0),
      activeOrdersCount: Number(row.active_orders_count || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  public async getAll(status?: string): Promise<Branch[]> {
    const db = getDb();
    let query = `SELECT * FROM branches`;
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ` WHERE status = ?`;
      params.push(status);
    }

    query += ` ORDER BY name ASC`;
    const rows = await db.query<any>(query, params);
    return rows.map((r) => this.mapRowToBranch(r));
  }

  public async getById(id: string): Promise<Branch | null> {
    const db = getDb();
    const rows = await db.query<any>(`SELECT * FROM branches WHERE id = ?`, [id]);
    if (rows.length === 0) return null;
    return this.mapRowToBranch(rows[0]);
  }

  public async create(dto: CreateBranchDTO): Promise<Branch> {
    const db = getDb();
    const id = `branch-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const branch: Branch = {
      id,
      code: dto.code.trim().toUpperCase(),
      name: dto.name.trim(),
      city: dto.city.trim(),
      address: dto.address.trim(),
      phone: dto.phone.trim(),
      email: dto.email.trim(),
      managerName: dto.managerName.trim(),
      openingTime: dto.openingTime || '10:00 AM',
      closingTime: dto.closingTime || '11:00 PM',
      status: 'active',
      seatingCapacity: Number(dto.seatingCapacity) || 40,
      tablesCount: Number(dto.tablesCount) || 10,
      currentDailyRevenue: 0,
      activeOrdersCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.execute(
      `INSERT INTO branches (
        id, code, name, city, address, phone, email, manager_name,
        opening_time, closing_time, status, seating_capacity, tables_count,
        current_daily_revenue, active_orders_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        branch.id,
        branch.code,
        branch.name,
        branch.city,
        branch.address,
        branch.phone,
        branch.email,
        branch.managerName,
        branch.openingTime,
        branch.closingTime,
        branch.status,
        branch.seatingCapacity,
        branch.tablesCount,
        branch.currentDailyRevenue,
        branch.activeOrdersCount,
        branch.createdAt,
        branch.updatedAt,
      ]
    );

    return branch;
  }

  public async update(id: string, dto: UpdateBranchDTO): Promise<Branch | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const db = getDb();
    const now = new Date().toISOString();

    const updated: Branch = {
      ...existing,
      name: dto.name !== undefined ? dto.name.trim() : existing.name,
      city: dto.city !== undefined ? dto.city.trim() : existing.city,
      address: dto.address !== undefined ? dto.address.trim() : existing.address,
      phone: dto.phone !== undefined ? dto.phone.trim() : existing.phone,
      email: dto.email !== undefined ? dto.email.trim() : existing.email,
      managerName: dto.managerName !== undefined ? dto.managerName.trim() : existing.managerName,
      openingTime: dto.openingTime !== undefined ? dto.openingTime : existing.openingTime,
      closingTime: dto.closingTime !== undefined ? dto.closingTime : existing.closingTime,
      status: dto.status !== undefined ? dto.status : existing.status,
      seatingCapacity: dto.seatingCapacity !== undefined ? Number(dto.seatingCapacity) : existing.seatingCapacity,
      tablesCount: dto.tablesCount !== undefined ? Number(dto.tablesCount) : existing.tablesCount,
      updatedAt: now,
    };

    await db.execute(
      `UPDATE branches SET
        name = ?, city = ?, address = ?, phone = ?, email = ?,
        manager_name = ?, opening_time = ?, closing_time = ?, status = ?,
        seating_capacity = ?, tables_count = ?, updated_at = ?
       WHERE id = ?`,
      [
        updated.name,
        updated.city,
        updated.address,
        updated.phone,
        updated.email,
        updated.managerName,
        updated.openingTime,
        updated.closingTime,
        updated.status,
        updated.seatingCapacity,
        updated.tablesCount,
        updated.updatedAt,
        id,
      ]
    );

    return updated;
  }

  public async delete(id: string): Promise<boolean> {
    const db = getDb();
    const result = await db.execute(`DELETE FROM branches WHERE id = ?`, [id]);
    return (result.affectedRows ?? 0) > 0;
  }

  public async getSummary(): Promise<BranchSummary> {
    const branches = await this.getAll();
    const totalBranches = branches.length;
    const activeBranches = branches.filter((b) => b.status === 'active').length;
    const totalFleetRevenue = branches.reduce((sum, b) => sum + b.currentDailyRevenue, 0);
    const totalFleetSeats = branches.reduce((sum, b) => sum + b.seatingCapacity, 0);

    return {
      totalBranches,
      activeBranches,
      totalFleetRevenue,
      totalFleetSeats,
    };
  }
}

export const branchService = new BranchService();
