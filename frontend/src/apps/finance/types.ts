export type TransactionType = 'income' | 'expense' | 'refund' | 'payout' | 'tax_payment';
export type TransactionCategory =
  | 'food_sales'
  | 'beverage_sales'
  | 'supplier_invoice'
  | 'payroll'
  | 'utilities'
  | 'equipment_maintenance'
  | 'marketing'
  | 'tax_settlement';

export type PaymentMethod = 'cash' | 'credit_card' | 'upi_qr' | 'bank_transfer' | 'delivery_partner';
export type TransactionStatus = 'completed' | 'pending' | 'reconciled';

export interface FinancialTransaction {
  id: string;
  branchId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  taxAmount: number;
  gstRate: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  description: string;
  status: TransactionStatus;
  reconciledAt?: string;
  recordedBy: string;
  date: string;
  createdAt: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  totalGstCollected: number;
  inputTaxCredit: number;
  netGstPayable: number;
  reconciledCount: number;
  unreconciledCount: number;
  reconciliationRate: number;
}

export interface TaxBreakdown {
  period: string;
  diningGrossSales: number;
  diningGst5: number;
  alcoholGrossSales: number;
  alcoholGst18: number;
  totalGstCollected: number;
  eligibleInputCredit: number;
  netTaxDue: number;
}

export interface CreateTransactionDTO {
  branchId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  taxAmount?: number;
  gstRate?: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  description: string;
  recordedBy: string;
  date?: string;
}

export interface ReconcileBatchDTO {
  transactionIds: string[];
  reconciledBy: string;
  notes?: string;
}
