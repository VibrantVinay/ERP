export interface PosCartItem {
  id: string;
  name: string;
  category: string;
  price: number;
  qty: number;
  modifiers?: string[];
  notes?: string;
}

export type OrderType = 'Dine-in' | 'Takeaway' | 'Delivery' | 'QR order';
export type PaymentMethod = 'Unpaid' | 'Cash' | 'Card' | 'UPI' | 'Online';

export interface PosCalculationRequest {
  items: PosCartItem[];
  discountPercentage?: number;
}

export interface PosCalculationResult {
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  gstAmount: number;
  gstRate: number;
  total: number;
}

export interface CreateTicketRequest {
  orderType: OrderType;
  tableOrGuest: string;
  items: PosCartItem[];
  discountPercentage: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

