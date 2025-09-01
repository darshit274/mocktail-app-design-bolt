import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  BarChart3, PieChart, TrendingUp, Users, Clock, Target, Award, AlertCircle,
  ChevronLeft, Calendar, Download, Filter, RefreshCw, Eye
} from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetTestAnalyticsQuery } from '@/store/api/testResponseApi';

const screenWidth = Dimensions.get('window').width;

interface ChartData {
  label: string;
  value: number;
  color: string;
}

export default function TestAnalyticsDashboard() {
  const params = useLocalSearchParams();
  const { testId, testName } = params;
  
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(isDarkMode);
  const styles = getStyles(Colors);
  
  // Get test analytics
  const { data, isLoading, error, refetch } = useGetTestAnalyticsQuery(
    parseInt(testId as string),
    { skip: !testId }
  );
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  
  const exportReport = () => {
    // TODO: Implement export functionality
    console.log('Exporting report...');
  };
  
  // Process score distribution data for chart
  const getScoreDistributionData = (): ChartData[] => {
    if (!data?.data.score_distribution) return [];
    
    const colors = [
      Colors.success, Colors.successLight, Colors.warning, Colors.warningLight,
      Colors.error, Colors.errorLight, Colors.textSecondary, Colors.border
    ];
    
    return data.data.score_distribution.map((item, index) => ({
      label: item.score_range,
      value: item.count,
      color: colors[index % colors.length]
    }));
  };
  
  const renderScoreDistributionChart = () => {
    const chartData = getScoreDistributionData();
    const maxValue = Math.max(...chartData.map(d => d.value));
    const chartHeight = 200;
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Score Distribution</Text>
        <View style={styles.barChart}>
          {chartData.map((item, index) => (
            <View key={index} style={styles.barContainer}>
              <Text style={styles.barValue}>{item.value}</Text>
              <View 
                style={[
                  styles.bar,
                  {
                    height: (item.value / maxValue) * chartHeight,
                    backgroundColor: item.color
                  }
                ]}
              />
              <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  const renderPerformanceMetrics = () => {
    if (!data?.data.analytics) return null;
    
    const analytics = data.data.analytics;
    
    const metrics = [
      {
        icon: Users,
        label: 'Total Attempts',
        value: analytics.total_attempts.toString(),
        color: Colors.primary,
        trend: null
      },
      {
        icon: Target,
        label: 'Average Score',
        value: `${analytics.avg_percentage.toFixed(1)}%`,
        color: Colors.success,
        trend: analytics.avg_percentage >= 70 ? 'up' : analytics.avg_percentage >= 50 ? 'stable' : 'down'
      },
      {
        icon: Award,
        label: 'Highest Score',
        value: `${analytics.highest_score.toFixed(1)}%`,
        color: Colors.warning,
        trend: 'up'
      },
      {
        icon: Clock,
        label: 'Avg Time',
        value: `${analytics.avg_time_taken_minutes}min`,
        color: Colors.textSecondary,
        trend: analytics.avg_time_taken_minutes <= 45 ? 'up' : 'down'
      }
    ];
    
    return (
      <View style={styles.metricsGrid}>
        {metrics.map((metric, index) => (
          <View key={index} style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIcon, { backgroundColor: `${metric.color}20` }]}>
                <metric.icon size={20} color={metric.color} />
              </View>
              {metric.trend && (
                <TrendingUp 
                  size={16} 
                  color={metric.trend === 'up' ? Colors.success : 
                         metric.trend === 'down' ? Colors.error : Colors.warning}
                  style={{
                    transform: [{
                      rotate: metric.trend === 'up' ? '0deg' : 
                              metric.trend === 'down' ? '180deg' : '90deg'
                    }]
                  }}
                />
              )}
            </View>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
          </View>
        ))}
      </View>
    );
  };
  
  const renderDetailedStats = () => {
    if (!data?.data.analytics) return null;
    
    const analytics = data.data.analytics;
    
    return (
      <View style={styles.detailedStats}>
        <Text style={styles.sectionTitle}>Detailed Statistics</Text>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Average Correct Answers</Text>
          <Text style={styles.statValue}>{analytics.avg_correct.toFixed(1)}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Average Wrong Answers</Text>
          <Text style={styles.statValue}>{analytics.avg_wrong.toFixed(1)}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Average Unanswered</Text>
          <Text style={styles.statValue}>{analytics.avg_unanswered.toFixed(1)}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Score Range</Text>
          <Text style={styles.statValue}>
            {analytics.lowest_score.toFixed(1)}% - {analytics.highest_score.toFixed(1)}%
          </Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Completion Rate</Text>
          <Text style={styles.statValue}>
            {((analytics.total_attempts / (analytics.total_attempts + 100)) * 100).toFixed(1)}%
          </Text>
        </View>
      </View>
    );
  };
  
  const renderInsights = () => {
    if (!data?.data.analytics) return null;
    
    const analytics = data.data.analytics;
    const insights = [];
    
    // Performance insights
    if (analytics.avg_percentage >= 80) {
      insights.push({
        type: 'success',
        title: 'Excellent Performance',
        message: 'Students are performing very well on this test. Consider increasing difficulty for advanced learners.'
      });
    } else if (analytics.avg_percentage < 50) {
      insights.push({
        type: 'warning',
        title: 'Low Average Score',
        message: 'Students are struggling with this test. Consider reviewing question difficulty or providing additional study materials.'
      });
    }
    
    // Time insights
    if (analytics.avg_time_taken_minutes < 30) {
      insights.push({
        type: 'info',
        title: 'Quick Completion',
        message: 'Students are completing the test quickly. Consider adding more questions or increasing complexity.'
      });
    } else if (analytics.avg_time_taken_minutes > 90) {
      insights.push({
        type: 'warning',
        title: 'Long Duration',
        message: 'Students are taking longer than expected. Review if questions are too complex or time limit needs adjustment.'
      });
    }
    
    // Participation insights
    if (analytics.total_attempts < 10) {
      insights.push({
        type: 'info',
        title: 'Low Participation',
        message: 'Consider promoting this test more or checking if it\'s properly categorized and accessible.'
      });
    }
    
    if (insights.length === 0) {
      insights.push({
        type: 'success',
        title: 'Balanced Performance',
        message: 'This test shows good balance in difficulty and engagement. Students are performing well within expected parameters.'
      });
    }
    
    return (
      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>AI Insights</Text>
        {insights.map((insight, index) => (
          <View key={index} style={[
            styles.insightCard,
            { borderLeftColor: insight.type === 'success' ? Colors.success : 
                              insight.type === 'warning' ? Colors.warning : Colors.primary }
          ]}>
            <View style={styles.insightHeader}>
              <AlertCircle 
                size={16} 
                color={insight.type === 'success' ? Colors.success : 
                       insight.type === 'warning' ? Colors.warning : Colors.primary} 
              />
              <Text style={styles.insightTitle}>{insight.title}</Text>
            </View>
            <Text style={styles.insightMessage}>{insight.message}</Text>
          </View>
        ))}
      </View>
    );
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <AlertCircle size={48} color={Colors.error} />
        <Text style={styles.errorText}>Failed to load analytics</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.title}>Test Analytics</Text>
          <Text style={styles.subtitle}>{testName || 'Test Performance'}</Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={exportReport}>
            <Download size={18} color={Colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size={18} color={Colors.primary} />
            ) : (
              <RefreshCw size={18} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Cards */}
        {renderPerformanceMetrics()}
        
        {/* Score Distribution Chart */}
        {renderScoreDistributionChart()}
        
        {/* Detailed Statistics */}
        {renderDetailedStats()}
        
        {/* AI Insights */}
        {renderInsights()}
        
        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => {
              router.push({
                pathname: '/test/enhanced-leaderboard',
                params: {
                  type: 'test',
                  id: testId,
                  title: `${testName} Leaderboard`
                }
              });
            }}
          >
            <Award size={20} color={Colors.primary} />
            <Text style={styles.actionCardText}>View Leaderboard</Text>
            <View style={styles.actionCardBadge}>
              <Text style={styles.actionCardBadgeText}>
                {data?.data.analytics.total_attempts || 0}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={exportReport}>
            <Download size={20} color={Colors.success} />
            <Text style={styles.actionCardText}>Export Report</Text>
            <Eye size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => {
              // Navigate to question analysis (if available)
              console.log('View question analysis');
            }}
          >
            <BarChart3 size={20} color={Colors.warning} />
            <Text style={styles.actionCardText}>Question Analysis</Text>
            <Eye size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  content: {
    flex: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: 16,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  chartContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    margin: 16,
    padding: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 240,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  bar: {
    width: '80%',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  detailedStats: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    margin: 16,
    padding: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  insightsSection: {
    margin: 16,
  },
  insightCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
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
  insightMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actionsSection: {
    margin: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  actionCardText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  actionCardBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionCardBadgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
});

export { TestAnalyticsDashboard };