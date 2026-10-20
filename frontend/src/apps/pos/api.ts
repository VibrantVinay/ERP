import { restClient } from '@/core/api-client';
import { PosItem, PosCalculation, CartItem } from './types';

export interface CreatedTicketResponse {
  ticket: string;
  orderType: string;
  tableOrGuest: string;
  items: CartItem[];
  calculation: PosCalculation;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

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
    discountPercentage: number;
    paymentMethod: string;
  }): Promise<CreatedTicketResponse> => {
    return restClient<CreatedTicketResponse>('/pos/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
