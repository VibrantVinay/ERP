import { Router } from 'express';
import { auditController } from './controller';

const router = Router();

router.get('/', (req, res) => auditController.getLogs(req, res));
router.get('/summary', (req, res) => auditController.getSummary(req, res));
router.get('/:id', (req, res) => auditController.getLogById(req, res));
router.post('/', (req, res) => auditController.createLog(req, res));

export default router;
