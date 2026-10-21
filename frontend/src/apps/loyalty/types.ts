export type TierName = 'Silver' | 'Gold' | 'Platinum';
export type DiscountType = 'Percentage' | 'FixedAmount' | 'FreeItem';

export interface PointsTransaction {
  id: string;
  points: number;
  type: 'Earned' | 'Redeemed' | 'Adjustment' | 'Bonus';
  orderTicket?: string;
  description: string;
  createdAt: string;
}

export interface LoyaltyMember {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  currentPoints: number;
  lifetimePoints: number;
  tier: TierName;
  transactions: PointsTransaction[];
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromoCampaign {
  id: string;
  code: string;
  title: string;
  discountType: DiscountType;
  discountValue: number;
  minSpend: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  branchId: string;
  createdAt: string;
}

export interface CreateCampaignDto {
  code: string;
  title: string;
  discountType: DiscountType;
  discountValue: number;
  minSpend?: number;
  maxDiscount?: number;
  usageLimit?: number;
  validFrom?: string;
  validTo: string;
  branchId?: string;
}

export interface ValidateCouponDto {
  code: string;
  orderTotal: number;
  branchId?: string;
}

export interface ValidateCouponResult {
  isValid: boolean;
  code: string;
  discountType?: DiscountType;
  discountValue?: number;
  calculatedDiscount: number;
  finalTotal: number;
  message: string;
}

export interface AdjustPointsDto {
  points: number;
  type: 'Earned' | 'Redeemed' | 'Adjustment' | 'Bonus';
  orderTicket?: string;
  description: string;
}

