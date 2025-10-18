/**
 * String Utilities
 *
 * Utility functions for string manipulation and formatting.
 * Provides common string operations used throughout the app.
 */

/**
 * Capitalize the first letter of a string
 * @param str - The string to capitalize
 * @returns Capitalized string
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Capitalize the first letter of each word
 * @param str - The string to title case
 * @returns Title cased string
 */
export const titleCase = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Convert string to camelCase
 * @param str - The string to convert
 * @returns camelCased string
 */
export const toCamelCase = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
};

/**
 * Convert string to kebab-case
 * @param str - The string to convert
 * @returns kebab-cased string
 */
export const toKebabCase = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
};

/**
 * Convert string to snake_case
 * @param str - The string to convert
 * @returns snake_cased string
 */
export const toSnakeCase = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
};

/**
 * Truncate a string to a specified length
 * @param str - The string to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add (default: '...')
 * @returns Truncated string
 */
export const truncate = (str: string, maxLength: number, suffix: string = '...'): string => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
};

/**
 * Truncate string at word boundary
 * @param str - The string to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add (default: '...')
 * @returns Truncated string at word boundary
 */
export const truncateWords = (str: string, maxLength: number, suffix: string = '...'): string => {
  if (!str) return '';
  if (str.length <= maxLength) return str;

  const truncated = str.slice(0, maxLength - suffix.length);
  const lastSpace = truncated.lastIndexOf(' ');

  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + suffix;
};

/**
 * Convert string to URL-friendly slug
 * @param str - The string to slugify
 * @returns URL-friendly slug
 */
export const slugify = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Remove all whitespace from string
 * @param str - The string to process
 * @returns String without whitespace
 */
export const removeWhitespace = (str: string): string => {
  if (!str) return '';
  return str.replace(/\s+/g, '');
};

/**
 * Remove extra whitespace (collapse multiple spaces to one)
 * @param str - The string to process
 * @returns String with normalized whitespace
 */
export const normalizeWhitespace = (str: string): string => {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
};

/**
 * Check if string is empty or only whitespace
 * @param str - The string to check
 * @returns True if empty or whitespace
 */
export const isBlank = (str: string | null | undefined): boolean => {
  return !str || str.trim().length === 0;
};

/**
 * Check if string contains substring (case-insensitive)
 * @param str - The string to search in
 * @param searchString - The substring to search for
 * @returns True if contains substring
 */
export const containsIgnoreCase = (str: string, searchString: string): boolean => {
  if (!str || !searchString) return false;
  return str.toLowerCase().includes(searchString.toLowerCase());
};

/**
 * Reverse a string
 * @param str - The string to reverse
 * @returns Reversed string
 */
export const reverse = (str: string): string => {
  if (!str) return '';
  return str.split('').reverse().join('');
};

/**
 * Count occurrences of substring in string
 * @param str - The string to search in
 * @param searchString - The substring to count
 * @returns Number of occurrences
 */
export const countOccurrences = (str: string, searchString: string): number => {
  if (!str || !searchString) return 0;
  return (str.match(new RegExp(searchString, 'g')) || []).length;
};

/**
 * Extract initials from a name
 * @param name - The name to extract initials from
 * @param maxInitials - Maximum number of initials (default: 2)
 * @returns Initials in uppercase
 */
export const getInitials = (name: string, maxInitials: number = 2): string => {
  if (!name) return '';

  const words = name.trim().split(/\s+/);
  const initials = words
    .slice(0, maxInitials)
    .map(word => word.charAt(0).toUpperCase())
    .join('');

  return initials;
};

/**
 * Mask email address (show only first char and domain)
 * @param email - The email to mask
 * @returns Masked email (e.g., j***@example.com)
 */
export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;

  const [localPart, domain] = email.split('@');
  const maskedLocal = localPart.charAt(0) + '***';

  return `${maskedLocal}@${domain}`;
};

/**
 * Mask phone number (show only last 4 digits)
 * @param phone - The phone number to mask
 * @returns Masked phone (e.g., ****5678)
 */
export const maskPhone = (phone: string): string => {
  if (!phone) return '';

  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return phone;

  const lastFour = cleaned.slice(-4);
  const masked = '*'.repeat(cleaned.length - 4) + lastFour;

  return masked;
};

/**
 * Format phone number with dashes
 * @param phone - The phone number to format
 * @param pattern - Pattern (e.g., 'XXX-XXX-XXXX')
 * @returns Formatted phone number
 */
export const formatPhone = (phone: string, pattern: string = 'XXX-XXX-XXXX'): string => {
  if (!phone) return '';

  const cleaned = phone.replace(/\D/g, '');
  let formatted = pattern;

  for (let i = 0; i < cleaned.length && formatted.includes('X'); i++) {
    formatted = formatted.replace('X', cleaned[i]);
  }

  return formatted.replace(/X/g, '');
};

/**
 * Generate random string
 * @param length - Length of random string
 * @param chars - Characters to use (default: alphanumeric)
 * @returns Random string
 */
export const randomString = (
  length: number,
  chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Escape HTML special characters
 * @param str - The string to escape
 * @returns Escaped string
 */
export const escapeHtml = (str: string): string => {
  if (!str) return '';

  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return str.replace(/[&<>"']/g, char => htmlEscapes[char]);
};

/**
 * Unescape HTML special characters
 * @param str - The string to unescape
 * @returns Unescaped string
 */
export const unescapeHtml = (str: string): string => {
  if (!str) return '';

  const htmlUnescapes: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
  };

  return str.replace(/&(?:amp|lt|gt|quot|#39);/g, entity => htmlUnescapes[entity]);
};

/**
 * Pad string to specified length
 * @param str - The string to pad
 * @param length - Target length
 * @param padChar - Character to pad with (default: ' ')
 * @param padLeft - Pad on left side (default: false)
 * @returns Padded string
 */
export const pad = (
  str: string,
  length: number,
  padChar: string = ' ',
  padLeft: boolean = false
): string => {
  if (!str) str = '';
  if (str.length >= length) return str;

  const padding = padChar.repeat(length - str.length);
  return padLeft ? padding + str : str + padding;
};

/**
 * Extract numbers from string
 * @param str - The string to extract from
 * @returns Array of numbers found
 */
export const extractNumbers = (str: string): number[] => {
  if (!str) return [];
  const matches = str.match(/\d+/g);
  return matches ? matches.map(Number) : [];
};

/**
 * Check if string starts with any of the given prefixes
 * @param str - The string to check
 * @param prefixes - Array of prefixes to check
 * @returns True if starts with any prefix
 */
export const startsWithAny = (str: string, prefixes: string[]): boolean => {
  if (!str || !prefixes || prefixes.length === 0) return false;
  return prefixes.some(prefix => str.startsWith(prefix));
};

/**
 * Check if string ends with any of the given suffixes
 * @param str - The string to check
 * @param suffixes - Array of suffixes to check
 * @returns True if ends with any suffix
 */
export const endsWithAny = (str: string, suffixes: string[]): boolean => {
  if (!str || !suffixes || suffixes.length === 0) return false;
  return suffixes.some(suffix => str.endsWith(suffix));
};
