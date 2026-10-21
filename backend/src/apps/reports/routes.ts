import { Router } from 'express';
import { reportsController } from './controller';

const router = Router();

router.get('/sales-summary', (req, res) => reportsController.getSalesSummary(req, res));
router.get('/menu-mix', (req, res) => reportsController.getMenuMix(req, res));
router.get('/food-cost', (req, res) => reportsController.getFoodCost(req, res));
router.post('/export', (req, res) => reportsController.exportReport(req, res));

export default router;
