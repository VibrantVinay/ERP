export type StorageLocation = 'Dry store' | 'Walk-in chiller' | 'Produce prep' | 'Bar' | 'Freezer';
export type StockStatus = 'In stock' | 'Low stock' | 'Out of stock' | 'Expiring soon';

export interface BatchRecord {
  id: string;
  itemId: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  productionDate: string;
  expirationDate: string;
  isExpiringSoon?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  location: StorageLocation;
  currentStock: number;
  unit: string;
  reorderLevel: number;
  unitCost: number;
  batches: BatchRecord[];
  status: StockStatus;
  branchId: string;
  updatedAt: string;
}

export interface CreateInventoryItemDto {
  name: string;
  sku: string;
  category: string;
  location: StorageLocation;
  currentStock: number;
  unit: string;
  reorderLevel: number;
  unitCost: number;
  initialBatchNumber?: string;
  expirationDate?: string;
}

export interface AddBatchDto {
  itemId: string;
  batchNumber: string;
  quantity: number;
  productionDate?: string;
  expirationDate: string;
}

export interface AdjustStockDto {
  quantityDelta: number;
  reason: string;
}
