export type ReservationStatus =
  | 'Requested'
  | 'Confirmed'
  | 'Arrived'
  | 'Seated'
  | 'Completed'
  | 'Cancelled'
  | 'Waitlisted';

export interface Reservation {
  id: string;
  guestName: string;
  phone: string;
  email?: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  tablePreference?: string;
  occasion?: string;
  specialRequests?: string;
  depositAmount: number;
  depositStatus: 'None' | 'Pending' | 'Paid' | 'Refunded';
  status: ReservationStatus;
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationDto {
  guestName: string;
  phone: string;
  email?: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  tablePreference?: string;
  occasion?: string;
  specialRequests?: string;
  depositAmount?: number;
  depositStatus?: 'None' | 'Pending' | 'Paid';
}

