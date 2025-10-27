import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Search, Play, BookOpen, FileText, User, ShoppingBag, File } from 'lucide-react-native';
import { router } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetProfileQuery } from '@/store/api/userApi';
import { UI } from '@/utils/appConstants';
import { QuickActionCard } from '@/components/home';

export default function HomeScreen() {
  const { theme } = useTheme();
  const Colors = getTheme(theme);
  const { t } = useLanguage();
  const { data: profileData } = useGetProfileQuery();

  const userProfile = profileData?.data;

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
