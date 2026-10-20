import React from 'react';
import Link from 'next/link';
import '../styles/globals.css';

export const metadata = {
  title: 'Rift · Restaurant ERP',
  description: 'Modular enterprise restaurant ERP with plug-and-play architecture',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          {/* Main Navigation Sidebar */}
          <aside className="sidebar">
            <div className="brand">
              <span>RIFT</span>
              <small>ERP</small>
            </div>

            <div className="nav-section-title">Service & FOH</div>
            <Link href="/pos" className="nav-link">
              <span>▤</span> Point of Sale
            </Link>
            <Link href="/orders" className="nav-link">
              <span>↗</span> Orders
            </Link>
            <Link href="/kitchen" className="nav-link">
              <span>♨</span> Kitchen Display
            </Link>
            <Link href="/tables" className="nav-link">
              <span>▦</span> Tables & Floor
            </Link>

            <div className="nav-section-title">Menu & Stock</div>
            <Link href="/menu" className="nav-link">
              <span>▧</span> Menu & Items
            </Link>
            <Link href="/inventory" className="nav-link">
              <span>▣</span> Inventory & Stock
            </Link>

            <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.8rem', color: '#8fa08e' }}>Branch: Panaji Main</div>
              <div style={{ fontSize: '0.75rem', color: '#cad8c9' }}>Plug & Play Modular ERP</div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="main-content">
            <header className="topbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  RIFT RESTAURANT WORKSPACE
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Aarav Mehta (Owner)</span>
                <span className="badge badge-success">API Connected</span>
              </div>
            </header>

            <div className="page-container">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}

