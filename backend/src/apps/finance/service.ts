import { getDb } from '../../core/database';
import {
  FinancialTransaction,
  FinanceSummary,
  TaxBreakdown,
  CreateTransactionDTO,
  ReconcileBatchDTO,
} from './types';

export class FinanceService {
  private schemaInitialized = false;

  public async initDatabaseSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;

    const db = getDb();

    // Table: financial_transactions
    await db.execute(`
      CREATE TABLE IF NOT EXISTS financial_transactions (
        id VARCHAR(50) PRIMARY KEY,
        branch_id VARCHAR(50) NOT NULL,
        type VARCHAR(30) NOT NULL,
        category VARCHAR(50) NOT NULL,
        amount REAL NOT NULL,
        tax_amount REAL NOT NULL DEFAULT 0,
        gst_rate REAL NOT NULL DEFAULT 5,
        payment_method VARCHAR(30) NOT NULL,
        reference_number VARCHAR(100),
        description TEXT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'completed',
        reconciled_at VARCHAR(30),
        recorded_by VARCHAR(100) NOT NULL,
        date VARCHAR(30) NOT NULL,
        created_at VARCHAR(30) NOT NULL
      )
    `);

    await this.seedInitialData();
  }

  private async seedInitialData(): Promise<void> {
    const db = getDb();
    const existing = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM financial_transactions`);
    const count = Number(existing[0]?.count || 0);

    if (count === 0) {
      const now = new Date().toISOString();
      const today = now.slice(0, 10);

      const sampleTransactions = [
        {
          id: 'txn-101',
          branchId: 'main-branch',
          type: 'income',
          category: 'food_sales',
          amount: 4850.0,
          taxAmount: 242.5,
          gstRate: 5,
          paymentMethod: 'credit_card',
          referenceNumber: 'SETTLE-VISA-0941',
          description: 'Dining Room Lunch & Dinner POS Register Batch',
          status: 'reconciled',
          reconciledAt: `${today}T22:30:00Z`,
          recordedBy: 'Mina D’Souza',
          date: today,
        },
        {
          id: 'txn-102',
          branchId: 'main-branch',
          type: 'income',
          category: 'beverage_sales',
          amount: 1920.0,
          taxAmount: 345.6,
          gstRate: 18,
          paymentMethod: 'upi_qr',
          referenceNumber: 'UPI-BATCH-5519',
          description: 'Cocktails, Craft Beer & Wine Service',
          status: 'reconciled',
          reconciledAt: `${today}T22:35:00Z`,
          recordedBy: 'Mina D’Souza',
          date: today,
        },
        {
          id: 'txn-103',
          branchId: 'main-branch',
          type: 'expense',
          category: 'supplier_invoice',
          amount: 1650.0,
          taxAmount: 82.5,
          gstRate: 5,
          paymentMethod: 'bank_transfer',
          referenceNumber: 'INV-SUP-8821',
          description: 'Valley Farm Organic Produce & Dairy Delivery (PO-8821)',
          status: 'reconciled',
          reconciledAt: `${today}T18:00:00Z`,
          recordedBy: 'Aarav Mehta',
          date: today,
        },
        {
          id: 'txn-104',
          branchId: 'main-branch',
          type: 'expense',
          category: 'payroll',
          amount: 2800.0,
          taxAmount: 0.0,
          gstRate: 0,
          paymentMethod: 'bank_transfer',
          referenceNumber: 'PAYROLL-WK-12',
          description: 'Weekly Kitchen & Front of House Wage Distribution',
          status: 'reconciled',
          reconciledAt: `${today}T17:00:00Z`,
          recordedBy: 'Aarav Mehta',
          date: today,
        },
        {
          id: 'txn-105',
          branchId: 'main-branch',
          type: 'expense',
          category: 'utilities',
          amount: 420.0,
          taxAmount: 75.6,
          gstRate: 18,
          paymentMethod: 'bank_transfer',
          referenceNumber: 'UTIL-GAS-03',
          description: 'Commercial Kitchen High-Pressure Gas Refill Tank',
          status: 'completed',
          reconciledAt: null,
          recordedBy: 'Mina D’Souza',
          date: today,
        },
        {
          id: 'txn-106',
          branchId: 'main-branch',
          type: 'expense',
          category: 'equipment_maintenance',
          amount: 285.0,
          taxAmount: 51.3,
          gstRate: 18,
          paymentMethod: 'credit_card',
          referenceNumber: 'TCK-REP-101',
          description: 'Emergency Pitco Fryer Thermocouple Diagnostic & Repair',
          status: 'completed',
          reconciledAt: null,
          recordedBy: 'Chef Roberto Gomez',
          date: today,
        },
        {
          id: 'txn-107',
          branchId: 'main-branch',
          type: 'income',
          category: 'food_sales',
          amount: 1240.0,
          taxAmount: 62.0,
          gstRate: 5,
          paymentMethod: 'delivery_partner',
          referenceNumber: 'SWIG-SETTLE-881',
          description: 'Direct Delivery Channel Settlement',
          status: 'completed',
          reconciledAt: null,
          recordedBy: 'Mina D’Souza',
          date: today,
        },
      ];

      for (const t of sampleTransactions) {
        await db.execute(
          `INSERT INTO financial_transactions (
            id, branch_id, type, category, amount, tax_amount, gst_rate,
            payment_method, reference_number, description, status,
            reconciled_at, recorded_by, date, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            t.id, t.branchId, t.type, t.category, t.amount, t.taxAmount,
            t.gstRate, t.paymentMethod, t.referenceNumber, t.description,
            t.status, t.reconciledAt, t.recordedBy, t.date, now
          ]
        );
      }
    }
  }

  public async getTransactions(
    branchId?: string,
    type?: string,
    category?: string,
    status?: string
  ): Promise<FinancialTransaction[]> {
    await this.initDatabaseSchema();
    const db = getDb();
    let query = `SELECT * FROM financial_transactions WHERE 1=1`;
    const params: any[] = [];

    if (branchId) {
      query += ` AND branch_id = ?`;
      params.push(branchId);
    }
    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }
    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }
    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY date DESC, created_at DESC`;
    const rows = await db.query<any>(query, params);

    return rows.map((r: any) => ({
      id: r.id,
      branchId: r.branch_id,
      type: r.type,
      category: r.category,
      amount: Number(r.amount),
      taxAmount: Number(r.tax_amount),
      gstRate: Number(r.gst_rate),
      paymentMethod: r.payment_method,
      referenceNumber: r.reference_number || undefined,
      description: r.description,
      status: r.status,
      reconciledAt: r.reconciled_at || undefined,
      recordedBy: r.recorded_by,
      date: r.date,
      createdAt: r.created_at,
    }));
  }

  public async createTransaction(dto: CreateTransactionDTO): Promise<FinancialTransaction> {
    await this.initDatabaseSchema();
    const db = getDb();
    const now = new Date().toISOString();
    const id = `txn-${Date.now()}`;
    const date = dto.date || now.slice(0, 10);

    const gstRate = dto.gstRate !== undefined ? dto.gstRate : dto.category === 'beverage_sales' ? 18 : 5;
    const taxAmount = dto.taxAmount !== undefined ? dto.taxAmount : (dto.amount * gstRate) / 100;

    await db.execute(
      `INSERT INTO financial_transactions (
        id, branch_id, type, category, amount, tax_amount, gst_rate,
        payment_method, reference_number, description, status,
        recorded_by, date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?)`,
      [
        id,
        dto.branchId || 'main-branch',
        dto.type,
        dto.category,
        dto.amount,
        taxAmount,
        gstRate,
        dto.paymentMethod,
        dto.referenceNumber || null,
        dto.description,
        dto.recordedBy,
        date,
        now,
      ]
    );

    const txns = await this.getTransactions(dto.branchId || 'main-branch');
    const created = txns.find(t => t.id === id);
    if (!created) throw new Error('Failed to record transaction');
    return created;
  }

  public async getFinanceSummary(branchId?: string): Promise<FinanceSummary> {
    const transactions = await this.getTransactions(branchId);

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalGstCollected = 0;
    let inputTaxCredit = 0;
    let reconciledCount = 0;
    let unreconciledCount = 0;

    for (const t of transactions) {
      if (t.type === 'income') {
        totalIncome += t.amount;
        totalGstCollected += t.taxAmount;
      } else if (t.type === 'expense' || t.type === 'refund') {
        totalExpenses += t.amount;
        if (t.category === 'supplier_invoice' || t.category === 'equipment_maintenance' || t.category === 'utilities') {
          inputTaxCredit += t.taxAmount;
        }
      }

      if (t.status === 'reconciled') {
        reconciledCount++;
      } else {
        unreconciledCount++;
      }
    }

    const netProfit = totalIncome - totalExpenses;
    const netGstPayable = Math.max(0, totalGstCollected - inputTaxCredit);
    const totalCount = transactions.length;
    const reconciliationRate = totalCount > 0 ? Math.round((reconciledCount / totalCount) * 100) : 100;

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      totalGstCollected,
      inputTaxCredit,
      netGstPayable,
      reconciledCount,
      unreconciledCount,
      reconciliationRate,
    };
  }

  public async getTaxBreakdown(branchId?: string, period: string = 'Current Month'): Promise<TaxBreakdown> {
    const transactions = await this.getTransactions(branchId);

    let diningGrossSales = 0;
    let diningGst5 = 0;
    let alcoholGrossSales = 0;
    let alcoholGst18 = 0;
    let eligibleInputCredit = 0;

    for (const t of transactions) {
      if (t.type === 'income') {
        if (t.gstRate === 18) {
          alcoholGrossSales += t.amount;
          alcoholGst18 += t.taxAmount;
        } else {
          diningGrossSales += t.amount;
          diningGst5 += t.taxAmount;
        }
      } else if (t.type === 'expense' && t.taxAmount > 0) {
        eligibleInputCredit += t.taxAmount;
      }
    }

    const totalGstCollected = diningGst5 + alcoholGst18;
    const netTaxDue = Math.max(0, totalGstCollected - eligibleInputCredit);

    return {
      period,
      diningGrossSales,
      diningGst5,
      alcoholGrossSales,
      alcoholGst18,
      totalGstCollected,
      eligibleInputCredit,
      netTaxDue,
    };
  }

  public async reconcileTransactions(dto: ReconcileBatchDTO): Promise<{ reconciledCount: number }> {
    await this.initDatabaseSchema();
    const db = getDb();
    const now = new Date().toISOString();

    for (const id of dto.transactionIds) {
      await db.execute(
        `UPDATE financial_transactions SET status = 'reconciled', reconciled_at = ? WHERE id = ?`,
        [now, id]
      );
    }

    return { reconciledCount: dto.transactionIds.length };
  }
}

export const financeService = new FinanceService();
