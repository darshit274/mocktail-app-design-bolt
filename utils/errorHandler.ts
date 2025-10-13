/**
 * Error handling utilities
 * Created: 2025-01-11
 * Purpose: Centralized error handling for API calls
 * Used by: All auth screens and API consumers
 */

import Toast from 'react-native-toast-message';
import { ApiError } from '@/types';

interface TFunction {
  common: { error: string; success: string };
}

/**
 * Handles API errors with toast notifications
 * @param error - The error object from API call
 * @param defaultMessage - Default message if error doesn't have one
 * @param t - Translation function
 * @param dispatch - Redux dispatch function (optional)
 */
export const handleApiError = (
  error: unknown,
  defaultMessage: string,
  t: TFunction,
  dispatch?: (action: any) => void
): void => {
  const apiError = error as ApiError;
  const errorMessage = apiError?.data?.message || defaultMessage;

  // Dispatch error to Redux store if dispatch function provided
  if (dispatch) {
    // Note: Import setError from auth slice where this is used
    // dispatch(setError(errorMessage));
  }

  Toast.show({
    type: 'error',
    text1: t.common.error,
    text2: errorMessage,
  });
};

/**
 * Handles validation errors with toast notifications
 * @param errorMessage - The validation error message
 * @param t - Translation function
 */
export const handleValidationError = (
  errorMessage: string,
  t: TFunction
): void => {
  Toast.show({
    type: 'error',
    text1: t.common.error,
    text2: errorMessage,
  });
};

/**
 * Handles success messages with toast notifications
 * @param title - Success title
 * @param message - Success message
 */
export const handleSuccess = (
  title: string,
  message: string
): void => {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
  });
};

/**
 * Handles info messages with toast notifications
 * @param title - Info title
 * @param message - Info message
 */
export const handleInfo = (
  title: string,
  message: string
): void => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
  });
};

/**
 * Extracts error message from various error formats
 * @param error - The error object
 * @param defaultMessage - Default message if extraction fails
 * @returns Extracted error message
 */
export const extractErrorMessage = (
  error: unknown,
  defaultMessage: string = 'An error occurred'
): string => {
  if (typeof error === 'string') {
    return error;
  }

  const apiError = error as ApiError;
  if (apiError?.data?.message) {
    return apiError.data.message;
  }

  if (apiError?.data?.error) {
    return apiError.data.error;
  }

  if ((error as Error)?.message) {
    return (error as Error).message;
  }

  return defaultMessage;
};

/**
 * Checks if error is a network error
 * @param error - The error object
 * @returns True if network error
 */
export const isNetworkError = (error: unknown): boolean => {
  const apiError = error as ApiError;
  return apiError?.status === undefined || apiError?.status === 0;
};

/**
 * Checks if error is an authentication error (401)
 * @param error - The error object
 * @returns True if auth error
 */
export const isAuthError = (error: unknown): boolean => {
  const apiError = error as ApiError;
  return apiError?.status === 401;
};

/**
 * Checks if error is a validation error (400)
 * @param error - The error object
 * @returns True if validation error
 */
export const isValidationError = (error: unknown): boolean => {
  const apiError = error as ApiError;
  return apiError?.status === 400;
};

/**
 * Checks if error is a server error (5xx)
 * @param error - The error object
 * @returns True if server error
 */
export const isServerError = (error: unknown): boolean => {
  const apiError = error as ApiError;
  return apiError?.status >= 500 && apiError?.status < 600;
};
