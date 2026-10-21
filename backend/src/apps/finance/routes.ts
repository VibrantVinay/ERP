import { Router } from 'express';
import { financeController } from './controller';

const router = Router();

router.get('/transactions', (req, res) => financeController.getTransactions(req, res));
router.post('/transactions', (req, res) => financeController.createTransaction(req, res));
router.get('/summary', (req, res) => financeController.getSummary(req, res));
router.get('/tax-summary', (req, res) => financeController.getTaxSummary(req, res));
router.post('/reconcile', (req, res) => financeController.reconcile(req, res));

export default router;

