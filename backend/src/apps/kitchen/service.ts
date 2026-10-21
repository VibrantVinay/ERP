import { getDb } from '../../core/database';
import {
  KitchenTicket,
  KitchenTicketItem,
  KitchenStation,
  KitchenTicketPriority,
  KitchenTicketStatus,
  CreateKitchenTicketDto,
} from './types';
import { NotFoundError } from '../../core/errors';

export class KitchenService {
  private schemaInitialized = false;

  public async initDatabaseSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;
    const db = getDb();
    const isSqlite = db.type === 'sqlite';

    const createTableQuery = isSqlite
      ? `CREATE TABLE IF NOT EXISTS kitchen_tickets (
          id TEXT PRIMARY KEY,
          ticket_number TEXT NOT NULL,
          table_number TEXT NOT NULL,
          station TEXT NOT NULL,
          items_json TEXT NOT NULL,
          priority TEXT NOT NULL,
          status TEXT NOT NULL,
          branch_id TEXT NOT NULL,
          received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME
        );`
      : `CREATE TABLE IF NOT EXISTS kitchen_tickets (
          id VARCHAR(64) PRIMARY KEY,
          ticket_number VARCHAR(32) NOT NULL,
          table_number VARCHAR(64) NOT NULL,
          station VARCHAR(32) NOT NULL,
          items_json TEXT NOT NULL,
          priority VARCHAR(32) NOT NULL,
          status VARCHAR(32) NOT NULL,
          branch_id VARCHAR(64) NOT NULL,
          received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP WITH TIME ZONE
        );`;

    await db.execute(createTableQuery);

    const countRes = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM kitchen_tickets;`);
    if (Number(countRes[0]?.count || 0) === 0) {
      await this.seedInitialTickets();
    }

    this.schemaInitialized = true;
  }

  private async seedInitialTickets(): Promise<void> {
    const seedTickets = [
      {
        ticketNumber: 'GH-1048',
        tableNumber: 'Table 04',
        station: 'Hot line' as KitchenStation,
        priority: 'Normal' as KitchenTicketPriority,
        status: 'Preparing' as KitchenTicketStatus,
        receivedAt: new Date(Date.now() - 6 * 60000).toISOString(),
        items: [
          { id: 'kit_1', name: 'Truffle Mushroom Risotto', quantity: 2, station: 'Hot line' as KitchenStation, notes: 'Extra parmesan', isBumped: false },
          { id: 'kit_2', name: 'Burrata Caprese Salad', quantity: 1, station: 'Cold prep' as KitchenStation, notes: 'Balsamic on side', isBumped: true, bumpedAt: new Date().toISOString() },
        ],
      },
      {
        ticketNumber: 'GH-1049',
        tableNumber: 'Table 02',
        station: 'Hot line' as KitchenStation,
        priority: 'Rush' as KitchenTicketPriority,
        status: 'Preparing' as KitchenTicketStatus,
        receivedAt: new Date(Date.now() - 17 * 60000).toISOString(), // Delayed > 15m
        items: [
          { id: 'kit_3', name: 'Wagyu Ribeye Steak (Medium)', quantity: 1, station: 'Hot line' as KitchenStation, notes: 'URGENT VIP', isBumped: false },
          { id: 'kit_4', name: 'Charred Broccolini', quantity: 1, station: 'Hot line' as KitchenStation, notes: '', isBumped: false },
        ],
      },
      {
        ticketNumber: 'GH-1050',
        tableNumber: 'Table 06',
        station: 'Bar' as KitchenStation,
        priority: 'Allergy' as KitchenTicketPriority,
        status: 'New' as KitchenTicketStatus,
        receivedAt: new Date(Date.now() - 3 * 60000).toISOString(),
        items: [
          { id: 'kit_5', name: 'Smoked Bourbon Old Fashioned', quantity: 2, station: 'Bar' as KitchenStation, notes: 'NO NUT BITTERS (Nut Allergy)', isBumped: false },
          { id: 'kit_6', name: 'Artisan Mocktail Citrus', quantity: 1, station: 'Bar' as KitchenStation, notes: '', isBumped: false },
        ],
      },
      {
        ticketNumber: 'GH-1051',
        tableNumber: 'Table 09',
        station: 'Dessert' as KitchenStation,
        priority: 'Normal' as KitchenTicketPriority,
        status: 'Ready' as KitchenTicketStatus,
        receivedAt: new Date(Date.now() - 12 * 60000).toISOString(),
        items: [
          { id: 'kit_7', name: 'Classic Tiramisu Slice', quantity: 2, station: 'Dessert' as KitchenStation, notes: 'Cocoa dusting', isBumped: true, bumpedAt: new Date().toISOString() },
        ],
      },
    ];

    const db = getDb();
    for (const t of seedTickets) {
      const id = `kds_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await db.execute(
        `INSERT INTO kitchen_tickets (id, ticket_number, table_number, station, items_json, priority, status, branch_id, received_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          t.ticketNumber,
          t.tableNumber,
          t.station,
          JSON.stringify(t.items),
          t.priority,
          t.status,
          'branch-south-01',
          t.receivedAt,
        ]
      );
    }
  }

  public async getTickets(filters?: { station?: string; activeOnly?: boolean; branchId?: string }): Promise<KitchenTicket[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    let query = `SELECT * FROM kitchen_tickets WHERE 1=1`;
    const params: any[] = [];

    if (filters?.station && filters.station !== 'all') {
      query += ` AND station = ?`;
      params.push(filters.station);
    }

    if (filters?.activeOnly) {
      query += ` AND status NOT IN ('Served', 'Completed')`;
    }

    if (filters?.branchId) {
      query += ` AND branch_id = ?`;
      params.push(filters.branchId);
    }

    query += ` ORDER BY received_at ASC;`;

    const rows = await db.query<any>(query, params);
    return rows.map(r => this.hydrateTicket(r));
  }

  public async getTicketById(id: string): Promise<KitchenTicket> {
    await this.initDatabaseSchema();
    const db = getDb();
    const rows = await db.query<any>(
      `SELECT * FROM kitchen_tickets WHERE id = ? OR ticket_number = ? LIMIT 1;`,
      [id, id]
    );

    if (rows.length === 0) {
      throw new NotFoundError(`Kitchen ticket '${id}' not found`);
    }

    return this.hydrateTicket(rows[0]);
  }

  public async createTicket(dto: CreateKitchenTicketDto): Promise<KitchenTicket> {
    await this.initDatabaseSchema();
    const db = getDb();
    const id = `kds_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const receivedAt = new Date().toISOString();

    const items: KitchenTicketItem[] = dto.items.map((item, idx) => ({
      id: `kitem_${Date.now()}_${idx}`,
      name: item.name,
      quantity: item.quantity,
      station: item.station || dto.station || 'Hot line',
      notes: item.notes,
      isBumped: false,
    }));

    const primaryStation = dto.station || items[0]?.station || 'Hot line';
    const priority = dto.priority || 'Normal';
    const branchId = dto.branchId || 'branch-south-01';

    await db.execute(
      `INSERT INTO kitchen_tickets (id, ticket_number, table_number, station, items_json, priority, status, branch_id, received_at)
       VALUES (?, ?, ?, ?, ?, ?, 'New', ?, ?)`,
      [
        id,
        dto.ticketNumber,
        dto.tableNumber,
        primaryStation,
        JSON.stringify(items),
        priority,
        branchId,
        receivedAt,
      ]
    );

    return this.getTicketById(id);
  }

  public async updateStatus(id: string, status: KitchenTicketStatus): Promise<KitchenTicket> {
    await this.initDatabaseSchema();
    const ticket = await this.getTicketById(id);
    const db = getDb();
    const completedAt = status === 'Ready' || status === 'Served' ? new Date().toISOString() : null;

    // If marking ready, also mark all items bumped
    let updatedItems = ticket.items;
    if (status === 'Ready' || status === 'Served') {
      updatedItems = updatedItems.map(item => ({
        ...item,
        isBumped: true,
        bumpedAt: item.bumpedAt || new Date().toISOString(),
      }));
    }

    await db.execute(
      `UPDATE kitchen_tickets SET status = ?, completed_at = ?, items_json = ? WHERE id = ?;`,
      [status, completedAt, JSON.stringify(updatedItems), ticket.id]
    );

    return this.getTicketById(ticket.id);
  }

  public async bumpItem(ticketId: string, itemId: string): Promise<KitchenTicket> {
    await this.initDatabaseSchema();
    const ticket = await this.getTicketById(ticketId);
    const db = getDb();

    let allBumped = true;
    const updatedItems = ticket.items.map(item => {
      if (item.id === itemId) {
        const nextBumped = !item.isBumped;
        if (!nextBumped) allBumped = false;
        return {
          ...item,
          isBumped: nextBumped,
          bumpedAt: nextBumped ? new Date().toISOString() : undefined,
        };
      }
      if (!item.isBumped) allBumped = false;
      return item;
    });

    // If every item is now bumped, automatically transition ticket to Ready!
    const nextTicketStatus: KitchenTicketStatus = allBumped ? 'Ready' : ticket.status === 'New' ? 'Preparing' : ticket.status;

    await db.execute(
      `UPDATE kitchen_tickets SET items_json = ?, status = ? WHERE id = ?;`,
      [JSON.stringify(updatedItems), nextTicketStatus, ticket.id]
    );

    return this.getTicketById(ticket.id);
  }

  public async getStations(): Promise<Array<{ station: KitchenStation; activeCount: number; delayedCount: number }>> {
    await this.initDatabaseSchema();
    const allTickets = await this.getTickets({ activeOnly: true });
    const stations: KitchenStation[] = ['Hot line', 'Cold prep', 'Bar', 'Dessert'];

    return stations.map(station => {
      const stationTickets = allTickets.filter(t => t.station === station);
      return {
        station,
        activeCount: stationTickets.length,
        delayedCount: stationTickets.filter(t => (t.elapsedMinutes || 0) > 15).length,
      };
    });
  }

  private hydrateTicket(row: any): KitchenTicket {
    let items: KitchenTicketItem[] = [];
    try {
      items = JSON.parse(row.items_json || '[]');
    } catch (e) {
      items = [];
    }

    const receivedTime = new Date(row.received_at).getTime();
    const nowTime = Date.now();
    const elapsedMinutes = Math.max(0, Math.floor((nowTime - receivedTime) / 60000));

    let status = row.status as KitchenTicketStatus;
    // Delayed escalation rule: if not completed and elapsed > 15 mins, tag as Delayed
    if (elapsedMinutes > 15 && (status === 'New' || status === 'Preparing')) {
      status = 'Delayed';
    }

    return {
      id: row.id,
      ticketNumber: row.ticket_number,
      tableNumber: row.table_number,
      station: row.station,
      items,
      priority: row.priority,
      status,
      receivedAt: row.received_at,
      elapsedMinutes,
      completedAt: row.completed_at,
      branchId: row.branch_id,
    };
  }
}

export const kitchenService = new KitchenService();
