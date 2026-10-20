import { Router } from 'express';
import { menuController } from './controller';

const router = Router();

router.get('/', menuController.getAll.bind(menuController));
router.patch('/:id/availability', menuController.setAvailability.bind(menuController));

export const menuRouter = router;

