import { getDb } from '../../core/database';
import {
  SalesSummaryReport,
  MenuMixItem,
  FoodCostReport,
  ExportRequestDTO,
  HourlyTraffic,
} from './types';

export class ReportsService {
  private schemaInitialized = false;

  public async initDatabaseSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;
    // Reports is an intelligence layer that reads from orders, finance, menu, and inventory
  }

  public async getSalesSummary(branchId?: string, period: string = 'Today'): Promise<SalesSummaryReport> {
    await this.initDatabaseSchema();
    const db = getDb();

    // Query orders count and totals if available
    let totalGrossSales = 7450.0;
    let totalOrders = 86;
    let totalGst = 412.5;

    try {
      const orderRows = await db.query<any>(
        `SELECT COUNT(*) as total_orders, SUM(total_amount) as gross_sales, SUM(tax_amount) as total_tax
         FROM orders WHERE status != 'cancelled'`
      );
      if (orderRows[0] && Number(orderRows[0].gross_sales) > 0) {
        totalGrossSales = Number(orderRows[0].gross_sales);
        totalOrders = Number(orderRows[0].total_orders);
        totalGst = Number(orderRows[0].total_tax || totalGrossSales * 0.05);
      }
    } catch {
      // Fallback to seeded demo metrics
    }

    const totalNetSales = totalGrossSales - totalGst;
    const averageOrderValue = totalOrders > 0 ? Number((totalGrossSales / totalOrders).toFixed(2)) : 0;

    const hourlyTrends: HourlyTraffic[] = [
      { hour: '11:00', sales: 340.0, orderCount: 4 },
      { hour: '12:00', sales: 980.0, orderCount: 12 },
      { hour: '13:00', sales: 1420.0, orderCount: 18 },
      { hour: '14:00', sales: 620.0, orderCount: 7 },
      { hour: '15:00', sales: 290.0, orderCount: 3 },
      { hour: '16:00', sales: 210.0, orderCount: 2 },
      { hour: '17:00', sales: 480.0, orderCount: 5 },
      { hour: '18:00', sales: 890.0, orderCount: 10 },
      { hour: '19:00', sales: 1350.0, orderCount: 15 },
      { hour: '20:00', sales: 1680.0, orderCount: 20 },
      { hour: '21:00', sales: 880.0, orderCount: 9 },
      { hour: '22:00', sales: 310.0, orderCount: 3 },
    ];

    const paymentDistribution = [
      { method: 'Credit Card (POS)', total: Number((totalGrossSales * 0.48).toFixed(2)), percentage: 48 },
      { method: 'UPI / QR Code', total: Number((totalGrossSales * 0.32).toFixed(2)), percentage: 32 },
      { method: 'Cash', total: Number((totalGrossSales * 0.12).toFixed(2)), percentage: 12 },
      { method: 'Delivery Aggregators', total: Number((totalGrossSales * 0.08).toFixed(2)), percentage: 8 },
    ];

    const channelDistribution = [
      { channel: 'Dine-In', total: Number((totalGrossSales * 0.65).toFixed(2)), orders: Math.round(totalOrders * 0.6) },
      { channel: 'Takeaway', total: Number((totalGrossSales * 0.20).toFixed(2)), orders: Math.round(totalOrders * 0.25) },
      { channel: 'Online Delivery', total: Number((totalGrossSales * 0.15).toFixed(2)), orders: Math.round(totalOrders * 0.15) },
    ];

    return {
      period,
      totalGrossSales,
      totalNetSales,
      totalOrders,
      averageOrderValue,
      totalGst,
      hourlyTrends,
      paymentDistribution,
      channelDistribution,
    };
  }

  public async getMenuMix(branchId?: string): Promise<MenuMixItem[]> {
    await this.initDatabaseSchema();

    // Standard Boston Consulting Group / Kasavana & Smith Menu Engineering Matrix
    const items: MenuMixItem[] = [
      {
        itemId: 'menu-101',
        itemName: 'Truffle Wild Mushroom Risotto',
        category: 'Mains',
        unitsSold: 142,
        unitPrice: 24.0,
        unitCost: 5.5,
        totalRevenue: 3408.0,
        totalMargin: 2627.0,
        foodCostPercent: 22.9,
        classification: 'star',
      },
      {
        itemId: 'menu-102',
        itemName: 'Signature 45-Day Dry Aged Ribeye',
        category: 'Mains',
        unitsSold: 98,
        unitPrice: 48.0,
        unitCost: 16.0,
        totalRevenue: 4704.0,
        totalMargin: 3136.0,
        foodCostPercent: 33.3,
        classification: 'star',
      },
      {
        itemId: 'menu-103',
        itemName: 'Wood-Fired Margherita Pizza',
        category: 'Pizzas',
        unitsSold: 185,
        unitPrice: 16.0,
        unitCost: 5.2,
        totalRevenue: 2960.0,
        totalMargin: 1998.0,
        foodCostPercent: 32.5,
        classification: 'plowhorse',
      },
      {
        itemId: 'menu-104',
        itemName: 'Crispy Truffle Parmesan Fries',
        category: 'Sides',
        unitsSold: 210,
        unitPrice: 9.0,
        unitCost: 3.1,
        totalRevenue: 1890.0,
        totalMargin: 1239.0,
        foodCostPercent: 34.4,
        classification: 'plowhorse',
      },
      {
        itemId: 'menu-105',
        itemName: 'Pan-Seared Chilean Sea Bass',
        category: 'Mains',
        unitsSold: 26,
        unitPrice: 42.0,
        unitCost: 11.5,
        totalRevenue: 1092.0,
        totalMargin: 793.0,
        foodCostPercent: 27.3,
        classification: 'puzzle',
      },
      {
        itemId: 'menu-106',
        itemName: 'Slow-Cooked Duck Confit Cassoulet',
        category: 'Mains',
        unitsSold: 22,
        unitPrice: 34.0,
        unitCost: 9.2,
        totalRevenue: 748.0,
        totalMargin: 545.6,
        foodCostPercent: 27.0,
        classification: 'puzzle',
      },
      {
        itemId: 'menu-107',
        itemName: 'House Garden Green Salad',
        category: 'Salads',
        unitsSold: 34,
        unitPrice: 11.0,
        unitCost: 4.8,
        totalRevenue: 374.0,
        totalMargin: 210.8,
        foodCostPercent: 43.6,
        classification: 'dog',
      },
      {
        itemId: 'menu-108',
        itemName: 'Classic Lemon Sorbet',
        category: 'Desserts',
        unitsSold: 28,
        unitPrice: 8.0,
        unitCost: 3.4,
        totalRevenue: 224.0,
        totalMargin: 128.8,
        foodCostPercent: 42.5,
        classification: 'dog',
      },
    ];

    return items;
  }

  public async getFoodCost(branchId?: string, period: string = 'Current Month'): Promise<FoodCostReport> {
    await this.initDatabaseSchema();

    return {
      period,
      theoreticalFoodCost: 14850.0,
      actualFoodCost: 16120.0,
      foodCostPercentage: 29.4,
      targetFoodCostPercentage: 27.5,
      varianceTotal: 1270.0,
      topVariances: [
        {
          ingredientName: 'Imported Burrata Di Bufala (250g)',
          unit: 'units',
          theoreticalQty: 120,
          actualQty: 142,
          varianceQty: 22,
          unitCost: 6.5,
          varianceCost: 143.0,
          wasteReason: 'Short expiry date & over-portioning in salad prep',
        },
        {
          ingredientName: 'Extra Virgin Tuscan Olive Oil',
          unit: 'Liters',
          theoreticalQty: 45,
          actualQty: 60,
          varianceQty: 15,
          unitCost: 14.0,
          varianceCost: 210.0,
          wasteReason: 'Saute station free-pouring without speed pourers',
        },
        {
          ingredientName: 'USDA Prime Beef Tenderloin',
          unit: 'Kilograms',
          theoreticalQty: 68.5,
          actualQty: 74.0,
          varianceQty: 5.5,
          unitCost: 38.0,
          varianceCost: 209.0,
          wasteReason: 'Butchery trimming loss on new meat supplier batch',
        },
        {
          ingredientName: 'Atlantic Fresh Salmon Fillet',
          unit: 'Kilograms',
          theoreticalQty: 52.0,
          actualQty: 58.0,
          varianceQty: 6.0,
          unitCost: 24.5,
          varianceCost: 147.0,
          wasteReason: 'Skinning loss and prep overcook discards',
        },
      ],
    };
  }

  public async exportReport(dto: ExportRequestDTO): Promise<{ filename: string; contentType: string; data: string }> {
    if (dto.reportType === 'menu_mix') {
      const items = await this.getMenuMix();
      if (dto.format === 'csv') {
        let csv = 'Item Name,Category,Units Sold,Price,Cost,Revenue,Margin,Food Cost %,Matrix Classification\n';
        for (const item of items) {
          csv += `"${item.itemName}","${item.category}",${item.unitsSold},${item.unitPrice},${item.unitCost},${item.totalRevenue},${item.totalMargin},${item.foodCostPercent}%,"${item.classification.toUpperCase()}"\n`;
        }
        return {
          filename: `menu_engineering_matrix_${Date.now()}.csv`,
          contentType: 'text/csv',
          data: csv,
        };
      }
      return {
        filename: `menu_engineering_matrix_${Date.now()}.json`,
        contentType: 'application/json',
        data: JSON.stringify(items, null, 2),
      };
    }

    if (dto.reportType === 'food_cost') {
      const foodCost = await this.getFoodCost();
      if (dto.format === 'csv') {
        let csv = 'Ingredient,Unit,Theoretical Qty,Actual Qty,Variance Qty,Unit Cost,Variance Cost,Reason\n';
        for (const v of foodCost.topVariances) {
          csv += `"${v.ingredientName}","${v.unit}",${v.theoreticalQty},${v.actualQty},${v.varianceQty},${v.unitCost},${v.varianceCost},"${v.wasteReason || ''}"\n`;
        }
        return {
          filename: `food_cost_variance_${Date.now()}.csv`,
          contentType: 'text/csv',
          data: csv,
        };
      }
      return {
        filename: `food_cost_variance_${Date.now()}.json`,
        contentType: 'application/json',
        data: JSON.stringify(foodCost, null, 2),
      };
    }

    // Default: sales summary
    const sales = await this.getSalesSummary();
    if (dto.format === 'csv') {
      let csv = 'Hour,Sales ($),Orders\n';
      for (const h of sales.hourlyTrends) {
        csv += `"${h.hour}",${h.sales},${h.orderCount}\n`;
      }
      return {
        filename: `sales_summary_${Date.now()}.csv`,
        contentType: 'text/csv',
        data: csv,
      };
    }

    return {
      filename: `sales_summary_${Date.now()}.json`,
      contentType: 'application/json',
      data: JSON.stringify(sales, null, 2),
    };
  }
}

export const reportsService = new ReportsService();
