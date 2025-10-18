/**
 * Application Constants
 * Centralized constants to replace magic numbers and hardcoded values
 */

/**
 * Timing Constants
 */
export const TIMING = {
  // App initialization delays
  LAYOUT_READY_DELAY: 500, // ms to wait for layout before routing
  AUTH_STATE_PROPAGATION: 200, // ms to wait for auth state to propagate

  // Quiz timers
  DEFAULT_QUIZ_DURATION: 3600, // seconds (60 minutes)
  QUIZ_WARNING_TIME: 300, // seconds (5 minutes)
  QUIZ_CRITICAL_TIME: 60, // seconds (1 minute)

  // API timeouts
  API_TIMEOUT: 30000, // ms (30 seconds)
  API_RETRY_DELAY: 1000, // ms (1 second)

  // Debounce delays
  SEARCH_DEBOUNCE: 300, // ms
  INPUT_DEBOUNCE: 500, // ms
} as const;

/**
 * UI Constants
 */
export const UI = {
  // Spacing
  SPACING_XS: 4,
  SPACING_SM: 8,
  SPACING_MD: 12,
  SPACING_LG: 16,
  SPACING_XL: 20,
  SPACING_XXL: 24,

  // Border radius
  BORDER_RADIUS_SM: 4,
  BORDER_RADIUS_MD: 8,
  BORDER_RADIUS_LG: 12,
  BORDER_RADIUS_XL: 16,
  BORDER_RADIUS_CIRCLE: 9999,

  // Icon sizes
  ICON_SIZE_SM: 16,
  ICON_SIZE_MD: 20,
  ICON_SIZE_LG: 24,
  ICON_SIZE_XL: 32,
  ICON_SIZE_XXL: 48,

  // Tab bar
  TAB_BAR_HEIGHT: 60,
  TAB_BAR_BOTTOM_PADDING: 5,

  // Avatar sizes
  AVATAR_SIZE_SM: 32,
  AVATAR_SIZE_MD: 48,
  AVATAR_SIZE_LG: 64,
  AVATAR_SIZE_XL: 96,

  // Animation durations (ms)
  ANIMATION_FAST: 150,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500,
} as const;

/**
 * Pagination Constants
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  ITEMS_PER_PAGE: {
    TESTS: 10,
    PDFS: 10,
    NOTIFICATIONS: 20,
    LEADERBOARD: 20,
  },
} as const;

/**
 * Quiz Constants
 */
export const QUIZ = {
  MIN_QUESTIONS: 1,
  DEFAULT_TIME_PER_QUESTION: 60, // seconds
  PASS_PERCENTAGE: 50,

  // Question status
  STATUS: {
    ANSWERED: 'answered',
    UNANSWERED: 'unanswered',
    FLAGGED: 'flagged',
    SKIPPED: 'skipped',
  },

  // Negative marking
  DEFAULT_NEGATIVE_MARKS: 0.25,
} as const;

/**
 * File Size Constants
 */
export const FILE_SIZE = {
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,

  // Max upload sizes
  MAX_PDF_SIZE: 50 * 1024 * 1024, // 50 MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5 MB
} as const;

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  THEME_MODE: '@theme_mode',
  LANGUAGE: '@mocktail_language',
  ONBOARDING_COMPLETE: '@onboarding_complete',
  LAST_SYNC: '@last_sync',
} as const;

/**
 * Validation Constants
 */
export const VALIDATION = {
  EMAIL: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 255,
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
  },
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 15,
  },
  OTP: {
    LENGTH: 6,
  },
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  AUTH_ERROR: 'Authentication failed. Please login again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  PDF_LOAD_ERROR: 'Failed to load PDF. Please try again.',
  QUIZ_SUBMIT_ERROR: 'Failed to submit quiz. Please try again.',
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  SIGNUP_SUCCESS: 'Signup successful! Please verify your email.',
  PASSWORD_RESET: 'Password reset link sent to your email.',
  QUIZ_SUBMITTED: 'Quiz submitted successfully!',
  PAYMENT_SUCCESS: 'Payment successful!',
  PROFILE_UPDATED: 'Profile updated successfully!',
} as const;

/**
 * Feature Flags
 */
export const FEATURES = {
  ENABLE_NOTIFICATIONS: true,
  ENABLE_DARK_MODE: true,
  ENABLE_OFFLINE_MODE: false,
  ENABLE_ANALYTICS: false,
  ENABLE_CRASH_REPORTING: false,
} as const;

/**
 * App Limits
 */
export const LIMITS = {
  MAX_RETRIES: 3,
  MAX_CONCURRENT_DOWNLOADS: 3,
  MAX_FLAGGED_QUESTIONS: 100,
  MAX_SEARCH_RESULTS: 50,
} as const;

/**
 * Date Formats
 */
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  FULL: 'MMMM dd, yyyy HH:mm:ss',
  SHORT: 'MM/dd/yyyy',
  TIME: 'HH:mm:ss',
  ISO: 'yyyy-MM-dd',
} as const;

/**
 * API Endpoints (relative paths)
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  TESTS: {
    GET_SERIES: '/tests/series',
    GET_QUESTIONS: '/tests/questions',
    SUBMIT: '/tests/submit',
    RESULTS: '/tests/results',
  },
  PDFS: {
    GET_ALL: '/pdfs',
    GET_BY_ID: '/pdfs/:id',
    CHECK_ACCESS: '/pdfs/:id/access',
  },
  USER: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    DASHBOARD: '/users/dashboard',
  },
} as const;
