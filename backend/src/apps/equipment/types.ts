export type EquipmentStatus = 'operational' | 'needs_maintenance' | 'under_repair' | 'decommissioned';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'cancelled';

export interface EquipmentAsset {
  id: string;
  branchId: string;
  name: string;
  category: string; // 'Cooking', 'Refrigeration', 'Beverage', 'Warewashing', 'HVAC'
  serialNumber?: string;
  location: string;
  status: EquipmentStatus;
  purchaseDate?: string;
  serviceIntervalDays: number;
  lastServiceDate?: string;
  nextServiceDate?: string;
  technicianContact?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BreakdownTicket {
  id: string;
  branchId: string;
  equipmentId: string;
  equipmentName: string;
  reportedBy: string;
  issueDescription: string;
  priority: MaintenancePriority;
  status: TicketStatus;
  technicianName?: string;
  serviceCost?: number;
  partsReplaced?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEquipmentDTO {
  branchId: string;
  name: string;
  category: string;
  serialNumber?: string;
  location: string;
  serviceIntervalDays?: number;
  purchaseDate?: string;
  technicianContact?: string;
  notes?: string;
}

export interface LogMaintenanceDTO {
  serviceDate: string;
  technicianName: string;
  cost?: number;
  notes?: string;
}

export interface CreateBreakdownDTO {
  branchId: string;
  equipmentId: string;
  reportedBy: string;
  issueDescription: string;
  priority?: MaintenancePriority;
}

export interface ResolveTicketDTO {
  technicianName: string;
  serviceCost?: number;
  partsReplaced?: string;
  notes?: string;
}

