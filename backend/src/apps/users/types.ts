export type UserAccountStatus = 'active' | 'suspended' | 'pending_invite';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  branchId: string;
  branchName: string;
  status: UserAccountStatus;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  phone: string;
  role: string;
  branchId: string;
  branchName?: string;
}

export interface UpdateUserDTO {
  name?: string;
  phone?: string;
  role?: string;
  branchId?: string;
  branchName?: string;
  status?: UserAccountStatus;
}

export interface UserSummary {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  rolesCount: number;
}
