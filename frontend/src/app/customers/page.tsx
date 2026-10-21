'use client';

import React from 'react';
import { AppShell } from '../../core/components/AppShell';
import { CustomerWorkspace } from '../../apps/customers/components/CustomerWorkspace';

export default function CustomersPage() {
  return (
    <AppShell>
      <CustomerWorkspace />
    </AppShell>
  );
}
