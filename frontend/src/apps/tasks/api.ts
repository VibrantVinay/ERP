import { apiClient } from '@/core/api-client';
import { OperationalTask, TemperatureLog, CreateTaskDTO, CompleteTaskDTO, LogTemperatureDTO } from './types';

export const tasksApi = {
  async getTasks(params?: { branchId?: string; category?: string; status?: string }): Promise<OperationalTask[]> {
    const searchParams = new URLSearchParams();
    if (params?.branchId) searchParams.append('branchId', params.branchId);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);

    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await apiClient.get<OperationalTask[]>(`/tasks${qs}`);
    return res.data;
  },

  async createTask(dto: CreateTaskDTO): Promise<OperationalTask> {
    const res = await apiClient.post<OperationalTask>('/tasks', dto);
    return res.data;
  },

  async completeTask(id: string, dto: CompleteTaskDTO): Promise<OperationalTask> {
    const res = await apiClient.patch<OperationalTask>(`/tasks/${id}/complete`, dto);
    return res.data;
  },

  async getTemperatureLogs(branchId?: string): Promise<TemperatureLog[]> {
    const qs = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
    const res = await apiClient.get<TemperatureLog[]>(`/tasks/temperature-logs${qs}`);
    return res.data;
  },

  async logTemperature(dto: LogTemperatureDTO): Promise<TemperatureLog> {
    const res = await apiClient.post<TemperatureLog>('/tasks/temperature-log', dto);
    return res.data;
  },
};
