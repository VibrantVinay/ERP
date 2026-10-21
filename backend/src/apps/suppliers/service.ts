import { getDb } from '../../core/database';
import {
  Supplier,
  PurchaseOrder,
  CreateSupplierDto,
  CreatePurchaseOrderDto,
  UpdatePOStatusDto,
  POStatus,
} from './types';
import { NotFoundError, ValidationError } from '../../core/errors';

export class SupplierService {
  private schemaInitialized = false;

  public async initDatabaseSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;
    const db = getDb();
    const isSqlite = db.type === 'sqlite';

    const createSuppliersTable = isSqlite
      ? `CREATE TABLE IF NOT EXISTS suppliers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          code TEXT NOT NULL UNIQUE,
          contact_person TEXT NOT NULL,
          phone TEXT NOT NULL,
          email TEXT NOT NULL,
          category TEXT NOT NULL,
          payment_terms TEXT NOT NULL,
          rating REAL DEFAULT 5.0,
          address TEXT NOT NULL,
          tax_id TEXT,
          status TEXT NOT NULL,
          branch_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      : `CREATE TABLE IF NOT EXISTS suppliers (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          code VARCHAR(32) NOT NULL UNIQUE,
          contact_person VARCHAR(128) NOT NULL,
          phone VARCHAR(32) NOT NULL,
          email VARCHAR(128) NOT NULL,
          category VARCHAR(64) NOT NULL,
          payment_terms VARCHAR(32) NOT NULL,
          rating NUMERIC(3, 2) DEFAULT 5.0,
          address TEXT NOT NULL,
          tax_id VARCHAR(64),
          status VARCHAR(32) NOT NULL,
          branch_id VARCHAR(64) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`;

    const createPOTable = isSqlite
      ? `CREATE TABLE IF NOT EXISTS purchase_orders (
          id TEXT PRIMARY KEY,
          po_number TEXT NOT NULL UNIQUE,
          supplier_id TEXT NOT NULL,
          supplier_name TEXT NOT NULL,
          status TEXT NOT NULL,
          order_date TEXT NOT NULL,
          expected_delivery_date TEXT NOT NULL,
          items_json TEXT NOT NULL,
          subtotal REAL NOT NULL,
          tax_amount REAL NOT NULL,
          total_amount REAL NOT NULL,
          notes TEXT,
          approved_by TEXT,
          received_by TEXT,
          branch_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      : `CREATE TABLE IF NOT EXISTS purchase_orders (
          id VARCHAR(64) PRIMARY KEY,
          po_number VARCHAR(32) NOT NULL UNIQUE,
          supplier_id VARCHAR(64) NOT NULL,
          supplier_name VARCHAR(128) NOT NULL,
          status VARCHAR(32) NOT NULL,
          order_date VARCHAR(32) NOT NULL,
          expected_delivery_date VARCHAR(32) NOT NULL,
          items_json TEXT NOT NULL,
          subtotal NUMERIC(10, 2) NOT NULL,
          tax_amount NUMERIC(10, 2) NOT NULL,
          total_amount NUMERIC(10, 2) NOT NULL,
          notes TEXT,
          approved_by VARCHAR(128),
          received_by VARCHAR(128),
          branch_id VARCHAR(64) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`;

    await db.execute(createSuppliersTable);
    await db.execute(createPOTable);

    const countRes = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM suppliers;`);
    if (Number(countRes[0]?.count || 0) === 0) {
      await this.seedInitialSuppliers();
    }
  }

  private async seedInitialSuppliers(): Promise<void> {
    const db = getDb();
    const suppliers: Array<CreateSupplierDto & { code: string; id: string }> = [
      {
        id: 'sup_01',
        name: 'Goa Valley Organic Farms',
        code: 'SUP-GVO',
        contactPerson: 'Sunil Karekar',
        phone: '98221 55678',
        email: 'orders@goavalleyfarms.in',
        category: 'Produce',
        paymentTerms: 'Net 15',
        rating: 4.8,
        address: 'Plot 14, Pilerne Industrial Estate, Goa 403511',
        taxId: '29AABCS1429B1Z8',
      },
      {
        id: 'sup_02',
        name: 'Milano Artisan Fromagerie & Dairy',
        code: 'SUP-MAF',
        contactPerson: 'Marco Valerio',
        phone: '98190 22311',
        email: 'sales@milanodairy.co',
        category: 'Dairy & Cheese',
        paymentTerms: 'Net 7',
        rating: 4.9,
        address: 'B-4, Royal Palms Estate, Mumbai 400065',
        taxId: '27AACCM9920A1ZX',
      },
      {
        id: 'sup_03',
        name: 'Coastal Catch Seafoods & Meats',
        code: 'SUP-CCS',
        contactPerson: 'Francis D’Cruz',
        phone: '98230 44901',
        email: 'francis@coastalcatch.in',
        category: 'Meat & Seafood',
        paymentTerms: 'COD',
        rating: 4.7,
        address: 'Jetty Road, Malim Fisheries Wharf, Panaji 403001',
        taxId: '30AADFC4509F1ZM',
      },
      {
        id: 'sup_04',
        name: 'Apex Imperial Beverages & Spirits',
        code: 'SUP-AIB',
        contactPerson: 'Rajesh Singhania',
        phone: '98200 99881',
        email: 'dispatch@apeximperial.com',
        category: 'Beverages & Spirits',
        paymentTerms: 'Net 30',
        rating: 4.6,
        address: 'Warehouse 9, Verna Logistics Park, Goa 403722',
        taxId: '30AABBA8821C1ZO',
      },
    ];

    for (const s of suppliers) {
      await db.execute(
        `INSERT INTO suppliers (
          id, name, code, contact_person, phone, email, category,
          payment_terms, rating, address, tax_id, status, branch_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', 'branch-south-01')`,
        [s.id, s.name, s.code, s.contactPerson, s.phone, s.email, s.category, s.paymentTerms, s.rating || 5, s.address, s.taxId || null]
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

    const samplePO = {
      id: 'po_01',
      poNumber: 'PO-2026-1001',
      supplierId: 'sup_02',
      supplierName: 'Milano Artisan Fromagerie & Dairy',
      status: 'Ordered' as POStatus,
      orderDate: today,
      expectedDeliveryDate: nextWeek,
      items: [
        { id: 'poi_1', ingredientName: 'Burrata Pugliese 200g', sku: 'DRY-104921', quantityOrdered: 20, quantityReceived: 0, unit: 'pcs', unitPrice: 85, totalPrice: 1700 },
        { id: 'poi_2', ingredientName: 'Parmigiano-Reggiano 24M', sku: 'DRY-773829', quantityOrdered: 5, quantityReceived: 0, unit: 'kg', unitPrice: 1200, totalPrice: 6000 },
        { id: 'poi_3', ingredientName: 'Italian Mascarpone', sku: 'DRY-552019', quantityOrdered: 6, quantityReceived: 0, unit: 'kg', unitPrice: 550, totalPrice: 3300 },
      ],
      subtotal: 11000,
      taxAmount: 550,
      totalAmount: 11550,
      notes: 'Please ensure temperature-controlled reef vehicle for delivery',
      approvedBy: 'Aarav Mehta (Owner)',
      branchId: 'branch-south-01',
    };

    await db.execute(
      `INSERT INTO purchase_orders (
        id, po_number, supplier_id, supplier_name, status, order_date,
        expected_delivery_date, items_json, subtotal, tax_amount, total_amount,
        notes, approved_by, branch_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        samplePO.id,
        samplePO.poNumber,
        samplePO.supplierId,
        samplePO.supplierName,
        samplePO.status,
        samplePO.orderDate,
        samplePO.expectedDeliveryDate,
        JSON.stringify(samplePO.items),
        samplePO.subtotal,
        samplePO.taxAmount,
        samplePO.totalAmount,
        samplePO.notes,
        samplePO.approvedBy,
        samplePO.branchId,
      ]
    );
  }

  public async getSuppliers(category?: string): Promise<Supplier[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    let sql = `SELECT * FROM suppliers WHERE 1=1`;
    const params: any[] = [];
    if (category && category !== 'all') {
      sql += ` AND category = ?`;
      params.push(category);
    }
    sql += ` ORDER BY name ASC;`;

    const rows = await db.query<any>(sql, params);
    return rows.map(r => this.hydrateSupplier(r));
  }

  public async getSupplierById(id: string): Promise<Supplier> {
    await this.initDatabaseSchema();
    const db = getDb();
    const rows = await db.query<any>(`SELECT * FROM suppliers WHERE id = ? OR code = ? LIMIT 1;`, [id, id]);
    if (rows.length === 0) {
      throw new NotFoundError(`Supplier '${id}' not found`);
    }
    return this.hydrateSupplier(rows[0]);
  }

  public async createSupplier(dto: CreateSupplierDto): Promise<Supplier> {
    await this.initDatabaseSchema();
    const db = getDb();
    const id = `sup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const code = `SUP-${dto.name.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const branchId = dto.branchId || 'branch-south-01';
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO suppliers (
        id, name, code, contact_person, phone, email, category,
        payment_terms, rating, address, tax_id, status, branch_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?)`,
      [
        id,
        dto.name,
        code,
        dto.contactPerson,
        dto.phone,
        dto.email,
        dto.category,
        dto.paymentTerms,
        dto.rating || 5.0,
        dto.address,
        dto.taxId || null,
        branchId,
        now,
        now,
      ]
    );

    return this.getSupplierById(id);
  }

  public async getPurchaseOrders(status?: string): Promise<PurchaseOrder[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    let sql = `SELECT * FROM purchase_orders WHERE 1=1`;
    const params: any[] = [];
    if (status && status !== 'all') {
      sql += ` AND LOWER(status) = LOWER(?)`;
      params.push(status);
    }
    sql += ` ORDER BY created_at DESC;`;

    const rows = await db.query<any>(sql, params);
    return rows.map(r => this.hydratePO(r));
  }

  public async getPOById(id: string): Promise<PurchaseOrder> {
    await this.initDatabaseSchema();
    const db = getDb();
    const rows = await db.query<any>(`SELECT * FROM purchase_orders WHERE id = ? OR po_number = ? LIMIT 1;`, [id, id]);
    if (rows.length === 0) {
      throw new NotFoundError(`Purchase order '${id}' not found`);
    }
    return this.hydratePO(rows[0]);
  }

  public async createPurchaseOrder(dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    await this.initDatabaseSchema();
    const supplier = await this.getSupplierById(dto.supplierId);
    const db = getDb();
    const id = `po_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    const branchId = dto.branchId || 'branch-south-01';

    const items = dto.items.map((item, idx) => ({
      id: `poi_${Date.now()}_${idx}`,
      ingredientName: item.ingredientName,
      sku: item.sku,
      quantityOrdered: item.quantityOrdered,
      quantityReceived: 0,
      unit: item.unit,
      unitPrice: item.unitPrice,
      totalPrice: Math.round(item.quantityOrdered * item.unitPrice * 100) / 100,
    }));

    const subtotal = items.reduce((sum, it) => sum + it.totalPrice, 0);
    const taxAmount = Math.round(subtotal * 0.05 * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    await db.execute(
      `INSERT INTO purchase_orders (
        id, po_number, supplier_id, supplier_name, status, order_date,
        expected_delivery_date, items_json, subtotal, tax_amount, total_amount,
        notes, branch_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'Draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        poNumber,
        supplier.id,
        supplier.name,
        today,
        dto.expectedDeliveryDate,
        JSON.stringify(items),
        subtotal,
        taxAmount,
        totalAmount,
        dto.notes || null,
        branchId,
        now,
        now,
      ]
    );

    return this.getPOById(id);
  }

  public async updatePOStatus(id: string, dto: UpdatePOStatusDto): Promise<PurchaseOrder> {
    await this.initDatabaseSchema();
    const po = await this.getPOById(id);
    const db = getDb();
    const now = new Date().toISOString();

    let approvedBy = po.approvedBy;
    let receivedBy = po.receivedBy;
    let updatedItems = [...po.items];

    if (dto.status === 'Approved') {
      approvedBy = dto.actionBy;
    } else if (dto.status === 'Received' || dto.status === 'Partially Received') {
      receivedBy = dto.actionBy;
      if (dto.receivedItems) {
        updatedItems = updatedItems.map(it => {
          const match = dto.receivedItems?.find(r => r.id === it.id);
          return match ? { ...it, quantityReceived: match.quantityReceived } : it;
        });
      } else if (dto.status === 'Received') {
        updatedItems = updatedItems.map(it => ({ ...it, quantityReceived: it.quantityOrdered }));
      }
    }

    await db.execute(
      `UPDATE purchase_orders SET
        status = ?,
        approved_by = ?,
        received_by = ?,
        items_json = ?,
        notes = COALESCE(?, notes),
        updated_at = ?
       WHERE id = ?`,
      [dto.status, approvedBy || null, receivedBy || null, JSON.stringify(updatedItems), dto.notes || null, now, po.id]
    );

    return this.getPOById(po.id);
  }

  private hydrateSupplier(row: any): Supplier {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      contactPerson: row.contact_person,
      phone: row.phone,
      email: row.email,
      category: row.category,
      paymentTerms: row.payment_terms,
      rating: Number(row.rating || 5),
      address: row.address,
      taxId: row.tax_id || undefined,
      status: row.status,
      branchId: row.branch_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private hydratePO(row: any): PurchaseOrder {
    let items = [];
    try {
      items = JSON.parse(row.items_json || '[]');
    } catch (e) {
      items = [];
    }
    return {
      id: row.id,
      poNumber: row.po_number,
      supplierId: row.supplier_id,
      supplierName: row.supplier_name,
      status: row.status,
      orderDate: row.order_date,
      expectedDeliveryDate: row.expected_delivery_date,
      items,
      subtotal: Number(row.subtotal),
      taxAmount: Number(row.tax_amount),
      totalAmount: Number(row.total_amount),
      notes: row.notes || undefined,
      approvedBy: row.approved_by || undefined,
      receivedBy: row.received_by || undefined,
      branchId: row.branch_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const supplierService = new SupplierService();

