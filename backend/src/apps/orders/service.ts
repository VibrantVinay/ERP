import { OrderRecord, OrderStatus } from './types';
import { NotFoundError } from '../../core/errors';

export class OrderService {
  private orders: OrderRecord[] = [
    {
      id: 'ord_1',
      ticket: 'GH-1048',
      type: 'Dine-in',
      tableOrGuest: 'Table 04',
      items: 'Burrata ×1, Risotto ×2',
      total: 1925,
      payment: 'Unpaid',
      status: 'Preparing',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ord_2',
      ticket: 'GH-1047',
      type: 'Delivery',
      tableOrGuest: 'Maya · 98••• 216',
      items: 'Chicken ×1, Cake ×1',
      total: 1200,
      payment: 'Online',
      status: 'Ready',
      createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: 'ord_3',
      ticket: 'GH-1046',
      type: 'Takeaway',
      tableOrGuest: 'Sam · pickup 12:30',
      items: 'Pumpkin bowl ×1',
      total: 560,
      payment: 'UPI',
      status: 'Accepted',
      createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    },
    {
      id: 'ord_4',
      ticket: 'GH-1045',
      type: 'QR order',
      tableOrGuest: 'Table 08',
      items: 'Spritz ×2, Sourdough ×1',
      total: 1020,
      payment: 'Unpaid',
      status: 'New',
      createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    },
  ];

  public getAll(filters?: { status?: string; type?: string }) {
    let result = [...this.orders];
    if (filters?.status) {
      result = result.filter(o => o.status.toLowerCase() === filters.status!.toLowerCase());
    }
    if (filters?.type) {
      result = result.filter(o => o.type.toLowerCase() === filters.type!.toLowerCase());
    }
    return result;
  }

  public getById(id: string): OrderRecord {
    const order = this.orders.find(o => o.id === id || o.ticket === id);
    if (!order) {
      throw new NotFoundError(`Order with ID ${id} not found`);
    }
    return order;
  }

  public updateStatus(id: string, status: OrderStatus): OrderRecord {
    const order = this.getById(id);
    order.status = status;
    return order;
  }

  public create(orderData: Omit<OrderRecord, 'id' | 'createdAt'>): OrderRecord {
    const newOrder: OrderRecord = {
      ...orderData,
      id: `ord_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.orders.unshift(newOrder);
    return newOrder;
  }
}

export const orderService = new OrderService();

