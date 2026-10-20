import { KitchenTicket, KitchenTicketStatus } from './types';
import { NotFoundError } from '../../core/errors';

export class KitchenService {
  private tickets: KitchenTicket[] = [
    {
      id: 'kds_1',
      ticket: 'GH-1048',
      station: 'Hot line',
      items: 'Risotto ×2 · no garnish',
      receivedAt: '12:24',
      elapsedMinutes: 8,
      priority: 'Normal',
      status: 'Preparing',
    },
    {
      id: 'kds_2',
      ticket: 'GH-1047',
      station: 'Dessert',
      items: 'Pistachio cake ×1',
      receivedAt: '12:28',
      elapsedMinutes: 4,
      priority: 'Normal',
      status: 'New',
    },
    {
      id: 'kds_3',
      ticket: 'GH-1045',
      station: 'Bar',
      items: 'Blood orange spritz ×2',
      receivedAt: '12:20',
      elapsedMinutes: 12,
      priority: 'Rush',
      status: 'Delayed',
    },
  ];

  public getTickets(station?: string): KitchenTicket[] {
    if (station && station !== 'All') {
      return this.tickets.filter(t => t.station.toLowerCase() === station.toLowerCase());
    }
    return this.tickets;
  }

  public updateStatus(id: string, status: KitchenTicketStatus): KitchenTicket {
    const ticket = this.tickets.find(t => t.id === id || t.ticket === id);
    if (!ticket) {
      throw new NotFoundError(`Kitchen ticket ${id} not found`);
    }
    ticket.status = status;
    return ticket;
  }

  public addTicket(ticketData: Omit<KitchenTicket, 'id' | 'elapsedMinutes'>): KitchenTicket {
    const newTicket: KitchenTicket = {
      ...ticketData,
      id: `kds_${Date.now()}`,
      elapsedMinutes: 0,
    };
    this.tickets.unshift(newTicket);
    return newTicket;
  }
}

export const kitchenService = new KitchenService();

