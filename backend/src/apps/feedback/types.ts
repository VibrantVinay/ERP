export type FeedbackSentiment = 'Positive' | 'Neutral' | 'Negative';
export type FeedbackStatus = 'New' | 'Under Review' | 'Escalated' | 'Resolved';
export type ResolutionStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface GuestFeedback {
  id: string;
  ticketNumber: string;
  customerName: string;
  phone?: string;
  tableOrChannel: string;
  overallRating: number; // 1-5
  foodRating: number; // 1-5
  serviceRating: number; // 1-5
  ambianceRating: number; // 1-5
  comments: string;
  dishMentions: string[];
  sentiment: FeedbackSentiment;
  status: FeedbackStatus;
  assignedTo?: string;
  resolutionNotes?: string;
  compensationOffered?: string;
  resolvedAt?: string;
  branchId: string;
  createdAt: string;
}

export interface CreateFeedbackDto {
  ticketNumber: string;
  customerName: string;
  phone?: string;
  tableOrChannel: string;
  overallRating: number;
  foodRating: number;
  serviceRating: number;
  ambianceRating: number;
  comments: string;
  dishMentions?: string[];
  branchId?: string;
}

export interface AssignFeedbackDto {
  assignedTo: string;
  managerNotes?: string;
}

export interface ResolveFeedbackDto {
  resolutionNotes: string;
  compensationOffered?: string;
  resolvedBy: string;
}

export interface FeedbackSummaryMetrics {
  averageOverall: number;
  averageFood: number;
  averageService: number;
  averageAmbiance: number;
  totalReviews: number;
  escalatedCount: number;
  positivePercentage: number;
}

