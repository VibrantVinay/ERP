import { apiClient } from '../../core/api-client';
import {
  OrderRecord,
  CreateOrderDto,
  UpdateOrderStatusDto,
  CancelOrderDto,
  MergeOrdersDto,
} from './types';

export const ordersApi = {
  async getOrders(filters?: { status?: string; type?: string; branchId?: string }): Promise<OrderRecord[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.branchId) params.append('branchId', filters.branchId);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<OrderRecord[]>(`/orders${qs}`);
    return res.data;
  },

  async getOrderById(id: string): Promise<OrderRecord> {
    const res = await apiClient.get<OrderRecord>(`/orders/${id}`);
    return res.data;
  },

  async createOrder(data: CreateOrderDto): Promise<OrderRecord> {
    const res = await apiClient.post<OrderRecord>('/orders', data);
    return res.data;
  },

  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<OrderRecord> {
    const res = await apiClient.patch<OrderRecord>(`/orders/${id}/status`, dto);
    return res.data;
  },

  async cancelOrder(id: string, dto: CancelOrderDto): Promise<OrderRecord> {
    const res = await apiClient.post<OrderRecord>(`/orders/${id}/cancel`, dto);
    return res.data;
  },

  async mergeOrders(dto: MergeOrdersDto): Promise<OrderRecord> {
    const res = await apiClient.post<OrderRecord>('/orders/merge', dto);
    return res.data;
  },
};
