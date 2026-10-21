import { Request, Response, NextFunction } from 'express';
import { feedbackService } from './service';
import { sendSuccess } from '../../core/response';

export class FeedbackController {
  public async getFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined;
      const sentiment = req.query.sentiment as string | undefined;
      const data = await feedbackService.getFeedback({ status, sentiment });
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async getSummaryMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await feedbackService.getSummaryMetrics();
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async getFeedbackById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await feedbackService.getFeedbackById(req.params.id);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async createFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await feedbackService.createFeedback(req.body);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  }

  public async assignFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await feedbackService.assignFeedback(req.params.id, req.body);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async resolveFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await feedbackService.resolveFeedback(req.params.id, req.body);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }
}

export const feedbackController = new FeedbackController();
