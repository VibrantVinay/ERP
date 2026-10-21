import { getDb } from '../../core/database';
import {
  Reservation,
  CreateReservationDto,
  UpdateReservationDto,
} from './types';
import { NotFoundError, ValidationError } from '../../core/errors';

export class ReservationService {
  private schemaInitialized = false;

  public async initDatabaseSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;
    const db = getDb();
    const isSqlite = db.type === 'sqlite';

    const createTable = isSqlite
      ? `CREATE TABLE IF NOT EXISTS reservations (
          id TEXT PRIMARY KEY,
          guest_name TEXT NOT NULL,
          phone TEXT NOT NULL,
          email TEXT,
          party_size INTEGER NOT NULL,
          reservation_date TEXT NOT NULL,
          reservation_time TEXT NOT NULL,
          table_preference TEXT,
          occasion TEXT,
          special_requests TEXT,
          deposit_amount REAL DEFAULT 0,
          deposit_status TEXT NOT NULL,
          status TEXT NOT NULL,
          branch_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      : `CREATE TABLE IF NOT EXISTS reservations (
          id VARCHAR(64) PRIMARY KEY,
          guest_name VARCHAR(128) NOT NULL,
          phone VARCHAR(32) NOT NULL,
          email VARCHAR(128),
          party_size INTEGER NOT NULL,
          reservation_date VARCHAR(32) NOT NULL,
          reservation_time VARCHAR(16) NOT NULL,
          table_preference VARCHAR(64),
          occasion VARCHAR(64),
          special_requests TEXT,
          deposit_amount NUMERIC(10, 2) DEFAULT 0,
          deposit_status VARCHAR(32) NOT NULL,
          status VARCHAR(32) NOT NULL,
          branch_id VARCHAR(64) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`;

    await db.execute(createTable);

    const countRes = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM reservations;`);
    if (Number(countRes[0]?.count || 0) === 0) {
      await this.seedInitialReservations();
    }

    this.schemaInitialized = true;
  }

  private async seedInitialReservations(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const samples: CreateReservationDto[] = [
      {
        guestName: 'Kavita Singhania',
        phone: '98200 45678',
        email: 'kavita.s@example.com',
        partySize: 4,
        reservationDate: today,
        reservationTime: '19:30',
        tablePreference: 'Patio 02',
        occasion: 'Anniversary Dinner',
        specialRequests: 'Candlelight setup and champagne flute glasses',
        depositAmount: 1000,
        depositStatus: 'Paid',
      },
      {
        guestName: 'Rohan Mehra',
        phone: '98401 22334',
        email: 'rohan.m@example.com',
        partySize: 6,
        reservationDate: today,
        reservationTime: '20:15',
        tablePreference: 'Main Room',
        occasion: 'Birthday Party',
        specialRequests: 'Bringing eggless birthday cake',
        depositAmount: 500,
        depositStatus: 'Paid',
      },
      {
        guestName: 'Zenith Tech Corp (Tarun)',
        phone: '99002 88112',
        email: 'tarun@zenith.ai',
        partySize: 10,
        reservationDate: tomorrow,
        reservationTime: '13:00',
        tablePreference: 'VIP Suite A',
        occasion: 'Executive Lunch',
        specialRequests: 'Quiet area with AV projector access',
        depositAmount: 2500,
        depositStatus: 'Paid',
      },
    ];

    for (const r of samples) {
      await this.create(r);
    }
  }

  public async getAll(filters?: { date?: string; status?: string; branchId?: string }): Promise<Reservation[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    let query = `SELECT * FROM reservations WHERE 1=1`;
    const params: any[] = [];

    if (filters?.date) {
      query += ` AND reservation_date = ?`;
      params.push(filters.date);
    }
    if (filters?.status && filters.status !== 'all') {
      query += ` AND LOWER(status) = LOWER(?)`;
      params.push(filters.status);
    }
    if (filters?.branchId) {
      query += ` AND branch_id = ?`;
      params.push(filters.branchId);
    }

    query += ` ORDER BY reservation_date ASC, reservation_time ASC;`;

    const rows = await db.query<any>(query, params);
    return rows.map(r => this.hydrateReservation(r));
  }

  public async getById(id: string): Promise<Reservation> {
    await this.initDatabaseSchema();
    const db = getDb();
    const rows = await db.query<any>(`SELECT * FROM reservations WHERE id = ? LIMIT 1;`, [id]);
    if (rows.length === 0) {
      throw new NotFoundError(`Reservation '${id}' not found`);
    }
    return this.hydrateReservation(rows[0]);
  }

  public async create(dto: CreateReservationDto): Promise<Reservation> {
    await this.initDatabaseSchema();
    const db = getDb();
    const id = `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const branchId = dto.branchId || 'branch-south-01';
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO reservations (
        id, guest_name, phone, email, party_size, reservation_date, reservation_time,
        table_preference, occasion, special_requests, deposit_amount, deposit_status,
        status, branch_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?, ?, ?)`,
      [
        id,
        dto.guestName,
        dto.phone,
        dto.email || null,
        dto.partySize,
        dto.reservationDate,
        dto.reservationTime,
        dto.tablePreference || null,
        dto.occasion || null,
        dto.specialRequests || null,
        dto.depositAmount || 0,
        dto.depositStatus || 'None',
        branchId,
        now,
        now,
      ]
    );

    return this.getById(id);
  }

  public async update(id: string, dto: UpdateReservationDto): Promise<Reservation> {
    await this.initDatabaseSchema();
    const res = await this.getById(id);
    const db = getDb();
    const now = new Date().toISOString();

    const newStatus = dto.status || res.status;
    const newPref = dto.tablePreference !== undefined ? dto.tablePreference : res.tablePreference;
    const newSize = dto.partySize || res.partySize;
    const newDate = dto.reservationDate || res.reservationDate;
    const newTime = dto.reservationTime || res.reservationTime;
    const newDeposit = dto.depositStatus || res.depositStatus;

    await db.execute(
      `UPDATE reservations SET
        status = ?, table_preference = ?, party_size = ?,
        reservation_date = ?, reservation_time = ?, deposit_status = ?, updated_at = ?
       WHERE id = ?;`,
      [newStatus, newPref || null, newSize, newDate, newTime, newDeposit, now, res.id]
    );

    return this.getById(res.id);
  }

  public async checkIn(id: string): Promise<Reservation> {
    return this.update(id, { status: 'Arrived' });
  }

  private hydrateReservation(row: any): Reservation {
    return {
      id: row.id,
      guestName: row.guest_name,
      phone: row.phone,
      email: row.email,
      partySize: Number(row.party_size),
      reservationDate: row.reservation_date,
      reservationTime: row.reservation_time,
      tablePreference: row.table_preference,
      occasion: row.occasion,
      specialRequests: row.special_requests,
      depositAmount: Number(row.deposit_amount),
      depositStatus: row.deposit_status,
      status: row.status,
      branchId: row.branch_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const reservationService = new ReservationService();

