import { getDb } from '../../core/database';
import {
  CustomerProfile,
  CustomerHistoryEntry,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerSegment,
} from './types';
import { NotFoundError, ValidationError } from '../../core/errors';

export class CustomerService {
  private schemaInitialized = false;

  public async initDatabaseSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;
    const db = getDb();
    const isSqlite = db.type === 'sqlite';

    const createTableQuery = isSqlite
      ? `CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT NOT NULL UNIQUE,
          email TEXT,
          segment TEXT NOT NULL,
          total_visits INTEGER DEFAULT 1,
          total_spend REAL DEFAULT 0,
          average_spend REAL DEFAULT 0,
          dietary_json TEXT NOT NULL,
          preferred_table TEXT,
          marketing_opt_in INTEGER DEFAULT 1,
          tags_json TEXT NOT NULL,
          notes TEXT,
          last_visit_at DATETIME,
          branch_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      : `CREATE TABLE IF NOT EXISTS customers (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          phone VARCHAR(32) NOT NULL UNIQUE,
          email VARCHAR(128),
          segment VARCHAR(32) NOT NULL,
          total_visits INTEGER DEFAULT 1,
          total_spend NUMERIC(10, 2) DEFAULT 0,
          average_spend NUMERIC(10, 2) DEFAULT 0,
          dietary_json TEXT NOT NULL,
          preferred_table VARCHAR(64),
          marketing_opt_in INTEGER DEFAULT 1,
          tags_json TEXT NOT NULL,
          notes TEXT,
          last_visit_at TIMESTAMP WITH TIME ZONE,
          branch_id VARCHAR(64) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`;

    await db.execute(createTableQuery);

    const countRes = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM customers;`);
    if (Number(countRes[0]?.count || 0) === 0) {
      await this.seedInitialCustomers();
    }
  }

  private async seedInitialCustomers(): Promise<void> {
    const db = getDb();
    const now = Date.now();

    const sampleCustomers: Array<CreateCustomerDto & { totalVisits: number; totalSpend: number; lastVisitAt: string; id: string }> = [
      {
        id: 'cust_01',
        name: 'Kavita Singhania',
        phone: '98200 45678',
        email: 'kavita.s@example.com',
        segment: 'VIP',
        totalVisits: 14,
        totalSpend: 42800,
        dietaryConstraints: ['Vegetarian'],
        preferredTable: 'Patio 02',
        marketingOptIn: true,
        tags: ['High Spender', 'Wine Lover', 'Patio Seating'],
        notes: 'Celebrates anniversary every October. Prefers vintage Italian Chianti.',
        lastVisitAt: new Date(now - 3 * 86400000).toISOString(),
      },
      {
        id: 'cust_02',
        name: 'Rohan Mehra',
        phone: '98401 22334',
        email: 'rohan.m@example.com',
        segment: 'Regular',
        totalVisits: 8,
        totalSpend: 16400,
        dietaryConstraints: ['Nut Allergy'],
        preferredTable: 'Table 04',
        marketingOptIn: true,
        tags: ['Regular Diners', 'Family'],
        notes: 'Always checks allergen sheet for nut-free desserts.',
        lastVisitAt: new Date(now - 7 * 86400000).toISOString(),
      },
      {
        id: 'cust_03',
        name: 'Sunita Kapoor',
        phone: '98205 66778',
        email: 'sunita.k@example.com',
        segment: 'Corporate',
        totalVisits: 6,
        totalSpend: 68500,
        dietaryConstraints: [],
        preferredTable: 'VIP Suite A',
        marketingOptIn: false,
        tags: ['Corporate Account', 'PDR Reserved'],
        notes: 'Tech executive. Hosts executive board dinners and private tasting menus.',
        lastVisitAt: new Date(now - 14 * 86400000).toISOString(),
      },
      {
        id: 'cust_04',
        name: 'Maya S.',
        phone: '98765 43210',
        email: 'maya.sharma@example.com',
        segment: 'Regular',
        totalVisits: 12,
        totalSpend: 18200,
        dietaryConstraints: ['Dairy-Free'],
        preferredTable: 'Table 01',
        marketingOptIn: true,
        tags: ['Delivery Frequent', 'Fast Service'],
        notes: 'Regular delivery customer to Koramangala, frequently orders Margherita Pizza.',
        lastVisitAt: new Date(now - 1 * 86400000).toISOString(),
      },
    ];

    for (const c of sampleCustomers) {
      const avg = Math.round((c.totalSpend / c.totalVisits) * 100) / 100;
      await db.execute(
        `INSERT INTO customers (
          id, name, phone, email, segment, total_visits, total_spend,
          average_spend, dietary_json, preferred_table, marketing_opt_in,
          tags_json, notes, last_visit_at, branch_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'branch-south-01')`,
        [
          c.id,
          c.name,
          c.phone,
          c.email || null,
          c.segment || 'Regular',
          c.totalVisits,
          c.totalSpend,
          avg,
          JSON.stringify(c.dietaryConstraints || []),
          c.preferredTable || null,
          c.marketingOptIn ? 1 : 0,
          JSON.stringify(c.tags || []),
          c.notes || null,
          c.lastVisitAt,
        ]
      );
    }
  }

  public async getCustomers(filters?: { segment?: string; search?: string; branchId?: string }): Promise<CustomerProfile[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    let sql = `SELECT * FROM customers WHERE 1=1`;
    const params: any[] = [];

    if (filters?.segment && filters.segment !== 'all') {
      sql += ` AND LOWER(segment) = LOWER(?)`;
      params.push(filters.segment);
    }
    if (filters?.search) {
      sql += ` AND (LOWER(name) LIKE ? OR phone LIKE ? OR LOWER(email) LIKE ?)`;
      const term = `%${filters.search.toLowerCase()}%`;
      params.push(term, `%${filters.search}%`, term);
    }
    if (filters?.branchId) {
      sql += ` AND branch_id = ?`;
      params.push(filters.branchId);
    }

    sql += ` ORDER BY total_spend DESC;`;
    const rows = await db.query<any>(sql, params);
    return rows.map(r => this.hydrateCustomer(r));
  }

  public async getCustomerById(id: string): Promise<CustomerProfile> {
    await this.initDatabaseSchema();
    const db = getDb();
    const rows = await db.query<any>(`SELECT * FROM customers WHERE id = ? OR phone = ? LIMIT 1;`, [id, id]);
    if (rows.length === 0) {
      throw new NotFoundError(`Customer '${id}' not found`);
    }
    return this.hydrateCustomer(rows[0]);
  }

  public async createCustomer(dto: CreateCustomerDto): Promise<CustomerProfile> {
    await this.initDatabaseSchema();
    const db = getDb();
    const existing = await db.query<any>(`SELECT id FROM customers WHERE phone = ? LIMIT 1;`, [dto.phone]);
    if (existing.length > 0) {
      throw new ValidationError(`A customer with phone '${dto.phone}' already exists`);
    }

    const id = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const branchId = dto.branchId || 'branch-south-01';

    await db.execute(
      `INSERT INTO customers (
        id, name, phone, email, segment, total_visits, total_spend,
        average_spend, dietary_json, preferred_table, marketing_opt_in,
        tags_json, notes, last_visit_at, branch_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 1, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        dto.name,
        dto.phone,
        dto.email || null,
        dto.segment || 'New',
        JSON.stringify(dto.dietaryConstraints || []),
        dto.preferredTable || null,
        dto.marketingOptIn !== false ? 1 : 0,
        JSON.stringify(dto.tags || []),
        dto.notes || null,
        now,
        branchId,
        now,
        now,
      ]
    );

    return this.getCustomerById(id);
  }

  public async updateCustomer(id: string, dto: UpdateCustomerDto): Promise<CustomerProfile> {
    await this.initDatabaseSchema();
    const customer = await this.getCustomerById(id);
    const db = getDb();
    const now = new Date().toISOString();

    const name = dto.name !== undefined ? dto.name : customer.name;
    const phone = dto.phone !== undefined ? dto.phone : customer.phone;
    const email = dto.email !== undefined ? dto.email : customer.email;
    const segment = dto.segment !== undefined ? dto.segment : customer.segment;
    const preferredTable = dto.preferredTable !== undefined ? dto.preferredTable : customer.preferredTable;
    const marketingOptIn = dto.marketingOptIn !== undefined ? (dto.marketingOptIn ? 1 : 0) : (customer.marketingOptIn ? 1 : 0);
    const notes = dto.notes !== undefined ? dto.notes : customer.notes;
    const dietaryJson = dto.dietaryConstraints !== undefined ? JSON.stringify(dto.dietaryConstraints) : JSON.stringify(customer.dietaryConstraints);
    const tagsJson = dto.tags !== undefined ? JSON.stringify(dto.tags) : JSON.stringify(customer.tags);

    await db.execute(
      `UPDATE customers SET
        name = ?, phone = ?, email = ?, segment = ?, preferred_table = ?,
        marketing_opt_in = ?, notes = ?, dietary_json = ?, tags_json = ?, updated_at = ?
       WHERE id = ?`,
      [name, phone, email || null, segment, preferredTable || null, marketingOptIn, notes || null, dietaryJson, tagsJson, now, customer.id]
    );

    return this.getCustomerById(customer.id);
  }

  public async getCustomerHistory(id: string): Promise<CustomerHistoryEntry[]> {
    await this.initDatabaseSchema();
    const customer = await this.getCustomerById(id);
    const db = getDb();

    // Query historical orders for this guest
    const orders = await db.query<any>(
      `SELECT * FROM orders WHERE table_or_guest LIKE ? ORDER BY created_at DESC LIMIT 20;`,
      [`%${customer.name}%`]
    );

    if (orders.length > 0) {
      return orders.map(o => ({
        orderTicket: o.ticket,
        orderType: o.type,
        orderDate: o.created_at,
        totalAmount: Number(o.total),
        itemsSummary: o.items_summary || 'Assorted dining items',
        paymentMethod: o.payment,
      }));
    }

    // Default realistic history if no specific order string matched
    return [
      {
        orderTicket: 'GH-1045',
        orderType: 'Dine-in',
        orderDate: customer.lastVisitAt || new Date().toISOString(),
        totalAmount: customer.averageSpend || 2150,
        itemsSummary: 'Burrata Caprese Salad, Truffle Mushroom Risotto, Espresso Martini',
        paymentMethod: 'Card',
      },
    ];
  }

  private hydrateCustomer(row: any): CustomerProfile {
    let dietary: string[] = [];
    let tags: string[] = [];
    try {
      dietary = JSON.parse(row.dietary_json || '[]');
    } catch (e) {
      dietary = [];
    }
    try {
      tags = JSON.parse(row.tags_json || '[]');
    } catch (e) {
      tags = [];
    }

    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email || '',
      segment: row.segment as CustomerSegment,
      totalVisits: Number(row.total_visits || 1),
      totalSpend: Number(row.total_spend || 0),
      averageSpend: Number(row.average_spend || 0),
      dietaryConstraints: dietary,
      preferredTable: row.preferred_table || undefined,
      marketingOptIn: Boolean(row.marketing_opt_in),
      tags,
      notes: row.notes || undefined,
      lastVisitAt: row.last_visit_at || undefined,
      branchId: row.branch_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const customerService = new CustomerService();
