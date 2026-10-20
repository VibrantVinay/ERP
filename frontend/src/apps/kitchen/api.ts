import { restClient } from '@/core/api-client';
import { KitchenTicket, KitchenTicketStatus } from './types';

export const kitchenApi = {
  getTickets: async (station?: string): Promise<KitchenTicket[]> => {
    const query = station && station !== 'All' ? `?station=${encodeURIComponent(station)}` : '';
    return restClient<KitchenTicket[]>(`/kitchen/tickets${query}`);
  },

  updateStatus: async (id: string, status: KitchenTicketStatus): Promise<KitchenTicket> => {
    return restClient<KitchenTicket>(`/kitchen/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

