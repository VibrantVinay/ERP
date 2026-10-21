import { Router } from 'express';
import { recipeController } from './controller';

const router = Router();

router.get('/', (req, res, next) => recipeController.getRecipes(req, res, next));
router.post('/', (req, res, next) => recipeController.createRecipe(req, res, next));
router.get('/cost-analysis', (req, res, next) => recipeController.getCostAnalysis(req, res, next));
router.get('/:id', (req, res, next) => recipeController.getRecipeById(req, res, next));
router.put('/:id', (req, res, next) => recipeController.updateRecipe(req, res, next));

export const recipeRouter = router;

