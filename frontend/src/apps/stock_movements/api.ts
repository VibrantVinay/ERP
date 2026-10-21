import { apiClient } from '../../core/api-client';
import { StockMovement, CreateStockMovementDto, VarianceSummary } from './types';

export const stockMovementApi = {
  async getMovements(type?: string): Promise<StockMovement[]> {
    const params = new URLSearchParams();
    if (type && type !== 'all') params.append('type', type);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await apiClient.get<StockMovement[]>(`/stock-movements${qs}`);
    return res.data;
  },

  async getVarianceSummary(): Promise<VarianceSummary> {
    const res = await apiClient.get<VarianceSummary>('/stock-movements/variance-summary');
    return res.data;
  },

  async getMovementById(id: string): Promise<StockMovement> {
    const res = await apiClient.get<StockMovement>(`/stock-movements/${id}`);
    return res.data;
  },

  async createMovement(dto: CreateStockMovementDto): Promise<StockMovement> {
    const res = await apiClient.post<StockMovement>('/stock-movements', dto);
    return res.data;
  },
};
