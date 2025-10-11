import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Search, Play, Clock, Users, Award, BookOpen, FileText, User, Gift } from 'lucide-react-native';
import { router } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetProfileQuery, useGetDashboardStatsQuery } from '@/store/api/userApi';

export default function HomeScreen() {
  const { theme } = useTheme();
  const Colors = getTheme(theme);
  const { t } = useLanguage();
  const { data: profileData } = useGetProfileQuery();
  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useGetDashboardStatsQuery();

  const userProfile = profileData?.data;
  const dashboardStats = dashboardData?.data;

  const quickActions = [
    { id: 1, title: t.freeTests.title, icon: Play, color: Colors.success, route: '/free-tests' },
    { id: 2, title: 'Free Samples', icon: Gift, color: Colors.warning, route: '/free-in-paid-tests' },
    { id: 3, title: t.testSeries.title, icon: BookOpen, color: Colors.primary, route: '/test-series' },
    { id: 4, title: t.pdfs.title, icon: FileText, color: Colors.primaryLight, route: '/pdfs' },
  ];

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Use real data from API, or fallback to empty array
  const recentTests = dashboardStats?.recentActivity || [];

  const styles = getStyles(Colors);

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

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryLight]}
            style={styles.statCard}
          >
            <Award size={32} color="#FFFFFF" />
            {isDashboardLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginTop: 8 }} />
            ) : (
              <Text style={styles.statNumber}>{dashboardStats?.totalScore || 0}</Text>
            )}
            <Text style={styles.statLabel}>{t.home.totalScore}</Text>
          </LinearGradient>

          <LinearGradient
            colors={[Colors.primaryLight, Colors.primary]}
            style={styles.statCard}
          >
            <Users size={32} color="#FFFFFF" />
            {isDashboardLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginTop: 8 }} />
            ) : (
              <Text style={styles.statNumber}>#{dashboardStats?.rank || '--'}</Text>
            )}
            <Text style={styles.statLabel}>{t.home.rank}</Text>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.home.quickActions}</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={() => router.push(action.route as any)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                  <action.icon size={24} color={action.color} />
                </View>
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Tests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.home.recentTests}</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>{t.common.seeAll}</Text>
            </TouchableOpacity>
          </View>
          
          {isDashboardLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : recentTests.length > 0 ? (
            recentTests.map((test) => (
              <TouchableOpacity key={test.id} style={styles.testCard}>
                <View style={styles.testCardLeft}>
                  <Text style={styles.testTitle}>{test.title}</Text>
                  <Text style={styles.testDate}>{formatDate(test.date)}</Text>
                </View>
                <View style={styles.testCardRight}>
                  <Text style={styles.testScore}>{test.score}/{test.total}</Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, { width: `${test.percentage}%` }]}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent tests yet. Start practicing!</Text>
            </View>
          )}
        </View>

        {/* Featured Test Series */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.home.featuredTestSeries}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={styles.featuredCard}>
              <LinearGradient
                colors={[Colors.primary, Colors.accent]}
                style={styles.featuredGradient}
              >
                <Text style={styles.featuredTitle}>PSI Mock Tests</Text>
                <Text style={styles.featuredSubtitle}>10 Tests • ₹299</Text>
                <Text style={styles.featuredDescription}>Complete preparation for PSI exam</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.featuredCard}>
              <LinearGradient
                colors={[Colors.accent, Colors.primaryLight]}
                style={styles.featuredGradient}
              >
                <Text style={styles.featuredTitle}>NCERT Series</Text>
                <Text style={styles.featuredSubtitle}>50+ Tests • ₹199</Text>
                <Text style={styles.featuredDescription}>Class 6-12 comprehensive tests</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 16,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
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
  featuredCard: {
    width: 280,
    marginRight: 16,
  },
  featuredGradient: {
    padding: 20,
    borderRadius: 16,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSubtle,
    textAlign: 'center',
  },
});
