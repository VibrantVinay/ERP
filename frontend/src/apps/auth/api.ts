import { restClient } from '@/core/api-client';
import { AuthSessionResponse, UserProfile, DemoPersona } from './types';

export const authApi = {
  loginWithPassword: async (email: string, password?: string, branchId?: string): Promise<AuthSessionResponse> => {
    return restClient<AuthSessionResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, branchId }),
    });
  },

  loginWithPin: async (pin: string, branchId?: string): Promise<AuthSessionResponse> => {
    return restClient<AuthSessionResponse>('/auth/pin-login', {
      method: 'POST',
      body: JSON.stringify({ pin, branchId }),
    });
  },

  getMe: async (): Promise<UserProfile> => {
    return restClient<UserProfile>('/auth/me');
  },

  switchBranch: async (branchId: string): Promise<UserProfile> => {
    return restClient<UserProfile>('/auth/switch-branch', {
      method: 'POST',
      body: JSON.stringify({ branchId }),
    });
  },

  getDemoPersonas: async (): Promise<DemoPersona[]> => {
    return restClient<DemoPersona[]>('/auth/demo-personas');
  },

  logout: async (): Promise<{ message: string }> => {
    return restClient<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  },

  cleanUsers: async (): Promise<{ message: string; count: number }> => {
    return restClient<{ message: string; count: number }>('/auth/clean-users', {
      method: 'POST',
    });
  },
};

