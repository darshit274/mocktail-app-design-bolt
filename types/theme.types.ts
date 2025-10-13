/**
 * Theme-related TypeScript interfaces
 * Created: 2025-01-11
 * Purpose: Strong typing for theme colors and styles
 */

export interface ThemeColors {
  // Primary Colors
  primary: string;
  primaryLight: string;
  secondary: string;
  accent: string;

  // Background Colors
  background: string;
  backgroundSecondary: string;
  cardBackground: string;

  // Text Colors
  text: string;
  textPrimary: string;
  textSecondary: string;
  textSubtle: string;
  textLink: string;

  // Border & Divider
  border: string;
  muted: string;
  light: string;

  // Status Colors
  success: string;
  error: string;
  warning: string;
  danger: string;
  info: string;

  // Badge Colors
  badgeSuccessBg: string;
  badgeDangerBg: string;
  premiumBadge: string;
  premiumText: string;

  // Common Colors
  white: string;
  shadow: string;
  chip: string;

  // Chart Colors (optional)
  gray400?: string;
}

export type ThemeMode = 'light' | 'dark';
