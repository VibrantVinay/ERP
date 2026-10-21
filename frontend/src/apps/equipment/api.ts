import { apiClient } from '@/core/api-client';
import {
  EquipmentAsset,
  BreakdownTicket,
  EquipmentStatus,
  CreateEquipmentDTO,
  LogMaintenanceDTO,
  CreateBreakdownDTO,
  ResolveTicketDTO,
} from './types';

export const equipmentApi = {
  async getEquipment(params?: { branchId?: string; category?: string; status?: string }): Promise<EquipmentAsset[]> {
    const searchParams = new URLSearchParams();
    if (params?.branchId) searchParams.append('branchId', params.branchId);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);

    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await apiClient.get<EquipmentAsset[]>(`/equipment${qs}`);
    return res.data;
  },

  async createEquipment(dto: CreateEquipmentDTO): Promise<EquipmentAsset> {
    const res = await apiClient.post<EquipmentAsset>('/equipment', dto);
    return res.data;
  },

  async updateStatus(id: string, status: EquipmentStatus): Promise<EquipmentAsset> {
    const res = await apiClient.patch<EquipmentAsset>(`/equipment/${id}/status`, { status });
    return res.data;
  },

  async logMaintenance(id: string, dto: LogMaintenanceDTO): Promise<EquipmentAsset> {
    const res = await apiClient.post<EquipmentAsset>(`/equipment/${id}/maintenance`, dto);
    return res.data;
  },

  async getBreakdownTickets(params?: { branchId?: string; status?: string }): Promise<BreakdownTicket[]> {
    const searchParams = new URLSearchParams();
    if (params?.branchId) searchParams.append('branchId', params.branchId);
    if (params?.status) searchParams.append('status', params.status);

    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await apiClient.get<BreakdownTicket[]>(`/equipment/breakdowns${qs}`);
    return res.data;
  },

  async createBreakdownTicket(dto: CreateBreakdownDTO): Promise<BreakdownTicket> {
    const res = await apiClient.post<BreakdownTicket>('/equipment/breakdowns', dto);
    return res.data;
  },

  async resolveTicket(id: string, dto: ResolveTicketDTO): Promise<BreakdownTicket> {
    const res = await apiClient.patch<BreakdownTicket>(`/equipment/breakdowns/${id}/resolve`, dto);
    return res.data;
  },
};

