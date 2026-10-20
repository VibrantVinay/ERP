import { restClient } from '@/core/api-client';
import { MenuItem } from './types';

export const menuApi = {
  getAll: async (category?: string): Promise<MenuItem[]> => {
    const query = category && category !== 'All dishes' ? `?category=${encodeURIComponent(category)}` : '';
    return restClient<MenuItem[]>(`/menu${query}`);
  },

  setAvailability: async (id: string, availability: 'Available' | 'Sold out' | 'Hidden'): Promise<MenuItem> => {
    return restClient<MenuItem>(`/menu/${id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ availability }),
    });
  },
};

