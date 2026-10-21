'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, DemoPersona, DEFAULT_DEMO_PERSONAS } from '../types';
import { authApi } from '../api';

export function getLandingRouteForRole(role?: string): string {
  switch (role) {
    case 'chef':
      return '/kitchen';
    case 'cleaner':
      return '/tables';
    case 'driver':
      return '/delivery';
    case 'accountant':
      return '/finance';
    case 'host':
      return '/reservations';
    case 'bartender':
    case 'server':
    case 'cashier':
    case 'manager':
    case 'owner':
    default:
      return '/pos';
  }
}

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
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      const storedToken = localStorage.getItem('rift_token');
      const storedUser = localStorage.getItem('rift_user');

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            // fallback
          }
        }
        try {
          const profile = await authApi.getMe();
          setUser(profile);
          localStorage.setItem('rift_user', JSON.stringify(profile));
        } catch {
          // If offline / backend booting, keep stored user if available
          if (!storedUser) {
            localStorage.removeItem('rift_token');
            setToken(null);
            setUser(null);
          }
        }
      } else {
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    }
    restoreSession();
  }, []);

  const handlePostLogin = (res: { token: string; user: UserProfile }) => {
    localStorage.setItem('rift_token', res.token);
    localStorage.setItem('rift_branch', res.user.activeBranch || 'Panaji Main');
    localStorage.setItem('rift_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);

    // Dynamic routing to role-scoped workspace
    const targetRoute = getLandingRouteForRole(res.user.role);
    router.push(targetRoute);
  };

  const loginWithPassword = async (email: string, password?: string, branch?: string) => {
    try {
      const res = await authApi.loginWithPassword(email, password, branch);
      handlePostLogin(res);
    } catch (err: any) {
      // Check if matches known demo persona for offline mode
      const matched = DEFAULT_DEMO_PERSONAS.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        handlePostLogin({
          token: `demo_token_${matched.role}_${Date.now()}`,
          user: {
            id: matched.id,
            name: matched.name,
            email: matched.email,
            role: matched.role,
            restaurantId: 'rest_01',
            branchScope: matched.branch,
            activeBranch: branch || matched.branch,
            hasPin: true,
          },
        });
        return;
      }
      throw err;
    }
  };

  const loginWithPin = async (pin: string, branch?: string) => {
    try {
      const res = await authApi.loginWithPin(pin, branch);
      handlePostLogin(res);
    } catch (err: any) {
      // Offline fallback for demo personas
      const matched = DEFAULT_DEMO_PERSONAS.find(p => p.pin === pin);
      if (matched) {
        handlePostLogin({
          token: `demo_token_${matched.role}_${Date.now()}`,
          user: {
            id: matched.id,
            name: matched.name,
            email: matched.email,
            role: matched.role,
            restaurantId: 'rest_01',
            branchScope: matched.branch,
            activeBranch: branch || matched.branch,
            hasPin: true,
          },
        });
        return;
      }
      throw err;
    }
  };

  const loginAsPersona = async (persona: DemoPersona) => {
    try {
      const res = await authApi.loginWithPassword(
        persona.email,
        'password123',
        persona.branch === 'All branches' ? 'Panaji Main' : persona.branch
      );
      handlePostLogin(res);
    } catch (err) {
      // Direct instant fallback so 1-Click Role Switcher ALWAYS works even if backend is offline
      handlePostLogin({
        token: `demo_token_${persona.role}_${Date.now()}`,
        user: {
          id: persona.id,
          name: persona.name,
          email: persona.email,
          role: persona.role,
          restaurantId: 'rest_01',
          branchScope: persona.branch,
          activeBranch: persona.branch === 'All branches' ? 'Panaji Main' : persona.branch,
          hasPin: true,
        },
      });
    }
  };

  const switchBranch = async (branch: string) => {
    if (!user) return;
    try {
      const updated = await authApi.switchBranch(branch);
      localStorage.setItem('rift_branch', branch);
      localStorage.setItem('rift_user', JSON.stringify(updated));
      setUser(updated);
    } catch {
      const updated = { ...user, activeBranch: branch };
      localStorage.setItem('rift_branch', branch);
      localStorage.setItem('rift_user', JSON.stringify(updated));
      setUser(updated);
    }
  };

  const logout = () => {
    localStorage.removeItem('rift_token');
    localStorage.removeItem('rift_branch');
    localStorage.removeItem('rift_user');
    setToken(null);
    setUser(null);
    router.push('/');
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
