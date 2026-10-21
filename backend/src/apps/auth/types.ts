export type StaffRole =
  | 'owner'
  | 'manager'
  | 'cashier'
  | 'chef'
  | 'server'
  | 'driver'
  | 'cleaner'
  | 'accountant'
  | 'bartender'
  | 'host'
  | 'customer_terminal';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  restaurantId: string;
  branchScope: string;
  activeBranch: string;
  hasPin: boolean;
}

export interface LoginDto {
  email: string;
  password?: string;
  branchId?: string;
}

export interface PinLoginDto {
  pin: string;
  branchId?: string;
}

export interface SwitchBranchDto {
  branchId: string;
}

export interface AuthSessionResponse {
  token: string;
  user: UserProfile;
  availableBranches: string[];
}

export interface DemoPersona {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  pin: string;
  branch: string;
  description: string;
}
