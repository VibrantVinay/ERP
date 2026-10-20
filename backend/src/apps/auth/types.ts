export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'cashier' | 'chef' | 'server' | 'driver' | 'accountant';
  restaurantId: string;
  branchScope: string;
}

export interface LoginDto {
  email: string;
  password?: string;
}

export interface AuthSessionResponse {
  token: string;
  user: UserProfile;
}

