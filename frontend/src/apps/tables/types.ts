export type TableZone = 'Main room' | 'Patio' | 'Counter' | 'Private dining';
export type TableStatus = 'Available' | 'Reserved' | 'Seated' | 'Ordering' | 'Dining' | 'Needs cleaning';

export interface TableRecord {
  id: string;
  tableNumber: string;
  zone: TableZone;
  seats: number;
  party?: string;
  seatedAt?: string;
  status: TableStatus;
}

