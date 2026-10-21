import { PluggableApp } from '../../core/base-app';
import { recipeRouter } from './routes';
import { recipeService } from './service';

export const recipesApp: PluggableApp = {
  id: 'recipes',
  name: 'Recipes & Food Costing BOM',
  routePrefix: '/recipes',
  router: recipeRouter,
  async init() {
    await recipeService.initDatabaseSchema();
  },
};

