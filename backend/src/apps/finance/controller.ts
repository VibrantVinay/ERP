import { Request, Response } from 'express';
import { financeService } from './service';

export class FinanceController {
  public async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { branchId, type, category, status } = req.query;
      const data = await financeService.getTransactions(
        branchId as string | undefined,
        type as string | undefined,
        category as string | undefined,
        status as string | undefined
      );
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { branchId, type, category, amount, taxAmount, gstRate, paymentMethod, referenceNumber, description, recordedBy, date } = req.body;
      if (!type || !category || amount === undefined || !paymentMethod || !description || !recordedBy) {
        res.status(400).json({ success: false, error: 'Type, category, amount, paymentMethod, description, and recordedBy are required' });
        return;
      }
      const data = await financeService.createTransaction({
        branchId,
        type,
        category,
        amount: Number(amount),
        taxAmount: taxAmount !== undefined ? Number(taxAmount) : undefined,
        gstRate: gstRate !== undefined ? Number(gstRate) : undefined,
        paymentMethod,
        referenceNumber,
        description,
        recordedBy,
        date,
      });
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const { branchId } = req.query;
      const data = await financeService.getFinanceSummary(branchId as string | undefined);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async getTaxSummary(req: Request, res: Response): Promise<void> {
    try {
      const { branchId, period } = req.query;
      const data = await financeService.getTaxBreakdown(branchId as string | undefined, period as string | undefined);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async reconcile(req: Request, res: Response): Promise<void> {
    try {
      const { transactionIds, reconciledBy, notes } = req.body;
      if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0 || !reconciledBy) {
        res.status(400).json({ success: false, error: 'transactionIds (array) and reconciledBy are required' });
        return;
      }
      const data = await financeService.reconcileTransactions({ transactionIds, reconciledBy, notes });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const financeController = new FinanceController();
