import { getDb } from '../../core/database';
import {
  StockMovement,
  CreateStockMovementDto,
  VarianceSummary,
  MovementType,
} from './types';
import { NotFoundError, ValidationError } from '../../core/errors';

export class StockMovementService {
  private schemaInitialized = false;

  public async initDatabaseSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;
    const db = getDb();
    const isSqlite = db.type === 'sqlite';

    const createTableQuery = isSqlite
      ? `CREATE TABLE IF NOT EXISTS stock_movements (
          id TEXT PRIMARY KEY,
          movement_number TEXT NOT NULL UNIQUE,
          type TEXT NOT NULL,
          item_id TEXT NOT NULL,
          item_name TEXT NOT NULL,
          sku TEXT NOT NULL,
          quantity REAL NOT NULL,
          unit TEXT NOT NULL,
          unit_cost REAL NOT NULL,
          total_cost REAL NOT NULL,
          from_location TEXT NOT NULL,
          to_location TEXT NOT NULL,
          reason TEXT NOT NULL,
          notes TEXT,
          performed_by TEXT NOT NULL,
          branch_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      : `CREATE TABLE IF NOT EXISTS stock_movements (
          id VARCHAR(64) PRIMARY KEY,
          movement_number VARCHAR(32) NOT NULL UNIQUE,
          type VARCHAR(32) NOT NULL,
          item_id VARCHAR(64) NOT NULL,
          item_name VARCHAR(128) NOT NULL,
          sku VARCHAR(64) NOT NULL,
          quantity NUMERIC(10, 2) NOT NULL,
          unit VARCHAR(32) NOT NULL,
          unit_cost NUMERIC(10, 2) NOT NULL,
          total_cost NUMERIC(10, 2) NOT NULL,
          from_location VARCHAR(64) NOT NULL,
          to_location VARCHAR(64) NOT NULL,
          reason VARCHAR(128) NOT NULL,
          notes TEXT,
          performed_by VARCHAR(128) NOT NULL,
          branch_id VARCHAR(64) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`;

    await db.execute(createTableQuery);

    const countRes = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM stock_movements;`);
    if (Number(countRes[0]?.count || 0) === 0) {
      await this.seedInitialMovements();
    }
  }

  private async seedInitialMovements(): Promise<void> {
    const db = getDb();
    const now = Date.now();

    const sampleMovements: CreateStockMovementDto[] = [
      {
        type: 'Waste',
        itemId: 'inv_tomatoes',
        itemName: 'Heirloom Vine Tomatoes',
        sku: 'PRD-330198',
        quantity: 1.5,
        unit: 'kg',
        unitCost: 180,
        fromLocation: 'Produce prep',
        toLocation: 'Disposal / Waste Bin',
        reason: 'Overripe',
        notes: 'Excess soft bruising during hot humid prep shift',
        performedBy: 'Samira Khan (Chef)',
        branchId: 'branch-south-01',
      },
      {
        type: 'Transfer',
        itemId: 'inv_rice',
        itemName: 'Carnaroli Risotto Rice',
        sku: 'RCE-890104',
        quantity: 5.0,
        unit: 'kg',
        unitCost: 350,
        fromLocation: 'Dry store',
        toLocation: 'Hot line',
        reason: 'Shift Restock',
        notes: 'Replenishing hot line grain bin for dinner service rush',
        performedBy: 'Ravi Naik (Server/Prep)',
        branchId: 'branch-south-01',
      },
      {
        type: 'Waste',
        itemId: 'inv_burrata',
        itemName: 'Fresh Burrata Pugliese',
        sku: 'DRY-104921',
        quantity: 2,
        unit: 'pcs',
        unitCost: 85,
        fromLocation: 'Walk-in chiller',
        toLocation: 'Disposal / Waste Bin',
        reason: 'Expired',
        notes: 'Passed 48-hour post-opening shelf life quality standard',
        performedBy: 'Samira Khan (Chef)',
        branchId: 'branch-south-01',
      },
      {
        type: 'CountVariance',
        itemId: 'inv_bourbon',
        itemName: 'Woodford Reserve Bourbon',
        sku: 'BEV-449102',
        quantity: -0.4,
        unit: 'L',
        unitCost: 3400,
        fromLocation: 'Bar',
        toLocation: 'Bar',
        reason: 'Physical Count Reconciled',
        notes: 'Weekly bar inventory discrepancy after cocktail prep spillage',
        performedBy: 'Mina D’Souza (Manager)',
        branchId: 'branch-south-01',
      },
    ];

    for (let i = 0; i < sampleMovements.length; i++) {
      const m = sampleMovements[i];
      const id = `smv_${now}_${i}`;
      const movNumber = `MOV-2026-${1000 + i}`;
      const totalCost = Math.round(Math.abs(m.quantity) * m.unitCost * 100) / 100;
      const createdAt = new Date(now - (sampleMovements.length - i) * 3600000).toISOString();

      await db.execute(
        `INSERT INTO stock_movements (
          id, movement_number, type, item_id, item_name, sku,
          quantity, unit, unit_cost, total_cost, from_location, to_location,
          reason, notes, performed_by, branch_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          movNumber,
          m.type,
          m.itemId,
          m.itemName,
          m.sku,
          m.quantity,
          m.unit,
          m.unitCost,
          totalCost,
          m.fromLocation,
          m.toLocation,
          m.reason,
          m.notes || null,
          m.performedBy,
          m.branchId || 'branch-south-01',
          createdAt,
        ]
      );
    }
  }

  public async getMovements(filters?: { type?: string; branchId?: string }): Promise<StockMovement[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    let sql = `SELECT * FROM stock_movements WHERE 1=1`;
    const params: any[] = [];

    if (filters?.type && filters.type !== 'all') {
      sql += ` AND LOWER(type) = LOWER(?)`;
      params.push(filters.type);
    }
    if (filters?.branchId) {
      sql += ` AND branch_id = ?`;
      params.push(filters.branchId);
    }

    sql += ` ORDER BY created_at DESC;`;
    const rows = await db.query<any>(sql, params);
    return rows.map(r => this.hydrateMovement(r));
  }

  public async getMovementById(id: string): Promise<StockMovement> {
    await this.initDatabaseSchema();
    const db = getDb();
    const rows = await db.query<any>(`SELECT * FROM stock_movements WHERE id = ? OR movement_number = ? LIMIT 1;`, [id, id]);
    if (rows.length === 0) {
      throw new NotFoundError(`Stock movement '${id}' not found`);
    }
    return this.hydrateMovement(rows[0]);
  }

  public async createMovement(dto: CreateStockMovementDto): Promise<StockMovement> {
    await this.initDatabaseSchema();
    const db = getDb();
    const id = `smv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const movNumber = `MOV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalCost = Math.round(Math.abs(dto.quantity) * dto.unitCost * 100) / 100;
    const now = new Date().toISOString();
    const branchId = dto.branchId || 'branch-south-01';

    await db.execute(
      `INSERT INTO stock_movements (
        id, movement_number, type, item_id, item_name, sku,
        quantity, unit, unit_cost, total_cost, from_location, to_location,
        reason, notes, performed_by, branch_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        movNumber,
        dto.type,
        dto.itemId,
        dto.itemName,
        dto.sku,
        dto.quantity,
        dto.unit,
        dto.unitCost,
        totalCost,
        dto.fromLocation,
        dto.toLocation,
        dto.reason,
        dto.notes || null,
        dto.performedBy,
        branchId,
        now,
      ]
    );

    // If movement impacts inventory stock (Waste, Adjustment, CountVariance):
    try {
      if (dto.type === 'Waste' || (dto.type === 'Adjustment' && dto.quantity < 0)) {
        await db.execute(
          `UPDATE inventory_items SET current_stock = MAX(0, current_stock - ?), updated_at = ? WHERE sku = ? OR name = ?`,
          [Math.abs(dto.quantity), now, dto.sku, dto.itemName]
        );
      } else if (dto.type === 'Adjustment' && dto.quantity > 0) {
        await db.execute(
          `UPDATE inventory_items SET current_stock = current_stock + ?, updated_at = ? WHERE sku = ? OR name = ?`,
          [dto.quantity, now, dto.sku, dto.itemName]
        );
      }
    } catch (e) {
      // Best-effort inventory sync
    }

    return this.getMovementById(id);
  }

  public async getVarianceSummary(): Promise<VarianceSummary> {
    await this.initDatabaseSchema();
    const db = getDb();
    const rows = await db.query<any>(`SELECT * FROM stock_movements ORDER BY created_at DESC;`);

    let totalWasteCost = 0;
    let totalAdjustmentCost = 0;
    let totalTransfersCount = 0;
    const wasteByReason: Record<string, { count: number; cost: number }> = {};

    for (const r of rows) {
      const cost = Number(r.total_cost || 0);
      if (r.type === 'Waste') {
        totalWasteCost += cost;
        const reason = r.reason || 'Other';
        if (!wasteByReason[reason]) {
          wasteByReason[reason] = { count: 0, cost: 0 };
        }
        wasteByReason[reason].count += 1;
        wasteByReason[reason].cost += cost;
      } else if (r.type === 'Adjustment' || r.type === 'CountVariance') {
        totalAdjustmentCost += cost;
      } else if (r.type === 'Transfer') {
        totalTransfersCount += 1;
      }
    }

    return {
      totalWasteCost: Math.round(totalWasteCost * 100) / 100,
      totalAdjustmentCost: Math.round(totalAdjustmentCost * 100) / 100,
      totalTransfersCount,
      wasteByReason,
      recentMovementsCount: rows.length,
    };
  }

  private hydrateMovement(row: any): StockMovement {
    return {
      id: row.id,
      movementNumber: row.movement_number,
      type: row.type as MovementType,
      itemId: row.item_id,
      itemName: row.item_name,
      sku: row.sku,
      quantity: Number(row.quantity),
      unit: row.unit,
      unitCost: Number(row.unit_cost),
      totalCost: Number(row.total_cost),
      fromLocation: row.from_location,
      toLocation: row.to_location,
      reason: row.reason,
      notes: row.notes || undefined,
      performedBy: row.performed_by,
      branchId: row.branch_id,
      createdAt: row.created_at,
    };
  }
}

export const stockMovementService = new StockMovementService();
