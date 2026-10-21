import { apiClient } from '@/core/api-client';
import {
  FinancialTransaction,
  FinanceSummary,
  TaxBreakdown,
  CreateTransactionDTO,
  ReconcileBatchDTO,
} from './types';

export const financeApi = {
  async getTransactions(params?: {
    branchId?: string;
    type?: string;
    category?: string;
    status?: string;
  }): Promise<FinancialTransaction[]> {
    const searchParams = new URLSearchParams();
    if (params?.branchId) searchParams.append('branchId', params.branchId);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);

    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await apiClient.get<FinancialTransaction[]>(`/finance/transactions${qs}`);
    return res.data;
  },

  async createTransaction(dto: CreateTransactionDTO): Promise<FinancialTransaction> {
    const res = await apiClient.post<FinancialTransaction>('/finance/transactions', dto);
    return res.data;
  },

  async getSummary(branchId?: string): Promise<FinanceSummary> {
    const qs = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
    const res = await apiClient.get<FinanceSummary>(`/finance/summary${qs}`);
    return res.data;
  },

  async getTaxSummary(branchId?: string, period?: string): Promise<TaxBreakdown> {
    const searchParams = new URLSearchParams();
    if (branchId) searchParams.append('branchId', branchId);
    if (period) searchParams.append('period', period);

    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await apiClient.get<TaxBreakdown>(`/finance/tax-summary${qs}`);
    return res.data;
  },

  async reconcile(dto: ReconcileBatchDTO): Promise<{ reconciledCount: number }> {
    const res = await apiClient.post<{ reconciledCount: number }>('/finance/reconcile', dto);
    return res.data;
  },
};

