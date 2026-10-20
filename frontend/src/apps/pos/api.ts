import { restClient } from '@/core/api-client';
import {
  PosItem,
  PosCalculation,
  CartItem,
  PosTicketRecord,
  PaymentMethod,
} from './types';

export const posApi = {
  getMenuItems: async (): Promise<PosItem[]> => {
    return restClient<PosItem[]>('/menu');
  },

  calculate: async (items: CartItem[], discountPercentage: number): Promise<PosCalculation> => {
    return restClient<PosCalculation>('/pos/calculate', {
      method: 'POST',
      body: JSON.stringify({ items, discountPercentage }),
    });
  },

  createTicket: async (data: {
    orderType: string;
    tableOrGuest: string;
    items: CartItem[];
    discountPercentage?: number;
    paymentMethod?: string;
    notes?: string;
  }): Promise<PosTicketRecord> => {
    return restClient<PosTicketRecord>('/pos/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getActiveTickets: async (): Promise<PosTicketRecord[]> => {
    return restClient<PosTicketRecord[]>('/pos/tickets/active');
  },

  getTicketById: async (id: string): Promise<PosTicketRecord> => {
    return restClient<PosTicketRecord>(`/pos/tickets/${id}`);
  },

  payTicket: async (id: string, paymentMethod: PaymentMethod, amountPaid: number, notes?: string): Promise<PosTicketRecord> => {
    return restClient<PosTicketRecord>(`/pos/tickets/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod, amountPaid, notes }),
    });
  },

  splitTicket: async (id: string, parts: number, paymentMethod?: PaymentMethod): Promise<PosTicketRecord[]> => {
    return restClient<PosTicketRecord[]>(`/pos/tickets/${id}/split`, {
      method: 'POST',
      body: JSON.stringify({ parts, paymentMethod }),
    });
  },
};
