import { apiClient } from '../../core/api-client';
import {
  KitchenTicket,
  KitchenStation,
  KitchenTicketStatus,
  StationStats,
} from './types';

export const kitchenApi = {
  async getTickets(filters?: { station?: string; activeOnly?: boolean }): Promise<KitchenTicket[]> {
    const params = new URLSearchParams();
    if (filters?.station) params.append('station', filters.station);
    if (filters?.activeOnly !== undefined) params.append('activeOnly', String(filters.activeOnly));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<KitchenTicket[]>(`/kitchen/tickets${qs}`);
    return res.data;
  },

  async updateStatus(id: string, status: KitchenTicketStatus): Promise<KitchenTicket> {
    const res = await apiClient.patch<KitchenTicket>(`/kitchen/tickets/${id}/status`, { status });
    return res.data;
  },

  async bumpItem(ticketId: string, itemId: string): Promise<KitchenTicket> {
    const res = await apiClient.patch<KitchenTicket>(`/kitchen/tickets/${ticketId}/items/${itemId}/bump`);
    return res.data;
  },

  async getStations(): Promise<StationStats[]> {
    const res = await apiClient.get<StationStats[]>('/kitchen/stations');
    return res.data;
  },
};
