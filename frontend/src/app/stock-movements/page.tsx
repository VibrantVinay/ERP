'use client';

import React from 'react';
import { AppShell } from '../../core/components/AppShell';
import { StockMovementWorkspace } from '../../apps/stock_movements/components/StockMovementWorkspace';

export default function StockMovementsPage() {
  return (
    <AppShell>
      <StockMovementWorkspace />
    </AppShell>
  );
}
