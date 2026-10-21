'use client';

import React from 'react';
import { AppShell } from '../../core/components/AppShell';
import { StaffWorkspace } from '../../apps/staff/components/StaffWorkspace';

export default function StaffPage() {
  return (
    <AppShell>
      <StaffWorkspace />
    </AppShell>
  );
}
