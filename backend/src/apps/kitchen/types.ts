export type KitchenStation = 'Hot line' | 'Cold prep' | 'Bar' | 'Dessert';
export type KitchenTicketPriority = 'Normal' | 'Rush' | 'Allergy';
export type KitchenTicketStatus = 'New' | 'Preparing' | 'Ready' | 'Served' | 'Delayed';

export interface KitchenTicketItem {
  id: string;
  name: string;
  quantity: number;
  station: KitchenStation;
  notes?: string;
  isBumped: boolean;
  bumpedAt?: string;
}

export interface KitchenTicket {
  id: string;
  ticketNumber: string;
  tableNumber: string;
  station: KitchenStation;
  items: KitchenTicketItem[];
  priority: KitchenTicketPriority;
  status: KitchenTicketStatus;
  receivedAt: string;
  elapsedMinutes?: number;
  completedAt?: string;
  branchId: string;
}

export interface CreateKitchenTicketDto {
  ticketNumber: string;
  tableNumber: string;
  station?: KitchenStation;
  items: Array<{
    name: string;
    quantity: number;
    station?: KitchenStation;
    notes?: string;
  }>;
  priority?: KitchenTicketPriority;
  branchId?: string;
}

export interface UpdateKitchenTicketStatusDto {
  status: KitchenTicketStatus;
}
