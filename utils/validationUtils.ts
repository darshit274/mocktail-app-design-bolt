/**
 * Validation Utilities
 *
 * Utility functions for input validation.
 * Provides common validators used throughout the app.
 */

import { VALIDATION } from './appConstants';

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email address
 * @param email - Email to validate
 * @returns Validation result
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' };
  }

  if (!VALIDATION.EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  if (email.length > VALIDATION.EMAIL_MAX_LENGTH) {
    return { isValid: false, error: `Email must be less than ${VALIDATION.EMAIL_MAX_LENGTH} characters` };
  }

  return { isValid: true };
};

/**
 * Validate password
 * @param password - Password to validate
 * @returns Validation result
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password || password.length === 0) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    return { isValid: false, error: `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters` };
  }

  if (password.length > VALIDATION.PASSWORD_MAX_LENGTH) {
    return { isValid: false, error: `Password must be less than ${VALIDATION.PASSWORD_MAX_LENGTH} characters` };
  }

  if (!VALIDATION.PASSWORD_REGEX.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one uppercase, one lowercase, one number, and one special character'
    };
  }

  return { isValid: true };
};

/**
 * Validate phone number
 * @param phone - Phone number to validate
 * @returns Validation result
 */
export const validatePhone = (phone: string): ValidationResult => {
  if (!phone || phone.trim().length === 0) {
    return { isValid: false, error: 'Phone number is required' };
  }

  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length < VALIDATION.PHONE_MIN_LENGTH) {
    return { isValid: false, error: `Phone number must be at least ${VALIDATION.PHONE_MIN_LENGTH} digits` };
  }

  if (cleaned.length > VALIDATION.PHONE_MAX_LENGTH) {
    return { isValid: false, error: `Phone number must be less than ${VALIDATION.PHONE_MAX_LENGTH} digits` };
  }

  if (!VALIDATION.PHONE_REGEX.test(cleaned)) {
    return { isValid: false, error: 'Invalid phone number format' };
  }

  return { isValid: true };
};

/**
 * Validate username
 * @param username - Username to validate
 * @returns Validation result
 */
export const validateUsername = (username: string): ValidationResult => {
  if (!username || username.trim().length === 0) {
    return { isValid: false, error: 'Username is required' };
  }

  if (username.length < VALIDATION.USERNAME_MIN_LENGTH) {
    return { isValid: false, error: `Username must be at least ${VALIDATION.USERNAME_MIN_LENGTH} characters` };
  }

  if (username.length > VALIDATION.USERNAME_MAX_LENGTH) {
    return { isValid: false, error: `Username must be less than ${VALIDATION.USERNAME_MAX_LENGTH} characters` };
  }

  if (!VALIDATION.USERNAME_REGEX.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }

  return { isValid: true };
};

/**
 * Validate full name
 * @param name - Name to validate
 * @returns Validation result
 */
export const validateName = (name: string): ValidationResult => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Name is required' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }

  if (name.length > 50) {
    return { isValid: false, error: 'Name must be less than 50 characters' };
  }

  if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { isValid: true };
};

/**
 * Validate URL
 * @param url - URL to validate
 * @returns Validation result
 */
export const validateUrl = (url: string): ValidationResult => {
  if (!url || url.trim().length === 0) {
    return { isValid: false, error: 'URL is required' };
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

/**
 * Validate date string
 * @param dateString - Date string to validate
 * @returns Validation result
 */
export const validateDate = (dateString: string): ValidationResult => {
  if (!dateString || dateString.trim().length === 0) {
    return { isValid: false, error: 'Date is required' };
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }

  return { isValid: true };
};

/**
 * Validate date is in the past
 * @param dateString - Date string to validate
 * @returns Validation result
 */
export const validatePastDate = (dateString: string): ValidationResult => {
  const dateResult = validateDate(dateString);
  if (!dateResult.isValid) return dateResult;

  const date = new Date(dateString);
  const now = new Date();

  if (date >= now) {
    return { isValid: false, error: 'Date must be in the past' };
  }

  return { isValid: true };
};

/**
 * Validate date is in the future
 * @param dateString - Date string to validate
 * @returns Validation result
 */
export const validateFutureDate = (dateString: string): ValidationResult => {
  const dateResult = validateDate(dateString);
  if (!dateResult.isValid) return dateResult;

  const date = new Date(dateString);
  const now = new Date();

  if (date <= now) {
    return { isValid: false, error: 'Date must be in the future' };
  }

  return { isValid: true };
};

/**
 * Validate age (based on date of birth)
 * @param dateOfBirth - Date of birth string
 * @param minAge - Minimum age required
 * @returns Validation result
 */
export const validateAge = (dateOfBirth: string, minAge: number = 13): ValidationResult => {
  const dateResult = validateDate(dateOfBirth);
  if (!dateResult.isValid) return dateResult;

  const dob = new Date(dateOfBirth);
  const now = new Date();
  const age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    if (age - 1 < minAge) {
      return { isValid: false, error: `You must be at least ${minAge} years old` };
    }
  } else if (age < minAge) {
    return { isValid: false, error: `You must be at least ${minAge} years old` };
  }

  return { isValid: true };
};

/**
 * Validate required field
 * @param value - Value to validate
 * @param fieldName - Name of field for error message
 * @returns Validation result
 */
export const validateRequired = (value: any, fieldName: string = 'Field'): ValidationResult => {
  if (value === null || value === undefined) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  if (Array.isArray(value) && value.length === 0) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true };
};

/**
 * Validate minimum length
 * @param value - String to validate
 * @param minLength - Minimum length required
 * @param fieldName - Name of field for error message
 * @returns Validation result
 */
export const validateMinLength = (
  value: string,
  minLength: number,
  fieldName: string = 'Field'
): ValidationResult => {
  if (!value || value.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }
  return { isValid: true };
};

/**
 * Validate maximum length
 * @param value - String to validate
 * @param maxLength - Maximum length allowed
 * @param fieldName - Name of field for error message
 * @returns Validation result
 */
export const validateMaxLength = (
  value: string,
  maxLength: number,
  fieldName: string = 'Field'
): ValidationResult => {
  if (value && value.length > maxLength) {
    return { isValid: false, error: `${fieldName} must be less than ${maxLength} characters` };
  }
  return { isValid: true };
};

/**
 * Validate numeric value
 * @param value - Value to validate
 * @param fieldName - Name of field for error message
 * @returns Validation result
 */
export const validateNumeric = (value: any, fieldName: string = 'Field'): ValidationResult => {
  if (isNaN(Number(value))) {
    return { isValid: false, error: `${fieldName} must be a number` };
  }
  return { isValid: true };
};

/**
 * Validate minimum value
 * @param value - Number to validate
 * @param min - Minimum value allowed
 * @param fieldName - Name of field for error message
 * @returns Validation result
 */
export const validateMin = (value: number, min: number, fieldName: string = 'Field'): ValidationResult => {
  if (value < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min}` };
  }
  return { isValid: true };
};

/**
 * Validate maximum value
 * @param value - Number to validate
 * @param max - Maximum value allowed
 * @param fieldName - Name of field for error message
 * @returns Validation result
 */
export const validateMax = (value: number, max: number, fieldName: string = 'Field'): ValidationResult => {
  if (value > max) {
    return { isValid: false, error: `${fieldName} must be at most ${max}` };
  }
  return { isValid: true };
};

/**
 * Validate range
 * @param value - Number to validate
 * @param min - Minimum value
 * @param max - Maximum value
 * @param fieldName - Name of field for error message
 * @returns Validation result
 */
export const validateRange = (
  value: number,
  min: number,
  max: number,
  fieldName: string = 'Field'
): ValidationResult => {
  if (value < min || value > max) {
    return { isValid: false, error: `${fieldName} must be between ${min} and ${max}` };
  }
  return { isValid: true };
};

/**
 * Validate password confirmation
 * @param password - Password
 * @param confirmPassword - Password confirmation
 * @returns Validation result
 */
export const validatePasswordMatch = (password: string, confirmPassword: string): ValidationResult => {
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }
  return { isValid: true };
};

/**
 * Validate OTP code
 * @param otp - OTP code to validate
 * @param length - Expected OTP length (default: 6)
 * @returns Validation result
 */
export const validateOTP = (otp: string, length: number = 6): ValidationResult => {
  if (!otp || otp.trim().length === 0) {
    return { isValid: false, error: 'OTP is required' };
  }

  const cleaned = otp.replace(/\D/g, '');

  if (cleaned.length !== length) {
    return { isValid: false, error: `OTP must be ${length} digits` };
  }

  return { isValid: true };
};

/**
 * Validate credit card number (Luhn algorithm)
 * @param cardNumber - Credit card number
 * @returns Validation result
 */
export const validateCreditCard = (cardNumber: string): ValidationResult => {
  if (!cardNumber || cardNumber.trim().length === 0) {
    return { isValid: false, error: 'Card number is required' };
  }

  const cleaned = cardNumber.replace(/\D/g, '');

  if (cleaned.length < 13 || cleaned.length > 19) {
    return { isValid: false, error: 'Invalid card number length' };
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  if (sum % 10 !== 0) {
    return { isValid: false, error: 'Invalid card number' };
  }

  return { isValid: true };
};

/**
 * Validate array has minimum items
 * @param array - Array to validate
 * @param minItems - Minimum items required
 * @param fieldName - Name of field for error message
 * @returns Validation result
 */
export const validateMinItems = (
  array: any[],
  minItems: number,
  fieldName: string = 'Selection'
): ValidationResult => {
  if (!array || array.length < minItems) {
    return { isValid: false, error: `${fieldName} must have at least ${minItems} items` };
  }
  return { isValid: true };
};

/**
 * Validate array has maximum items
 * @param array - Array to validate
 * @param maxItems - Maximum items allowed
 * @param fieldName - Name of field for error message
 * @returns Validation result
 */
export const validateMaxItems = (
  array: any[],
  maxItems: number,
  fieldName: string = 'Selection'
): ValidationResult => {
  if (array && array.length > maxItems) {
    return { isValid: false, error: `${fieldName} must have at most ${maxItems} items` };
  }
  return { isValid: true };
};

/**
 * Check if email is valid (boolean only)
 * @param email - Email to check
 * @returns True if valid
 */
export const isValidEmail = (email: string): boolean => {
  return validateEmail(email).isValid;
};

/**
 * Check if password is valid (boolean only)
 * @param password - Password to check
 * @returns True if valid
 */
export const isValidPassword = (password: string): boolean => {
  return validatePassword(password).isValid;
};

/**
 * Check if phone is valid (boolean only)
 * @param phone - Phone to check
 * @returns True if valid
 */
export const isValidPhone = (phone: string): boolean => {
  return validatePhone(phone).isValid;
};

/**
 * Check if URL is valid (boolean only)
 * @param url - URL to check
 * @returns True if valid
 */
export const isValidUrl = (url: string): boolean => {
  return validateUrl(url).isValid;
};
