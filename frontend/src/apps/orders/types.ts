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

export interface OrderRecord {
  id: string;
  ticket: string;
  type: 'Dine-in' | 'Takeaway' | 'Delivery' | 'QR order';
  tableOrGuest: string;
  items: string;
  total: number;
  payment: 'Unpaid' | 'Cash' | 'Card' | 'UPI' | 'Online';
  status: OrderStatus;
  createdAt: string;
}

