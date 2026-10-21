import { apiClient } from '../../core/api-client';
import {
  DeliveryDispatch,
  DeliveryStatus,
  Driver,
  DriverStatus,
  DeliveryZone,
  CreateDispatchDto,
} from './types';

export const deliveryApi = {
  async getDispatches(filters?: { status?: string; driverId?: string }): Promise<DeliveryDispatch[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.driverId) params.append('driverId', filters.driverId);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<DeliveryDispatch[]>(`/delivery/dispatches${qs}`);
    return res.data;
  },

  async createDispatch(dto: CreateDispatchDto): Promise<DeliveryDispatch> {
    const res = await apiClient.post<DeliveryDispatch>('/delivery/dispatches', dto);
    return res.data;
  },

  async assignDriver(id: string, driverId: string): Promise<DeliveryDispatch> {
    const res = await apiClient.post<DeliveryDispatch>(`/delivery/dispatches/${id}/assign`, { driverId });
    return res.data;
  },

  async updateStatus(id: string, status: DeliveryStatus): Promise<DeliveryDispatch> {
    const res = await apiClient.patch<DeliveryDispatch>(`/delivery/dispatches/${id}/status`, { status });
    return res.data;
  },

  async getDrivers(): Promise<Driver[]> {
    const res = await apiClient.get<Driver[]>('/delivery/drivers');
    return res.data;
  },

  async updateDriverStatus(id: string, status: DriverStatus): Promise<Driver> {
    const res = await apiClient.patch<Driver>(`/delivery/drivers/${id}/status`, { status });
    return res.data;
  },

  async getZones(): Promise<DeliveryZone[]> {
    const res = await apiClient.get<DeliveryZone[]>('/delivery/zones');
    return res.data;
  },
};

