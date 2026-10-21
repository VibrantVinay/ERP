import { apiClient } from '@/core/api-client';
import { UserRecord, CreateUserDTO, UpdateUserDTO, UserSummary } from './types';

export const userApi = {
  async getUsers(params?: { role?: string; status?: string; branchId?: string }): Promise<UserRecord[]> {
    const searchParams = new URLSearchParams();
    if (params?.role && params.role !== 'all') searchParams.append('role', params.role);
    if (params?.status && params.status !== 'all') searchParams.append('status', params.status);
    if (params?.branchId && params.branchId !== 'all') searchParams.append('branchId', params.branchId);

    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await apiClient.get<UserRecord[]>(`/users${qs}`);
    return res.data;
  },

  async getUserById(id: string): Promise<UserRecord> {
    const res = await apiClient.get<UserRecord>(`/users/${id}`);
    return res.data;
  },

  async createUser(dto: CreateUserDTO): Promise<UserRecord> {
    const res = await apiClient.post<UserRecord>('/users', dto);
    return res.data;
  },

  async updateUser(id: string, dto: UpdateUserDTO): Promise<UserRecord> {
    const res = await apiClient.put<UserRecord>(`/users/${id}`, dto);
    return res.data;
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },

  async getSummary(): Promise<UserSummary> {
    const res = await apiClient.get<UserSummary>('/users/summary');
    return res.data;
  },
};

