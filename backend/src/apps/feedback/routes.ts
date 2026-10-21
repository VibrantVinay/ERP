import { Router } from 'express';
import { feedbackController } from './controller';

export const feedbackRouter = Router();

// Metrics placed before :id
feedbackRouter.get('/metrics/summary', (req, res, next) => feedbackController.getSummaryMetrics(req, res, next));
feedbackRouter.get('/', (req, res, next) => feedbackController.getFeedback(req, res, next));
feedbackRouter.post('/', (req, res, next) => feedbackController.createFeedback(req, res, next));
feedbackRouter.get('/:id', (req, res, next) => feedbackController.getFeedbackById(req, res, next));
feedbackRouter.patch('/:id/assign', (req, res, next) => feedbackController.assignFeedback(req, res, next));
feedbackRouter.patch('/:id/resolve', (req, res, next) => feedbackController.resolveFeedback(req, res, next));

