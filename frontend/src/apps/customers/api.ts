import { apiClient } from '../../core/api-client';
import { CustomerProfile, CustomerHistoryEntry, CreateCustomerDto, UpdateCustomerDto } from './types';

export const customerApi = {
  async getCustomers(filters?: { segment?: string; search?: string }): Promise<CustomerProfile[]> {
    const params = new URLSearchParams();
    if (filters?.segment && filters.segment !== 'all') params.append('segment', filters.segment);
    if (filters?.search) params.append('search', filters.search);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await apiClient.get<CustomerProfile[]>(`/customers${qs}`);
    return res.data;
  },

  async getCustomerById(id: string): Promise<CustomerProfile> {
    const res = await apiClient.get<CustomerProfile>(`/customers/${id}`);
    return res.data;
  },

  async createCustomer(dto: CreateCustomerDto): Promise<CustomerProfile> {
    const res = await apiClient.post<CustomerProfile>('/customers', dto);
    return res.data;
  },

  async updateCustomer(id: string, dto: UpdateCustomerDto): Promise<CustomerProfile> {
    const res = await apiClient.put<CustomerProfile>(`/customers/${id}`, dto);
    return res.data;
  },

  async getCustomerHistory(id: string): Promise<CustomerHistoryEntry[]> {
    const res = await apiClient.get<CustomerHistoryEntry[]>(`/customers/${id}/history`);
    return res.data;
  },
};
