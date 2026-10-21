import { apiClient } from '../../core/api-client';
import { Recipe, CreateRecipeDto, RecipeCostAnalysis } from './types';

export const recipesApi = {
  async getRecipes(): Promise<Recipe[]> {
    const res = await apiClient.get<Recipe[]>('/recipes');
    return res.data;
  },

  async getRecipeById(id: string): Promise<Recipe> {
    const res = await apiClient.get<Recipe>(`/recipes/${id}`);
    return res.data;
  },

  async createRecipe(dto: CreateRecipeDto): Promise<Recipe> {
    const res = await apiClient.post<Recipe>('/recipes', dto);
    return res.data;
  },

  async getCostAnalysis(): Promise<RecipeCostAnalysis> {
    const res = await apiClient.get<RecipeCostAnalysis>('/recipes/cost-analysis');
    return res.data;
  },
};

