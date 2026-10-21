export interface RecipeIngredient {
  id: string;
  inventoryItemId: string;
  name: string;
  quantity: number; // e.g. 150
  unit: string; // e.g. 'g', 'ml', 'pcs'
  costPerUnit: number; // e.g. 0.85 per g
  ingredientCost: number; // quantity * costPerUnit
}

export interface Recipe {
  id: string;
  menuItemId?: string;
  dishName: string;
  category: string;
  sellingPrice: number;
  yieldPortions: number;
  preparationMinutes: number;
  ingredients: RecipeIngredient[];
  totalPortionCost: number;
  foodCostPercentage: number; // (totalPortionCost / sellingPrice) * 100
  grossMarginPercentage: number; // 100 - foodCostPercentage
  branchId: string;
  updatedAt: string;
}

export interface CreateRecipeDto {
  menuItemId?: string;
  dishName: string;
  category: string;
  sellingPrice: number;
  yieldPortions?: number;
  preparationMinutes?: number;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    costPerUnit: number;
  }>;
  branchId?: string;
}

export interface RecipeCostAnalysis {
  averageFoodCostPercentage: number;
  highestCostDish: string;
  highestCostPercentage: number;
  lowestCostDish: string;
  lowestCostPercentage: number;
  totalRecipesCount: number;
}

