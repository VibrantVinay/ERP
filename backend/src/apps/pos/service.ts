import { getDb } from '../../core/database';
import {
  PosCartItem,
  PosCalculationRequest,
  PosCalculationResult,
  CreateTicketRequest,
  PayTicketRequest,
  SplitTicketRequest,
  PosTicketRecord,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  TicketStatus,
} from './types';
import { ValidationError, NotFoundError } from '../../core/errors';

export class PosService {
  public async initDatabaseSchema(): Promise<void> {
    const db = getDb();
    const isSqlite = db.type === 'sqlite';

    const createTableQuery = isSqlite
      ? `CREATE TABLE IF NOT EXISTS pos_tickets (
          id TEXT PRIMARY KEY,
          ticket_number TEXT UNIQUE NOT NULL,
          order_type TEXT NOT NULL,
          table_or_guest TEXT NOT NULL,
          items_json TEXT NOT NULL,
          subtotal REAL NOT NULL,
          discount_percentage REAL NOT NULL,
          discount_amount REAL NOT NULL,
          gst_amount REAL NOT NULL,
          total REAL NOT NULL,
          payment_method TEXT NOT NULL,
          payment_status TEXT NOT NULL,
          amount_paid REAL DEFAULT 0,
          status TEXT NOT NULL,
          server_name TEXT,
          branch_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      : `CREATE TABLE IF NOT EXISTS pos_tickets (
          id VARCHAR(64) PRIMARY KEY,
          ticket_number VARCHAR(32) UNIQUE NOT NULL,
          order_type VARCHAR(32) NOT NULL,
          table_or_guest VARCHAR(128) NOT NULL,
          items_json TEXT NOT NULL,
          subtotal NUMERIC(10, 2) NOT NULL,
          discount_percentage NUMERIC(5, 2) NOT NULL,
          discount_amount NUMERIC(10, 2) NOT NULL,
          gst_amount NUMERIC(10, 2) NOT NULL,
          total NUMERIC(10, 2) NOT NULL,
          payment_method VARCHAR(32) NOT NULL,
          payment_status VARCHAR(32) NOT NULL,
          amount_paid NUMERIC(10, 2) DEFAULT 0,
          status VARCHAR(32) NOT NULL,
          server_name VARCHAR(128),
          branch_id VARCHAR(64) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`;

    await db.execute(createTableQuery);

    // Check if tickets table is empty, seed initial starter tickets for recall
    const existing = await db.query('SELECT COUNT(*) as count FROM pos_tickets');
    const count = Number(existing[0]?.count || 0);

    if (count === 0) {
      console.log('[POS] Seeding initial POS open tickets...');
      const seedTickets = [
        {
          id: 'pos_1048',
          ticketNumber: 'GH-1048',
          orderType: 'Dine-in' as OrderType,
          tableOrGuest: 'Table 04',
          items: [
            { id: 'm_1', name: 'Burrata & heirloom tomato', category: 'Small plates', price: 485, qty: 1, notes: 'Extra sourdough' },
            { id: 'm_2', name: 'Wild mushroom risotto', category: 'Mains', price: 720, qty: 2, notes: 'Less pepper' },
          ],
          subtotal: 1925,
          discountPercentage: 0,
          discountAmount: 0,
          gstAmount: 96,
          total: 2021,
          paymentMethod: 'Unpaid' as PaymentMethod,
          paymentStatus: 'Unpaid' as PaymentStatus,
          status: 'Preparing' as TicketStatus,
          serverName: 'Ravi Naik',
          branchId: 'Panaji Main',
        },
        {
          id: 'pos_1047',
          ticketNumber: 'GH-1047',
          orderType: 'Delivery' as OrderType,
          tableOrGuest: 'Maya · 98••• 216',
          items: [
            { id: 'm_3', name: 'Charred lemon chicken', category: 'Mains', price: 840, qty: 1 },
            { id: 'm_6', name: 'Pistachio olive oil cake', category: 'Desserts', price: 360, qty: 1 },
          ],
          subtotal: 1200,
          discountPercentage: 10,
          discountAmount: 120,
          gstAmount: 54,
          total: 1134,
          paymentMethod: 'Online' as PaymentMethod,
          paymentStatus: 'Paid' as PaymentStatus,
          status: 'Ready' as TicketStatus,
          serverName: 'Samira Khan',
          branchId: 'Panaji Main',
        },
      ];

      for (const t of seedTickets) {
        await db.execute(
          `INSERT INTO pos_tickets (id, ticket_number, order_type, table_or_guest, items_json, subtotal, discount_percentage, discount_amount, gst_amount, total, payment_method, payment_status, status, server_name, branch_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            t.id,
            t.ticketNumber,
            t.orderType,
            t.tableOrGuest,
            JSON.stringify(t.items),
            t.subtotal,
            t.discountPercentage,
            t.discountAmount,
            t.gstAmount,
            t.total,
            t.paymentMethod,
            t.paymentStatus,
            t.status,
            t.serverName,
            t.branchId,
          ]
        );
      }
      console.log('[POS] Seeded starter POS tickets successfully.');
    }
  }

  public calculate(req: PosCalculationRequest): PosCalculationResult {
    const subtotal = req.items.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);
    const discountPercentage = Math.min(100, Math.max(0, req.discountPercentage || 0));
    const discountAmount = Math.round((subtotal * discountPercentage) / 100);
    const taxableAmount = subtotal - discountAmount;

    // GST is 5% in Indian restaurants (2.5% CGST + 2.5% SGST)
    const gstRate = 0.05;
    const cgstAmount = Math.round(taxableAmount * 0.025);
    const sgstAmount = Math.round(taxableAmount * 0.025);
    const gstAmount = cgstAmount + sgstAmount;
    const total = taxableAmount + gstAmount;

    return {
      subtotal,
      discountPercentage,
      discountAmount,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      gstAmount,
      gstRate,
      total,
    };
  }

  private mapRowToRecord(row: any): PosTicketRecord {
    let items: PosCartItem[] = [];
    try {
      items = JSON.parse(row.items_json);
    } catch {
      items = [];
    }

    return {
      id: row.id,
      ticketNumber: row.ticket_number,
      orderType: row.order_type as OrderType,
      tableOrGuest: row.table_or_guest,
      items,
      subtotal: Number(row.subtotal),
      discountPercentage: Number(row.discount_percentage),
      discountAmount: Number(row.discount_amount),
      gstAmount: Number(row.gst_amount),
      total: Number(row.total),
      paymentMethod: row.payment_method as PaymentMethod,
      paymentStatus: row.payment_status as PaymentStatus,
      amountPaid: Number(row.amount_paid || 0),
      status: row.status as TicketStatus,
      serverName: row.server_name,
      branchId: row.branch_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  public async getNextTicketNumber(branchId: string): Promise<string> {
    const db = getDb();
    const rows = await db.query('SELECT COUNT(*) as total FROM pos_tickets');
    const count = Number(rows[0]?.total || 0) + 1050;
    return `GH-${count}`;
  }

  public async createTicket(
    req: CreateTicketRequest,
    serverName = 'Staff Member',
    branchId = 'Panaji Main'
  ): Promise<PosTicketRecord> {
    if (!req.items || req.items.length === 0) {
      throw new ValidationError('Cannot submit an empty POS ticket.');
    }

    const calc = this.calculate({
      items: req.items,
      discountPercentage: req.discountPercentage || 0,
    });

    const ticketNumber = await this.getNextTicketNumber(branchId);
    const id = `pos_${Date.now()}`;
    const paymentMethod = req.paymentMethod || 'Unpaid';
    const paymentStatus: PaymentStatus = paymentMethod === 'Unpaid' ? 'Unpaid' : 'Paid';
    const amountPaid = paymentStatus === 'Paid' ? calc.total : 0;
    const status: TicketStatus = 'Preparing';

    const db = getDb();
    await db.execute(
      `INSERT INTO pos_tickets (
        id, ticket_number, order_type, table_or_guest, items_json,
        subtotal, discount_percentage, discount_amount, gst_amount, total,
        payment_method, payment_status, amount_paid, status, server_name, branch_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        ticketNumber,
        req.orderType,
        req.tableOrGuest || (req.orderType === 'Dine-in' ? 'Table 01' : 'Walk-in'),
        JSON.stringify(req.items),
        calc.subtotal,
        calc.discountPercentage,
        calc.discountAmount,
        calc.gstAmount,
        calc.total,
        paymentMethod,
        paymentStatus,
        amountPaid,
        status,
        serverName,
        branchId,
      ]
    );

    return this.getTicketById(id);
  }

  public async getActiveTickets(branchId?: string): Promise<PosTicketRecord[]> {
    const db = getDb();
    const query = branchId
      ? 'SELECT * FROM pos_tickets WHERE branch_id = ? AND status NOT IN ("Completed", "Cancelled") ORDER BY created_at DESC'
      : 'SELECT * FROM pos_tickets WHERE status NOT IN ("Completed", "Cancelled") ORDER BY created_at DESC';
    const params = branchId ? [branchId] : [];
    const rows = await db.query(query, params);
    return rows.map(r => this.mapRowToRecord(r));
  }

  public async getTicketById(id: string): Promise<PosTicketRecord> {
    const db = getDb();
    const rows = await db.query('SELECT * FROM pos_tickets WHERE id = ? OR ticket_number = ?', [id, id]);
    if (!rows.length) {
      throw new NotFoundError(`Ticket ${id} not found.`);
    }
    return this.mapRowToRecord(rows[0]);
  }

  public async payTicket(id: string, req: PayTicketRequest): Promise<PosTicketRecord> {
    const ticket = await this.getTicketById(id);

    if (ticket.paymentStatus === 'Paid') {
      throw new ValidationError(`Ticket ${ticket.ticketNumber} is already settled.`);
    }

    const db = getDb();
    const newAmountPaid = (ticket.amountPaid || 0) + req.amountPaid;
    const isFull = newAmountPaid >= ticket.total;
    const newPaymentStatus: PaymentStatus = isFull ? 'Paid' : 'Partial';
    const newStatus: TicketStatus = isFull ? 'Completed' : ticket.status;

    await db.execute(
      `UPDATE pos_tickets SET
        payment_method = ?,
        payment_status = ?,
        amount_paid = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [req.paymentMethod, newPaymentStatus, newAmountPaid, newStatus, ticket.id]
    );

    return this.getTicketById(ticket.id);
  }

  public async splitTicket(id: string, req: SplitTicketRequest): Promise<PosTicketRecord[]> {
    const ticket = await this.getTicketById(id);
    const parts = Math.max(2, req.parts || 2);

    if (ticket.paymentStatus === 'Paid') {
      throw new ValidationError(`Cannot split a ticket that is already paid.`);
    }

    const splitAmount = Math.round(ticket.total / parts);
    const splitSubtotal = Math.round(ticket.subtotal / parts);
    const splitGst = Math.round(ticket.gstAmount / parts);

    const subTickets: PosTicketRecord[] = [];
    const db = getDb();

    // Mark original ticket as Split
    await db.execute('UPDATE pos_tickets SET status = "Split", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      ticket.id,
    ]);

    // Create sub tickets A, B, C...
    for (let i = 0; i < parts; i++) {
      const suffix = String.fromCharCode(65 + i); // 'A', 'B', 'C'
      const subTicketNumber = `${ticket.ticketNumber}-${suffix}`;
      const subId = `${ticket.id}_${suffix.toLowerCase()}`;

      await db.execute(
        `INSERT INTO pos_tickets (
          id, ticket_number, order_type, table_or_guest, items_json,
          subtotal, discount_percentage, discount_amount, gst_amount, total,
          payment_method, payment_status, amount_paid, status, server_name, branch_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          subId,
          subTicketNumber,
          ticket.orderType,
          `${ticket.tableOrGuest} (Split ${suffix})`,
          JSON.stringify(ticket.items),
          splitSubtotal,
          0,
          0,
          splitGst,
          splitAmount,
          req.paymentMethod || 'Unpaid',
          'Unpaid',
          0,
          'Preparing',
          ticket.serverName,
          ticket.branchId,
        ]
      );

      subTickets.push(await this.getTicketById(subId));
    }

    return subTickets;
  }
}

export const posService = new PosService();
