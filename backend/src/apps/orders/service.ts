import { getDb } from '../../core/database';
import {
  OrderRecord,
  OrderItem,
  OrderStatus,
  CreateOrderDto,
  UpdateOrderStatusDto,
  CancelOrderDto,
  MergeOrdersDto,
  OrderStatusHistoryItem,
} from './types';
import { NotFoundError, ValidationError } from '../../core/errors';

export class OrderService {
  private schemaInitialized = false;

  public async initDatabaseSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;
    const db = getDb();
    const isSqlite = db.type === 'sqlite';

    const createOrdersTable = isSqlite
      ? `CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          ticket TEXT NOT NULL UNIQUE,
          type TEXT NOT NULL,
          table_or_guest TEXT NOT NULL,
          items_json TEXT NOT NULL,
          items_summary TEXT NOT NULL,
          subtotal REAL NOT NULL,
          gst_amount REAL NOT NULL,
          total REAL NOT NULL,
          payment TEXT NOT NULL,
          status TEXT NOT NULL,
          branch_id TEXT NOT NULL,
          cancellation_reason TEXT,
          merged_into TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      : `CREATE TABLE IF NOT EXISTS orders (
          id VARCHAR(64) PRIMARY KEY,
          ticket VARCHAR(32) NOT NULL UNIQUE,
          type VARCHAR(32) NOT NULL,
          table_or_guest VARCHAR(128) NOT NULL,
          items_json TEXT NOT NULL,
          items_summary TEXT NOT NULL,
          subtotal NUMERIC(10, 2) NOT NULL,
          gst_amount NUMERIC(10, 2) NOT NULL,
          total NUMERIC(10, 2) NOT NULL,
          payment VARCHAR(32) NOT NULL,
          status VARCHAR(32) NOT NULL,
          branch_id VARCHAR(64) NOT NULL,
          cancellation_reason TEXT,
          merged_into VARCHAR(64),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`;

    const createHistoryTable = isSqlite
      ? `CREATE TABLE IF NOT EXISTS order_status_history (
          id TEXT PRIMARY KEY,
          order_id TEXT NOT NULL,
          from_status TEXT NOT NULL,
          to_status TEXT NOT NULL,
          changed_by TEXT NOT NULL,
          reason TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      : `CREATE TABLE IF NOT EXISTS order_status_history (
          id VARCHAR(64) PRIMARY KEY,
          order_id VARCHAR(64) NOT NULL,
          from_status VARCHAR(32) NOT NULL,
          to_status VARCHAR(32) NOT NULL,
          changed_by VARCHAR(128) NOT NULL,
          reason TEXT,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`;

    await db.execute(createOrdersTable);
    await db.execute(createHistoryTable);

    // Seed sample orders if table is empty
    const countResult = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM orders;`);
    const count = Number(countResult[0]?.count || 0);

    if (count === 0) {
      await this.seedInitialOrders();
    }

    this.schemaInitialized = true;
  }

  private async seedInitialOrders(): Promise<void> {
    const initialOrders: Array<CreateOrderDto & { status: OrderStatus; ticket: string; createdAt: string }> = [
      {
        ticket: 'GH-1048',
        type: 'Dine-in',
        tableOrGuest: 'Table 04',
        items: [
          { id: 'i1', name: 'Burrata Salad', quantity: 1, unitPrice: 425 },
          { id: 'i2', name: 'Truffle Mushroom Risotto', quantity: 2, unitPrice: 750 },
        ],
        subtotal: 1925,
        gstAmount: 96.25,
        total: 2021.25,
        payment: 'Unpaid',
        status: 'Preparing',
        branch_id: 'branch-south-01',
        createdBy: 'Server Ananya',
        createdAt: new Date().toISOString(),
      } as any,
      {
        ticket: 'GH-1047',
        type: 'Delivery',
        tableOrGuest: 'Maya S. · 98765 43210',
        items: [
          { id: 'i3', name: 'Butter Chicken Roast', quantity: 1, unitPrice: 850 },
          { id: 'i4', name: 'Dark Chocolate Lava Cake', quantity: 1, unitPrice: 350 },
        ],
        subtotal: 1200,
        gstAmount: 60,
        total: 1260,
        payment: 'Online',
        status: 'Ready',
        branch_id: 'branch-south-01',
        createdBy: 'Web Ordering',
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
      } as any,
      {
        ticket: 'GH-1046',
        type: 'Takeaway',
        tableOrGuest: 'Vikram · pickup 13:00',
        items: [{ id: 'i5', name: 'Roasted Pumpkin Bowl', quantity: 1, unitPrice: 560 }],
        subtotal: 560,
        gstAmount: 28,
        total: 588,
        payment: 'UPI',
        status: 'Accepted',
        branch_id: 'branch-south-01',
        createdBy: 'Cashier Priya',
        createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
      } as any,
      {
        ticket: 'GH-1045',
        type: 'QR order',
        tableOrGuest: 'Table 08',
        items: [
          { id: 'i6', name: 'Aperol Spritz', quantity: 2, unitPrice: 450 },
          { id: 'i7', name: 'Artisan Garlic Sourdough', quantity: 1, unitPrice: 120 },
        ],
        subtotal: 1020,
        gstAmount: 51,
        total: 1071,
        payment: 'Unpaid',
        status: 'New',
        branch_id: 'branch-south-01',
        createdBy: 'Table 08 QR',
        createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
      } as any,
    ];

    for (const ord of initialOrders) {
      await this.createInternal(ord, ord.status, (ord as any).createdAt);
    }
  }

  private async createInternal(
    data: CreateOrderDto,
    status: OrderStatus = 'New',
    createdAt?: string
  ): Promise<OrderRecord> {
    const db = getDb();
    const id = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const ticket = data.ticket || `GH-${Math.floor(1000 + Math.random() * 9000)}`;
    const branchId = data.branchId || 'branch-south-01';

    let subtotal = data.subtotal || 0;
    if (!subtotal && data.items) {
      subtotal = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    }
    const gstAmount = data.gstAmount ?? Math.round(subtotal * 0.05 * 100) / 100;
    const total = data.total ?? Math.round((subtotal + gstAmount) * 100) / 100;

    const itemsSummary = (data.items || [])
      .map(item => `${item.name} ×${item.quantity}`)
      .join(', ');

    const itemsJson = JSON.stringify(data.items || []);
    const payment = data.payment || 'Unpaid';
    const createdTimestamp = createdAt || new Date().toISOString();

    await db.execute(
      `INSERT INTO orders (
        id, ticket, type, table_or_guest, items_json, items_summary,
        subtotal, gst_amount, total, payment, status, branch_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        ticket,
        data.type,
        data.tableOrGuest,
        itemsJson,
        itemsSummary,
        subtotal,
        gstAmount,
        total,
        payment,
        status,
        branchId,
        createdTimestamp,
        createdTimestamp,
      ]
    );

    // Initial history record
    const historyId = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.execute(
      `INSERT INTO order_status_history (id, order_id, from_status, to_status, changed_by, reason, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        historyId,
        id,
        'Created',
        status,
        data.createdBy || 'System',
        'Order placed and logged into registry',
        createdTimestamp,
      ]
    );

    return this.getById(id);
  }

  public async create(data: CreateOrderDto): Promise<OrderRecord> {
    await this.initDatabaseSchema();
    return this.createInternal(data, 'New');
  }

  public async getAll(filters?: { status?: string; type?: string; branchId?: string }): Promise<OrderRecord[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    let query = `SELECT * FROM orders WHERE 1=1`;
    const params: any[] = [];

    if (filters?.status) {
      query += ` AND LOWER(status) = LOWER(?)`;
      params.push(filters.status);
    }
    if (filters?.type) {
      query += ` AND LOWER(type) = LOWER(?)`;
      params.push(filters.type);
    }
    if (filters?.branchId) {
      query += ` AND branch_id = ?`;
      params.push(filters.branchId);
    }

    query += ` ORDER BY created_at DESC;`;

    const rows = await db.query<any>(query, params);
    return Promise.all(rows.map(row => this.hydrateOrder(row)));
  }

  public async getById(id: string): Promise<OrderRecord> {
    await this.initDatabaseSchema();
    const db = getDb();
    const rows = await db.query<any>(
      `SELECT * FROM orders WHERE id = ? OR ticket = ? LIMIT 1;`,
      [id, id]
    );

    if (rows.length === 0) {
      throw new NotFoundError(`Order with ID/Ticket '${id}' not found`);
    }

    return this.hydrateOrder(rows[0]);
  }

  public async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<OrderRecord> {
    await this.initDatabaseSchema();
    const order = await this.getById(id);
    const db = getDb();

    if (order.status === 'Cancelled' || order.status === 'Completed' || order.status === 'Merged') {
      throw new ValidationError(`Cannot transition status of already ${order.status} order`);
    }

    const fromStatus = order.status;
    const toStatus = dto.status;
    const now = new Date().toISOString();

    await db.execute(
      `UPDATE orders SET status = ?, updated_at = ? WHERE id = ?;`,
      [toStatus, now, order.id]
    );

    const historyId = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.execute(
      `INSERT INTO order_status_history (id, order_id, from_status, to_status, changed_by, reason, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        historyId,
        order.id,
        fromStatus,
        toStatus,
        dto.changedBy || 'Staff',
        dto.reason || `Status updated to ${toStatus}`,
        now,
      ]
    );

    return this.getById(order.id);
  }

  public async cancelOrder(id: string, dto: CancelOrderDto): Promise<OrderRecord> {
    await this.initDatabaseSchema();
    const order = await this.getById(id);
    const db = getDb();

    if (!dto.reason || dto.reason.trim() === '') {
      throw new ValidationError('Cancellation reason is required');
    }

    if (order.status === 'Completed') {
      throw new ValidationError('Cannot cancel a completed/settled order');
    }

    const now = new Date().toISOString();
    await db.execute(
      `UPDATE orders SET status = 'Cancelled', cancellation_reason = ?, updated_at = ? WHERE id = ?;`,
      [dto.reason, now, order.id]
    );

    const historyId = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.execute(
      `INSERT INTO order_status_history (id, order_id, from_status, to_status, changed_by, reason, timestamp)
       VALUES (?, ?, ?, 'Cancelled', ?, ?, ?)`,
      [
        historyId,
        order.id,
        order.status,
        dto.cancelledBy || 'Staff',
        `Cancelled: ${dto.reason}`,
        now,
      ]
    );

    return this.getById(order.id);
  }

  public async mergeOrders(dto: MergeOrdersDto): Promise<OrderRecord> {
    await this.initDatabaseSchema();
    const targetOrder = await this.getById(dto.targetOrderId);
    const db = getDb();

    if (!dto.sourceOrderIds || dto.sourceOrderIds.length === 0) {
      throw new ValidationError('At least one source order is required to merge');
    }

    const now = new Date().toISOString();
    let aggregatedItems = [...targetOrder.items];

    for (const sourceId of dto.sourceOrderIds) {
      if (sourceId === targetOrder.id || sourceId === targetOrder.ticket) continue;
      const sourceOrder = await this.getById(sourceId);

      // Append items
      aggregatedItems = aggregatedItems.concat(sourceOrder.items);

      // Mark source order as Merged
      await db.execute(
        `UPDATE orders SET status = 'Merged', merged_into = ?, updated_at = ? WHERE id = ?;`,
        [targetOrder.id, now, sourceOrder.id]
      );

      // Add to source history
      const histId = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await db.execute(
        `INSERT INTO order_status_history (id, order_id, from_status, to_status, changed_by, reason, timestamp)
         VALUES (?, ?, ?, 'Merged', ?, ?, ?)`,
        [
          histId,
          sourceOrder.id,
          sourceOrder.status,
          dto.mergedBy || 'Staff',
          `Merged into ${targetOrder.ticket}`,
          now,
        ]
      );
    }

    // Recalculate target totals
    const newSubtotal = aggregatedItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
    const newGst = Math.round(newSubtotal * 0.05 * 100) / 100;
    const newTotal = Math.round((newSubtotal + newGst) * 100) / 100;
    const newSummary = aggregatedItems.map(i => `${i.name} ×${i.quantity}`).join(', ');

    await db.execute(
      `UPDATE orders SET
        items_json = ?,
        items_summary = ?,
        subtotal = ?,
        gst_amount = ?,
        total = ?,
        updated_at = ?
       WHERE id = ?;`,
      [
        JSON.stringify(aggregatedItems),
        newSummary,
        newSubtotal,
        newGst,
        newTotal,
        now,
        targetOrder.id,
      ]
    );

    // Add target history
    const targetHistId = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.execute(
      `INSERT INTO order_status_history (id, order_id, from_status, to_status, changed_by, reason, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        targetHistId,
        targetOrder.id,
        targetOrder.status,
        targetOrder.status,
        dto.mergedBy || 'Staff',
        `Merged ${dto.sourceOrderIds.length} orders into this ticket`,
        now,
      ]
    );

    return this.getById(targetOrder.id);
  }

  private async hydrateOrder(row: any): Promise<OrderRecord> {
    const db = getDb();
    let parsedItems: OrderItem[] = [];
    try {
      parsedItems = JSON.parse(row.items_json || '[]');
    } catch (e) {
      parsedItems = [];
    }

    const historyRows = await db.query<any>(
      `SELECT * FROM order_status_history WHERE order_id = ? ORDER BY timestamp ASC;`,
      [row.id]
    );

    const history: OrderStatusHistoryItem[] = historyRows.map(h => ({
      id: h.id,
      orderId: h.order_id,
      fromStatus: h.from_status,
      toStatus: h.to_status,
      changedBy: h.changed_by,
      reason: h.reason,
      timestamp: h.timestamp,
    }));

    return {
      id: row.id,
      ticket: row.ticket,
      type: row.type,
      tableOrGuest: row.table_or_guest,
      items: parsedItems,
      itemsSummary: row.items_summary,
      subtotal: Number(row.subtotal),
      gstAmount: Number(row.gst_amount),
      total: Number(row.total),
      payment: row.payment,
      status: row.status,
      branchId: row.branch_id,
      cancellationReason: row.cancellation_reason,
      mergedInto: row.merged_into,
      history,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const orderService = new OrderService();
