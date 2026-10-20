export interface InventoryItem {
  id: string;
  ingredient: string;
  barcode?: string;
  location: string;
  onHand: string;
  reorderPoint: string;
  batchExpiry: string;
  unitCost: number;
  status: 'In stock' | 'Low stock' | 'Out of stock' | 'Expiring soon';
}

