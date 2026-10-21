export type TableStatus =
  | 'Available'
  | 'Reserved'
  | 'Seated'
  | 'Ordering'
  | 'Dining'
  | 'Needs Cleaning';

export type FloorZone = 'Main Room' | 'Patio' | 'Counter' | 'Private Dining';

export interface DiningTable {
  id: string;
  name: string;
  zone: FloorZone;
  capacity: number;
  status: TableStatus;
  currentTicketId?: string;
  guestCount?: number;
  serverName?: string;
  seatedAt?: string;
  seatedMinutes?: number;
  branchId: string;
  updatedAt: string;
}

export interface WaitlistEntry {
  id: string;
  guestName: string;
  partySize: number;
  phone: string;
  zonePreference: FloorZone | 'Any';
  notes?: string;
  estWaitMinutes: number;
  status: 'Waiting' | 'Notified' | 'Seated' | 'Cancelled';
  createdAt: string;
}

export interface SeatTableDto {
  guestCount: number;
  serverName?: string;
  ticketId?: string;
}

export interface AddWaitlistDto {
  guestName: string;
  partySize: number;
  phone: string;
  zonePreference?: FloorZone | 'Any';
  notes?: string;
  estWaitMinutes?: number;
}
