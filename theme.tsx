// theme.tsx
export interface ThemeColors {
  white: string;
  black: string;
  gray400: string;
  blue500: string;
  yellow600: string;
  primary: string;
  primaryLight: string;
  primaryExtraLight: string;
  accent: string;
  background: string;
  cardBackground: string;
  textPrimary: string;
  textSubtle: string;
  textLink: string;
  success: string;
  warning: string;
  danger: string;
  muted: string;
  light: string;
  chip: string;
  badgeSuccessBg: string;
  badgeDangerBg: string;
  shadow: string;
  premiumBadge: string;
  premiumText: string;
  skeletonBase: string;
  skeletonHighlight: string;
  border: string;
  error: string;
  progress: string;
}

export const LightTheme: ThemeColors = {
  white: '#FFFFFF',
  black: '#000000',
  gray400: '#9CA3AF',
  blue500: '#3B82F6',
  yellow600: '#D97706',
  primary: '#0A1F66',
  primaryLight: '#3A5DAE',
  primaryExtraLight: '#7C95D6',
  accent: '#1D8A9E',
  background: '#F9FAFB',
  cardBackground: '#FFFFFF',
  textPrimary: '#111827',
  textSubtle: '#6B7280',
  textLink: '#1D8A9E',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#DC2626',
  muted: '#E5E7EB',
  light: '#F3F4F6',
  chip: '#EEF2FF',
  badgeSuccessBg: '#D1FAE5',
  badgeDangerBg: '#FEE2E2',
  shadow: '#000',
  premiumBadge: '#FEF3C7',
  premiumText: '#D97706',
  skeletonBase: '#E5E7EB',
  skeletonHighlight: '#F3F4F6',
  border: '#E5E7EB',
  error: '#DC2626',
  progress: '#10B981',
};

export const DarkTheme: ThemeColors = {
  white: '#FFFFFF',
  black: '#000000',
  gray400: '#6B7280',
  blue500: '#60A5FA',
  yellow600: '#FBBF24',
  primary: '#1E40AF',
  primaryLight: '#3B82F6',
  primaryExtraLight: '#60A5FA',
  accent: '#06B6D4',
  background: '#0F172A',
  cardBackground: '#1E293B',
  textPrimary: '#F1F5F9',
  textSubtle: '#94A3B8',
  textLink: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  muted: '#374151',
  light: '#334155',
  chip: '#1E293B',
  badgeSuccessBg: '#064E3B',
  badgeDangerBg: '#7F1D1D',
  shadow: '#000',
  premiumBadge: '#451A03',
  premiumText: '#FBBF24',
  skeletonBase: '#374151',
  skeletonHighlight: '#4B5563',
  border: '#374151',
  error: '#EF4444',
  progress: '#10B981',
};

// Theme Option 1: Rose & Emerald
export const RoseEmeraldTheme: ThemeColors = {
  white: '#FFFFFF',
  black: '#000000',
  gray400: '#9CA3AF',
  blue500: '#3B82F6',
  yellow600: '#D97706',
  primary: '#E11D48',        // Rose-600
  primaryLight: '#F43F5E',   // Rose-500
  primaryExtraLight: '#FB7185', // Rose-400
  accent: '#10B981',         // Emerald-500
  background: '#FFF1F3',     // Rose-50
  cardBackground: '#FFFFFF',
  textPrimary: '#111827',
  textSubtle: '#6B7280',
  textLink: '#10B981',       // Emerald-500
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#DC2626',
  muted: '#E5E7EB',
  light: '#F3F4F6',
  chip: '#FFE4E6',           // Rose-100
  badgeSuccessBg: '#D1FAE5',
  badgeDangerBg: '#FEE2E2',
  shadow: '#000',
  premiumBadge: '#FEF3C7',
  premiumText: '#D97706',
  skeletonBase: '#E5E7EB',
  skeletonHighlight: '#F3F4F6',
  border: '#E5E7EB',
  error: '#DC2626',
  progress: '#10B981',
};

// Theme Option 2: Blue & Orange
export const BlueOrangeTheme: ThemeColors = {
  white: '#FFFFFF',
  black: '#000000',
  gray400: '#9CA3AF',
  blue500: '#3B82F6',
  yellow600: '#D97706',
  primary: '#2563EB',        // Blue-600
  primaryLight: '#3B82F6',   // Blue-500
  primaryExtraLight: '#60A5FA', // Blue-400
  accent: '#F97316',         // Orange-500
  background: '#EFF6FF',     // Blue-50
  cardBackground: '#FFFFFF',
  textPrimary: '#111827',
  textSubtle: '#6B7280',
  textLink: '#F97316',       // Orange-500
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#DC2626',
  muted: '#E5E7EB',
  light: '#F3F4F6',
  chip: '#DBEAFE',           // Blue-100
  badgeSuccessBg: '#D1FAE5',
  badgeDangerBg: '#FEE2E2',
  shadow: '#000',
  premiumBadge: '#FEF3C7',
  premiumText: '#D97706',
  skeletonBase: '#E5E7EB',
  skeletonHighlight: '#F3F4F6',
  border: '#E5E7EB',
  error: '#DC2626',
  progress: '#10B981',
};

// Theme Option 3: Purple & Teal
export const PurpleTealTheme: ThemeColors = {
  white: '#FFFFFF',
  black: '#000000',
  gray400: '#9CA3AF',
  blue500: '#3B82F6',
  yellow600: '#D97706',
  primary: '#7C3AED',        // Violet-600
  primaryLight: '#8B5CF6',   // Violet-500
  primaryExtraLight: '#A78BFA', // Violet-400
  accent: '#14B8A6',         // Teal-500
  background: '#FAF5FF',     // Violet-50
  cardBackground: '#FFFFFF',
  textPrimary: '#111827',
  textSubtle: '#6B7280',
  textLink: '#14B8A6',       // Teal-500
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#DC2626',
  muted: '#E5E7EB',
  light: '#F3F4F6',
  chip: '#EDE9FE',           // Violet-100
  badgeSuccessBg: '#D1FAE5',
  badgeDangerBg: '#FEE2E2',
  shadow: '#000',
  premiumBadge: '#FEF3C7',
  premiumText: '#D97706',
  skeletonBase: '#E5E7EB',
  skeletonHighlight: '#F3F4F6',
  border: '#E5E7EB',
  error: '#DC2626',
  progress: '#10B981',
};

// Default export for backward compatibility
export const Colors = LightTheme;

// Theme types for selection
export type ThemeType = 'light' | 'dark' | 'rose-emerald' | 'blue-orange' | 'purple-teal';

// Theme options for client selection
export const ThemeOptions = [
  {
    id: 'light' as ThemeType,
    name: 'Original Light',
    description: 'Classic blue theme',
    theme: LightTheme,
    preview: {
      primary: '#0A1F66',
      accent: '#1D8A9E',
      background: '#F9FAFB'
    }
  },
  {
    id: 'rose-emerald' as ThemeType,
    name: 'Rose & Emerald',
    description: 'Warm rose with fresh emerald',
    theme: RoseEmeraldTheme,
    preview: {
      primary: '#E11D48',
      accent: '#10B981',
      background: '#FFF1F3'
    }
  },
  {
    id: 'blue-orange' as ThemeType,
    name: 'Blue & Orange',
    description: 'Professional blue with energetic orange',
    theme: BlueOrangeTheme,
    preview: {
      primary: '#2563EB',
      accent: '#F97316',
      background: '#EFF6FF'
    }
  },
  {
    id: 'purple-teal' as ThemeType,
    name: 'Purple & Teal',
    description: 'Creative purple with calming teal',
    theme: PurpleTealTheme,
    preview: {
      primary: '#7C3AED',
      accent: '#14B8A6',
      background: '#FAF5FF'
    }
  }
];

export const getTheme = (themeType: ThemeType = 'light'): ThemeColors => {
  try {
    switch (themeType) {
      case 'dark':
        return DarkTheme;
      case 'rose-emerald':
        return RoseEmeraldTheme;
      case 'blue-orange':
        return BlueOrangeTheme;
      case 'purple-teal':
        return PurpleTealTheme;
      case 'light':
      default:
        return LightTheme;
    }
  } catch (error) {
    console.warn('Theme initialization error, using fallback:', error);
    return LightTheme;
  }
};

// Legacy support for dark mode
export const getThemeByDarkMode = (isDarkMode: boolean): ThemeColors => {
  return isDarkMode ? DarkTheme : LightTheme;
};
