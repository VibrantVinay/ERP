import { Router } from 'express';
import { tableController } from './controller';

const router = Router();

router.get('/', tableController.getAll.bind(tableController));
router.patch('/:id/status', tableController.updateStatus.bind(tableController));

export const tableRouter = router;

