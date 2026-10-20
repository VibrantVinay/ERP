import crypto from 'crypto';
import { getDb } from '../../core/database';
import {
  LoginDto,
  PinLoginDto,
  AuthSessionResponse,
  UserProfile,
  StaffRole,
  DemoPersona,
} from './types';
import { UnauthorizedError, NotFoundError, ValidationError } from '../../core/errors';

export const AVAILABLE_BRANCHES = ['Panaji Main', 'Candolim Beach', 'Margao Town'];

export const SEED_PERSONAS: DemoPersona[] = [
  {
    id: 'usr_owner_01',
    name: 'Aarav Mehta',
    email: 'aarav@rift.example',
    role: 'owner',
    pin: '1111',
    branch: 'All branches',
    description: 'Full administrative access, multi-unit P&L, system config',
  },
  {
    id: 'usr_mgr_02',
    name: 'Mina D’Souza',
    email: 'mina@rift.example',
    role: 'manager',
    pin: '2222',
    branch: 'Panaji Main',
    description: 'Floor management, staff approvals, inventory reconciliation',
  },
  {
    id: 'usr_cashier_03',
    name: 'Neha Verma',
    email: 'neha@rift.example',
    role: 'cashier',
    pin: '3333',
    branch: 'Panaji Main',
    description: 'Fast POS cashiering, receipt billing & drawer checkout',
  },
  {
    id: 'usr_chef_04',
    name: 'Samira Khan',
    email: 'samira@rift.example',
    role: 'chef',
    pin: '4444',
    branch: 'Panaji Main',
    description: 'Kitchen Display System (KDS), line station routing, prep tickets',
  },
  {
    id: 'usr_server_05',
    name: 'Ravi Naik',
    email: 'ravi@rift.example',
    role: 'server',
    pin: '5555',
    branch: 'Panaji Main',
    description: 'Table order taking, customer dining state & floor service',
  },
  {
    id: 'usr_driver_06',
    name: 'Kabir Shah',
    email: 'kabir@rift.example',
    role: 'driver',
    pin: '6666',
    branch: 'Panaji Main',
    description: 'Delivery dispatch, driver route & customer drops',
  },
  {
    id: 'usr_acct_07',
    name: 'Devendra Rao',
    email: 'dev@rift.example',
    role: 'accountant',
    pin: '7777',
    branch: 'All branches',
    description: 'Invoicing, supplier balances, GST tax calculations',
  },
  {
    id: 'usr_cleaner_08',
    name: 'Manoj Kumar',
    email: 'manoj@rift.example',
    role: 'cleaner',
    pin: '8888',
    branch: 'Panaji Main',
    description: 'Table bussing, table reset, hygiene & floor sanitation',
  },
];

export class AuthService {
  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password + '_rift_salt').digest('hex');
  }

  public async initDatabaseSchema(): Promise<void> {
    const db = getDb();
    const isSqlite = db.type === 'sqlite';

    const createUsersTable = isSqlite
      ? `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          pin TEXT,
          role TEXT NOT NULL,
          restaurant_id TEXT NOT NULL,
          branch_scope TEXT NOT NULL,
          active_branch TEXT NOT NULL,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      : `CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          pin VARCHAR(10),
          role VARCHAR(50) NOT NULL,
          restaurant_id VARCHAR(64) NOT NULL,
          branch_scope VARCHAR(255) NOT NULL,
          active_branch VARCHAR(255) NOT NULL,
          is_active INTEGER DEFAULT 1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`;

    await db.execute(createUsersTable);

    // Seed default personas (insert missing personas)
    const defaultPasswordHash = this.hashPassword('password123');
    for (const persona of SEED_PERSONAS) {
      const userExists = await db.query('SELECT id FROM users WHERE email = ?', [persona.email]);
      if (!userExists.length) {
        await db.execute(
          `INSERT INTO users (id, name, email, password_hash, pin, role, restaurant_id, branch_scope, active_branch)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            persona.id,
            persona.name,
            persona.email,
            defaultPasswordHash,
            persona.pin,
            persona.role,
            'rest_01',
            persona.branch,
            persona.branch === 'All branches' ? 'Panaji Main' : persona.branch,
          ]
        );
      }
    }
  }

  private mapRowToProfile(row: any): UserProfile {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role as StaffRole,
      restaurantId: row.restaurant_id,
      branchScope: row.branch_scope,
      activeBranch: row.active_branch || 'Panaji Main',
      hasPin: Boolean(row.pin),
    };
  }

  private createToken(user: UserProfile): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
      activeBranch: user.activeBranch,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  public async loginWithPassword(dto: LoginDto): Promise<AuthSessionResponse> {
    const db = getDb();
    const rows = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND is_active = 1', [
      dto.email.trim(),
    ]);

    if (!rows.length) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const userRow = rows[0];

    // Check password if provided (for dev convenience, allow standard password123 or check hash)
    if (dto.password) {
      const inputHash = this.hashPassword(dto.password);
      if (inputHash !== userRow.password_hash && dto.password !== 'password123') {
        throw new UnauthorizedError('Invalid email or password.');
      }
    }

    // Set branch if selected
    let activeBranch = userRow.active_branch || 'Panaji Main';
    if (dto.branchId && AVAILABLE_BRANCHES.includes(dto.branchId)) {
      activeBranch = dto.branchId;
      await db.execute('UPDATE users SET active_branch = ? WHERE id = ?', [activeBranch, userRow.id]);
      userRow.active_branch = activeBranch;
    }

    const profile = this.mapRowToProfile(userRow);
    const token = this.createToken(profile);

    return {
      token,
      user: profile,
      availableBranches: AVAILABLE_BRANCHES,
    };
  }

  public async loginWithPin(dto: PinLoginDto): Promise<AuthSessionResponse> {
    if (!dto.pin || dto.pin.length < 4) {
      throw new ValidationError('A 4-digit staff PIN is required.');
    }

    const db = getDb();
    const rows = await db.query('SELECT * FROM users WHERE pin = ? AND is_active = 1', [dto.pin.trim()]);

    if (!rows.length) {
      throw new UnauthorizedError('Incorrect staff PIN code.');
    }

    const userRow = rows[0];

    let activeBranch = userRow.active_branch || 'Panaji Main';
    if (dto.branchId && AVAILABLE_BRANCHES.includes(dto.branchId)) {
      activeBranch = dto.branchId;
      await db.execute('UPDATE users SET active_branch = ? WHERE id = ?', [activeBranch, userRow.id]);
      userRow.active_branch = activeBranch;
    }

    const profile = this.mapRowToProfile(userRow);
    const token = this.createToken(profile);

    return {
      token,
      user: profile,
      availableBranches: AVAILABLE_BRANCHES,
    };
  }

  public async getProfile(userId: string): Promise<UserProfile> {
    const db = getDb();
    const rows = await db.query('SELECT * FROM users WHERE id = ? AND is_active = 1', [userId]);

    if (!rows.length) {
      throw new NotFoundError('User account not found.');
    }

    return this.mapRowToProfile(rows[0]);
  }

  public async switchBranch(userId: string, branchId: string): Promise<UserProfile> {
    if (!AVAILABLE_BRANCHES.includes(branchId)) {
      throw new ValidationError(`Invalid branch name. Available: ${AVAILABLE_BRANCHES.join(', ')}`);
    }

    const db = getDb();
    await db.execute('UPDATE users SET active_branch = ? WHERE id = ?', [branchId, userId]);
    return this.getProfile(userId);
  }

  public getDemoPersonas(): DemoPersona[] {
    return SEED_PERSONAS;
  }

  public async cleanAndResetUsers(): Promise<{ message: string; count: number }> {
    const db = getDb();
    await db.execute('DELETE FROM users');
    await this.initDatabaseSchema();
    return {
      message: 'Users table cleaned and reset to pristine default restaurant personas.',
      count: SEED_PERSONAS.length,
    };
  }
}

export const authService = new AuthService();
