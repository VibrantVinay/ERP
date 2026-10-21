export type BranchStatus = 'active' | 'renovation' | 'closed';

export interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  managerName: string;
  openingTime: string;
  closingTime: string;
  status: BranchStatus;
  seatingCapacity: number;
  tablesCount: number;
  currentDailyRevenue: number;
  activeOrdersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchDTO {
  code: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  managerName: string;
  openingTime?: string;
  closingTime?: string;
  seatingCapacity: number;
  tablesCount: number;
}

export interface UpdateBranchDTO {
  name?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  managerName?: string;
  openingTime?: string;
  closingTime?: string;
  status?: BranchStatus;
  seatingCapacity?: number;
  tablesCount?: number;
}

export interface BranchSummary {
  totalBranches: number;
  activeBranches: number;
  totalFleetRevenue: number;
  totalFleetSeats: number;
}

