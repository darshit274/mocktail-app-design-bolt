/**
 * LeaderboardItem Component Tests
 * Tests for the memoized leaderboard item component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { LeaderboardItem } from '@/components/leaderboard';
import { mockThemeColors, mockLeaderboardItem, mockTopPerformer, renderWithProviders } from '../../helpers/testHelpers';

describe('LeaderboardItem', () => {
  const defaultProps = {
    item: mockLeaderboardItem(),
    index: 4,
    Colors: mockThemeColors(),
  };

  describe('basic rendering', () => {
    it('renders correctly with required props', () => {
      const { getByText } = renderWithProviders(<LeaderboardItem {...defaultProps} />);

      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('85')).toBeTruthy();
    });

    it('displays user name correctly', () => {
      const item = mockLeaderboardItem({ name: 'Jane Smith' });
      const { getByText } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );

      expect(getByText('Jane Smith')).toBeTruthy();
    });

    it('displays total score correctly', () => {
      const item = mockLeaderboardItem({ totalScore: 95 });
      const { getByText } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );

      expect(getByText('95')).toBeTruthy();
    });

    it('displays percentage with 1 decimal place', () => {
      const item = mockLeaderboardItem({ percentage: 87.654 });
      const { getByText } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );

      // Should display as 87.7%
      expect(getByText(/87\.7%/)).toBeTruthy();
    });
  });

  describe('rank display', () => {
    it('shows numeric rank for rank > 3', () => {
      const item = mockLeaderboardItem({ rank: 5 });
      const { getByText } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );

      expect(getByText('5')).toBeTruthy();
    });

    it('shows numeric rank for rank 10', () => {
      const item = mockLeaderboardItem({ rank: 10 });
      const { getByText } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );

      expect(getByText('10')).toBeTruthy();
    });

    it('shows numeric rank for rank 100', () => {
      const item = mockLeaderboardItem({ rank: 100 });
      const { getByText } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );

      expect(getByText('100')).toBeTruthy();
    });

    // Note: Ranks 1-3 render icons (Crown, Medal, Award) instead of text
    // Icon rendering is tested in integration, but icons themselves don't render text in tests
  });

  describe('time formatting', () => {
    it('formats time under 1 hour correctly (minutes only)', () => {
      const item = mockLeaderboardItem({ timeTaken: 2400 }); // 40 minutes
      const { getByText } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );

      expect(getByText(/40m/)).toBeTruthy();
    });

    it('formats time over 1 hour correctly (hours and minutes)', () => {
      const item = mockLeaderboardItem({ timeTaken: 5400 }); // 1h 30m
      const { getByText } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );

      expect(getByText(/1h 30m/)).toBeTruthy();
    });

    it('formats time for exactly 1 hour', () => {
      const item = mockLeaderboardItem({ timeTaken: 3600 }); // 1h 0m
      const { getByText } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );

      expect(getByText(/1h 0m/)).toBeTruthy();
    });

    it('formats time for 2 hours 45 minutes', () => {
      const item = mockLeaderboardItem({ timeTaken: 9900 }); // 2h 45m
      const { getByText } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );

      expect(getByText(/2h 45m/)).toBeTruthy();
    });
  });

  describe('avatar rendering', () => {
    it('renders avatar image when provided', () => {
      const item = mockLeaderboardItem({
        avatar: 'https://example.com/avatar.jpg'
      });
      const { UNSAFE_getByType } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );

      // Should contain an Image component
      const images = UNSAFE_getByType(require('react-native').Image);
      expect(images).toBeTruthy();
    });

    it('renders avatar placeholder when no image provided', () => {
      const item = mockLeaderboardItem({ avatar: undefined, name: 'John Doe' });
      const { getByText } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );

      // Should show first letter of name as placeholder
      expect(getByText('J')).toBeTruthy();
    });

    it('shows correct initial for avatar placeholder', () => {
      const item = mockLeaderboardItem({ avatar: undefined, name: 'Sarah' });
      const { getByText } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );

      expect(getByText('S')).toBeTruthy();
    });

    it('handles lowercase names in avatar placeholder', () => {
      const item = mockLeaderboardItem({ avatar: undefined, name: 'alice wonderland' });
      const { getByText } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );

      // Should capitalize the first letter
      expect(getByText('A')).toBeTruthy();
    });
  });

  describe('theme colors', () => {
    it('applies correct theme colors', () => {
      const customColors = mockThemeColors();
      customColors.textPrimary = '#CUSTOM_PRIMARY';
      customColors.textSubtle = '#CUSTOM_SUBTLE';
      customColors.textLink = '#CUSTOM_LINK';

      const { getByText } = renderWithProviders(
        <LeaderboardItem {...defaultProps} Colors={customColors} />
      );

      // Check that colors are applied
      const userName = getByText('John Doe');
      expect(userName.props.style).toContainEqual(
        expect.objectContaining({ color: '#CUSTOM_PRIMARY' })
      );

      const score = getByText('85');
      expect(score.props.style).toContainEqual(
        expect.objectContaining({ color: '#CUSTOM_LINK' })
      );
    });
  });

  describe('memoization', () => {
    it('component is memoized (has displayName)', () => {
      expect(LeaderboardItem.displayName).toBe('LeaderboardItem');
    });
  });

  describe('edge cases', () => {
    it('handles missing userId', () => {
      const item = mockLeaderboardItem({ userId: undefined });
      const { getByText } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );

      // Should still render without crashing
      expect(getByText('John Doe')).toBeTruthy();
    });

    it('handles zero score', () => {
      const item = mockLeaderboardItem({ totalScore: 0, percentage: 0 });
      const { getByText } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );

      expect(getByText('0')).toBeTruthy();
      expect(getByText(/0\.0%/)).toBeTruthy();
    });

    it('handles perfect score', () => {
      const item = mockLeaderboardItem({ totalScore: 100, percentage: 100 });
      const { getByText } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );

      expect(getByText('100')).toBeTruthy();
      expect(getByText(/100\.0%/)).toBeTruthy();
    });

    it('handles very long names', () => {
      const item = mockLeaderboardItem({
        name: 'This Is A Very Long Name That Should Still Display'
      });
      const { getByText } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );

      expect(getByText('This Is A Very Long Name That Should Still Display')).toBeTruthy();
    });

    it('handles very short time (1 minute)', () => {
      const item = mockLeaderboardItem({ timeTaken: 60 }); // 1 minute
      const { getByText } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );

      expect(getByText(/1m/)).toBeTruthy();
    });
  });

  describe('top performers', () => {
    it('renders rank 1 correctly', () => {
      const item = mockTopPerformer(1);
      const { getByText } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );

      expect(getByText('Top Scorer')).toBeTruthy();
      expect(getByText('95')).toBeTruthy();
    });

    it('renders rank 2 correctly', () => {
      const item = mockTopPerformer(2);
      const { getByText } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );

      expect(getByText('Second Place')).toBeTruthy();
      expect(getByText('92')).toBeTruthy();
    });

    it('renders rank 3 correctly', () => {
      const item = mockTopPerformer(3);
      const { getByText } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );

      expect(getByText('Third Place')).toBeTruthy();
      expect(getByText('89')).toBeTruthy();
    });
  });

  describe('snapshot tests', () => {
    it('matches snapshot with default props', () => {
      const { toJSON } = renderWithProviders(<LeaderboardItem {...defaultProps} />);
      expect(toJSON()).toMatchSnapshot();
    });

    it('matches snapshot for rank 1', () => {
      const item = mockTopPerformer(1);
      const { toJSON } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('matches snapshot without avatar', () => {
      const item = mockLeaderboardItem({ avatar: undefined });
      const { toJSON } = renderWithProviders(
        <LeaderboardItem {...defaultProps} item={item} />
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
