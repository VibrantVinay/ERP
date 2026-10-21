import { apiClient } from '@/core/api-client';
import {
  RestaurantSettings,
  UpdateSettingsDTO,
  TestPrinterResponse,
  TestWebhookResponse,
} from './types';

export const settingsApi = {
  async getSettings(): Promise<RestaurantSettings> {
    const res = await apiClient.get<RestaurantSettings>('/settings');
    return res.data;
  },

  async updateSettings(dto: UpdateSettingsDTO): Promise<RestaurantSettings> {
    const res = await apiClient.put<RestaurantSettings>('/settings', dto);
    return res.data;
  },

  async testPrinter(printerType: 'kot' | 'receipt'): Promise<TestPrinterResponse> {
    const res = await apiClient.post<TestPrinterResponse>('/settings/test-printer', { printerType });
    return res.data;
  },

  async testWebhook(aggregator: 'swiggy' | 'zomato'): Promise<TestWebhookResponse> {
    const res = await apiClient.post<TestWebhookResponse>('/settings/test-webhook', { aggregator });
    return res.data;
  },
};
