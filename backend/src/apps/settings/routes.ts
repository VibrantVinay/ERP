import { Router } from 'express';
import { settingsController } from './controller';

const router = Router();

router.get('/', (req, res) => settingsController.getSettings(req, res));
router.put('/', (req, res) => settingsController.updateSettings(req, res));
router.post('/test-printer', (req, res) => settingsController.testPrinter(req, res));
router.post('/test-webhook', (req, res) => settingsController.testWebhook(req, res));

export default router;

