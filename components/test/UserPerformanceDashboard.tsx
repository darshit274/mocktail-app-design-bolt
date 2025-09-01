import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Trophy, TrendingUp, Calendar, Clock, Target, Award, Star,
  ChevronRight, ChevronLeft, BarChart3, PieChart, Activity
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetUserTestHistoryQuery } from '@/store/api/testResponseApi';

export default function UserPerformanceDashboard() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | number>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(isDarkMode);
  const styles = getStyles(Colors);
  
  // Get current user
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Get user test history
  const { data, isLoading, error, refetch } = useGetUserTestHistoryQuery({
    userId: user?.uuid || '',
    page: currentPage,
    limit: 10,
    ...(typeof selectedFilter === 'number' && { testSeriesId: selectedFilter })
  }, {
    skip: !user?.uuid
  });
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };
  
  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { label: 'Excellent', color: Colors.success, icon: Trophy };
    if (percentage >= 80) return { label: 'Very Good', color: Colors.success, icon: Award };
    if (percentage >= 70) return { label: 'Good', color: Colors.warning, icon: Star };
    if (percentage >= 60) return { label: 'Average', color: Colors.warning, icon: Target };
    return { label: 'Needs Work', color: Colors.error, icon: Activity };
  };
  
  const getProgressTrend = () => {
    if (!data?.data.history || data.data.history.length < 2) return null;
    
    const recent = data.data.history.slice(0, 3);
    const older = data.data.history.slice(-3);
    
    const recentAvg = recent.reduce((sum, test) => sum + test.percentage, 0) / recent.length;
    const olderAvg = older.reduce((sum, test) => sum + test.percentage, 0) / older.length;
    
    const trend = recentAvg - olderAvg;
    
    if (trend > 5) return { direction: 'up', color: Colors.success, label: 'Improving' };
    if (trend < -5) return { direction: 'down', color: Colors.error, label: 'Declining' };
    return { direction: 'stable', color: Colors.warning, label: 'Stable' };
  };
  
  if (isLoading && !data) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading performance data...</Text>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Failed to load performance data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  const statistics = data?.data.statistics;
  const history = data?.data.history || [];
  const trend = getProgressTrend();
  const performance = getPerformanceLevel(statistics?.avg_percentage || 0);
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>My Performance</Text>
          <Text style={styles.subtitle}>Track your progress and achievements</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={() => refetch()}>
          <BarChart3 size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overall Performance Card */}
        {statistics && (
          <View style={styles.overallCard}>
            <LinearGradient
              colors={[performance.color, `${performance.color}80`]}
              style={styles.overallGradient}
            >
              <View style={styles.overallContent}>
                <View style={styles.overallMain}>
                  <performance.icon size={32} color={Colors.background} />
                  <Text style={styles.overallScore}>
                    {statistics.avg_percentage.toFixed(1)}%
                  </Text>
                  <Text style={styles.overallLabel}>Average Score</Text>
                </View>
                
                <View style={styles.overallStats}>
                  <View style={styles.overallStat}>
                    <Text style={styles.overallStatValue}>{statistics.total_tests}</Text>
                    <Text style={styles.overallStatLabel}>Tests</Text>
                  </View>
                  <View style={styles.overallStat}>
                    <Text style={styles.overallStatValue}>#{statistics.best_rank}</Text>
                    <Text style={styles.overallStatLabel}>Best Rank</Text>
                  </View>
                  <View style={styles.overallStat}>
                    <Text style={styles.overallStatValue}>{statistics.best_score.toFixed(1)}%</Text>
                    <Text style={styles.overallStatLabel}>Best Score</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}
        
        {/* Performance Level Badge */}
        <View style={styles.badgeContainer}>
          <View style={[styles.performanceBadge, { backgroundColor: `${performance.color}20` }]}>
            <performance.icon size={20} color={performance.color} />
            <Text style={[styles.performanceText, { color: performance.color }]}>
              {performance.label} Performance
            </Text>
            {trend && (
              <View style={styles.trendIndicator}>
                <TrendingUp 
                  size={16} 
                  color={trend.color}
                  style={{ 
                    transform: [{ 
                      rotate: trend.direction === 'up' ? '0deg' : 
                               trend.direction === 'down' ? '180deg' : '90deg' 
                    }] 
                  }}
                />
                <Text style={[styles.trendText, { color: trend.color }]}>
                  {trend.label}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Quick Stats Grid */}
        {statistics && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Trophy size={20} color={Colors.success} />
              </View>
              <Text style={styles.statValue}>{statistics.best_score.toFixed(1)}%</Text>
              <Text style={styles.statLabel}>Highest Score</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Target size={20} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>{statistics.avg_score.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Avg Points</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Award size={20} color={Colors.warning} />
              </View>
              <Text style={styles.statValue}>#{statistics.avg_rank.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Avg Rank</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Activity size={20} color={Colors.textSecondary} />
              </View>
              <Text style={styles.statValue}>{statistics.total_tests}</Text>
              <Text style={styles.statLabel}>Tests Taken</Text>
            </View>
          </View>
        )}
        
        {/* Recent Performance */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Tests</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => {
                router.push({
                  pathname: '/test/enhanced-leaderboard',
                  params: {
                    type: 'overall',
                    title: 'Overall Leaderboard',
                    showTimeframe: 'true'
                  }
                });
              }}
            >
              <Text style={styles.viewAllText}>View Leaderboard</Text>
              <ChevronRight size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          
          {history.map((test, index) => (
            <View key={test.id} style={styles.historyItem}>
              <View style={styles.historyLeft}>
                <View style={styles.historyIndex}>
                  <Text style={styles.historyIndexText}>{index + 1}</Text>
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTestName} numberOfLines={1}>
                    {test.test.name}
                  </Text>
                  <Text style={styles.historyDate}>
                    {new Date(test.completion_date).toLocaleDateString()}
                  </Text>
                  {test.test.testSeries && (
                    <Text style={styles.historySeriesName} numberOfLines={1}>
                      {test.test.testSeries.name}
                    </Text>
                  )}
                </View>
              </View>
              
              <View style={styles.historyRight}>
                <View style={styles.historyScore}>
                  <Text style={[
                    styles.historyScoreText,
                    { color: getPerformanceLevel(test.percentage).color }
                  ]}>
                    {test.percentage.toFixed(1)}%
                  </Text>
                  {test.rank && (
                    <Text style={styles.historyRank}>#{test.rank}</Text>
                  )}
                </View>
                <View style={styles.historyMeta}>
                  {test.percentile && (
                    <Text style={styles.historyPercentile}>
                      {test.percentile.toFixed(0)}th percentile
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}
          
          {history.length === 0 && (
            <View style={styles.emptyState}>
              <PieChart size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>No Test History</Text>
              <Text style={styles.emptyStateText}>
                Start taking tests to see your performance analytics here
              </Text>
            </View>
          )}
        </View>
        
        {/* Performance Insights */}
        {statistics && statistics.total_tests > 0 && (
          <View style={styles.insightsSection}>
            <Text style={styles.sectionTitle}>Performance Insights</Text>
            
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <TrendingUp size={20} color={Colors.primary} />
                <Text style={styles.insightTitle}>Score Range</Text>
              </View>
              <Text style={styles.insightText}>
                Your scores range from {statistics.worst_score.toFixed(1)}% to {statistics.best_score.toFixed(1)}%, 
                showing a {(statistics.best_score - statistics.worst_score).toFixed(1)}% improvement range.
              </Text>
            </View>
            
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Target size={20} color={Colors.success} />
                <Text style={styles.insightTitle}>Consistency</Text>
              </View>
              <Text style={styles.insightText}>
                {statistics.avg_percentage >= 75 
                  ? "You're performing consistently well across different tests."
                  : statistics.avg_percentage >= 60
                    ? "Your performance is fairly consistent with room for improvement."
                    : "Focus on understanding core concepts to improve consistency."}
              </Text>
            </View>
            
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Award size={20} color={Colors.warning} />
                <Text style={styles.insightTitle}>Ranking Performance</Text>
              </View>
              <Text style={styles.insightText}>
                Your best rank is #{statistics.best_rank}, with an average rank of #{statistics.avg_rank.toFixed(0)}. 
                {statistics.avg_rank <= 10 
                  ? " You're consistently among the top performers!"
                  : statistics.avg_rank <= 50
                    ? " You're performing above average."
                    : " Keep practicing to improve your rankings."}
              </Text>
            </View>
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
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    flex: 1,
  },
  overallCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  overallGradient: {
    padding: 24,
  },
  overallContent: {
    alignItems: 'center',
  },
  overallMain: {
    alignItems: 'center',
    marginBottom: 24,
  },
  overallScore: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.background,
    marginTop: 8,
  },
  overallLabel: {
    fontSize: 16,
    color: Colors.background,
    opacity: 0.9,
    marginTop: 4,
  },
  overallStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  overallStat: {
    alignItems: 'center',
  },
  overallStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.background,
  },
  overallStatLabel: {
    fontSize: 12,
    color: Colors.background,
    opacity: 0.8,
    marginTop: 4,
  },
  badgeContainer: {
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  performanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  performanceText: {
    fontSize: 16,
    fontWeight: '600',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 4,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  historySection: {
    margin: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyIndex: {
    width: 32,
    height: 32,
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyIndexText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  historyInfo: {
    flex: 1,
  },
  historyTestName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  historySeriesName: {
    fontSize: 12,
    color: Colors.primary,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyScore: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  historyScoreText: {
    fontSize: 18,
    fontWeight: '700',
  },
  historyRank: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  historyMeta: {
    alignItems: 'flex-end',
  },
  historyPercentile: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  insightsSection: {
    margin: 16,
  },
  insightCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  insightText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});

export { UserPerformanceDashboard };