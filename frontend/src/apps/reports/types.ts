export type MenuMatrixClassification = 'star' | 'plowhorse' | 'puzzle' | 'dog';

export interface HourlyTraffic {
  hour: string;
  sales: number;
  orderCount: number;
}

export interface PaymentBreakdown {
  method: string;
  total: number;
  percentage: number;
}

export interface ChannelBreakdown {
  channel: string;
  total: number;
  orders: number;
}

export interface SalesSummaryReport {
  period: string;
  totalGrossSales: number;
  totalNetSales: number;
  totalOrders: number;
  averageOrderValue: number;
  totalGst: number;
  hourlyTrends: HourlyTraffic[];
  paymentDistribution: PaymentBreakdown[];
  channelDistribution: ChannelBreakdown[];
}

export interface MenuMixItem {
  itemId: string;
  itemName: string;
  category: string;
  unitsSold: number;
  unitPrice: number;
  unitCost: number;
  totalRevenue: number;
  totalMargin: number;
  foodCostPercent: number;
  classification: MenuMatrixClassification;
}

export interface FoodCostVarianceItem {
  ingredientName: string;
  unit: string;
  theoreticalQty: number;
  actualQty: number;
  varianceQty: number;
  unitCost: number;
  varianceCost: number;
  wasteReason?: string;
}

export interface FoodCostReport {
  period: string;
  theoreticalFoodCost: number;
  actualFoodCost: number;
  foodCostPercentage: number;
  targetFoodCostPercentage: number;
  varianceTotal: number;
  topVariances: FoodCostVarianceItem[];
}

export interface ExportRequestDTO {
  reportType: 'sales' | 'menu_mix' | 'food_cost';
  format: 'csv' | 'json';
  period?: string;
}

