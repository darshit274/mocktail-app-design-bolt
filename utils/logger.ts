/**
 * Centralized Logging Utility
 * Provides consistent logging across the application with environment-aware behavior
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  enabled: boolean;
  level: LogLevel;
  includeTimestamp: boolean;
  includeLocation: boolean;
}

const defaultConfig: LogConfig = {
  enabled: __DEV__, // Only log in development
  level: 'debug',
  includeTimestamp: true,
  includeLocation: false,
};

let config: LogConfig = { ...defaultConfig };

/**
 * Configure the logger
 * @param newConfig - Partial configuration to merge with existing config
 */
export const configureLogger = (newConfig: Partial<LogConfig>): void => {
  config = { ...config, ...newConfig };
};

/**
 * Get current timestamp
 */
const getTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Format log message with optional metadata
 */
const formatMessage = (level: LogLevel, message: string, data?: any): string => {
  const parts: string[] = [];

  if (config.includeTimestamp) {
    parts.push(`[${getTimestamp()}]`);
  }

  parts.push(`[${level.toUpperCase()}]`);
  parts.push(message);

  return parts.join(' ');
};

/**
 * Check if log level should be logged
 */
const shouldLog = (level: LogLevel): boolean => {
  if (!config.enabled) return false;

  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  const configLevelIndex = levels.indexOf(config.level);
  const messageLevelIndex = levels.indexOf(level);

  return messageLevelIndex >= configLevelIndex;
};

/**
 * Debug level logging - for detailed debugging information
 * @param message - Log message
 * @param data - Optional data to log
 */
export const debug = (message: string, data?: any): void => {
  if (!shouldLog('debug')) return;

  const formattedMessage = formatMessage('debug', message);

  if (data !== undefined) {
    console.debug(formattedMessage, data);
  } else {
    console.debug(formattedMessage);
  }
};

/**
 * Info level logging - for general information
 * @param message - Log message
 * @param data - Optional data to log
 */
export const info = (message: string, data?: any): void => {
  if (!shouldLog('info')) return;

  const formattedMessage = formatMessage('info', message);

  if (data !== undefined) {
    console.info(formattedMessage, data);
  } else {
    console.info(formattedMessage);
  }
};

/**
 * Warning level logging - for warnings that don't break functionality
 * @param message - Log message
 * @param data - Optional data to log
 */
export const warn = (message: string, data?: any): void => {
  if (!shouldLog('warn')) return;

  const formattedMessage = formatMessage('warn', message);

  if (data !== undefined) {
    console.warn(formattedMessage, data);
  } else {
    console.warn(formattedMessage);
  }
};

/**
 * Error level logging - for errors and exceptions
 * @param message - Log message
 * @param error - Error object or data
 */
export const error = (message: string, error?: Error | any): void => {
  if (!shouldLog('error')) return;

  const formattedMessage = formatMessage('error', message);

  if (error !== undefined) {
    if (error instanceof Error) {
      console.error(formattedMessage, {
        message: error.message,
        stack: error.stack,
        ...error,
      });
    } else {
      console.error(formattedMessage, error);
    }
  } else {
    console.error(formattedMessage);
  }
};

/**
 * Log API requests for debugging
 * @param method - HTTP method
 * @param url - Request URL
 * @param data - Request data
 */
export const logApiRequest = (method: string, url: string, data?: any): void => {
  debug(`API Request: ${method} ${url}`, data);
};

/**
 * Log API responses for debugging
 * @param method - HTTP method
 * @param url - Request URL
 * @param status - Response status code
 * @param data - Response data
 */
export const logApiResponse = (
  method: string,
  url: string,
  status: number,
  data?: any
): void => {
  if (status >= 400) {
    error(`API Error: ${method} ${url} - Status ${status}`, data);
  } else {
    debug(`API Response: ${method} ${url} - Status ${status}`, data);
  }
};

/**
 * Log navigation events
 * @param from - Previous route
 * @param to - New route
 * @param params - Navigation params
 */
export const logNavigation = (from: string, to: string, params?: any): void => {
  debug(`Navigation: ${from} → ${to}`, params);
};

/**
 * Create a scoped logger for a specific module
 * @param moduleName - Name of the module
 * @returns Scoped logger functions
 */
export const createLogger = (moduleName: string) => {
  const prefixMessage = (message: string) => `[${moduleName}] ${message}`;

  return {
    debug: (message: string, data?: any) => debug(prefixMessage(message), data),
    info: (message: string, data?: any) => info(prefixMessage(message), data),
    warn: (message: string, data?: any) => warn(prefixMessage(message), data),
    error: (message: string, errorData?: Error | any) => error(prefixMessage(message), errorData),
  };
};

// Default export
export default {
  debug,
  info,
  warn,
  error,
  logApiRequest,
  logApiResponse,
  logNavigation,
  configureLogger,
  createLogger,
};
