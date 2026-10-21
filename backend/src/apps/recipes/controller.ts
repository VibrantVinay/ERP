import { Request, Response, NextFunction } from 'express';
import { recipeService } from './service';
import { sendSuccess } from '../../core/response';

export class RecipeController {
  public async getRecipes(req: Request, res: Response, next: NextFunction) {
    try {
      const recipes = await recipeService.getRecipes();
      return sendSuccess(res, recipes);
    } catch (error) {
      next(error);
    }
  }

  public async getRecipeById(req: Request, res: Response, next: NextFunction) {
    try {
      const recipe = await recipeService.getRecipeById(req.params.id);
      return sendSuccess(res, recipe);
    } catch (error) {
      next(error);
    }
  }

  public async createRecipe(req: Request, res: Response, next: NextFunction) {
    try {
      const recipe = await recipeService.create(req.body);
      return sendSuccess(res, recipe, 'Recipe created', 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateRecipe(req: Request, res: Response, next: NextFunction) {
    try {
      const recipe = await recipeService.update(req.params.id, req.body);
      return sendSuccess(res, recipe, 'Recipe updated');
    } catch (error) {
      next(error);
    }
  }

  public async getCostAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const analysis = await recipeService.getCostAnalysis();
      return sendSuccess(res, analysis);
    } catch (error) {
      next(error);
    }
  }
}

export const recipeController = new RecipeController();

