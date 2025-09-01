import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, TrendingUp, PlayCircle, Award, Target, Users } from 'lucide-react-native';
import { router } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface TestActionButtonsProps {
  testId?: number;
  categoryId?: number;
  seriesId?: number;
  testName?: string;
  showPerformanceButton?: boolean;
}

/**
 * Navigation buttons that can be integrated into existing test screens
 * to provide access to enhanced test features
 */
export function TestActionButtons({ 
  testId, 
  categoryId, 
  seriesId, 
  testName,
  showPerformanceButton = true 
}: TestActionButtonsProps) {
  const { isDarkMode } = useTheme();
  const Colors = getTheme(isDarkMode);
  const styles = getStyles(Colors);

  const startEnhancedTest = () => {
    router.push({
      pathname: '/test/enhanced-quiz',
      params: {
        testId,
        categoryId,
        categoryName: testName
      }
    });
  };

  const viewLeaderboard = () => {
    if (testId) {
      router.push({
        pathname: '/test/enhanced-leaderboard',
        params: {
          type: 'test',
          id: testId,
          title: `${testName} Leaderboard`
        }
      });
    } else if (seriesId) {
      router.push({
        pathname: '/test/enhanced-leaderboard',
        params: {
          type: 'series',
          id: seriesId,
          title: 'Series Leaderboard'
        }
      });
    } else if (categoryId) {
      router.push({
        pathname: '/test/enhanced-leaderboard',
        params: {
          type: 'category',
          id: categoryId,
          title: 'Category Leaderboard'
        }
      });
    }
  };

  const viewPerformance = () => {
    router.push('/test/performance-dashboard');
  };

  const viewOverallLeaderboard = () => {
    router.push({
      pathname: '/test/enhanced-leaderboard',
      params: {
        type: 'overall',
        title: 'Overall Leaderboard',
        showTimeframe: 'true'
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Primary Action - Start Test */}
      {(testId || categoryId) && (
        <TouchableOpacity style={styles.primaryButton} onPress={startEnhancedTest}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark || Colors.primary]}
            style={styles.primaryGradient}
          >
            <PlayCircle size={20} color={Colors.background} />
            <Text style={styles.primaryButtonText}>Start Test</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Secondary Actions */}
      <View style={styles.secondaryButtons}>
        <TouchableOpacity style={styles.secondaryButton} onPress={viewLeaderboard}>
          <Trophy size={18} color={Colors.primary} />
          <Text style={styles.secondaryButtonText}>Leaderboard</Text>
        </TouchableOpacity>

        {showPerformanceButton && (
          <TouchableOpacity style={styles.secondaryButton} onPress={viewPerformance}>
            <TrendingUp size={18} color={Colors.success} />
            <Text style={styles.secondaryButtonText}>My Progress</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.secondaryButton} onPress={viewOverallLeaderboard}>
          <Users size={18} color={Colors.warning} />
          <Text style={styles.secondaryButtonText}>Top Ranks</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Performance summary widget that shows user's recent performance
 */
interface PerformanceWidgetProps {
  userId?: string;
  compact?: boolean;
}

export function PerformanceWidget({ userId, compact = false }: PerformanceWidgetProps) {
  const { isDarkMode } = useTheme();
  const Colors = getTheme(isDarkMode);
  const styles = getStyles(Colors);

  // This would use the useGetUserTestHistoryQuery hook to get recent data
  // For demo purposes, showing static data
  const mockData = {
    avgScore: 78.5,
    totalTests: 12,
    bestRank: 5,
    recentImprovement: 8.3
  };

  const handleViewDetails = () => {
    router.push('/test/performance-dashboard');
  };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactWidget} onPress={handleViewDetails}>
        <View style={styles.compactContent}>
          <View style={styles.compactLeft}>
            <Award size={20} color={Colors.primary} />
            <Text style={styles.compactScore}>{mockData.avgScore}%</Text>
          </View>
          <View style={styles.compactRight}>
            <Text style={styles.compactLabel}>Avg Score</Text>
            <Text style={styles.compactMeta}>{mockData.totalTests} tests</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.performanceWidget}>
      <View style={styles.widgetHeader}>
        <Text style={styles.widgetTitle}>Your Performance</Text>
        <TouchableOpacity onPress={handleViewDetails}>
          <Text style={styles.viewDetailsLink}>View Details</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.widgetStats}>
        <View style={styles.widgetStat}>
          <Target size={16} color={Colors.primary} />
          <Text style={styles.widgetStatValue}>{mockData.avgScore}%</Text>
          <Text style={styles.widgetStatLabel}>Avg Score</Text>
        </View>

        <View style={styles.widgetStat}>
          <Trophy size={16} color={Colors.success} />
          <Text style={styles.widgetStatValue}>#{mockData.bestRank}</Text>
          <Text style={styles.widgetStatLabel}>Best Rank</Text>
        </View>

        <View style={styles.widgetStat}>
          <TrendingUp size={16} color={Colors.warning} />
          <Text style={styles.widgetStatValue}>+{mockData.recentImprovement}%</Text>
          <Text style={styles.widgetStatLabel}>Improvement</Text>
        </View>
      </View>
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    padding: 16,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
  },
  compactWidget: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactScore: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  compactRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  compactLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  compactMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  performanceWidget: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  viewDetailsLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  widgetStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  widgetStat: {
    alignItems: 'center',
    gap: 4,
  },
  widgetStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  widgetStatLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});

export default { TestActionButtons, PerformanceWidget };