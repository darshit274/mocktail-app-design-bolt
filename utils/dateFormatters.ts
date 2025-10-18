/**
 * Date Formatting Utilities
 * Centralized date formatting functions used across the application
 */

/**
 * Format a date string to a readable relative time
 * @param dateString - ISO date string
 * @returns Formatted string like "Today", "Yesterday", "3 days ago", etc.
 */
export const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }

  return date.toLocaleDateString();
};

/**
 * Format a date string to a standard date format
 * @param dateString - ISO date string
 * @param locale - Locale string (default: 'en-US')
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string,
  locale: string = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string => {
  const date = new Date(dateString);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return date.toLocaleDateString(locale, options || defaultOptions);
};

/**
 * Format a date string to include time
 * @param dateString - ISO date string
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted date and time string
 */
export const formatDateTime = (dateString: string, locale: string = 'en-US'): string => {
  const date = new Date(dateString);
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format a duration in seconds to readable format
 * @param seconds - Duration in seconds
 * @returns Formatted string like "1h 30m" or "45m" or "30s"
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

/**
 * Format seconds to MM:SS or HH:MM:SS format
 * @param seconds - Duration in seconds
 * @returns Formatted time string
 */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Check if a date is today
 * @param dateString - ISO date string
 * @returns true if date is today
 */
export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();

  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

/**
 * Check if a date is within the last N days
 * @param dateString - ISO date string
 * @param days - Number of days
 * @returns true if date is within the last N days
 */
export const isWithinDays = (dateString: string, days: number): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  return diffInDays <= days;
};
