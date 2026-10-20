import { restClient } from '@/core/api-client';
import { OrderRecord, OrderStatus } from './types';

export const ordersApi = {
  getAll: async (filters?: { status?: string; type?: string }): Promise<OrderRecord[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return restClient<OrderRecord[]>(`/orders${queryString}`);
  },

  updateStatus: async (id: string, status: OrderStatus): Promise<OrderRecord> => {
    return restClient<OrderRecord>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

