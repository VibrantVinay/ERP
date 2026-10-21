import { Request, Response } from 'express';
import { reportsService } from './service';

export class ReportsController {
  public async getSalesSummary(req: Request, res: Response): Promise<void> {
    try {
      const { branchId, period } = req.query;
      const data = await reportsService.getSalesSummary(
        branchId as string | undefined,
        period as string | undefined
      );
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async getMenuMix(req: Request, res: Response): Promise<void> {
    try {
      const { branchId } = req.query;
      const data = await reportsService.getMenuMix(branchId as string | undefined);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async getFoodCost(req: Request, res: Response): Promise<void> {
    try {
      const { branchId, period } = req.query;
      const data = await reportsService.getFoodCost(
        branchId as string | undefined,
        period as string | undefined
      );
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async exportReport(req: Request, res: Response): Promise<void> {
    try {
      const { reportType, format, period } = req.body;
      if (!reportType) {
        res.status(400).json({ success: false, error: 'reportType is required' });
        return;
      }
      const file = await reportsService.exportReport({
        reportType,
        format: format || 'csv',
        period,
      });

      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.setHeader('Content-Type', file.contentType);
      res.send(file.data);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const reportsController = new ReportsController();
