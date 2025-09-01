import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, Medal, Award, TrendingUp, Calendar, ChevronLeft, Crown, Star, Clock, Target, Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useGetTestLeaderboardQuery,
  useGetTestSeriesLeaderboardQuery,
  useGetOverallLeaderboardQuery,
  useGetCategoryLeaderboardQuery,
  LeaderboardEntry
} from '@/store/api/testResponseApi';

type LeaderboardType = 'test' | 'series' | 'category' | 'overall';
type TimeFrame = 'today' | 'week' | 'month' | 'all';

interface LeaderboardProps {
  type: LeaderboardType;
  id?: number; // testId, seriesId, or categoryId
  title?: string;
  showTimeframe?: boolean;
}

export default function EnhancedLeaderboard({ 
  type = 'test', 
  id, 
  title, 
  showTimeframe = false 
}: LeaderboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(isDarkMode);
  const styles = getStyles(Colors);
  
  // Get current user
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Determine which query to use based on type
  const testQuery = useGetTestLeaderboardQuery(
    { testId: id!, page: currentPage, userId: user?.uuid },
    { skip: type !== 'test' || !id }
  );
  
  const seriesQuery = useGetTestSeriesLeaderboardQuery(
    { testSeriesId: id!, page: currentPage, userId: user?.uuid },
    { skip: type !== 'series' || !id }
  );
  
  const categoryQuery = useGetCategoryLeaderboardQuery(
    { categoryId: id!, page: currentPage, userId: user?.uuid },
    { skip: type !== 'category' || !id }
  );
  
  const overallQuery = useGetOverallLeaderboardQuery(
    { timeframe: selectedTimeframe, page: currentPage },
    { skip: type !== 'overall' }
  );
  
  // Get the appropriate query result
  const getCurrentQuery = () => {
    switch (type) {
      case 'test': return testQuery;
      case 'series': return seriesQuery;
      case 'category': return categoryQuery;
      case 'overall': return overallQuery;
      default: return testQuery;
    }
  };
  
  const { data, isLoading, error, refetch } = getCurrentQuery();
  
  const timeframes: { key: TimeFrame; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All Time' }
  ];
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  
  const handleLoadMore = () => {
    if (data?.data.pagination && currentPage < data.data.pagination.totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown size={24} color="#FFD700" />;
      case 2: return <Medal size={24} color="#C0C0C0" />;
      case 3: return <Award size={24} color="#CD7F32" />;
      default: return null;
    }
  };
  
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return Colors.textSecondary;
    }
  };
  
  if (isLoading && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{title || 'Leaderboard'}</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{title || 'Leaderboard'}</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load leaderboard</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const leaderboard = data?.data.leaderboard || [];
  const userRank = data?.data.userRank;
  const pagination = data?.data.pagination;
  
  // Get top 3 performers for podium display
  const topThree = leaderboard.slice(0, 3);
  const restOfLeaderboard = leaderboard.slice(3);
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{title || 'Leaderboard'}</Text>
          {pagination && (
            <Text style={styles.subtitle}>
              {pagination.totalEntries} participants
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <TrendingUp size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Timeframe Selector */}
      {showTimeframe && (
        <View style={styles.timeframeContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeframeScroll}>
            {timeframes.map((timeframe) => (
              <TouchableOpacity
                key={timeframe.key}
                style={[
                  styles.timeframeButton,
                  selectedTimeframe === timeframe.key && styles.activeTimeframeButton
                ]}
                onPress={() => {
                  setSelectedTimeframe(timeframe.key);
                  setCurrentPage(1);
                }}
              >
                <Text
                  style={[
                    styles.timeframeButtonText,
                    selectedTimeframe === timeframe.key && styles.activeTimeframeButtonText
                  ]}
                >
                  {timeframe.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* User's Rank Card */}
      {userRank && (
        <View style={styles.userRankCard}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark || Colors.primary]}
            style={styles.userRankGradient}
          >
            <View style={styles.userRankContent}>
              <View style={styles.userRankLeft}>
                <Text style={styles.userRankLabel}>Your Rank</Text>
                <Text style={styles.userRankValue}>#{userRank.rank}</Text>
              </View>
              <View style={styles.userRankStats}>
                <View style={styles.userRankStat}>
                  <Target size={16} color={Colors.background} />
                  <Text style={styles.userRankStatText}>{userRank.score}%</Text>
                </View>
                <View style={styles.userRankStat}>
                  <TrendingUp size={16} color={Colors.background} />
                  <Text style={styles.userRankStatText}>{userRank.percentile}th</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <View style={styles.podiumContainer}>
            <Text style={styles.podiumTitle}>Top Performers</Text>
            <View style={styles.podium}>
              {/* Second Place */}
              {topThree[1] && (
                <View style={[styles.podiumPosition, styles.secondPlace]}>
                  <View style={styles.podiumRank}>
                    <Medal size={20} color="#C0C0C0" />
                  </View>
                  <Image 
                    source={{ uri: topThree[1].user?.avatarUrl || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg' }}
                    style={styles.podiumAvatar}
                  />
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {topThree[1].user?.fullName || topThree[1].user?.username || 'User'}
                  </Text>
                  <Text style={styles.podiumScore}>{topThree[1].score}%</Text>
                  <Text style={styles.podiumTime}>
                    <Clock size={12} color={Colors.textSecondary} />
                    {' '}{formatTime(topThree[1].time_taken_seconds)}
                  </Text>
                </View>
              )}
              
              {/* First Place */}
              {topThree[0] && (
                <View style={[styles.podiumPosition, styles.firstPlace]}>
                  <View style={styles.podiumRank}>
                    <Crown size={24} color="#FFD700" />
                  </View>
                  <Image 
                    source={{ uri: topThree[0].user?.avatarUrl || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg' }}
                    style={[styles.podiumAvatar, styles.firstPlaceAvatar]}
                  />
                  <Text style={[styles.podiumName, styles.firstPlaceName]} numberOfLines={1}>
                    {topThree[0].user?.fullName || topThree[0].user?.username || 'User'}
                  </Text>
                  <Text style={[styles.podiumScore, styles.firstPlaceScore]}>{topThree[0].score}%</Text>
                  <Text style={styles.podiumTime}>
                    <Clock size={12} color={Colors.textSecondary} />
                    {' '}{formatTime(topThree[0].time_taken_seconds)}
                  </Text>
                </View>
              )}
              
              {/* Third Place */}
              {topThree[2] && (
                <View style={[styles.podiumPosition, styles.thirdPlace]}>
                  <View style={styles.podiumRank}>
                    <Award size={20} color="#CD7F32" />
                  </View>
                  <Image 
                    source={{ uri: topThree[2].user?.avatarUrl || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg' }}
                    style={styles.podiumAvatar}
                  />
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {topThree[2].user?.fullName || topThree[2].user?.username || 'User'}
                  </Text>
                  <Text style={styles.podiumScore}>{topThree[2].score}%</Text>
                  <Text style={styles.podiumTime}>
                    <Clock size={12} color={Colors.textSecondary} />
                    {' '}{formatTime(topThree[2].time_taken_seconds)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
        
        {/* Rest of Leaderboard */}
        <View style={styles.leaderboardList}>
          <Text style={styles.listTitle}>All Rankings</Text>
          {restOfLeaderboard.map((entry, index) => (
            <View key={entry.id} style={styles.leaderboardItem}>
              <View style={styles.rankSection}>
                <Text style={[styles.rankText, { color: getRankColor(entry.rank || (index + 4)) }]}>
                  #{entry.rank || (index + 4)}
                </Text>
              </View>
              
              <Image 
                source={{ uri: entry.user?.avatarUrl || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg' }}
                style={styles.listAvatar}
              />
              
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {entry.user?.fullName || entry.user?.username || 'User'}
                </Text>
                <View style={styles.userStats}>
                  <Text style={styles.userStat}>
                    {entry.correct_answers}/{entry.total_questions} correct
                  </Text>
                  <Text style={styles.userStat}>
                    {formatTime(entry.time_taken_seconds)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.scoreSection}>
                <Text style={styles.scoreText}>{entry.score}%</Text>
                {entry.percentile && (
                  <Text style={styles.percentileText}>{entry.percentile}th</Text>
                )}
              </View>
            </View>
          ))}
          
          {/* Load More Button */}
          {pagination && currentPage < pagination.totalPages && (
            <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <Users size={16} color={Colors.primary} />
                  <Text style={styles.loadMoreText}>Load More</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
        
        {leaderboard.length === 0 && (
          <View style={styles.emptyState}>
            <Trophy size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyStateTitle}>No Results Yet</Text>
            <Text style={styles.emptyStateText}>
              Be the first to complete this test and claim the top spot!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  timeframeContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  timeframeScroll: {
    paddingHorizontal: 16,
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: Colors.surface,
    borderRadius: 20,
  },
  activeTimeframeButton: {
    backgroundColor: Colors.primary,
  },
  timeframeButtonText: {
    fontSize: 14,
    color: Colors.text,
  },
  activeTimeframeButtonText: {
    color: Colors.background,
    fontWeight: '600',
  },
  userRankCard: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  userRankGradient: {
    padding: 20,
  },
  userRankContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userRankLeft: {
    flex: 1,
  },
  userRankLabel: {
    fontSize: 14,
    color: Colors.background,
    opacity: 0.8,
  },
  userRankValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.background,
    marginTop: 4,
  },
  userRankStats: {
    flexDirection: 'row',
    gap: 16,
  },
  userRankStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userRankStatText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
  content: {
    flex: 1,
  },
  podiumContainer: {
    padding: 20,
  },
  podiumTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 16,
  },
  podiumPosition: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    paddingBottom: 20,
    minWidth: 100,
  },
  firstPlace: {
    marginBottom: 0,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  secondPlace: {
    marginBottom: 20,
  },
  thirdPlace: {
    marginBottom: 40,
  },
  podiumRank: {
    marginBottom: 12,
  },
  podiumAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
  },
  firstPlaceAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  podiumName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  firstPlaceName: {
    fontSize: 16,
    color: Colors.primary,
  },
  podiumScore: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.success,
    marginBottom: 2,
  },
  firstPlaceScore: {
    fontSize: 18,
  },
  podiumTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaderboardList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  rankSection: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
  },
  listAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 12,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  userStats: {
    flexDirection: 'row',
    gap: 12,
  },
  userStat: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  scoreSection: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.success,
  },
  percentileText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export { EnhancedLeaderboard };