import { apiClient } from '../../core/api-client';
import { MenuItem, MenuAvailability, CreateMenuItemDto } from './types';

export const menuApi = {
  async getItems(filters?: { category?: string; availability?: string }): Promise<MenuItem[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.availability) params.append('availability', filters.availability);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<MenuItem[]>(`/menu/items${qs}`);
    return res.data;
  },

  async createItem(dto: CreateMenuItemDto): Promise<MenuItem> {
    const res = await apiClient.post<MenuItem>('/menu/items', dto);
    return res.data;
  },

  async updateAvailability(id: string, availability: MenuAvailability): Promise<MenuItem> {
    const res = await apiClient.patch<MenuItem>(`/menu/items/${id}/availability`, { availability });
    return res.data;
  },

  async getCategories(): Promise<string[]> {
    const res = await apiClient.get<string[]>('/menu/categories');
    return res.data;
  },
};
