/**
 * Test Utilities
 * Helper functions and mock data factories for testing components
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { ThemeColors } from '@/types';
import { DynamicTestSeries } from '@/store/api/dynamicHierarchyApi';

/**
 * Mock Theme Colors
 * Generates a complete mock theme object for testing
 */
export const mockThemeColors = (): ThemeColors => ({
  background: '#FFFFFF',
  cardBackground: '#F9FAFB',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textSubtle: '#9CA3AF',
  textLink: '#3B82F6',
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryExtraLight: '#DBEAFE',
  secondary: '#8B5CF6',
  accent: '#EC4899',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  danger: '#DC2626',
  info: '#06B6D4',
  white: '#FFFFFF',
  black: '#000000',
  muted: '#E5E7EB',
  border: '#D1D5DB',
  shadow: '#000000',
  chip: '#F3F4F6',
  progress: '#10B981',
  premiumBadge: '#F59E0B',
  premiumText: '#FFD700',
});

/**
 * Mock Test Series Data
 * Generates mock test series data for testing TestSeriesCard
 */
export const mockTestSeries = (overrides?: Partial<DynamicTestSeries>): DynamicTestSeries => ({
  id: 1,
  title: 'PSI Mock Test Series',
  name: 'PSI Mock Test Series',
  description: 'Complete preparation for PSI exam with 10 comprehensive tests',
  rating: 4.5,
  purchase_count: 1250,
  test_count: 10,
  is_free: false,
  price: 299,
  discounted_price: 199,
  validity_days: 90,
  difficulty_level: 'Medium',
  ...overrides,
});

/**
 * Mock Leaderboard Item Data
 * Generates mock leaderboard entry data for testing LeaderboardItem
 */
export const mockLeaderboardItem = (overrides?: any) => ({
  userId: 123,
  name: 'John Doe',
  rank: 5,
  totalScore: 85,
  percentage: 85.5,
  timeTaken: 3600, // 1 hour in seconds
  avatar: 'https://example.com/avatar.jpg',
  ...overrides,
});

/**
 * Mock Leaderboard Top 3 Item
 * Generates mock data for top 3 leaderboard positions
 */
export const mockTopPerformer = (rank: 1 | 2 | 3, overrides?: any) => ({
  userId: rank,
  name: rank === 1 ? 'Top Scorer' : rank === 2 ? 'Second Place' : 'Third Place',
  rank,
  totalScore: rank === 1 ? 95 : rank === 2 ? 92 : 89,
  percentage: rank === 1 ? 95.0 : rank === 2 ? 92.0 : 89.0,
  timeTaken: rank === 1 ? 5400 : rank === 2 ? 5100 : 4800,
  avatar: `https://example.com/avatar-${rank}.jpg`,
  ...overrides,
});

/**
 * Mock Access Data
 * Generates mock access data for test series
 */
export const mockAccessData = (hasAccess = false, overrides?: any) => ({
  hasAccess,
  isPurchased: hasAccess,
  isActive: hasAccess,
  expiresAt: hasAccess ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
  ...overrides,
});

/**
 * Mock Button State
 * Generates mock button state for test series cards
 */
export const mockButtonState = (overrides?: any) => ({
  label: 'Start Test',
  disabled: false,
  showLock: false,
  isPurchased: false,
  isActive: false,
  ...overrides,
});

/**
 * Render with Providers
 * Renders a component with all necessary providers (theme, language, etc.)
 * Note: For now, this is a simple wrapper. Extend as needed for theme/language context.
 */
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: RenderOptions
) => {
  return render(ui, options);
};

/**
 * Create Mock Function with Type Safety
 * Helper to create typed mock functions
 */
export const createMockFn = <T extends (...args: any[]) => any>(): jest.MockedFunction<T> => {
  return jest.fn() as jest.MockedFunction<T>;
};

/**
 * Wait for Async Updates
 * Helper to wait for async state updates in tests
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Mock Icon Component
 * Simple mock for lucide-react-native icons
 */
export const MockIcon: React.FC<{ size?: number; color?: string; testID?: string }> = ({
  size,
  color,
  testID
}) => {
  return null; // Icons don't render in tests
};
