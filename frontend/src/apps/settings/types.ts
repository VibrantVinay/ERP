export interface RestaurantSettings {
  id: string;
  restaurantName: string;
  tagline: string;
  legalEntity: string;
  gstin: string;
  fssaiNumber: string;
  currency: string;
  timezone: string;
  defaultGstRate: number;
  contactEmail: string;
  contactPhone: string;
  address: string;
  receiptFooter: string;
  kotPrinterIp: string;
  kotPrinterPort: number;
  receiptPrinterIp: string;
  receiptPrinterPort: number;
  paperWidth: '80mm' | '58mm';
  enableAutoCutter: boolean;
  swiggyWebhookSecret: string;
  zomatoWebhookSecret: string;
  whatsappApiKey: string;
  updatedAt: string;
}

export type UpdateSettingsDTO = Partial<Omit<RestaurantSettings, 'id' | 'updatedAt'>>;

export interface TestPrinterResponse {
  success: boolean;
  message: string;
  printerType: 'kot' | 'receipt';
  payloadSample: string;
  timestamp: string;
}

export interface TestWebhookResponse {
  success: boolean;
  aggregator: string;
  message: string;
  pingLatencyMs: number;
  timestamp: string;
}

