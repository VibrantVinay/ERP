import { apiClient } from '@/core/api-client';
import {
  SalesSummaryReport,
  MenuMixItem,
  FoodCostReport,
  ExportRequestDTO,
} from './types';

export const reportsApi = {
  async getSalesSummary(branchId?: string, period?: string): Promise<SalesSummaryReport> {
    const searchParams = new URLSearchParams();
    if (branchId) searchParams.append('branchId', branchId);
    if (period) searchParams.append('period', period);

    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await apiClient.get<SalesSummaryReport>(`/reports/sales-summary${qs}`);
    return res.data;
  },

  async getMenuMix(branchId?: string): Promise<MenuMixItem[]> {
    const qs = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
    const res = await apiClient.get<MenuMixItem[]>(`/reports/menu-mix${qs}`);
    return res.data;
  },

  async getFoodCost(branchId?: string, period?: string): Promise<FoodCostReport> {
    const searchParams = new URLSearchParams();
    if (branchId) searchParams.append('branchId', branchId);
    if (period) searchParams.append('period', period);

    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await apiClient.get<FoodCostReport>(`/reports/food-cost${qs}`);
    return res.data;
  },

  async triggerExport(dto: ExportRequestDTO): Promise<void> {
    const response = await fetch('http://localhost:5000/api/v1/reports/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dto.reportType}_export_${Date.now()}.${dto.format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
