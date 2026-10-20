import { restClient } from '@/core/api-client';
import { TableRecord, TableStatus } from './types';

export const tablesApi = {
  getAll: async (zone?: string): Promise<TableRecord[]> => {
    const query = zone && zone !== 'All' ? `?zone=${encodeURIComponent(zone)}` : '';
    return restClient<TableRecord[]>(`/tables${query}`);
  },

  updateStatus: async (id: string, status: TableStatus, party?: string): Promise<TableRecord> => {
    return restClient<TableRecord>(`/tables/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, party }),
    });
  },
};

