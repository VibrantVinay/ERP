'use client';

import React from 'react';
import { AppShell } from '../../core/components/AppShell';
import { TaskChecklistWorkspace } from '../../apps/tasks/components/TaskChecklistWorkspace';

export default function TasksPage() {
  return (
    <AppShell>
      <TaskChecklistWorkspace />
    </AppShell>
  );
}
