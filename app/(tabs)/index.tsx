import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Search, Play, BookOpen, FileText, User, ShoppingBag, File, Clock, CheckCircle, Trophy, Calendar } from 'lucide-react-native';
import { router } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetProfileQuery, useGetDashboardStatsQuery } from '@/store/api/userApi';
import { UI } from '@/utils/appConstants';
import { QuickActionCard } from '@/components/home';

export default function HomeScreen() {
  const { theme } = useTheme();
  const Colors = getTheme(theme);
  const { t } = useLanguage();
  const { data: profileData } = useGetProfileQuery();
  const { data: dashboardData, isLoading: isDashboardLoading } = useGetDashboardStatsQuery();

  const userProfile = profileData?.data;
  const dashboardStats = dashboardData?.data;

  // Memoize quick actions array to prevent recreation on every render
  // Note: "Free Samples" removed - replaced with inline hierarchy navigation
  // PYQs added to replace Study PDFs
  const quickActions = useMemo(() => [
    { id: 1, title: t.freeTests.title, icon: Play, color: Colors.success, route: '/free-tests' },
    { id: 2, title: 'My Series', icon: ShoppingBag, color: Colors.warning, route: '/purchased-series' },
    { id: 3, title: t.testSeries.title, icon: BookOpen, color: Colors.primary, route: '/test-series' },
    { id: 4, title: 'PYQs', icon: File, color: '#9333ea', route: '/pyqs' },
  ], [t, Colors]);

  // Memoize navigation handlers
  const handleQuickActionPress = useCallback((route: string) => {
    router.push(route as any);
  }, []);

  // Format date helper
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    if (isToday) return `Today at ${timeStr}`;
    if (isYesterday) return `Yesterday at ${timeStr}`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Memoize styles to prevent recalculation
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {userProfile?.avatarUrl ? (
              <Image 
                source={{ uri: userProfile.avatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <User size={24} color={Colors.white} />
              </View>
            )}
            <View>
              <Text style={styles.greeting}>{t.home.goodMorning}</Text>
              <Text style={styles.userName}>
                {userProfile?.fullName || userProfile?.username || 'Student'}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Search size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Bell size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.home.quickActions}</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <QuickActionCard
                key={action.id}
                title={action.title}
                icon={action.icon}
                color={action.color}
                onPress={() => handleQuickActionPress(action.route)}
                Colors={Colors}
              />
            ))}
          </View>
        </View>

        {/* Stats Cards Row */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          {isDashboardLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : (
            <View style={styles.statsRow}>
              <TouchableOpacity
                style={[styles.statCard, { backgroundColor: Colors.primary + '15' }]}
                onPress={() => router.push('/test-series' as any)}
              >
                <View style={[styles.statIconContainer, { backgroundColor: Colors.primary }]}>
                  <BookOpen size={20} color={Colors.white} />
                </View>
                <Text style={styles.statValue}>{dashboardStats?.totalTests || 0}</Text>
                <Text style={styles.statLabel}>Total Tests</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statCard, { backgroundColor: Colors.success + '15' }]}
                onPress={() => router.push('/test-history' as any)}
              >
                <View style={[styles.statIconContainer, { backgroundColor: Colors.success }]}>
                  <CheckCircle size={20} color={Colors.white} />
                </View>
                <Text style={styles.statValue}>{dashboardStats?.completedTests || 0}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statCard, { backgroundColor: '#9333ea15' }]}
                onPress={() => router.push('/purchased-series' as any)}
              >
                <View style={[styles.statIconContainer, { backgroundColor: '#9333ea' }]}>
                  <Trophy size={20} color={Colors.white} />
                </View>
                <Text style={styles.statValue}>{dashboardStats?.activeSubscriptions || 0}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {isDashboardLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : !dashboardStats?.recentActivity || dashboardStats.recentActivity.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: Colors.cardBackground }]}>
                <Clock size={32} color={Colors.textSubtle} />
              </View>
              <Text style={styles.emptyTitle}>No recent activity</Text>
              <Text style={styles.emptyText}>Start taking tests to see your progress here</Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: Colors.primary }]}
                onPress={() => router.push('/free-tests' as any)}
              >
                <Text style={styles.emptyButtonText}>Take Free Test</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.activityList}>
              {dashboardStats.recentActivity.slice(0, 5).map((activity) => (
                <View key={activity.id} style={styles.activityCard}>
                  <View style={[
                    styles.activityIcon,
                    { backgroundColor: activity.type === 'test' ? Colors.primary + '20' : '#9333ea20' }
                  ]}>
                    {activity.type === 'test' ? (
                      <BookOpen size={20} color={Colors.primary} />
                    ) : (
                      <FileText size={20} color="#9333ea" />
                    )}
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle} numberOfLines={1}>
                      {activity.title}
                    </Text>
                    <View style={styles.activityMeta}>
                      <Calendar size={12} color={Colors.textSubtle} />
                      <Text style={styles.activityDate}>{formatDate(activity.date)}</Text>
                    </View>
                  </View>
                  {/* {activity.percentage !== undefined && (
                    <View style={[
                      styles.percentageBadge,
                      {
                        backgroundColor:
                          activity.percentage >= 75 ? Colors.success + '20' :
                          activity.percentage >= 50 ? Colors.warning + '20' :
                          Colors.error + '20'
                      }
                    ]}>
                      <Text style={[
                        styles.percentageText,
                        {
                          color:
                            activity.percentage >= 75 ? Colors.success :
                            activity.percentage >= 50 ? Colors.warning :
                            Colors.error
                        }
                      ]}>
                        {activity.percentage}%
                      </Text>
                    </View>
                  )} */}
                </View>
              ))}
            </View>
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.cardBackground,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSubtle,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.textLink,
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '47%',
    backgroundColor: Colors.cardBackground,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  testCard: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  testCardLeft: {
    flex: 1,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  testDate: {
    fontSize: 12,
    color: Colors.textSubtle,
  },
  testCardRight: {
    alignItems: 'flex-end',
  },
  testScore: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryLight,
    marginBottom: 4,
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.progress,
    borderRadius: 2,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Stats Cards Row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSubtle,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Recent Activity
  activityList: {
    gap: 12,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 12,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityDate: {
    fontSize: 12,
    color: Colors.textSubtle,
  },
  percentageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Empty State
  emptyState: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSubtle,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSubtle,
    textAlign: 'center',
  },
});
