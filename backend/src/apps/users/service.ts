import { getDb } from '../../core/database';
import { UserRecord, CreateUserDTO, UpdateUserDTO, UserSummary, UserAccountStatus } from './types';

export class UserService {
  private schemaInitialized = false;

  public async initDatabaseSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;

    const db = getDb();

    await db.execute(`
      CREATE TABLE IF NOT EXISTS app_users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(30) NOT NULL,
        role VARCHAR(30) NOT NULL,
        branch_id VARCHAR(50) NOT NULL,
        branch_name VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        last_login VARCHAR(30),
        created_at VARCHAR(30) NOT NULL,
        updated_at VARCHAR(30) NOT NULL
      )
    `);

    await this.seedInitialData();
  }

  private async seedInitialData(): Promise<void> {
    const db = getDb();
    const existing = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM app_users`);
    const count = Number(existing[0]?.count || 0);

    if (count === 0) {
      const now = new Date().toISOString();
      const sampleUsers = [
        {
          id: 'usr-001',
          name: 'Vikram Malhotra',
          email: 'vikram@rift-erp.internal',
          phone: '+91 98450 11001',
          role: 'owner',
          branchId: 'branch-ind',
          branchName: 'Indiranagar Flagship',
          status: 'active' as UserAccountStatus,
          lastLogin: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'usr-002',
          name: 'Priya Sharma',
          email: 'priya@rift-erp.internal',
          phone: '+91 98450 11002',
          role: 'manager',
          branchId: 'branch-ind',
          branchName: 'Indiranagar Flagship',
          status: 'active' as UserAccountStatus,
          lastLogin: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'usr-003',
          name: 'Chef Sanjeev',
          email: 'sanjeev@rift-erp.internal',
          phone: '+91 98450 11003',
          role: 'chef',
          branchId: 'branch-ind',
          branchName: 'Indiranagar Flagship',
          status: 'active' as UserAccountStatus,
          lastLogin: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'usr-004',
          name: 'Rahul Verma',
          email: 'rahul@rift-erp.internal',
          phone: '+91 98450 11004',
          role: 'cashier',
          branchId: 'branch-kor',
          branchName: 'Koramangala Bistro',
          status: 'active' as UserAccountStatus,
          lastLogin: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'usr-005',
          name: 'Anjali Das',
          email: 'anjali@rift-erp.internal',
          phone: '+91 98450 11005',
          role: 'server',
          branchId: 'branch-kor',
          branchName: 'Koramangala Bistro',
          status: 'active' as UserAccountStatus,
          lastLogin: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'usr-006',
          name: 'Rohan Mehra',
          email: 'rohan@rift-erp.internal',
          phone: '+91 98450 11006',
          role: 'driver',
          branchId: 'branch-whf',
          branchName: 'Whitefield Tech Express',
          status: 'active' as UserAccountStatus,
          lastLogin: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'usr-007',
          name: 'Sunita Rao',
          email: 'sunita@rift-erp.internal',
          phone: '+91 98450 11007',
          role: 'accountant',
          branchId: 'branch-ind',
          branchName: 'Indiranagar Flagship',
          status: 'active' as UserAccountStatus,
          lastLogin: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'usr-008',
          name: 'Manoj Kumar',
          email: 'manoj@rift-erp.internal',
          phone: '+91 98450 11008',
          role: 'cleaner',
          branchId: 'branch-ind',
          branchName: 'Indiranagar Flagship',
          status: 'active' as UserAccountStatus,
          lastLogin: now,
          createdAt: now,
          updatedAt: now,
        },
      ];

      for (const u of sampleUsers) {
        await db.execute(
          `INSERT INTO app_users (
            id, name, email, phone, role, branch_id, branch_name, status, last_login, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            u.id,
            u.name,
            u.email,
            u.phone,
            u.role,
            u.branchId,
            u.branchName,
            u.status,
            u.lastLogin,
            u.createdAt,
            u.updatedAt,
          ]
        );
      }
    }
  }

  private mapRowToUser(row: any): UserRecord {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      branchId: row.branch_id,
      branchName: row.branch_name,
      status: row.status as UserAccountStatus,
      lastLogin: row.last_login || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  public async getAll(filter?: { role?: string; status?: string; branchId?: string }): Promise<UserRecord[]> {
    const db = getDb();
    let query = `SELECT * FROM app_users`;
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter?.role && filter.role !== 'all') {
      conditions.push(`role = ?`);
      params.push(filter.role);
    }

    if (filter?.status && filter.status !== 'all') {
      conditions.push(`status = ?`);
      params.push(filter.status);
    }

    if (filter?.branchId && filter.branchId !== 'all') {
      conditions.push(`branch_id = ?`);
      params.push(filter.branchId);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY name ASC`;
    const rows = await db.query<any>(query, params);
    return rows.map((r) => this.mapRowToUser(r));
  }

  public async getById(id: string): Promise<UserRecord | null> {
    const db = getDb();
    const rows = await db.query<any>(`SELECT * FROM app_users WHERE id = ?`, [id]);
    if (rows.length === 0) return null;
    return this.mapRowToUser(rows[0]);
  }

  public async create(dto: CreateUserDTO): Promise<UserRecord> {
    const db = getDb();
    const id = `usr-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const branchName = dto.branchName || (dto.branchId === 'branch-kor' ? 'Koramangala Bistro' : dto.branchId === 'branch-whf' ? 'Whitefield Express' : 'Indiranagar Flagship');

    const user: UserRecord = {
      id,
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone.trim(),
      role: dto.role.trim().toLowerCase(),
      branchId: dto.branchId,
      branchName,
      status: 'active',
      lastLogin: undefined,
      createdAt: now,
      updatedAt: now,
    };

    await db.execute(
      `INSERT INTO app_users (
        id, name, email, phone, role, branch_id, branch_name, status, last_login, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.name,
        user.email,
        user.phone,
        user.role,
        user.branchId,
        user.branchName,
        user.status,
        user.lastLogin || null,
        user.createdAt,
        user.updatedAt,
      ]
    );

    return user;
  }

  public async update(id: string, dto: UpdateUserDTO): Promise<UserRecord | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const db = getDb();
    const now = new Date().toISOString();

    const updated: UserRecord = {
      ...existing,
      name: dto.name !== undefined ? dto.name.trim() : existing.name,
      phone: dto.phone !== undefined ? dto.phone.trim() : existing.phone,
      role: dto.role !== undefined ? dto.role.trim().toLowerCase() : existing.role,
      branchId: dto.branchId !== undefined ? dto.branchId : existing.branchId,
      branchName: dto.branchName !== undefined ? dto.branchName : existing.branchName,
      status: dto.status !== undefined ? dto.status : existing.status,
      updatedAt: now,
    };

    await db.execute(
      `UPDATE app_users SET
        name = ?, phone = ?, role = ?, branch_id = ?, branch_name = ?, status = ?, updated_at = ?
       WHERE id = ?`,
      [
        updated.name,
        updated.phone,
        updated.role,
        updated.branchId,
        updated.branchName,
        updated.status,
        updated.updatedAt,
        id,
      ]
    );

    return updated;
  }

  public async delete(id: string): Promise<boolean> {
    const db = getDb();
    const result = await db.execute(`DELETE FROM app_users WHERE id = ?`, [id]);
    return (result.affectedRows ?? 0) > 0;
  }

  public async getSummary(): Promise<UserSummary> {
    const users = await this.getAll();
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === 'active').length;
    const suspendedUsers = users.filter((u) => u.status === 'suspended').length;
    const rolesSet = new Set(users.map((u) => u.role));

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      rolesCount: rolesSet.size,
    };
  }
}

export const userService = new UserService();
