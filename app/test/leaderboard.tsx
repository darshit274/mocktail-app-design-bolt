import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, Medal, Award, TrendingUp, Calendar, ChevronLeft, Crown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetTestSeriesLeaderboardWebQuery } from '@/store/api/webCompatibleApi';
import { LeaderboardItem } from '@/components/leaderboard';
import logger from '@/utils/logger';

const leaderboardLogger = logger.createLogger('Leaderboard');

export default function TestLeaderboardScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useSelector((state: RootState) => state.auth);
  const Colors = getTheme(theme);
  const params = useLocalSearchParams();
  leaderboardLogger.debug('Leaderboard params', params);
  leaderboardLogger.debug('Current user:', user);

  // Get the test series UUID from params (should come from navigation)
  const testSeriesUuid = params.sessionId || params.seriesUuid || params.categoryUuid || '4d7c05cd-f70e-4717-a631-5f1e85756a5c';
  leaderboardLogger.info('Using test series UUID for leaderboard', { testSeriesUuid });

  // Fetch leaderboard using web-compatible API (EXACT SAME AS WEB)
  const {
    data: leaderboardResponse,
    isLoading: loadingLeaderboard,
    error: leaderboardError,
    refetch: refetchLeaderboard
  } = useGetTestSeriesLeaderboardWebQuery(
    { testSeriesUuid: testSeriesUuid as string, limit: 20 },
    { skip: !testSeriesUuid }
  );

  // Debug logging
  console.log('[Leaderboard] API Response:', {
    success: leaderboardResponse?.success,
    dataLength: leaderboardResponse?.data?.length,
    firstThree: leaderboardResponse?.data?.slice(0, 3),
    loading: loadingLeaderboard,
    error: leaderboardError
  });

  // Memoize periods array to prevent recreation
  const periods = useMemo(() => [
    { key: 'This Test', label: t.leaderboard.periods.thisTest },
    { key: 'Weekly', label: t.leaderboard.periods.weekly },
    { key: 'Monthly', label: t.leaderboard.periods.monthly },
    { key: 'All Time', label: t.leaderboard.periods.allTime }
  ], [t]);


  // Get top 3 performers from API data
  const topPerformers = useMemo(() => {
    console.log('[Leaderboard] Computing topPerformers:', {
      hasResponse: !!leaderboardResponse,
      success: leaderboardResponse?.success,
      hasData: !!leaderboardResponse?.data,
      dataLength: leaderboardResponse?.data?.length
    });

    if (!leaderboardResponse?.success || !leaderboardResponse.data || leaderboardResponse.data.length === 0) {
      console.log('[Leaderboard] No data available for top performers');
      return [];
    }
    // Return top 3 from API
    const top3 = leaderboardResponse.data.slice(0, 3);
    console.log('[Leaderboard] Top 3 performers:', top3);
    return top3;
  }, [leaderboardResponse]);

  // Find current user's rank in the leaderboard data
  const currentUserRank = useMemo(() => {
    if (!leaderboardResponse?.success || !leaderboardResponse.data || !user) {
      console.log('[Leaderboard] Cannot compute currentUserRank:', {
        hasResponse: !!leaderboardResponse,
        hasData: !!leaderboardResponse?.data,
        hasUser: !!user
      });
      return null;
    }

    // Find the current user in the leaderboard by userId
    const userEntry = leaderboardResponse.data.find(entry =>
      entry.userId === user.id || entry.userId === user.uuid
    );

    console.log('[Leaderboard] Current user rank search:', {
      userId: user.id,
      userUuid: user.uuid,
      found: !!userEntry,
      userEntry
    });

    if (!userEntry) {
      return null;
    }
    return {
      rank: userEntry.rank,
      name: userEntry.name || user.username || t.leaderboard.you,
      score: userEntry.percentage || userEntry.totalScore,
      totalScore: userEntry.totalScore,
      percentage: userEntry.percentage,
      accuracy: userEntry.percentage, // Using percentage as accuracy
      percentile: userEntry.percentile,
      timeTaken: userEntry.timeTaken,
      timeSpent: userEntry.timeTaken
    };
  }, [leaderboardResponse, user, t]);

  // Memoize formatTime helper for podium display
  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }, []);

  // Memoize styles to prevent recalculation on every render
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  // FlatList optimizations
  const keyExtractor = useCallback((item: any, index: number) =>
    item.userId?.toString() || index.toString(), []
  );

  // Fixed height for getItemLayout optimization
  const ITEM_HEIGHT = 80;
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  // Render leaderboard item using extracted component
  const renderLeaderboardItem = useCallback(({ item, index }: { item: any, index: number }) => {
    return (
      <LeaderboardItem
        item={item}
        index={index}
        Colors={Colors}
      />
    );
  }, [Colors]);

  // Render list header - simplified version
  const renderListHeader = useCallback(() => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={Colors.textSubtle} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t.leaderboard.title}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Your Rank */}
      {currentUserRank && (
        <View style={styles.yourRankContainer}>
          <Text style={styles.sectionTitle}>{t.leaderboard.yourPerformance}</Text>
          <LinearGradient
            colors={[Colors.primaryExtraLight, Colors.white]}
            style={styles.yourRankCard}
          >
            <View style={styles.rankInfo}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankNumber}>{currentUserRank.rank}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{currentUserRank.name || t.leaderboard.you}</Text>
                <Text style={styles.userStats}>
                  {currentUserRank.percentile} • {formatTime(currentUserRank.timeTaken || currentUserRank.timeSpent || 0)}
                </Text>
              </View>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={styles.userScore}>{currentUserRank.totalScore ?? currentUserRank.percentage ?? 0}</Text>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Full Leaderboard Title */}
      <View style={styles.leaderboardContainer}>
        <Text style={styles.sectionTitle}>{t.leaderboard.allRankings}</Text>
      </View>
    </>
  ), [Colors, t, currentUserRank, formatTime, styles]);

  // Prepare data for FlatList
  const leaderboardListData = useMemo(() => {
    if (loadingLeaderboard || leaderboardError || !leaderboardResponse?.success || !leaderboardResponse.data) {
      return [];
    }
    return leaderboardResponse.data;
  }, [loadingLeaderboard, leaderboardError, leaderboardResponse]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={leaderboardListData}
        renderItem={renderLeaderboardItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={
          loadingLeaderboard ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading leaderboard...</Text>
            </View>
          ) : leaderboardError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load leaderboard</Text>
              <TouchableOpacity onPress={refetchLeaderboard} style={styles.retryButton}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No leaderboard data available</Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={10}
        getItemLayout={getItemLayout}
      />
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.muted,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSubtle,
    marginTop: 2,
  },
  calendarButton: {
    padding: 8,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.9,
  },
  periodContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.cardBackground,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.chip,
    marginRight: 12,
  },
  periodChipActive: {
    backgroundColor: Colors.primary,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSubtle,
  },
  periodTextActive: {
    color: Colors.white,
  },
  topPerformersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 220,
  },
  podiumItem: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  firstPlaceItem: {
    marginBottom: 20,
  },
  podiumRank: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  firstPlace: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  secondPlace: {
    marginTop: 20,
  },
  thirdPlace: {
    marginTop: 40,
  },
  podiumAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    position: 'absolute',
    top: 8,
  },
  podiumName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  podiumScore: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textLink,
    marginBottom: 2,
  },
  podiumTime: {
    fontSize: 12,
    color: Colors.textSubtle,
  },
  yourRankContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  yourRankCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  leaderboardContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  leaderboardItem: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: Colors.shadow,
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
    backgroundColor: Colors.chip,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSubtle,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  userStats: {
    fontSize: 12,
    color: Colors.textSubtle,
  },
  scoreInfo: {
    alignItems: 'flex-end',
  },
  userScore: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textLink,
    marginBottom: 2,
  },
  percentileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentileText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSubtle,
    marginLeft: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 10,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});