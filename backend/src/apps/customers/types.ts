export type CustomerSegment = 'VIP' | 'Regular' | 'Corporate' | 'Occasional' | 'New';

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  segment: CustomerSegment;
  totalVisits: number;
  totalSpend: number;
  averageSpend: number;
  dietaryConstraints: string[];
  preferredTable?: string;
  marketingOptIn: boolean;
  tags: string[];
  notes?: string;
  lastVisitAt?: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerHistoryEntry {
  orderTicket: string;
  orderType: string;
  orderDate: string;
  totalAmount: number;
  itemsSummary: string;
  paymentMethod: string;
}

export interface CreateCustomerDto {
  name: string;
  phone: string;
  email?: string;
  segment?: CustomerSegment;
  dietaryConstraints?: string[];
  preferredTable?: string;
  marketingOptIn?: boolean;
  tags?: string[];
  notes?: string;
  branchId?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  phone?: string;
  email?: string;
  segment?: CustomerSegment;
  dietaryConstraints?: string[];
  preferredTable?: string;
  marketingOptIn?: boolean;
  tags?: string[];
  notes?: string;
}

