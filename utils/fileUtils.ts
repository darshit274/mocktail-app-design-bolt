/**
 * File Utilities
 *
 * Utility functions for file operations and formatting.
 * Provides consistent file size formatting and file-related helpers.
 */

import { FILE_SIZE } from './appConstants';

/**
 * Format bytes to human-readable file size
 * @param bytes - The number of bytes to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = FILE_SIZE.KB;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

/**
 * Get file extension from filename or path
 * @param filename - The filename or path
 * @returns File extension without dot (e.g., "pdf", "jpg")
 */
export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

/**
 * Get filename without extension
 * @param filename - The filename or path
 * @returns Filename without extension
 */
export const getFileNameWithoutExtension = (filename: string): string => {
  const parts = filename.split('.');
  if (parts.length > 1) {
    parts.pop();
  }
  return parts.join('.');
};

/**
 * Validate file size against maximum allowed
 * @param bytes - The file size in bytes
 * @param maxBytes - Maximum allowed bytes
 * @returns True if file size is valid
 */
export const isValidFileSize = (bytes: number, maxBytes: number): boolean => {
  return bytes > 0 && bytes <= maxBytes;
};

/**
 * Check if file is a PDF based on extension
 * @param filename - The filename or path
 * @returns True if file is a PDF
 */
export const isPDF = (filename: string): boolean => {
  return getFileExtension(filename) === 'pdf';
};

/**
 * Check if file is an image based on extension
 * @param filename - The filename or path
 * @returns True if file is an image
 */
export const isImage = (filename: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  return imageExtensions.includes(getFileExtension(filename));
};

/**
 * Sanitize filename by removing special characters
 * @param filename - The filename to sanitize
 * @returns Sanitized filename
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9.-]/gi, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};

/**
 * Generate unique filename by adding timestamp
 * @param filename - Original filename
 * @returns Unique filename with timestamp
 */
export const generateUniqueFilename = (filename: string): string => {
  const timestamp = Date.now();
  const extension = getFileExtension(filename);
  const nameWithoutExt = getFileNameWithoutExtension(filename);

  return extension
    ? `${nameWithoutExt}_${timestamp}.${extension}`
    : `${filename}_${timestamp}`;
};

/**
 * Convert file size string to bytes
 * @param sizeStr - Size string (e.g., "1.5 MB")
 * @returns Number of bytes
 */
export const sizeStringToBytes = (sizeStr: string): number => {
  const units: Record<string, number> = {
    'B': 1,
    'KB': FILE_SIZE.KB,
    'MB': FILE_SIZE.MB,
    'GB': FILE_SIZE.GB,
    'TB': FILE_SIZE.TB,
  };

  const matches = sizeStr.match(/^([\d.]+)\s*([A-Z]+)$/i);
  if (!matches) return 0;

  const [, value, unit] = matches;
  const multiplier = units[unit.toUpperCase()] || 1;

  return parseFloat(value) * multiplier;
};
