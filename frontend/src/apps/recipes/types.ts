export interface RecipeIngredient {
  id: string;
  inventoryItemId: string;
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  ingredientCost: number;
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
  foodCostPercentage: number;
  grossMarginPercentage: number;
  branchId: string;
  updatedAt: string;
}

export interface CreateRecipeDto {
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
}

export interface RecipeCostAnalysis {
  averageFoodCostPercentage: number;
  highestCostDish: string;
  highestCostPercentage: number;
  lowestCostDish: string;
  lowestCostPercentage: number;
  totalRecipesCount: number;
}

