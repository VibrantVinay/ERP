import { PosCalculationRequest, PosCalculationResult, CreateTicketRequest } from './types';
import { ValidationError } from '../../core/errors';

export class PosService {
  private ticketCounter = 1049;

  public calculate(req: PosCalculationRequest): PosCalculationResult {
    const subtotal = req.items.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);
    const discountPercentage = Math.min(100, Math.max(0, req.discountPercentage || 0));
    const discountAmount = Math.round((subtotal * discountPercentage) / 100);
    const taxableAmount = subtotal - discountAmount;
    const gstRate = 0.05; // 5% sample GST
    const gstAmount = Math.round(taxableAmount * gstRate);
    const total = taxableAmount + gstAmount;

    return {
      subtotal,
      discountPercentage,
      discountAmount,
      gstAmount,
      gstRate,
      total,
    };
  }

  public createTicket(data: CreateTicketRequest) {
    if (!data.items || data.items.length === 0) {
      throw new ValidationError('Cart cannot be empty to create a ticket');
    }

    const calc = this.calculate({
      items: data.items,
      discountPercentage: data.discountPercentage,
    });

    const ticketNumber = `GH-${this.ticketCounter++}`;

    return {
      ticket: ticketNumber,
      orderType: data.orderType,
      tableOrGuest: data.tableOrGuest || 'Counter',
      items: data.items,
      calculation: calc,
      paymentMethod: data.paymentMethod,
      status: 'Preparing',
      createdAt: new Date().toISOString(),
    };
  }
}

export const posService = new PosService();

