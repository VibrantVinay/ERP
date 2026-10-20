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

export interface PosCartItem {
  id: string;
  name: string;
  category: string;
  price: number;
  qty: number;
  notes?: string;
  modifiers?: string[];
}

export interface PosCalculationRequest {
  items: PosCartItem[];
  discountPercentage?: number;
}

export interface PosCalculationResult {
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

export interface CreateTicketRequest {
  orderType: OrderType;
  tableOrGuest: string;
  items: PosCartItem[];
  discountPercentage?: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface PayTicketRequest {
  paymentMethod: PaymentMethod;
  amountPaid: number;
  notes?: string;
}

export interface SplitTicketRequest {
  parts: number;
  paymentMethod?: PaymentMethod;
}

export interface PosTicketRecord {
  id: string;
  ticketNumber: string;
  orderType: OrderType;
  tableOrGuest: string;
  items: PosCartItem[];
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
