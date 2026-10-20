'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, getLandingRouteForRole } from '@/apps/auth/context/AuthContext';
import { LoginPortal } from '@/apps/auth/components/LoginPortal';
import { StaffRole } from '@/apps/auth/types';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

const ALL_NAV_GROUPS: NavGroup[] = [
  {
    section: 'Service & FOH',
    items: [
      { label: 'Point of Sale', href: '/pos', icon: '▤' },
      { label: 'Orders', href: '/orders', icon: '↗' },
      { label: 'Kitchen Display', href: '/kitchen', icon: '♨' },
      { label: 'Tables & Floor', href: '/tables', icon: '▦' },
    ],
  },
  {
    section: 'Menu & Stock',
    items: [
      { label: 'Menu & Items', href: '/menu', icon: '▧' },
      { label: 'Inventory & Stock', href: '/inventory', icon: '▣' },
    ],
  },
];

/**
 * Strict Role-Based Access Control (RBAC) rules
 */
export const ROLE_ALLOWED_ROUTES: Record<StaffRole, string[]> = {
  chef: ['/kitchen', '/menu', '/inventory'],
  server: ['/pos', '/tables'],
  cashier: ['/pos', '/orders'],
  driver: ['/orders'],
  accountant: ['/orders', '/inventory', '/menu'],
  manager: ['/pos', '/orders', '/kitchen', '/tables', '/menu', '/inventory'],
  owner: ['/pos', '/orders', '/kitchen', '/tables', '/menu', '/inventory'],
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
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

  const role = (user.role || 'server') as StaffRole;
  const allowedRoutes = ROLE_ALLOWED_ROUTES[role] || ['/pos'];
  const isAuthorized = allowedRoutes.includes(pathname);

  // Filter navigation groups according to active user's permissions
  const visibleGroups = ALL_NAV_GROUPS.map(group => ({
    section: group.section,
    items: group.items.filter(item => allowedRoutes.includes(item.href)),
  })).filter(group => group.items.length > 0);

  const getRoleBadgeColor = (r: StaffRole) => {
    switch (r) {
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

  const roleStyle = getRoleBadgeColor(role);

  return (
    <div className="app-container">
      {/* Main Navigation Sidebar (Dynamic Role-Filtered) */}
      <aside className="sidebar">
        <div className="brand">
          <span>RIFT</span>
          <small>{role.toUpperCase()}</small>
        </div>

        {visibleGroups.map(group => (
          <div key={group.section}>
            <div className="nav-section-title">{group.section}</div>
            {group.items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${pathname === item.href ? 'active' : ''}`}
              >
                <span>{item.icon}</span> {item.label}
              </Link>
            ))}
          </div>
        ))}

        {/* Staff footer in sidebar */}
        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '0.8rem', color: '#8fa08e' }}>
            Branch: <strong style={{ color: '#fff' }}>{user.activeBranch || 'Panaji Main'}</strong>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#cad8c9', marginTop: '0.2rem' }}>
            {user.name} ({role.toUpperCase()})
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              RIFT · {role.toUpperCase()} WORKSPACE
            </span>

            {/* Branch Switcher */}
            <select
              value={user.activeBranch || 'Panaji Main'}
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
              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{user.name}</div>
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
                {role}
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

        {/* Content Area with Unauthorized Route Guard */}
        <div className="page-container">
          {isAuthorized ? (
            children
          ) : (
            <div className="card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
              <div className="eyebrow" style={{ color: 'var(--danger)' }}>403 · RESTRICTED ACCESS</div>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '0.75rem' }}>Portal Not Authorized</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                Your account (<strong>{user.name}</strong> · <span style={{ textTransform: 'capitalize' }}>{role}</span>) does not have permission to view <code>{pathname}</code>.
              </p>
              <button
                onClick={() => router.push(getLandingRouteForRole(role))}
                className="btn btn-primary"
              >
                Go to My Workspace ({getLandingRouteForRole(role)}) →
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
