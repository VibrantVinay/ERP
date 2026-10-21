import { getDb } from '../../core/database';
import {
  Recipe,
  RecipeIngredient,
  CreateRecipeDto,
  RecipeCostAnalysis,
} from './types';
import { NotFoundError } from '../../core/errors';

export class RecipeService {
  private schemaInitialized = false;

  public async initDatabaseSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;
    const db = getDb();
    const isSqlite = db.type === 'sqlite';

    const createTable = isSqlite
      ? `CREATE TABLE IF NOT EXISTS recipes (
          id TEXT PRIMARY KEY,
          menu_item_id TEXT,
          dish_name TEXT NOT NULL,
          category TEXT NOT NULL,
          selling_price REAL NOT NULL,
          yield_portions INTEGER NOT NULL,
          preparation_minutes INTEGER NOT NULL,
          ingredients_json TEXT NOT NULL,
          total_portion_cost REAL NOT NULL,
          food_cost_percentage REAL NOT NULL,
          gross_margin_percentage REAL NOT NULL,
          branch_id TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      : `CREATE TABLE IF NOT EXISTS recipes (
          id VARCHAR(64) PRIMARY KEY,
          menu_item_id VARCHAR(64),
          dish_name VARCHAR(128) NOT NULL,
          category VARCHAR(64) NOT NULL,
          selling_price NUMERIC(10, 2) NOT NULL,
          yield_portions INTEGER NOT NULL,
          preparation_minutes INTEGER NOT NULL,
          ingredients_json TEXT NOT NULL,
          total_portion_cost NUMERIC(10, 2) NOT NULL,
          food_cost_percentage NUMERIC(5, 2) NOT NULL,
          gross_margin_percentage NUMERIC(5, 2) NOT NULL,
          branch_id VARCHAR(64) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`;

    await db.execute(createTable);

    const countRes = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM recipes;`);
    if (Number(countRes[0]?.count || 0) === 0) {
      await this.seedInitialRecipes();
    }

    this.schemaInitialized = true;
  }

  private async seedInitialRecipes(): Promise<void> {
    const seedRecipes: CreateRecipeDto[] = [
      {
        dishName: 'Truffle Mushroom Risotto',
        category: 'Mains',
        sellingPrice: 750,
        yieldPortions: 1,
        preparationMinutes: 18,
        ingredients: [
          { name: 'Carnaroli Risotto Rice', quantity: 120, unit: 'g', costPerUnit: 0.35 },
          { name: 'Porcini Mushrooms (Fresh)', quantity: 80, unit: 'g', costPerUnit: 0.90 },
          { name: 'White Truffle Oil', quantity: 10, unit: 'ml', costPerUnit: 4.50 },
          { name: 'Parmigiano-Reggiano 24M', quantity: 30, unit: 'g', costPerUnit: 1.20 },
          { name: 'Cultured French Butter', quantity: 25, unit: 'g', costPerUnit: 0.60 },
        ],
      },
      {
        dishName: 'Burrata Caprese Salad',
        category: 'Small plates',
        sellingPrice: 425,
        yieldPortions: 1,
        preparationMinutes: 8,
        ingredients: [
          { name: 'Fresh Burrata Pugliese Ball', quantity: 1, unit: 'pcs', costPerUnit: 85.00 },
          { name: 'Heirloom Vine Tomatoes', quantity: 150, unit: 'g', costPerUnit: 0.18 },
          { name: 'Cold Pressed EVOO', quantity: 20, unit: 'ml', costPerUnit: 0.95 },
          { name: 'Organic Fresh Basil', quantity: 15, unit: 'g', costPerUnit: 0.40 },
        ],
      },
      {
        dishName: 'Charred Wagyu Ribeye Steak',
        category: 'Mains',
        sellingPrice: 1450,
        yieldPortions: 1,
        preparationMinutes: 22,
        ingredients: [
          { name: 'A5 Wagyu Ribeye Cut', quantity: 250, unit: 'g', costPerUnit: 1.60 },
          { name: 'Smoked Bone Marrow', quantity: 40, unit: 'g', costPerUnit: 0.75 },
          { name: 'Maldon Flaky Sea Salt', quantity: 5, unit: 'g', costPerUnit: 0.50 },
          { name: 'Fresh Rosemary & Thyme', quantity: 10, unit: 'g', costPerUnit: 0.40 },
        ],
      },
      {
        dishName: 'Dark Chocolate Lava Cake',
        category: 'Desserts',
        sellingPrice: 360,
        yieldPortions: 1,
        preparationMinutes: 15,
        ingredients: [
          { name: 'Valrhona 70% Dark Chocolate', quantity: 80, unit: 'g', costPerUnit: 0.90 },
          { name: 'Farm Fresh Organic Eggs', quantity: 2, unit: 'pcs', costPerUnit: 9.00 },
          { name: 'Madagascar Vanilla Bean Gelato', quantity: 60, unit: 'g', costPerUnit: 0.45 },
        ],
      },
    ];

    for (const r of seedRecipes) {
      await this.create(r);
    }
  }

  public async getRecipes(): Promise<Recipe[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    const rows = await db.query<any>(`SELECT * FROM recipes ORDER BY category ASC, dish_name ASC;`);
    return rows.map(r => this.hydrateRecipe(r));
  }

  public async getRecipeById(id: string): Promise<Recipe> {
    await this.initDatabaseSchema();
    const db = getDb();
    const rows = await db.query<any>(`SELECT * FROM recipes WHERE id = ? LIMIT 1;`, [id]);
    if (rows.length === 0) {
      throw new NotFoundError(`Recipe '${id}' not found`);
    }
    return this.hydrateRecipe(rows[0]);
  }

  public async create(dto: CreateRecipeDto): Promise<Recipe> {
    await this.initDatabaseSchema();
    const db = getDb();
    const id = `rcp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const branchId = dto.branchId || 'branch-south-01';
    const now = new Date().toISOString();
    const yieldPortions = dto.yieldPortions || 1;
    const prepMinutes = dto.preparationMinutes || 15;

    const ingredients: RecipeIngredient[] = dto.ingredients.map((ing, idx) => {
      const ingredientCost = Math.round(ing.quantity * ing.costPerUnit * 100) / 100;
      return {
        id: `ing_${Date.now()}_${idx}`,
        inventoryItemId: `inv_${ing.name.toLowerCase().replace(/\s+/g, '_')}`,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        costPerUnit: ing.costPerUnit,
        ingredientCost,
      };
    });

    const totalBatchCost = ingredients.reduce((sum, ing) => sum + ing.ingredientCost, 0);
    const totalPortionCost = Math.round((totalBatchCost / yieldPortions) * 100) / 100;
    const foodCostPercentage = Math.round((totalPortionCost / dto.sellingPrice) * 1000) / 10;
    const grossMarginPercentage = Math.round((100 - foodCostPercentage) * 10) / 10;

    await db.execute(
      `INSERT INTO recipes (
        id, menu_item_id, dish_name, category, selling_price, yield_portions,
        preparation_minutes, ingredients_json, total_portion_cost, food_cost_percentage,
        gross_margin_percentage, branch_id, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        dto.menuItemId || null,
        dto.dishName,
        dto.category,
        dto.sellingPrice,
        yieldPortions,
        prepMinutes,
        JSON.stringify(ingredients),
        totalPortionCost,
        foodCostPercentage,
        grossMarginPercentage,
        branchId,
        now,
      ]
    );

    return this.getRecipeById(id);
  }

  public async update(id: string, dto: Partial<CreateRecipeDto>): Promise<Recipe> {
    await this.initDatabaseSchema();
    const current = await this.getRecipeById(id);
    const db = getDb();
    const now = new Date().toISOString();

    const dishName = dto.dishName ?? current.dishName;
    const category = dto.category ?? current.category;
    const sellingPrice = dto.sellingPrice ?? current.sellingPrice;
    const yieldPortions = dto.yieldPortions ?? current.yieldPortions;
    const prepMinutes = dto.preparationMinutes ?? current.preparationMinutes;

    let ingredients = current.ingredients;
    if (dto.ingredients) {
      ingredients = dto.ingredients.map((ing, idx) => ({
        id: `ing_${Date.now()}_${idx}`,
        inventoryItemId: `inv_${ing.name.toLowerCase().replace(/\s+/g, '_')}`,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        costPerUnit: ing.costPerUnit,
        ingredientCost: Math.round(ing.quantity * ing.costPerUnit * 100) / 100,
      }));
    }

    const totalBatchCost = ingredients.reduce((sum, ing) => sum + ing.ingredientCost, 0);
    const totalPortionCost = Math.round((totalBatchCost / yieldPortions) * 100) / 100;
    const foodCostPercentage = Math.round((totalPortionCost / sellingPrice) * 1000) / 10;
    const grossMarginPercentage = Math.round((100 - foodCostPercentage) * 10) / 10;

    await db.execute(
      `UPDATE recipes SET
        dish_name = ?, category = ?, selling_price = ?, yield_portions = ?,
        preparation_minutes = ?, ingredients_json = ?, total_portion_cost = ?,
        food_cost_percentage = ?, gross_margin_percentage = ?, updated_at = ?
       WHERE id = ?;`,
      [
        dishName,
        category,
        sellingPrice,
        yieldPortions,
        prepMinutes,
        JSON.stringify(ingredients),
        totalPortionCost,
        foodCostPercentage,
        grossMarginPercentage,
        now,
        current.id,
      ]
    );

    return this.getRecipeById(current.id);
  }

  public async getCostAnalysis(): Promise<RecipeCostAnalysis> {
    const recipes = await this.getRecipes();
    if (recipes.length === 0) {
      return {
        averageFoodCostPercentage: 0,
        highestCostDish: 'None',
        highestCostPercentage: 0,
        lowestCostDish: 'None',
        lowestCostPercentage: 0,
        totalRecipesCount: 0,
      };
    }

    const sumPct = recipes.reduce((sum, r) => sum + r.foodCostPercentage, 0);
    const avgPct = Math.round((sumPct / recipes.length) * 10) / 10;

    const sorted = [...recipes].sort((a, b) => b.foodCostPercentage - a.foodCostPercentage);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];

    return {
      averageFoodCostPercentage: avgPct,
      highestCostDish: highest.dishName,
      highestCostPercentage: highest.foodCostPercentage,
      lowestCostDish: lowest.dishName,
      lowestCostPercentage: lowest.foodCostPercentage,
      totalRecipesCount: recipes.length,
    };
  }

  private hydrateRecipe(row: any): Recipe {
    let ingredients: RecipeIngredient[] = [];
    try {
      ingredients = JSON.parse(row.ingredients_json || '[]');
    } catch (e) {
      ingredients = [];
    }

    return {
      id: row.id,
      menuItemId: row.menu_item_id,
      dishName: row.dish_name,
      category: row.category,
      sellingPrice: Number(row.selling_price),
      yieldPortions: Number(row.yield_portions),
      preparationMinutes: Number(row.preparation_minutes),
      ingredients,
      totalPortionCost: Number(row.total_portion_cost),
      foodCostPercentage: Number(row.food_cost_percentage),
      grossMarginPercentage: Number(row.gross_margin_percentage),
      branchId: row.branch_id,
      updatedAt: row.updated_at,
    };
  }
}

export const recipeService = new RecipeService();

