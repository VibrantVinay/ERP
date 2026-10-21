'use client';

import React from 'react';
import { AppShell } from '../../core/components/AppShell';
import { LoyaltyWorkspace } from '../../apps/loyalty/components/LoyaltyWorkspace';

export default function LoyaltyPage() {
  return (
    <AppShell>
      <LoyaltyWorkspace />
    </AppShell>
  );
}
