export type OrderStatus =
  | 'New'
  | 'Accepted'
  | 'Preparing'
  | 'Ready'
  | 'Served'
  | 'Dispatched'
  | 'Completed'
  | 'Cancelled'
  | 'Merged';

export type OrderType = 'Dine-in' | 'Takeaway' | 'Delivery' | 'QR order';

export type PaymentStatus = 'Unpaid' | 'Cash' | 'Card' | 'UPI' | 'Online';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface OrderStatusHistoryItem {
  id: string;
  orderId: string;
  fromStatus: OrderStatus | 'Created';
  toStatus: OrderStatus;
  changedBy: string;
  reason?: string;
  timestamp: string;
}

export interface OrderRecord {
  id: string;
  ticket: string;
  type: OrderType;
  tableOrGuest: string;
  items: OrderItem[];
  itemsSummary: string;
  subtotal: number;
  gstAmount: number;
  total: number;
  payment: PaymentStatus;
  status: OrderStatus;
  branchId: string;
  cancellationReason?: string;
  mergedInto?: string;
  history: OrderStatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderDto {
  ticket?: string;
  type: OrderType;
  tableOrGuest: string;
  items: OrderItem[];
  subtotal?: number;
  gstAmount?: number;
  total?: number;
  payment?: PaymentStatus;
  branchId?: string;
  createdBy?: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  changedBy?: string;
  reason?: string;
}

export interface CancelOrderDto {
  reason: string;
  cancelledBy?: string;
}

export interface MergeOrdersDto {
  targetOrderId: string;
  sourceOrderIds: string[];
  mergedBy?: string;
}
