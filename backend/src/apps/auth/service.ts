import { LoginDto, AuthSessionResponse } from './types';
import { UnauthorizedError } from '../../core/errors';

export class AuthService {
  private demoUsers = [
    {
      id: 'usr_owner_01',
      name: 'Aarav Mehta',
      email: 'aarav@rift.example',
      role: 'owner' as const,
      restaurantId: 'rest_01',
      branchScope: 'All branches',
    },
    {
      id: 'usr_mgr_02',
      name: 'Mina D’Souza',
      email: 'mina@rift.example',
      role: 'manager' as const,
      restaurantId: 'rest_01',
      branchScope: 'Panaji',
    },
  ];

  public async login(dto: LoginDto): Promise<AuthSessionResponse> {
    const user = this.demoUsers.find(u => u.email.toLowerCase() === dto.email.toLowerCase()) || this.demoUsers[0];
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }
    return {
      token: `fake-jwt-token-for-${user.id}`,
      user,
    };
  }

  public async getProfile(userId: string) {
    const user = this.demoUsers.find(u => u.id === userId) || this.demoUsers[0];
    return user;
  }
}

export const authService = new AuthService();

