import { Request, Response } from 'express';
import { settingsService } from './service';
import { sendSuccess, sendError } from '../../core/response';

export class SettingsController {
  public async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await settingsService.getSettings();
      sendSuccess(res, settings);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch settings', 500);
    }
  }

  public async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const updated = await settingsService.updateSettings(req.body);
      sendSuccess(res, updated);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to update settings', 500);
    }
  }

  public async testPrinter(req: Request, res: Response): Promise<void> {
    try {
      const { printerType } = req.body as { printerType: 'kot' | 'receipt' };
      if (!printerType || (printerType !== 'kot' && printerType !== 'receipt')) {
        sendError(res, 'Valid printerType ("kot" or "receipt") is required', 400);
        return;
      }
      const response = await settingsService.testPrinter(printerType);
      sendSuccess(res, response);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to dispatch printer test', 500);
    }
  }

  public async testWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { aggregator } = req.body as { aggregator: 'swiggy' | 'zomato' };
      if (!aggregator || (aggregator !== 'swiggy' && aggregator !== 'zomato')) {
        sendError(res, 'Valid aggregator ("swiggy" or "zomato") is required', 400);
        return;
      }
      const response = await settingsService.testWebhook(aggregator);
      sendSuccess(res, response);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to ping webhook', 500);
    }
  }
}

export const settingsController = new SettingsController();

