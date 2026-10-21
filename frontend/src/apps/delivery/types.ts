export type DeliveryStatus =
  | 'Queued'
  | 'Preparing'
  | 'Ready for pickup'
  | 'Picked up'
  | 'On the way'
  | 'Delivered'
  | 'Failed';

export type DriverStatus = 'Available' | 'On Delivery' | 'Off Duty';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleType: 'Bike' | 'Scooter' | 'Car';
  status: DriverStatus;
  activeDeliveriesCount: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  radiusKm: number;
  deliveryFee: number;
  minOrderAmount: number;
  estMinutes: number;
}

export interface DeliveryDispatch {
  id: string;
  orderTicket: string;
  customerName: string;
  phone: string;
  address: string;
  zone: string;
  orderTotal: number;
  driverId?: string;
  driverName?: string;
  status: DeliveryStatus;
  promisedTime: string;
  elapsedMinutes?: number;
  isDelayed?: boolean;
  branchId: string;
  createdAt: string;
  deliveredAt?: string;
}

export interface CreateDispatchDto {
  orderTicket: string;
  customerName: string;
  phone: string;
  address: string;
  zone: string;
  orderTotal: number;
  promisedMinutes?: number;
}

