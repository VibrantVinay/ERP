'use client';

import React from 'react';
import { AppShell } from '../../core/components/AppShell';
import { FinanceWorkspace } from '../../apps/finance/components/FinanceWorkspace';

export default function FinancePage() {
  return (
    <AppShell>
      <FinanceWorkspace />
    </AppShell>
  );
}
