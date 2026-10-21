import { getDb } from '../../core/database';
import {
  MenuItem,
  MenuAvailability,
  ModifierGroup,
  CreateMenuItemDto,
  UpdateMenuItemDto,
} from './types';
import { NotFoundError } from '../../core/errors';

export class MenuService {
  private schemaInitialized = false;

  public async initDatabaseSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;
    const db = getDb();
    const isSqlite = db.type === 'sqlite';

    const createTable = isSqlite
      ? `CREATE TABLE IF NOT EXISTS menu_items (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          price REAL NOT NULL,
          description TEXT,
          allergens_json TEXT NOT NULL,
          modifiers_json TEXT NOT NULL,
          availability TEXT NOT NULL,
          tax_rate REAL DEFAULT 5.0,
          branch_id TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      : `CREATE TABLE IF NOT EXISTS menu_items (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          category VARCHAR(64) NOT NULL,
          price NUMERIC(10, 2) NOT NULL,
          description TEXT,
          allergens_json TEXT NOT NULL,
          modifiers_json TEXT NOT NULL,
          availability VARCHAR(32) NOT NULL,
          tax_rate NUMERIC(5, 2) DEFAULT 5.0,
          branch_id VARCHAR(64) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`;

    await db.execute(createTable);

    const countRes = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM menu_items;`);
    if (Number(countRes[0]?.count || 0) === 0) {
      await this.seedInitialMenu();
    }

    this.schemaInitialized = true;
  }

  private async seedInitialMenu(): Promise<void> {
    const seed: CreateMenuItemDto[] = [
      {
        name: 'Burrata Caprese Salad',
        category: 'Small plates',
        price: 425,
        description: 'Heirloom tomatoes, fresh burrata pugliese, basil pesto, balsamic reduction',
        allergens: ['Dairy'],
        availability: 'Available',
        modifierGroups: [
          {
            id: 'mod_portion',
            name: 'Portion Size',
            minSelection: 1,
            maxSelection: 1,
            options: [
              { id: 'opt_reg', name: 'Regular', priceDelta: 0 },
              { id: 'opt_large', name: 'Large Sharing', priceDelta: 150 },
            ],
          },
        ],
      },
      {
        name: 'Truffle Mushroom Risotto',
        category: 'Mains',
        price: 750,
        description: 'Carnaroli rice, porcini mushrooms, black truffle oil, 24m parmigiano',
        allergens: ['Dairy'],
        availability: 'Available',
      },
      {
        name: 'Charred Wagyu Ribeye Steak',
        category: 'Mains',
        price: 1450,
        description: 'A5 Miyazaki Wagyu ribeye, smoked bone marrow butter, chimichurri',
        allergens: [],
        availability: 'Available',
        modifierGroups: [
          {
            id: 'mod_doneness',
            name: 'Meat Doneness',
            minSelection: 1,
            maxSelection: 1,
            options: [
              { id: 'opt_rare', name: 'Rare', priceDelta: 0 },
              { id: 'opt_med_rare', name: 'Medium Rare', priceDelta: 0 },
              { id: 'opt_med', name: 'Medium', priceDelta: 0 },
              { id: 'opt_well', name: 'Well Done', priceDelta: 0 },
            ],
          },
        ],
      },
      {
        name: 'Artisan Garlic Sourdough',
        category: 'Sides',
        price: 180,
        description: 'Slow fermented sourdough loaf, roasted garlic parsley compound butter',
        allergens: ['Gluten', 'Dairy'],
        availability: 'Available',
      },
      {
        name: 'Smoked Bourbon Old Fashioned',
        category: 'Drinks',
        price: 490,
        description: 'Woodford reserve, angostura, charred orange peel, applewood smoke',
        allergens: [],
        availability: 'Available',
      },
      {
        name: 'Dark Chocolate Lava Cake',
        category: 'Desserts',
        price: 360,
        description: '70% Valrhona dark cocoa, molten core, Tahitian vanilla bean gelato',
        allergens: ['Dairy', 'Gluten', 'Eggs'],
        availability: 'Sold out',
      },
    ];

    for (const item of seed) {
      await this.create(item);
    }
  }

  public async getItems(filters?: { category?: string; availability?: string; branchId?: string }): Promise<MenuItem[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    let query = `SELECT * FROM menu_items WHERE 1=1`;
    const params: any[] = [];

    if (filters?.category && filters.category !== 'all') {
      query += ` AND category = ?`;
      params.push(filters.category);
    }
    if (filters?.availability && filters.availability !== 'all') {
      query += ` AND availability = ?`;
      params.push(filters.availability);
    }
    if (filters?.branchId) {
      query += ` AND branch_id = ?`;
      params.push(filters.branchId);
    }

    query += ` ORDER BY category ASC, name ASC;`;

    const rows = await db.query<any>(query, params);
    return rows.map(r => this.hydrateItem(r));
  }

  public async getItemById(id: string): Promise<MenuItem> {
    await this.initDatabaseSchema();
    const db = getDb();
    const rows = await db.query<any>(`SELECT * FROM menu_items WHERE id = ? LIMIT 1;`, [id]);
    if (rows.length === 0) {
      throw new NotFoundError(`Menu item '${id}' not found`);
    }
    return this.hydrateItem(rows[0]);
  }

  public async create(dto: CreateMenuItemDto): Promise<MenuItem> {
    await this.initDatabaseSchema();
    const db = getDb();
    const id = `menu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const branchId = dto.branchId || 'branch-south-01';
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO menu_items (
        id, name, category, price, description, allergens_json, modifiers_json,
        availability, tax_rate, branch_id, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        dto.name,
        dto.category,
        dto.price,
        dto.description || null,
        JSON.stringify(dto.allergens || []),
        JSON.stringify(dto.modifierGroups || []),
        dto.availability || 'Available',
        dto.taxRatePercent || 5.0,
        branchId,
        now,
      ]
    );

    return this.getItemById(id);
  }

  public async update(id: string, dto: UpdateMenuItemDto): Promise<MenuItem> {
    await this.initDatabaseSchema();
    const item = await this.getItemById(id);
    const db = getDb();
    const now = new Date().toISOString();

    const name = dto.name !== undefined ? dto.name : item.name;
    const category = dto.category !== undefined ? dto.category : item.category;
    const price = dto.price !== undefined ? dto.price : item.price;
    const description = dto.description !== undefined ? dto.description : item.description;
    const allergens = dto.allergens !== undefined ? JSON.stringify(dto.allergens) : JSON.stringify(item.allergens);
    const modifiers = dto.modifierGroups !== undefined ? JSON.stringify(dto.modifierGroups) : JSON.stringify(item.modifierGroups || []);
    const availability = dto.availability !== undefined ? dto.availability : item.availability;
    const taxRate = dto.taxRatePercent !== undefined ? dto.taxRatePercent : item.taxRatePercent;

    await db.execute(
      `UPDATE menu_items SET
        name = ?, category = ?, price = ?, description = ?,
        allergens_json = ?, modifiers_json = ?, availability = ?, tax_rate = ?, updated_at = ?
       WHERE id = ?;`,
      [name, category, price, description, allergens, modifiers, availability, taxRate, now, item.id]
    );

    return this.getItemById(item.id);
  }

  public async updateAvailability(id: string, availability: MenuAvailability): Promise<MenuItem> {
    return this.update(id, { availability });
  }

  public async getCategories(): Promise<string[]> {
    return ['Small plates', 'Mains', 'Sides', 'Desserts', 'Drinks'];
  }

  private hydrateItem(row: any): MenuItem {
    let allergens: string[] = [];
    let modifierGroups: ModifierGroup[] = [];
    try {
      allergens = JSON.parse(row.allergens_json || '[]');
      modifierGroups = JSON.parse(row.modifiers_json || '[]');
    } catch (e) {
      allergens = [];
      modifierGroups = [];
    }

    return {
      id: row.id,
      name: row.name,
      category: row.category,
      price: Number(row.price),
      description: row.description,
      allergens,
      modifierGroups,
      availability: row.availability,
      taxRatePercent: Number(row.tax_rate),
      branchId: row.branch_id,
      updatedAt: row.updated_at,
    };
  }
}

export const menuService = new MenuService();
