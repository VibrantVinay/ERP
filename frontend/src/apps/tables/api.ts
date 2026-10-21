import { apiClient } from '../../core/api-client';
import {
  DiningTable,
  FloorZone,
  TableStatus,
  WaitlistEntry,
  SeatTableDto,
  AddWaitlistDto,
} from './types';

export const tablesApi = {
  async getTables(filters?: { zone?: string; status?: string }): Promise<DiningTable[]> {
    const params = new URLSearchParams();
    if (filters?.zone) params.append('zone', filters.zone);
    if (filters?.status) params.append('status', filters.status);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<DiningTable[]>(`/tables${qs}`);
    return res.data;
  },

  async updateStatus(id: string, status: TableStatus): Promise<DiningTable> {
    const res = await apiClient.patch<DiningTable>(`/tables/${id}/status`, { status });
    return res.data;
  },

  async seatTable(id: string, dto: SeatTableDto): Promise<DiningTable> {
    const res = await apiClient.post<DiningTable>(`/tables/${id}/seat`, dto);
    return res.data;
  },

  async clearTable(id: string): Promise<DiningTable> {
    const res = await apiClient.post<DiningTable>(`/tables/${id}/clear`);
    return res.data;
  },

  async getZones(): Promise<FloorZone[]> {
    const res = await apiClient.get<FloorZone[]>('/tables/zones');
    return res.data;
  },

  async getWaitlist(): Promise<WaitlistEntry[]> {
    const res = await apiClient.get<WaitlistEntry[]>('/tables/waitlist');
    return res.data;
  },

  async addToWaitlist(dto: AddWaitlistDto): Promise<WaitlistEntry> {
    const res = await apiClient.post<WaitlistEntry>('/tables/waitlist', dto);
    return res.data;
  },

  async updateWaitlistStatus(id: string, status: 'Notified' | 'Seated' | 'Cancelled'): Promise<void> {
    await apiClient.patch(`/tables/waitlist/${id}`, { status });
  },
};
