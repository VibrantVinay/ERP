import { apiClient } from '../../core/api-client';
import { Reservation, CreateReservationDto, ReservationStatus } from './types';

export const reservationsApi = {
  async getReservations(filters?: { date?: string; status?: string }): Promise<Reservation[]> {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.status) params.append('status', filters.status);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<Reservation[]>(`/reservations${qs}`);
    return res.data;
  },

  async createReservation(dto: CreateReservationDto): Promise<Reservation> {
    const res = await apiClient.post<Reservation>('/reservations', dto);
    return res.data;
  },

  async updateStatus(id: string, status: ReservationStatus): Promise<Reservation> {
    const res = await apiClient.patch<Reservation>(`/reservations/${id}`, { status });
    return res.data;
  },

  async checkIn(id: string): Promise<Reservation> {
    const res = await apiClient.post<Reservation>(`/reservations/${id}/check-in`);
    return res.data;
  },
};

