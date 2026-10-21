import { getDb } from '../../core/database';
import {
  DeliveryDispatch,
  DeliveryStatus,
  Driver,
  DriverStatus,
  DeliveryZone,
  CreateDispatchDto,
  AssignDriverDto,
} from './types';
import { NotFoundError, ValidationError } from '../../core/errors';

export class DeliveryService {
  private schemaInitialized = false;

  public async initDatabaseSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;
    const db = getDb();
    const isSqlite = db.type === 'sqlite';

    const createDispatches = isSqlite
      ? `CREATE TABLE IF NOT EXISTS delivery_dispatches (
          id TEXT PRIMARY KEY,
          order_ticket TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          phone TEXT NOT NULL,
          address TEXT NOT NULL,
          zone TEXT NOT NULL,
          order_total REAL NOT NULL,
          driver_id TEXT,
          driver_name TEXT,
          status TEXT NOT NULL,
          promised_time DATETIME NOT NULL,
          branch_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          delivered_at DATETIME
        );`
      : `CREATE TABLE IF NOT EXISTS delivery_dispatches (
          id VARCHAR(64) PRIMARY KEY,
          order_ticket VARCHAR(32) NOT NULL,
          customer_name VARCHAR(128) NOT NULL,
          phone VARCHAR(32) NOT NULL,
          address TEXT NOT NULL,
          zone VARCHAR(64) NOT NULL,
          order_total NUMERIC(10, 2) NOT NULL,
          driver_id VARCHAR(64),
          driver_name VARCHAR(128),
          status VARCHAR(32) NOT NULL,
          promised_time TIMESTAMP WITH TIME ZONE NOT NULL,
          branch_id VARCHAR(64) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          delivered_at TIMESTAMP WITH TIME ZONE
        );`;

    const createDrivers = isSqlite
      ? `CREATE TABLE IF NOT EXISTS delivery_drivers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          vehicle_type TEXT NOT NULL,
          status TEXT NOT NULL,
          active_deliveries INTEGER DEFAULT 0
        );`
      : `CREATE TABLE IF NOT EXISTS delivery_drivers (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          phone VARCHAR(32) NOT NULL,
          vehicle_type VARCHAR(32) NOT NULL,
          status VARCHAR(32) NOT NULL,
          active_deliveries INTEGER DEFAULT 0
        );`;

    const createZones = isSqlite
      ? `CREATE TABLE IF NOT EXISTS delivery_zones (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          radius_km REAL NOT NULL,
          delivery_fee REAL NOT NULL,
          min_order_amount REAL NOT NULL,
          est_minutes INTEGER NOT NULL
        );`
      : `CREATE TABLE IF NOT EXISTS delivery_zones (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(64) NOT NULL,
          radius_km NUMERIC(5, 2) NOT NULL,
          delivery_fee NUMERIC(10, 2) NOT NULL,
          min_order_amount NUMERIC(10, 2) NOT NULL,
          est_minutes INTEGER NOT NULL
        );`;

    await db.execute(createDispatches);
    await db.execute(createDrivers);
    await db.execute(createZones);

    const countDrivers = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM delivery_drivers;`);
    if (Number(countDrivers[0]?.count || 0) === 0) {
      await this.seedInitialDeliveryData();
    }

    this.schemaInitialized = true;
  }

  private async seedInitialDeliveryData(): Promise<void> {
    const db = getDb();

    // Drivers
    const drivers = [
      { id: 'drv_1', name: 'Raju Kumar', phone: '98700 11223', vehicle: 'Scooter', status: 'On Delivery', active: 1 },
      { id: 'drv_2', name: 'Sunil Verma', phone: '98700 44556', vehicle: 'Bike', status: 'Available', active: 0 },
      { id: 'drv_3', name: 'Deepak Rao', phone: '98700 77889', vehicle: 'Bike', status: 'Available', active: 0 },
      { id: 'drv_4', name: 'Amit Singh', phone: '98700 99001', vehicle: 'Car', status: 'Off Duty', active: 0 },
    ];
    for (const d of drivers) {
      await db.execute(
        `INSERT INTO delivery_drivers (id, name, phone, vehicle_type, status, active_deliveries) VALUES (?, ?, ?, ?, ?, ?);`,
        [d.id, d.name, d.phone, d.vehicle, d.status, d.active]
      );
    }

    // Zones
    const zones = [
      { id: 'zone_1', name: 'Koramangala (0-3 km)', radius: 3, fee: 30, min: 250, est: 25 },
      { id: 'zone_2', name: 'Indiranagar (3-6 km)', radius: 6, fee: 50, min: 400, est: 35 },
      { id: 'zone_3', name: 'HSR Layout (6-10 km)', radius: 10, fee: 75, min: 500, est: 45 },
    ];
    for (const z of zones) {
      await db.execute(
        `INSERT INTO delivery_zones (id, name, radius_km, delivery_fee, min_order_amount, est_minutes) VALUES (?, ?, ?, ?, ?, ?);`,
        [z.id, z.name, z.radius, z.fee, z.min, z.est]
      );
    }

    // Initial Active Dispatches
    const now = Date.now();
    const dispatches = [
      {
        orderTicket: 'GH-1047',
        customerName: 'Maya S.',
        phone: '98765 43210',
        address: 'Flat 402, Green Palms, 4th Cross, Koramangala',
        zone: 'Koramangala (0-3 km)',
        orderTotal: 1260,
        driverId: 'drv_1',
        driverName: 'Raju Kumar',
        status: 'On the way',
        promisedTime: new Date(now + 12 * 60000).toISOString(),
        createdAt: new Date(now - 20 * 60000).toISOString(),
      },
      {
        orderTicket: 'GH-1052',
        customerName: 'Vikrant Roy',
        phone: '99880 11224',
        address: 'B-12, Palm Meadows, 100ft Road, Indiranagar',
        zone: 'Indiranagar (3-6 km)',
        orderTotal: 840,
        driverId: null,
        driverName: null,
        status: 'Ready for pickup',
        promisedTime: new Date(now + 25 * 60000).toISOString(),
        createdAt: new Date(now - 10 * 60000).toISOString(),
      },
      {
        orderTicket: 'GH-1053',
        customerName: 'Dr. Alok Verma',
        phone: '98455 33221',
        address: 'Villa 14, Prestige Park, Sector 2, HSR',
        zone: 'HSR Layout (6-10 km)',
        orderTotal: 1750,
        driverId: null,
        driverName: null,
        status: 'Preparing',
        promisedTime: new Date(now + 38 * 60000).toISOString(),
        createdAt: new Date(now - 5 * 60000).toISOString(),
      },
    ];

    for (const d of dispatches) {
      const id = `dsp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await db.execute(
        `INSERT INTO delivery_dispatches (
          id, order_ticket, customer_name, phone, address, zone, order_total,
          driver_id, driver_name, status, promised_time, branch_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'branch-south-01', ?);`,
        [
          id,
          d.orderTicket,
          d.customerName,
          d.phone,
          d.address,
          d.zone,
          d.orderTotal,
          d.driverId,
          d.driverName,
          d.status,
          d.promisedTime,
          d.createdAt,
        ]
      );
    }
  }

  public async getDispatches(filters?: { status?: string; driverId?: string; branchId?: string }): Promise<DeliveryDispatch[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    let query = `SELECT * FROM delivery_dispatches WHERE 1=1`;
    const params: any[] = [];

    if (filters?.status && filters.status !== 'all') {
      query += ` AND LOWER(status) = LOWER(?)`;
      params.push(filters.status);
    }
    if (filters?.driverId) {
      query += ` AND driver_id = ?`;
      params.push(filters.driverId);
    }
    if (filters?.branchId) {
      query += ` AND branch_id = ?`;
      params.push(filters.branchId);
    }

    query += ` ORDER BY promised_time ASC;`;

    const rows = await db.query<any>(query, params);
    return rows.map(r => this.hydrateDispatch(r));
  }

  public async getDispatchById(id: string): Promise<DeliveryDispatch> {
    await this.initDatabaseSchema();
    const db = getDb();
    const rows = await db.query<any>(`SELECT * FROM delivery_dispatches WHERE id = ? LIMIT 1;`, [id]);
    if (rows.length === 0) {
      throw new NotFoundError(`Delivery dispatch '${id}' not found`);
    }
    return this.hydrateDispatch(rows[0]);
  }

  public async createDispatch(dto: CreateDispatchDto): Promise<DeliveryDispatch> {
    await this.initDatabaseSchema();
    const db = getDb();
    const id = `dsp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const promisedMinutes = dto.promisedMinutes || 35;
    const promisedTime = new Date(now.getTime() + promisedMinutes * 60000).toISOString();
    const branchId = dto.branchId || 'branch-south-01';

    await db.execute(
      `INSERT INTO delivery_dispatches (
        id, order_ticket, customer_name, phone, address, zone, order_total,
        status, promised_time, branch_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Queued', ?, ?, ?)`,
      [
        id,
        dto.orderTicket,
        dto.customerName,
        dto.phone,
        dto.address,
        dto.zone,
        dto.orderTotal,
        promisedTime,
        branchId,
        now.toISOString(),
      ]
    );

    return this.getDispatchById(id);
  }

  public async assignDriver(id: string, dto: AssignDriverDto): Promise<DeliveryDispatch> {
    await this.initDatabaseSchema();
    const dispatch = await this.getDispatchById(id);
    const db = getDb();

    const driverRows = await db.query<any>(`SELECT * FROM delivery_drivers WHERE id = ? LIMIT 1;`, [dto.driverId]);
    if (driverRows.length === 0) {
      throw new NotFoundError(`Driver '${dto.driverId}' not found`);
    }
    const driver = driverRows[0];

    await db.execute(
      `UPDATE delivery_dispatches SET driver_id = ?, driver_name = ?, status = 'On the way' WHERE id = ?;`,
      [driver.id, driver.name, dispatch.id]
    );

    await db.execute(
      `UPDATE delivery_drivers SET status = 'On Delivery', active_deliveries = active_deliveries + 1 WHERE id = ?;`,
      [driver.id]
    );

    return this.getDispatchById(dispatch.id);
  }

  public async updateStatus(id: string, status: DeliveryStatus): Promise<DeliveryDispatch> {
    await this.initDatabaseSchema();
    const dispatch = await this.getDispatchById(id);
    const db = getDb();
    const deliveredAt = status === 'Delivered' ? new Date().toISOString() : null;

    await db.execute(
      `UPDATE delivery_dispatches SET status = ?, delivered_at = ? WHERE id = ?;`,
      [status, deliveredAt, dispatch.id]
    );

    // If delivered, decrement driver active deliveries
    if (status === 'Delivered' && dispatch.driverId) {
      await db.execute(
        `UPDATE delivery_drivers SET
          active_deliveries = CASE WHEN active_deliveries > 0 THEN active_deliveries - 1 ELSE 0 END,
          status = 'Available'
         WHERE id = ?;`,
        [dispatch.driverId]
      );
    }

    return this.getDispatchById(dispatch.id);
  }

  public async getDrivers(): Promise<Driver[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    const rows = await db.query<any>(`SELECT * FROM delivery_drivers ORDER BY name ASC;`);
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      vehicleType: r.vehicle_type,
      status: r.status,
      activeDeliveriesCount: Number(r.active_deliveries),
    }));
  }

  public async updateDriverStatus(id: string, status: DriverStatus): Promise<Driver> {
    await this.initDatabaseSchema();
    const db = getDb();
    await db.execute(`UPDATE delivery_drivers SET status = ? WHERE id = ?;`, [status, id]);
    const updated = await db.query<any>(`SELECT * FROM delivery_drivers WHERE id = ?;`, [id]);
    const r = updated[0];
    return {
      id: r.id,
      name: r.name,
      phone: r.phone,
      vehicleType: r.vehicle_type,
      status: r.status,
      activeDeliveriesCount: Number(r.active_deliveries),
    };
  }

  public async getZones(): Promise<DeliveryZone[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    const rows = await db.query<any>(`SELECT * FROM delivery_zones ORDER BY radius_km ASC;`);
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      radiusKm: Number(r.radius_km),
      deliveryFee: Number(r.delivery_fee),
      minOrderAmount: Number(r.min_order_amount),
      estMinutes: Number(r.est_minutes),
    }));
  }

  private hydrateDispatch(row: any): DeliveryDispatch {
    const promisedTimeMs = new Date(row.promised_time).getTime();
    const now = Date.now();
    const isDelayed = now > promisedTimeMs && row.status !== 'Delivered';
    const elapsedMinutes = Math.floor((now - new Date(row.created_at).getTime()) / 60000);

    return {
      id: row.id,
      orderTicket: row.order_ticket,
      customerName: row.customer_name,
      phone: row.phone,
      address: row.address,
      zone: row.zone,
      orderTotal: Number(row.order_total),
      driverId: row.driver_id,
      driverName: row.driver_name,
      status: row.status,
      promisedTime: row.promised_time,
      elapsedMinutes,
      isDelayed,
      branchId: row.branch_id,
      createdAt: row.created_at,
      deliveredAt: row.delivered_at,
    };
  }
}

export const deliveryService = new DeliveryService();

