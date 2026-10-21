export type MovementType = 'Waste' | 'Transfer' | 'Adjustment' | 'CountVariance';

export type WasteReason =
  | 'Overripe'
  | 'Spillage'
  | 'Burnt'
  | 'Expired'
  | 'Damaged Packaging'
  | 'Preparation Error'
  | 'Quality Standard Rejection';

export type MovementLocation =
  | 'Dry store'
  | 'Walk-in chiller'
  | 'Produce prep'
  | 'Hot line'
  | 'Bar'
  | 'Freezer'
  | 'Bakery'
  | 'External Vendor'
  | 'Disposal / Waste Bin';

export interface StockMovement {
  id: string;
  movementNumber: string;
  type: MovementType;
  itemId: string;
  itemName: string;
  sku: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  fromLocation: MovementLocation;
  toLocation: MovementLocation;
  reason: string;
  notes?: string;
  performedBy: string;
  branchId: string;
  createdAt: string;
}

export interface CreateStockMovementDto {
  type: MovementType;
  itemId: string;
  itemName: string;
  sku: string;
  quantity: number;
  unit: string;
  unitCost: number;
  fromLocation: MovementLocation;
  toLocation: MovementLocation;
  reason: string;
  notes?: string;
  performedBy: string;
  branchId?: string;
}

export interface VarianceSummary {
  totalWasteCost: number;
  totalAdjustmentCost: number;
  totalTransfersCount: number;
  wasteByReason: Record<string, { count: number; cost: number }>;
  recentMovementsCount: number;
}
