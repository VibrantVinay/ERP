'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, DemoPersona } from '../types';
import { authApi } from '../api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  loginWithPassword: (email: string, password?: string, branch?: string) => Promise<void>;
  loginWithPin: (pin: string, branch?: string) => Promise<void>;
  loginAsPersona: (persona: DemoPersona) => Promise<void>;
  switchBranch: (branch: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    async function restoreSession() {
      const storedToken = localStorage.getItem('rift_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const profile = await authApi.getMe();
          setUser(profile);
        } catch {
          localStorage.removeItem('rift_token');
          setToken(null);
          setUser(null);
        }
      } else {
        // Default guest persona for instant dev interaction
        setUser({
          id: 'usr_owner_01',
          name: 'Aarav Mehta',
          email: 'aarav@rift.example',
          role: 'owner',
          restaurantId: 'rest_01',
          branchScope: 'All branches',
          activeBranch: 'Panaji Main',
          hasPin: true,
        });
      }
      setLoading(false);
    }
    restoreSession();
  }, []);

  const loginWithPassword = async (email: string, password?: string, branch?: string) => {
    const res = await authApi.loginWithPassword(email, password, branch);
    localStorage.setItem('rift_token', res.token);
    localStorage.setItem('rift_branch', res.user.activeBranch);
    setToken(res.token);
    setUser(res.user);
    router.push('/pos');
  };

  const loginWithPin = async (pin: string, branch?: string) => {
    const res = await authApi.loginWithPin(pin, branch);
    localStorage.setItem('rift_token', res.token);
    localStorage.setItem('rift_branch', res.user.activeBranch);
    setToken(res.token);
    setUser(res.user);
    router.push('/pos');
  };

  const loginAsPersona = async (persona: DemoPersona) => {
    const res = await authApi.loginWithPassword(persona.email, 'password123', persona.branch === 'All branches' ? 'Panaji Main' : persona.branch);
    localStorage.setItem('rift_token', res.token);
    localStorage.setItem('rift_branch', res.user.activeBranch);
    setToken(res.token);
    setUser(res.user);
    router.push('/pos');
  };

  const switchBranch = async (branch: string) => {
    if (!user) return;
    const updated = await authApi.switchBranch(branch);
    localStorage.setItem('rift_branch', branch);
    setUser(updated);
  };

  const logout = () => {
    localStorage.removeItem('rift_token');
    localStorage.removeItem('rift_branch');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginWithPassword,
        loginWithPin,
        loginAsPersona,
        switchBranch,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
