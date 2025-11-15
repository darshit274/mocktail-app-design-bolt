/**
 * Leaderboard Item Component
 * Created: 2025-01-13
 * Purpose: Memoized component for individual leaderboard entries
 * Optimized: React.memo for preventing unnecessary re-renders
 */

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Crown, Medal, Award } from 'lucide-react-native';
import { ThemeColors } from '@/types';

/**
 * Data structure for a leaderboard item
 * @interface LeaderboardItemData
 */
interface LeaderboardItemData {
  /** Unique identifier for the user (optional) */
  userId?: number | string;
  /** Display name of the user */
  name: string;
  /** User's rank position (1-indexed) */
  rank: number;
  /** Total score achieved by the user */
  totalScore: number;
  /** Score as percentage (0-100) */
  percentage: number;
  /** Time taken to complete the test (in seconds) */
  timeTaken: number;
  /** URL to user's avatar image (optional) */
  avatar?: string;
}

/**
 * Props for LeaderboardItem component
 * @interface LeaderboardItemProps
 */
interface LeaderboardItemProps {
  /** Leaderboard entry data */
  item: LeaderboardItemData;
  /** Index of the item in the list (used by FlatList) */
  index: number;
  /** Theme colors object for consistent styling */
  Colors: ThemeColors;
}

/**
 * LeaderboardItem Component
 *
 * Displays a single leaderboard entry with user rank, avatar, name, score, percentage, and time taken.
 * Automatically formats rank icons for top 3 positions (Crown for 1st, Medal for 2nd, Award for 3rd).
 * Time is formatted as "Xh Ym" for times over an hour, or "Ym" for shorter durations.
 *
 * **Performance**:
 * - Wrapped with React.memo to prevent unnecessary re-renders
 * - Uses useMemo for rank icon and time formatting computations
 * - Optimized for use in FlatList with fixed-height items
 *
 * **Features**:
 * - Special icons for top 3 ranks
 * - Avatar image support with fallback to initials
 * - Automatic time formatting (hours + minutes)
 * - Percentage display with 1 decimal precision
 *
 * @component
 * @example
 * ```tsx
 * <FlatList
 *   data={leaderboardData}
 *   renderItem={({ item, index }) => (
 *     <LeaderboardItem
 *       item={item}
 *       index={index}
 *       Colors={Colors}
 *     />
 *   )}
 *   keyExtractor={(item) => item.userId.toString()}
 * />
 * ```
 *
 * @param {LeaderboardItemProps} props - Component props
 * @returns {React.ReactElement} Rendered leaderboard item
 */
export const LeaderboardItem = memo<LeaderboardItemProps>(({
  item,
  index,
  Colors
}) => {
  // Format time helper (memoized within component)
  const formattedTime = useMemo(() => {
    const hours = Math.floor(item.timeTaken / 3600);
    const minutes = Math.floor((item.timeTaken % 3600) / 60);
    const seconds = item.timeTaken % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, [item.timeTaken]);

  // Get rank icon based on position (memoized)
  const rankIcon = useMemo(() => {
    switch (item.rank) {
      case 1:
        return <Crown size={24} color={Colors.premiumText} />;
      case 2:
        return <Medal size={24} color={Colors.premiumBadge} />;
      case 3:
        return <Award size={24} color={Colors.premiumText} />;
      default:
        return (
          <Text style={[styles.rankNumber, { color: Colors.textSubtle }]}>
            {item.rank}
          </Text>
        );
    }
  }, [item.rank, Colors]);
console.log(item,"ooooooooooooooooooooo");

  return (
    <View
      style={[
        styles.leaderboardItem,
        {
          backgroundColor: Colors.cardBackground,
          shadowColor: Colors.shadow,
        }
      ]}
    >
      <View style={styles.rankInfo}>
        <View style={[styles.rankBadge, { backgroundColor: Colors.chip }]}>
          {rankIcon}
        </View>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
        ) : (
          <View style={[styles.userAvatar, { backgroundColor: Colors.primary }]}>
            <Text style={[styles.avatarText, { color: Colors.white }]}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: Colors.textPrimary }]}>
            {item.name}
          </Text>
          <Text style={[styles.userStats, { color: Colors.textSubtle }]}>
            {item.percentage.toFixed(1)}% • {formattedTime}
          </Text>
        </View>
      </View>
      <View style={styles.scoreInfo}>
        <Text style={[styles.userScore, { color: Colors.textLink }]}>
          {item.totalScore}
        </Text>
      </View>
    </View>
  );
});

LeaderboardItem.displayName = 'LeaderboardItem';

const styles = StyleSheet.create({
  leaderboardItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    marginHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  rankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  userStats: {
    fontSize: 12,
  },
  scoreInfo: {
    alignItems: 'flex-end',
  },
  userScore: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
});
