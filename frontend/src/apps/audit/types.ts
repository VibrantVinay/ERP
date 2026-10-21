export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VOID'
  | 'DISPATCH'
  | 'OVERRIDE'
  | 'EXPORT'
  | 'LOGIN';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  branchId: string;
  branchName: string;
  module: string;
  action: AuditAction;
  severity: AuditSeverity;
  description: string;
  details?: string;
  ipAddress: string;
}

export interface CreateAuditEventDTO {
  actorId: string;
  actorName: string;
  actorRole: string;
  branchId: string;
  branchName?: string;
  module: string;
  action: AuditAction;
  severity?: AuditSeverity;
  description: string;
  details?: string;
  ipAddress?: string;
}

export interface AuditSummary {
  totalEvents: number;
  criticalEvents: number;
  todayEvents: number;
  uniqueActors: number;
}
