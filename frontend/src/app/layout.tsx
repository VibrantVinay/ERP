import React from 'react';
import { AuthProvider } from '@/apps/auth/context/AuthContext';
import { AppShell } from '@/core/components/AppShell';
import '../styles/globals.css';

export const metadata = {
  title: 'Rift · Restaurant ERP',
  description: 'Modular enterprise restaurant ERP with plug-and-play architecture',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
