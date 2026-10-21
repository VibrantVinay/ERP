'use client';

import React from 'react';
import { AppShell } from '../../core/components/AppShell';
import { EquipmentWorkspace } from '../../apps/equipment/components/EquipmentWorkspace';

export default function EquipmentPage() {
  return (
    <AppShell>
      <EquipmentWorkspace />
    </AppShell>
  );
}
