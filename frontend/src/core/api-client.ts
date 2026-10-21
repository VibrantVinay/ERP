import { clientConfig } from './config';
import { DEFAULT_DEMO_PERSONAS } from '@/apps/auth/types';

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

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers as Record<string, string>),
      },
    });
  } catch (netErr: any) {
    console.warn(`[RIFT API] Failed to connect to ${url}:`, netErr?.message || netErr);

    // If demo personas are requested, always return built-in personas so login works immediately
    if (endpoint.includes('/auth/demo-personas')) {
      return DEFAULT_DEMO_PERSONAS as any;
    }

    throw new ApiError(
      `Cannot connect to Backend API server at ${clientConfig.apiUrl}. Please verify backend server is running ('npm run dev').`,
      'BACKEND_CONNECTION_REFUSED',
      503,
      netErr
    );
  }

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

export const apiClient = {
  async get<T = any>(endpoint: string, options?: RequestInit): Promise<{ data: T }> {
    const data = await restClient<T>(endpoint, { ...options, method: 'GET' });
    return { data };
  },

  async post<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<{ data: T }> {
    const data = await restClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return { data };
  },

  async put<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<{ data: T }> {
    const data = await restClient<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return { data };
  },

  async patch<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<{ data: T }> {
    const data = await restClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return { data };
  },

  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<{ data: T }> {
    const data = await restClient<T>(endpoint, { ...options, method: 'DELETE' });
    return { data };
  },
};
