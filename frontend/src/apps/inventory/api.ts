import { restClient } from '@/core/api-client';
import { InventoryItem } from './types';

export const inventoryApi = {
  getAll: async (status?: string): Promise<InventoryItem[]> => {
    const query = status && status !== 'All' ? `?status=${encodeURIComponent(status)}` : '';
    return restClient<InventoryItem[]>(`/inventory${query}`);
  },

  getAlerts: async () => {
    return restClient<{ lowStock: InventoryItem[]; expiringSoon: InventoryItem[] }>('/inventory/alerts');
  },

  updateStock: async (id: string, onHand: string, status?: InventoryItem['status']): Promise<InventoryItem> => {
    return restClient<InventoryItem>(`/inventory/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ onHand, status }),
    });
  },
};

