import { Router } from 'express';
import { menuController } from './controller';

const router = Router();

router.get('/', (req, res, next) => menuController.getItems(req, res, next));
router.get('/items', (req, res, next) => menuController.getItems(req, res, next));
router.post('/items', (req, res, next) => menuController.createItem(req, res, next));
router.get('/categories', (req, res, next) => menuController.getCategories(req, res, next));
router.get('/items/:id', (req, res, next) => menuController.getItemById(req, res, next));
router.put('/items/:id', (req, res, next) => menuController.updateItem(req, res, next));
router.patch('/items/:id/availability', (req, res, next) => menuController.updateAvailability(req, res, next));

export const menuRouter = router;
