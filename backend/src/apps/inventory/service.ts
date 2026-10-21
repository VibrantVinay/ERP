import { getDb } from '../../core/database';
import {
  InventoryItem,
  BatchRecord,
  StorageLocation,
  StockStatus,
  CreateInventoryItemDto,
  AddBatchDto,
  AdjustStockDto,
} from './types';
import { NotFoundError, ValidationError } from '../../core/errors';

export class InventoryService {
  private schemaInitialized = false;

  public async initDatabaseSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;
    const db = getDb();
    const isSqlite = db.type === 'sqlite';

    const createItemsTable = isSqlite
      ? `CREATE TABLE IF NOT EXISTS inventory_items (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          sku TEXT UNIQUE NOT NULL,
          category TEXT NOT NULL,
          location TEXT NOT NULL,
          current_stock REAL NOT NULL,
          unit TEXT NOT NULL,
          reorder_level REAL NOT NULL,
          unit_cost REAL NOT NULL,
          branch_id TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      : `CREATE TABLE IF NOT EXISTS inventory_items (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          sku VARCHAR(64) UNIQUE NOT NULL,
          category VARCHAR(64) NOT NULL,
          location VARCHAR(64) NOT NULL,
          current_stock NUMERIC(10, 2) NOT NULL,
          unit VARCHAR(32) NOT NULL,
          reorder_level NUMERIC(10, 2) NOT NULL,
          unit_cost NUMERIC(10, 2) NOT NULL,
          branch_id VARCHAR(64) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`;

    const createBatchesTable = isSqlite
      ? `CREATE TABLE IF NOT EXISTS inventory_batches (
          id TEXT PRIMARY KEY,
          item_id TEXT NOT NULL,
          batch_number TEXT NOT NULL,
          quantity REAL NOT NULL,
          production_date TEXT NOT NULL,
          expiration_date TEXT NOT NULL
        );`
      : `CREATE TABLE IF NOT EXISTS inventory_batches (
          id VARCHAR(64) PRIMARY KEY,
          item_id VARCHAR(64) NOT NULL,
          batch_number VARCHAR(64) NOT NULL,
          quantity NUMERIC(10, 2) NOT NULL,
          production_date VARCHAR(32) NOT NULL,
          expiration_date VARCHAR(32) NOT NULL
        );`;

    await db.execute(createItemsTable);
    await db.execute(createBatchesTable);

    const countRes = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM inventory_items;`);
    if (Number(countRes[0]?.count || 0) === 0) {
      await this.seedInitialInventory();
    }

    this.schemaInitialized = true;
  }

  private async seedInitialInventory(): Promise<void> {
    const today = new Date();
    const expSoon = new Date(today.getTime() + 4 * 86400000).toISOString().split('T')[0];
    const expLater = new Date(today.getTime() + 90 * 86400000).toISOString().split('T')[0];

    const seedItems: CreateInventoryItemDto[] = [
      {
        name: 'Carnaroli Risotto Rice',
        sku: 'RCE-890104',
        category: 'Grains & Pasta',
        location: 'Dry store',
        currentStock: 8.4,
        unit: 'kg',
        reorderLevel: 5.0,
        unitCost: 220,
        initialBatchNumber: 'B-214',
        expirationDate: expLater,
      },
      {
        name: 'Fresh Burrata Pugliese',
        sku: 'BUR-890281',
        category: 'Dairy',
        location: 'Walk-in chiller',
        currentStock: 2.0,
        unit: 'kg',
        reorderLevel: 4.0, // Low stock
        unitCost: 680,
        initialBatchNumber: 'B-047',
        expirationDate: expSoon, // Expiring soon
      },
      {
        name: 'Organic Blood Orange',
        sku: 'ORG-890312',
        category: 'Produce',
        location: 'Produce prep',
        currentStock: 4.0,
        unit: 'kg',
        reorderLevel: 6.0, // Low stock
        unitCost: 160,
        initialBatchNumber: 'B-118',
        expirationDate: expSoon, // Expiring soon
      },
      {
        name: 'Cold Pressed EVOO',
        sku: 'OIL-890480',
        category: 'Oils & Condiments',
        location: 'Dry store',
        currentStock: 14.5,
        unit: 'L',
        reorderLevel: 5.0,
        unitCost: 940,
        initialBatchNumber: 'B-032',
        expirationDate: expLater,
      },
      {
        name: 'Woodford Reserve Bourbon',
        sku: 'BRB-890901',
        category: 'Spirits',
        location: 'Bar',
        currentStock: 5.0,
        unit: 'bottles',
        reorderLevel: 2.0,
        unitCost: 3200,
        initialBatchNumber: 'B-990',
        expirationDate: '2028-12-31',
      },
      {
        name: 'A5 Wagyu Ribeye Cut',
        sku: 'WAG-890550',
        category: 'Meat & Poultry',
        location: 'Walk-in chiller',
        currentStock: 0.8,
        unit: 'kg',
        reorderLevel: 2.5, // Low stock
        unitCost: 8500,
        initialBatchNumber: 'B-771',
        expirationDate: expSoon,
      },
    ];

    for (const item of seedItems) {
      await this.createItem(item);
    }
  }

  public async getItems(filters?: { location?: string; status?: string; branchId?: string }): Promise<InventoryItem[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    let query = `SELECT * FROM inventory_items WHERE 1=1`;
    const params: any[] = [];

    if (filters?.location && filters.location !== 'all') {
      query += ` AND location = ?`;
      params.push(filters.location);
    }
    if (filters?.branchId) {
      query += ` AND branch_id = ?`;
      params.push(filters.branchId);
    }

    query += ` ORDER BY name ASC;`;

    const rows = await db.query<any>(query, params);
    const items = await Promise.all(rows.map(r => this.hydrateItem(r)));

    if (filters?.status && filters.status !== 'all') {
      return items.filter(i => i.status.toLowerCase() === filters.status!.toLowerCase());
    }

    return items;
  }

  public async getItemById(id: string): Promise<InventoryItem> {
    await this.initDatabaseSchema();
    const db = getDb();
    const rows = await db.query<any>(`SELECT * FROM inventory_items WHERE id = ? OR sku = ? LIMIT 1;`, [id, id]);
    if (rows.length === 0) {
      throw new NotFoundError(`Inventory item '${id}' not found`);
    }
    return this.hydrateItem(rows[0]);
  }

  public async createItem(dto: CreateInventoryItemDto): Promise<InventoryItem> {
    await this.initDatabaseSchema();
    const db = getDb();
    const id = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const branchId = dto.branchId || 'branch-south-01';
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO inventory_items (
        id, name, sku, category, location, current_stock, unit, reorder_level,
        unit_cost, branch_id, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        dto.name,
        dto.sku,
        dto.category,
        dto.location,
        dto.currentStock,
        dto.unit,
        dto.reorderLevel,
        dto.unitCost,
        branchId,
        now,
      ]
    );

    if (dto.initialBatchNumber && dto.expirationDate) {
      const batchId = `bat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await db.execute(
        `INSERT INTO inventory_batches (id, item_id, batch_number, quantity, production_date, expiration_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          batchId,
          id,
          dto.initialBatchNumber,
          dto.currentStock,
          now.split('T')[0],
          dto.expirationDate,
        ]
      );
    }

    return this.getItemById(id);
  }

  public async addBatch(dto: AddBatchDto): Promise<BatchRecord> {
    await this.initDatabaseSchema();
    const item = await this.getItemById(dto.itemId);
    const db = getDb();
    const batchId = `bat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const prodDate = dto.productionDate || new Date().toISOString().split('T')[0];

    await db.execute(
      `INSERT INTO inventory_batches (id, item_id, batch_number, quantity, production_date, expiration_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [batchId, item.id, dto.batchNumber, dto.quantity, prodDate, dto.expirationDate]
    );

    // Increase current stock
    await this.adjustStock(item.id, {
      quantityDelta: dto.quantity,
      reason: `Batch ${dto.batchNumber} received`,
    });

    return {
      id: batchId,
      itemId: item.id,
      batchNumber: dto.batchNumber,
      quantity: dto.quantity,
      unit: item.unit,
      productionDate: prodDate,
      expirationDate: dto.expirationDate,
    };
  }

  public async adjustStock(id: string, dto: AdjustStockDto): Promise<InventoryItem> {
    await this.initDatabaseSchema();
    const item = await this.getItemById(id);
    const db = getDb();
    const newStock = Math.max(0, Math.round((item.currentStock + dto.quantityDelta) * 100) / 100);
    const now = new Date().toISOString();

    await db.execute(
      `UPDATE inventory_items SET current_stock = ?, updated_at = ? WHERE id = ?;`,
      [newStock, now, item.id]
    );

    return this.getItemById(item.id);
  }

  public async getAlerts(): Promise<{ lowStock: InventoryItem[]; expiringSoon: InventoryItem[] }> {
    const all = await this.getItems();
    return {
      lowStock: all.filter(i => i.status === 'Low stock' || i.status === 'Out of stock'),
      expiringSoon: all.filter(i => i.status === 'Expiring soon'),
    };
  }

  public async getLocations(): Promise<StorageLocation[]> {
    return ['Dry store', 'Walk-in chiller', 'Produce prep', 'Bar', 'Freezer'];
  }

  private async hydrateItem(row: any): Promise<InventoryItem> {
    const db = getDb();
    const batchRows = await db.query<any>(
      `SELECT * FROM inventory_batches WHERE item_id = ? ORDER BY expiration_date ASC;`,
      [row.id]
    );

    const now = Date.now();
    const sevenDaysMs = 7 * 86400000;

    let hasExpiringSoon = false;
    const batches: BatchRecord[] = batchRows.map(b => {
      const expTime = new Date(b.expiration_date).getTime();
      const isExpSoon = expTime - now <= sevenDaysMs;
      if (isExpSoon) hasExpiringSoon = true;
      return {
        id: b.id,
        itemId: b.item_id,
        batchNumber: b.batch_number,
        quantity: Number(b.quantity),
        unit: row.unit,
        productionDate: b.production_date,
        expirationDate: b.expiration_date,
        isExpiringSoon: isExpSoon,
      };
    });

    const stock = Number(row.current_stock);
    const reorder = Number(row.reorder_level);

    let status: StockStatus = 'In stock';
    if (stock <= 0) {
      status = 'Out of stock';
    } else if (stock <= reorder) {
      status = 'Low stock';
    } else if (hasExpiringSoon) {
      status = 'Expiring soon';
    }

    return {
      id: row.id,
      name: row.name,
      sku: row.sku,
      category: row.category,
      location: row.location as StorageLocation,
      currentStock: stock,
      unit: row.unit,
      reorderLevel: reorder,
      unitCost: Number(row.unit_cost),
      batches,
      status,
      branchId: row.branch_id,
      updatedAt: row.updated_at,
    };
  }
}

export const inventoryService = new InventoryService();
