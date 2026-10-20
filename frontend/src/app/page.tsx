'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, getLandingRouteForRole } from '@/apps/auth/context/AuthContext';
import { LoginPortal } from '@/apps/auth/components/LoginPortal';

export default function RootHomePage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && token) {
      router.replace(getLandingRouteForRole(user.role));
    }
  }, [user, token, loading, router]);

  // While checking session
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-muted)' }}>
        <p>Loading Rift Workspace...</p>
      </div>
    );
  }

  // If already authenticated, show brief redirecting state
  if (user && token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-muted)' }}>
        <p>Redirecting to {user.role.toUpperCase()} workspace...</p>
      </div>
    );
  }

  // Default: Render the Login Portal right at "/"
  return <LoginPortal />;
}
