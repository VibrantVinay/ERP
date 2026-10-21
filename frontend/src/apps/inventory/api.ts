import { apiClient } from '../../core/api-client';
import {
  InventoryItem,
  StorageLocation,
  CreateInventoryItemDto,
  AddBatchDto,
  AdjustStockDto,
  BatchRecord,
} from './types';

export const inventoryApi = {
  async getItems(filters?: { location?: string; status?: string }): Promise<InventoryItem[]> {
    const params = new URLSearchParams();
    if (filters?.location) params.append('location', filters.location);
    if (filters?.status) params.append('status', filters.status);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<InventoryItem[]>(`/inventory/items${qs}`);
    return res.data;
  },

  async createItem(dto: CreateInventoryItemDto): Promise<InventoryItem> {
    const res = await apiClient.post<InventoryItem>('/inventory/items', dto);
    return res.data;
  },

  async addBatch(dto: AddBatchDto): Promise<BatchRecord> {
    const res = await apiClient.post<BatchRecord>('/inventory/batches', dto);
    return res.data;
  },

  async adjustStock(id: string, dto: AdjustStockDto): Promise<InventoryItem> {
    const res = await apiClient.patch<InventoryItem>(`/inventory/items/${id}/stock`, dto);
    return res.data;
  },

  async getAlerts(): Promise<{ lowStock: InventoryItem[]; expiringSoon: InventoryItem[] }> {
    const res = await apiClient.get<{ lowStock: InventoryItem[]; expiringSoon: InventoryItem[] }>('/inventory/alerts');
    return res.data;
  },

  async getLocations(): Promise<StorageLocation[]> {
    const res = await apiClient.get<StorageLocation[]>('/inventory/locations');
    return res.data;
  },
};
