export type KitchenStation = 'Hot line' | 'Cold prep' | 'Bar' | 'Dessert';
export type KitchenTicketPriority = 'Normal' | 'Rush' | 'Allergy';
export type KitchenTicketStatus = 'New' | 'Preparing' | 'Ready' | 'Served' | 'Delayed';

export interface KitchenTicket {
  id: string;
  ticket: string;
  station: KitchenStation;
  items: string;
  receivedAt: string;
  elapsedMinutes: number;
  priority: KitchenTicketPriority;
  status: KitchenTicketStatus;
}

