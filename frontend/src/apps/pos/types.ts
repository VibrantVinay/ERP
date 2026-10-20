export interface PosItem {
  id: string;
  name: string;
  category: string;
  price: number;
  note?: string;
  color?: string;
}

export interface CartItem extends PosItem {
  qty: number;
}

export interface PosCalculation {
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  gstAmount: number;
  gstRate: number;
  total: number;
}

