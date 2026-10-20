import { clientConfig } from './config';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  meta?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(message: string, code: string, statusCode: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export async function restClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${clientConfig.apiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let token: string | null = null;
  let activeBranch = clientConfig.branchId;

  if (typeof window !== 'undefined') {
    token = localStorage.getItem('rift_token');
    const storedBranch = localStorage.getItem('rift_branch');
    if (storedBranch) activeBranch = storedBranch;
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Restaurant-ID': clientConfig.restaurantId,
    'X-Branch-ID': activeBranch,
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers as Record<string, string>),
    },
  });

  const payload: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    data: null as any,
    error: {
      code: 'NETWORK_OR_PARSING_ERROR',
      message: `Failed to parse response from ${endpoint}`,
    },
  }));

  if (!response.ok || !payload.success) {
    throw new ApiError(
      payload.error?.message || `Request failed with status ${response.status}`,
      payload.error?.code || 'UNKNOWN_ERROR',
      response.status,
      payload.error?.details
    );
  }

  return payload.data;
}
