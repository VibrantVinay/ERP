import { apiClient } from '@/core/api-client';
import { AuditEvent, CreateAuditEventDTO, AuditSummary } from './types';

export const auditApi = {
  async getLogs(params?: {
    module?: string;
    action?: string;
    severity?: string;
    actorId?: string;
    branchId?: string;
    limit?: number;
  }): Promise<AuditEvent[]> {
    const searchParams = new URLSearchParams();
    if (params?.module && params.module !== 'all') searchParams.append('module', params.module);
    if (params?.action && params.action !== 'all') searchParams.append('action', params.action);
    if (params?.severity && params.severity !== 'all') searchParams.append('severity', params.severity);
    if (params?.actorId && params.actorId !== 'all') searchParams.append('actorId', params.actorId);
    if (params?.branchId && params.branchId !== 'all') searchParams.append('branchId', params.branchId);
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await apiClient.get<AuditEvent[]>(`/audit${qs}`);
    return res.data;
  },

  async getLogById(id: string): Promise<AuditEvent> {
    const res = await apiClient.get<AuditEvent>(`/audit/${id}`);
    return res.data;
  },

  async createLog(dto: CreateAuditEventDTO): Promise<AuditEvent> {
    const res = await apiClient.post<AuditEvent>('/audit', dto);
    return res.data;
  },

  async getSummary(): Promise<AuditSummary> {
    const res = await apiClient.get<AuditSummary>('/audit/summary');
    return res.data;
  },
};
