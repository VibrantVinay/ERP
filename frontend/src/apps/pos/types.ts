export type OrderType = 'Dine-in' | 'Takeaway' | 'Delivery' | 'QR order';
export type PaymentMethod = 'Unpaid' | 'Cash' | 'Card' | 'UPI' | 'Online';
export type PaymentStatus = 'Unpaid' | 'Partial' | 'Paid' | 'Refunded';

export type TicketStatus =
  | 'New'
  | 'Accepted'
  | 'Preparing'
  | 'Ready'
  | 'Served'
  | 'Completed'
  | 'Cancelled'
  | 'Split';

export interface PosItem {
  id: string;
  name: string;
  category: string;
  price: number;
  note?: string;
  allergens?: string[];
  color?: string;
}

export interface CartItem extends PosItem {
  qty: number;
  notes?: string;
}

export interface PosCalculation {
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  gstAmount: number;
  gstRate: number;
  total: number;
}

export interface PosTicketRecord {
  id: string;
  ticketNumber: string;
  orderType: OrderType;
  tableOrGuest: string;
  items: CartItem[];
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  gstAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  status: TicketStatus;
  serverName?: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
}
