import { apiClient } from '@/core/api-client';
import { Branch, CreateBranchDTO, UpdateBranchDTO, BranchSummary } from './types';

export const branchApi = {
  async getBranches(status?: string): Promise<Branch[]> {
    const qs = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    const res = await apiClient.get<Branch[]>(`/branches${qs}`);
    return res.data;
  },

  async getBranchById(id: string): Promise<Branch> {
    const res = await apiClient.get<Branch>(`/branches/${id}`);
    return res.data;
  },

  async createBranch(dto: CreateBranchDTO): Promise<Branch> {
    const res = await apiClient.post<Branch>('/branches', dto);
    return res.data;
  },

  async updateBranch(id: string, dto: UpdateBranchDTO): Promise<Branch> {
    const res = await apiClient.put<Branch>(`/branches/${id}`, dto);
    return res.data;
  },

  async deleteBranch(id: string): Promise<void> {
    await apiClient.delete(`/branches/${id}`);
  },

  async getSummary(): Promise<BranchSummary> {
    const res = await apiClient.get<BranchSummary>('/branches/summary');
    return res.data;
  },
};

