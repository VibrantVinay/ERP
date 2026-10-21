'use client';

import React from 'react';
import { AppShell } from '../../core/components/AppShell';
import { FeedbackWorkspace } from '../../apps/feedback/components/FeedbackWorkspace';

export default function FeedbackPage() {
  return (
    <AppShell>
      <FeedbackWorkspace />
    </AppShell>
  );
}
