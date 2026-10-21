'use client';

import React from 'react';
import { AppShell } from '../../core/components/AppShell';
import { SupplierWorkspace } from '../../apps/suppliers/components/SupplierWorkspace';

export default function SuppliersPage() {
  return (
    <AppShell>
      <SupplierWorkspace />
    </AppShell>
  );
}
