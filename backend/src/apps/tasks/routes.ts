import { Router } from 'express';
import { tasksController } from './controller';

const router = Router();

router.get('/', (req, res) => tasksController.getTasks(req, res));
router.post('/', (req, res) => tasksController.createTask(req, res));
router.patch('/:id/complete', (req, res) => tasksController.completeTask(req, res));
router.get('/temperature-logs', (req, res) => tasksController.getTemperatureLogs(req, res));
router.post('/temperature-log', (req, res) => tasksController.logTemperature(req, res));

export default router;
