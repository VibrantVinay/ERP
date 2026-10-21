'use client';

import React from 'react';
import { AppShell } from '../../core/components/AppShell';
import { ReportsWorkspace } from '../../apps/reports/components/ReportsWorkspace';

export default function ReportsPage() {
  return (
    <AppShell>
      <ReportsWorkspace />
    </AppShell>
  );
}
