/**
 * API-related TypeScript interfaces
 * Created: 2025-01-11
 * Purpose: Strong typing for API requests and responses
 */

export interface ApiError {
  status: number;
  data: {
    success: false;
    message: string;
    error?: string;
    details?: string[];
  };
}

export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
  timestamp?: number;
}

export interface PaginatedResponse<T> {
  success: true;
  message: string;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiRequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
}
