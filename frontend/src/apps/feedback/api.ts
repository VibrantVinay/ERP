import { apiClient } from '../../core/api-client';
import { GuestFeedback, CreateFeedbackDto, AssignFeedbackDto, ResolveFeedbackDto, FeedbackSummaryMetrics } from './types';

export const feedbackApi = {
  async getFeedback(filters?: { status?: string; sentiment?: string }): Promise<GuestFeedback[]> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.sentiment && filters.sentiment !== 'all') params.append('sentiment', filters.sentiment);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await apiClient.get<GuestFeedback[]>(`/feedback${qs}`);
    return res.data;
  },

  async getSummaryMetrics(): Promise<FeedbackSummaryMetrics> {
    const res = await apiClient.get<FeedbackSummaryMetrics>('/feedback/metrics/summary');
    return res.data;
  },

  async getFeedbackById(id: string): Promise<GuestFeedback> {
    const res = await apiClient.get<GuestFeedback>(`/feedback/${id}`);
    return res.data;
  },

  async createFeedback(dto: CreateFeedbackDto): Promise<GuestFeedback> {
    const res = await apiClient.post<GuestFeedback>('/feedback', dto);
    return res.data;
  },

  async assignFeedback(id: string, dto: AssignFeedbackDto): Promise<GuestFeedback> {
    const res = await apiClient.patch<GuestFeedback>(`/feedback/${id}/assign`, dto);
    return res.data;
  },

  async resolveFeedback(id: string, dto: ResolveFeedbackDto): Promise<GuestFeedback> {
    const res = await apiClient.patch<GuestFeedback>(`/feedback/${id}/resolve`, dto);
    return res.data;
  },
};
