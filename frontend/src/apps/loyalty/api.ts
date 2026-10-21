import { apiClient } from '../../core/api-client';
import { PromoCampaign, LoyaltyMember, CreateCampaignDto, ValidateCouponDto, ValidateCouponResult, AdjustPointsDto } from './types';

export const loyaltyApi = {
  async getCampaigns(activeOnly?: boolean): Promise<PromoCampaign[]> {
    const params = new URLSearchParams();
    if (activeOnly) params.append('active', 'true');
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await apiClient.get<PromoCampaign[]>(`/loyalty/campaigns${qs}`);
    return res.data;
  },

  async createCampaign(dto: CreateCampaignDto): Promise<PromoCampaign> {
    const res = await apiClient.post<PromoCampaign>('/loyalty/campaigns', dto);
    return res.data;
  },

  async validateCoupon(dto: ValidateCouponDto): Promise<ValidateCouponResult> {
    const res = await apiClient.post<ValidateCouponResult>('/loyalty/validate-coupon', dto);
    return res.data;
  },

  async getMembers(): Promise<LoyaltyMember[]> {
    const res = await apiClient.get<LoyaltyMember[]>('/loyalty/members');
    return res.data;
  },

  async getMemberById(id: string): Promise<LoyaltyMember> {
    const res = await apiClient.get<LoyaltyMember>(`/loyalty/members/${id}`);
    return res.data;
  },

  async adjustPoints(id: string, dto: AdjustPointsDto): Promise<LoyaltyMember> {
    const res = await apiClient.post<LoyaltyMember>(`/loyalty/members/${id}/adjust-points`, dto);
    return res.data;
  },
};
