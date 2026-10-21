import { getDb } from '../../core/database';
import {
  DiningTable,
  FloorZone,
  TableStatus,
  WaitlistEntry,
  SeatTableDto,
  AddWaitlistDto,
} from './types';
import { NotFoundError, ValidationError } from '../../core/errors';

export class TableService {
  private schemaInitialized = false;

  public async initDatabaseSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;
    const db = getDb();
    const isSqlite = db.type === 'sqlite';

    const createTablesQuery = isSqlite
      ? `CREATE TABLE IF NOT EXISTS dining_tables (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          zone TEXT NOT NULL,
          capacity INTEGER NOT NULL,
          status TEXT NOT NULL,
          current_ticket_id TEXT,
          guest_count INTEGER,
          server_name TEXT,
          seated_at DATETIME,
          branch_id TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      : `CREATE TABLE IF NOT EXISTS dining_tables (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(64) NOT NULL UNIQUE,
          zone VARCHAR(64) NOT NULL,
          capacity INTEGER NOT NULL,
          status VARCHAR(32) NOT NULL,
          current_ticket_id VARCHAR(64),
          guest_count INTEGER,
          server_name VARCHAR(128),
          seated_at TIMESTAMP WITH TIME ZONE,
          branch_id VARCHAR(64) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`;

    const createWaitlistQuery = isSqlite
      ? `CREATE TABLE IF NOT EXISTS waitlist_entries (
          id TEXT PRIMARY KEY,
          guest_name TEXT NOT NULL,
          party_size INTEGER NOT NULL,
          phone TEXT NOT NULL,
          zone_preference TEXT NOT NULL,
          notes TEXT,
          est_wait_minutes INTEGER NOT NULL,
          status TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      : `CREATE TABLE IF NOT EXISTS waitlist_entries (
          id VARCHAR(64) PRIMARY KEY,
          guest_name VARCHAR(128) NOT NULL,
          party_size INTEGER NOT NULL,
          phone VARCHAR(32) NOT NULL,
          zone_preference VARCHAR(64) NOT NULL,
          notes TEXT,
          est_wait_minutes INTEGER NOT NULL,
          status VARCHAR(32) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`;

    await db.execute(createTablesQuery);
    await db.execute(createWaitlistQuery);

    const countRes = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM dining_tables;`);
    if (Number(countRes[0]?.count || 0) === 0) {
      await this.seedInitialTables();
    }

    const waitCount = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM waitlist_entries;`);
    if (Number(waitCount[0]?.count || 0) === 0) {
      await this.seedInitialWaitlist();
    }

    this.schemaInitialized = true;
  }

  private async seedInitialTables(): Promise<void> {
    const db = getDb();
    const initialTables: Array<Omit<DiningTable, 'id' | 'seatedMinutes' | 'updatedAt'>> = [
      { name: 'Table 01', zone: 'Main Room', capacity: 2, status: 'Available', branchId: 'branch-south-01' },
      { name: 'Table 02', zone: 'Main Room', capacity: 4, status: 'Dining', guestCount: 3, serverName: 'Ananya', seatedAt: new Date(Date.now() - 42 * 60000).toISOString(), branchId: 'branch-south-01' },
      { name: 'Table 03', zone: 'Main Room', capacity: 4, status: 'Ordering', guestCount: 4, serverName: 'Rahul', seatedAt: new Date(Date.now() - 12 * 60000).toISOString(), branchId: 'branch-south-01' },
      { name: 'Table 04', zone: 'Main Room', capacity: 6, status: 'Needs Cleaning', branchId: 'branch-south-01' },
      { name: 'Table 05', zone: 'Main Room', capacity: 2, status: 'Reserved', guestCount: 2, branchId: 'branch-south-01' },
      { name: 'Patio 01', zone: 'Patio', capacity: 4, status: 'Available', branchId: 'branch-south-01' },
      { name: 'Patio 02', zone: 'Patio', capacity: 4, status: 'Dining', guestCount: 4, serverName: 'Karan', seatedAt: new Date(Date.now() - 25 * 60000).toISOString(), branchId: 'branch-south-01' },
      { name: 'Patio 03', zone: 'Patio', capacity: 6, status: 'Needs Cleaning', branchId: 'branch-south-01' },
      { name: 'Bar 01', zone: 'Counter', capacity: 1, status: 'Available', branchId: 'branch-south-01' },
      { name: 'Bar 02', zone: 'Counter', capacity: 1, status: 'Dining', guestCount: 1, serverName: 'Maya', seatedAt: new Date(Date.now() - 18 * 60000).toISOString(), branchId: 'branch-south-01' },
      { name: 'Bar 03', zone: 'Counter', capacity: 1, status: 'Available', branchId: 'branch-south-01' },
      { name: 'VIP Suite A', zone: 'Private Dining', capacity: 10, status: 'Available', branchId: 'branch-south-01' },
      { name: 'VIP Suite B', zone: 'Private Dining', capacity: 12, status: 'Reserved', branchId: 'branch-south-01' },
    ];

    for (const t of initialTables) {
      const id = `tbl_${t.name.toLowerCase().replace(/\s+/g, '_')}`;
      await db.execute(
        `INSERT INTO dining_tables (id, name, zone, capacity, status, guest_count, server_name, seated_at, branch_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          t.name,
          t.zone,
          t.capacity,
          t.status,
          t.guestCount || null,
          t.serverName || null,
          t.seatedAt || null,
          t.branchId,
        ]
      );
    }
  }

  private async seedInitialWaitlist(): Promise<void> {
    const db = getDb();
    const waitlist = [
      {
        guestName: 'Arjun Verma',
        partySize: 4,
        phone: '98450 11223',
        zonePreference: 'Main Room' as FloorZone,
        notes: 'High chair required',
        estWaitMinutes: 15,
        status: 'Waiting',
        createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
      },
      {
        guestName: 'Dr. Sonia Sen',
        partySize: 2,
        phone: '98111 88776',
        zonePreference: 'Patio' as FloorZone,
        notes: 'Anniversary couple',
        estWaitMinutes: 5,
        status: 'Notified',
        createdAt: new Date(Date.now() - 22 * 60000).toISOString(),
      },
    ];

    for (const w of waitlist) {
      const id = `wait_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await db.execute(
        `INSERT INTO waitlist_entries (id, guest_name, party_size, phone, zone_preference, notes, est_wait_minutes, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          w.guestName,
          w.partySize,
          w.phone,
          w.zonePreference,
          w.notes,
          w.estWaitMinutes,
          w.status,
          w.createdAt,
        ]
      );
    }
  }

  public async getTables(filters?: { zone?: string; status?: string; branchId?: string }): Promise<DiningTable[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    let query = `SELECT * FROM dining_tables WHERE 1=1`;
    const params: any[] = [];

    if (filters?.zone && filters.zone !== 'all') {
      query += ` AND zone = ?`;
      params.push(filters.zone);
    }
    if (filters?.status && filters.status !== 'all') {
      query += ` AND status = ?`;
      params.push(filters.status);
    }
    if (filters?.branchId) {
      query += ` AND branch_id = ?`;
      params.push(filters.branchId);
    }

    query += ` ORDER BY name ASC;`;

    const rows = await db.query<any>(query, params);
    return rows.map(r => this.hydrateTable(r));
  }

  public async getTableById(id: string): Promise<DiningTable> {
    await this.initDatabaseSchema();
    const db = getDb();
    const rows = await db.query<any>(
      `SELECT * FROM dining_tables WHERE id = ? OR LOWER(name) = LOWER(?) LIMIT 1;`,
      [id, id]
    );

    if (rows.length === 0) {
      throw new NotFoundError(`Dining table '${id}' not found`);
    }

    return this.hydrateTable(rows[0]);
  }

  public async updateTableStatus(id: string, status: TableStatus): Promise<DiningTable> {
    await this.initDatabaseSchema();
    const table = await this.getTableById(id);
    const db = getDb();
    const now = new Date().toISOString();

    let seatedAt = table.seatedAt;
    if (status === 'Available' || status === 'Needs Cleaning') {
      seatedAt = undefined;
    }

    await db.execute(
      `UPDATE dining_tables SET status = ?, seated_at = ?, updated_at = ? WHERE id = ?;`,
      [status, seatedAt || null, now, table.id]
    );

    return this.getTableById(table.id);
  }

  public async seatTable(id: string, dto: SeatTableDto): Promise<DiningTable> {
    await this.initDatabaseSchema();
    const table = await this.getTableById(id);
    const db = getDb();

    if (table.status === 'Dining' || table.status === 'Ordering') {
      throw new ValidationError(`Table ${table.name} is already occupied`);
    }

    const now = new Date().toISOString();
    await db.execute(
      `UPDATE dining_tables SET
        status = 'Seated',
        guest_count = ?,
        server_name = ?,
        current_ticket_id = ?,
        seated_at = ?,
        updated_at = ?
       WHERE id = ?;`,
      [
        dto.guestCount,
        dto.serverName || 'Staff',
        dto.ticketId || null,
        now,
        now,
        table.id,
      ]
    );

    return this.getTableById(table.id);
  }

  public async clearTable(id: string): Promise<DiningTable> {
    await this.initDatabaseSchema();
    const table = await this.getTableById(id);
    const db = getDb();
    const now = new Date().toISOString();

    await db.execute(
      `UPDATE dining_tables SET
        status = 'Available',
        guest_count = NULL,
        server_name = NULL,
        current_ticket_id = NULL,
        seated_at = NULL,
        updated_at = ?
       WHERE id = ?;`,
      [now, table.id]
    );

    return this.getTableById(table.id);
  }

  public async getZones(): Promise<FloorZone[]> {
    return ['Main Room', 'Patio', 'Counter', 'Private Dining'];
  }

  public async getWaitlist(): Promise<WaitlistEntry[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    const rows = await db.query<any>(
      `SELECT * FROM waitlist_entries WHERE status IN ('Waiting', 'Notified') ORDER BY created_at ASC;`
    );

    return rows.map(r => ({
      id: r.id,
      guestName: r.guest_name,
      partySize: Number(r.party_size),
      phone: r.phone,
      zonePreference: r.zone_preference,
      notes: r.notes,
      estWaitMinutes: Number(r.est_wait_minutes),
      status: r.status,
      createdAt: r.created_at,
    }));
  }

  public async addToWaitlist(dto: AddWaitlistDto): Promise<WaitlistEntry> {
    await this.initDatabaseSchema();
    const db = getDb();
    const id = `wait_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const createdAt = new Date().toISOString();

    await db.execute(
      `INSERT INTO waitlist_entries (id, guest_name, party_size, phone, zone_preference, notes, est_wait_minutes, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Waiting', ?)`,
      [
        id,
        dto.guestName,
        dto.partySize,
        dto.phone,
        dto.zonePreference || 'Any',
        dto.notes || '',
        dto.estWaitMinutes || 15,
        createdAt,
      ]
    );

    return {
      id,
      guestName: dto.guestName,
      partySize: dto.partySize,
      phone: dto.phone,
      zonePreference: dto.zonePreference || 'Any',
      notes: dto.notes,
      estWaitMinutes: dto.estWaitMinutes || 15,
      status: 'Waiting',
      createdAt,
    };
  }

  public async updateWaitlistStatus(id: string, status: 'Notified' | 'Seated' | 'Cancelled'): Promise<void> {
    await this.initDatabaseSchema();
    const db = getDb();
    await db.execute(`UPDATE waitlist_entries SET status = ? WHERE id = ?;`, [status, id]);
  }

  private hydrateTable(row: any): DiningTable {
    let seatedMinutes: number | undefined = undefined;
    if (row.seated_at) {
      const seatedTime = new Date(row.seated_at).getTime();
      seatedMinutes = Math.max(0, Math.floor((Date.now() - seatedTime) / 60000));
    }

    return {
      id: row.id,
      name: row.name,
      zone: row.zone,
      capacity: Number(row.capacity),
      status: row.status,
      currentTicketId: row.current_ticket_id,
      guestCount: row.guest_count ? Number(row.guest_count) : undefined,
      serverName: row.server_name,
      seatedAt: row.seated_at,
      seatedMinutes,
      branchId: row.branch_id,
      updatedAt: row.updated_at,
    };
  }
}

export const tableService = new TableService();
