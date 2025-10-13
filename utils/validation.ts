/**
 * Form validation utilities
 * Created: 2025-01-11
 * Purpose: Reusable validation functions for auth forms
 * Used by: login.tsx, signup.tsx, forgot-password.tsx, otp-verify.tsx
 */

interface TFunction {
  common: { error: string };
  auth: {
    validation: {
      emailRequired: string;
      invalidEmail: string;
      passwordRequired: string;
      passwordMinLength: string;
      passwordMismatch: string;
      nameRequired: string;
      otpRequired: string;
      otpLength: string;
      noPendingVerification: string;
    };
  };
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates password length
 */
export const validatePassword = (password: string): boolean => {
  return password.trim().length >= 6;
};

/**
 * Validates OTP format (4 digits)
 */
export const validateOTP = (otp: string): boolean => {
  return otp.trim().length === 4 && /^\d{4}$/.test(otp.trim());
};

/**
 * Validates login form
 */
export const validateLoginForm = (
  email: string,
  password: string,
  t: TFunction
): ValidationResult => {
  if (!email.trim()) {
    return { isValid: false, error: t.auth.validation.emailRequired };
  }
  if (!validateEmail(email)) {
    return { isValid: false, error: t.auth.validation.invalidEmail };
  }
  if (!password.trim()) {
    return { isValid: false, error: t.auth.validation.passwordRequired };
  }
  return { isValid: true };
};

/**
 * Validates signup form
 */
export const validateSignupForm = (
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
  t: TFunction
): ValidationResult => {
  if (!name.trim()) {
    return { isValid: false, error: t.auth.validation.nameRequired };
  }
  if (!email.trim()) {
    return { isValid: false, error: t.auth.validation.emailRequired };
  }
  if (!validateEmail(email)) {
    return { isValid: false, error: t.auth.validation.invalidEmail };
  }
  if (!password.trim()) {
    return { isValid: false, error: t.auth.validation.passwordRequired };
  }
  if (password.length < 6) {
    return { isValid: false, error: t.auth.validation.passwordMinLength };
  }
  if (password !== confirmPassword) {
    return { isValid: false, error: t.auth.validation.passwordMismatch };
  }
  return { isValid: true };
};

/**
 * Validates forgot password form
 */
export const validateForgotPasswordForm = (
  email: string,
  t: TFunction
): ValidationResult => {
  if (!email.trim()) {
    return { isValid: false, error: t.auth.validation.emailRequired };
  }
  if (!validateEmail(email)) {
    return { isValid: false, error: t.auth.validation.invalidEmail };
  }
  return { isValid: true };
};

/**
 * Validates OTP verification form
 */
export const validateOTPForm = (
  otp: string,
  hasPendingVerification: boolean,
  t: TFunction
): ValidationResult => {
  if (!otp.trim()) {
    return { isValid: false, error: t.auth.validation.otpRequired };
  }
  if (!validateOTP(otp)) {
    return { isValid: false, error: t.auth.validation.otpLength };
  }
  if (!hasPendingVerification) {
    return { isValid: false, error: t.auth.validation.noPendingVerification };
  }
  return { isValid: true };
};
