'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/apps/auth/context/AuthContext';
import { LoginPortal } from '@/apps/auth/components/LoginPortal';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, token, loading, switchBranch, logout } = useAuth();

  // If on the root login portal or /login, render without sidebar/topbar
  if (pathname === '/' || pathname === '/login') {
    return <>{children}</>;
  }

  // Session verification in progress
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-muted)' }}>
        <p>Loading session...</p>
      </div>
    );
  }

  // If trying to access internal routes without authentication, render the login portal
  if (!user || !token) {
    return (
      <div>
        <div style={{ background: '#fef3c7', borderBottom: '1px solid #f59e0b', color: '#92400e', padding: '0.6rem 1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
          🔒 Authentication required. Please sign in to access the workspace.
        </div>
        <LoginPortal />
      </div>
    );
  }

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'owner': return { bg: '#fef3c7', text: '#92400e' };
      case 'manager': return { bg: '#e0f2fe', text: '#0369a1' };
      case 'chef': return { bg: '#fee2e2', text: '#b91c1c' };
      case 'cashier': return { bg: '#dcfce7', text: '#15803d' };
      case 'server': return { bg: '#f3e8ff', text: '#6b21a8' };
      case 'driver': return { bg: '#ffedd5', text: '#c2410c' };
      case 'accountant': return { bg: '#ecfdf5', text: '#047857' };
      default: return { bg: '#e5e7eb', text: '#374151' };
    }
  };

  const roleStyle = getRoleBadgeColor(user?.role);

  return (
    <div className="app-container">
      {/* Main Navigation Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <span>RIFT</span>
          <small>ERP</small>
        </div>

        <div className="nav-section-title">Service & FOH</div>
        <Link href="/pos" className={`nav-link ${pathname === '/pos' ? 'active' : ''}`}>
          <span>▤</span> Point of Sale
        </Link>
        <Link href="/orders" className={`nav-link ${pathname === '/orders' ? 'active' : ''}`}>
          <span>↗</span> Orders
        </Link>
        <Link href="/kitchen" className={`nav-link ${pathname === '/kitchen' ? 'active' : ''}`}>
          <span>♨</span> Kitchen Display
        </Link>
        <Link href="/tables" className={`nav-link ${pathname === '/tables' ? 'active' : ''}`}>
          <span>▦</span> Tables & Floor
        </Link>

        <div className="nav-section-title">Menu & Stock</div>
        <Link href="/menu" className={`nav-link ${pathname === '/menu' ? 'active' : ''}`}>
          <span>▧</span> Menu & Items
        </Link>
        <Link href="/inventory" className={`nav-link ${pathname === '/inventory' ? 'active' : ''}`}>
          <span>▣</span> Inventory & Stock
        </Link>

        {/* Staff footer in sidebar */}
        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '0.8rem', color: '#8fa08e' }}>
            Branch: <strong style={{ color: '#fff' }}>{user?.activeBranch || 'Panaji Main'}</strong>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#cad8c9', marginTop: '0.2rem' }}>
            {user?.name || 'Staff User'} ({user?.role?.toUpperCase() || 'OPERATOR'})
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              RIFT RESTAURANT WORKSPACE
            </span>

            {/* Branch Switcher */}
            <select
              value={user?.activeBranch || 'Panaji Main'}
              onChange={e => switchBranch(e.target.value)}
              style={{
                fontSize: '0.8rem',
                padding: '0.25rem 0.5rem',
                borderRadius: 4,
                border: '1px solid var(--border)',
                background: 'var(--surface-alt)',
                fontWeight: 600,
              }}
            >
              <option value="Panaji Main">Panaji Main</option>
              <option value="Candolim Beach">Candolim Beach</option>
              <option value="Margao Town">Margao Town</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* User Profile & Role Badge */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{user?.name}</div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: roleStyle.bg,
                  color: roleStyle.text,
                  padding: '1px 6px',
                  borderRadius: 4,
                }}
              >
                {user?.role}
              </span>
            </div>

            {/* Switch User / Logout Button */}
            <button
              onClick={logout}
              className="btn btn-outline"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              title="Sign out and return to Login Portal"
            >
              Sign Out
            </button>
          </div>
        </header>

        <div className="page-container">{children}</div>
      </main>
    </div>
  );
}
