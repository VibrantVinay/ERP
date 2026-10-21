export type PaymentTerms = 'COD' | 'Net 7' | 'Net 15' | 'Net 30';
export type SupplierCategory = 'Produce' | 'Dairy & Cheese' | 'Meat & Seafood' | 'Dry Goods' | 'Beverages & Spirits' | 'Packaging';
export type SupplierStatus = 'Active' | 'Inactive';

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: SupplierCategory;
  paymentTerms: PaymentTerms;
  rating: number; // 1-5
  address: string;
  taxId?: string;
  status: SupplierStatus;
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export type POStatus = 'Draft' | 'Approved' | 'Ordered' | 'Partially Received' | 'Received' | 'Cancelled';

export interface PurchaseOrderItem {
  id: string;
  ingredientName: string;
  sku?: string;
  quantityOrdered: number;
  quantityReceived?: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: POStatus;
  orderDate: string;
  expectedDeliveryDate: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  approvedBy?: string;
  receivedBy?: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: SupplierCategory;
  paymentTerms: PaymentTerms;
  rating?: number;
  address: string;
  taxId?: string;
  branchId?: string;
}

export interface CreatePurchaseOrderDto {
  supplierId: string;
  expectedDeliveryDate: string;
  items: Array<{
    ingredientName: string;
    sku?: string;
    quantityOrdered: number;
    unit: string;
    unitPrice: number;
  }>;
  notes?: string;
  branchId?: string;
}

export interface UpdatePOStatusDto {
  status: POStatus;
  actionBy: string;
  receivedItems?: Array<{
    id: string;
    quantityReceived: number;
  }>;
  notes?: string;
}

