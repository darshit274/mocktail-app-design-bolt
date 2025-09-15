import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Settings, Bell, Shield, CircleHelp as HelpCircle, LogOut, ChevronRight, Trophy, BookOpen, Clock, Target, Star, Download, Globe, Moon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/shared';
import { useGetProfileQuery } from '@/store/api/userApi';
import { useDispatch } from 'react-redux';
import { clearAuth } from '@/store/slices/authSlice';
import { userApi } from '@/store/api/userApi';
import { authApi } from '@/store/api/authApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_CONFIG } from '@/config/constants';

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const { isDarkMode, theme, toggleTheme } = useTheme();
  const { t, language } = useLanguage();
  const Colors = getTheme(theme);
  const dispatch = useDispatch();
  
  const { data: profileData, isLoading, error } = useGetProfileQuery();
  const userProfile = profileData?.data;
  const userStats = userProfile?.stats || {
    testsCompleted: 0,
    totalScore: 0,
    averageScore: 0,
    rank: 0,
    studyHours: 0,
    streak: 0,
  };
  
  // Log profile data for debugging
  React.useEffect(() => {
    if (profileData) {
      console.log('Profile Data:', profileData);
    }
    if (error) {
      console.error('Profile Error:', error);
    }
  }, [profileData, error]);

  const achievements = [
    { id: 1, title: 'First Test', icon: Trophy, color: '#F59E0B', unlocked: true },
    { id: 2, title: 'Score Master', icon: Target, color: '#10B981', unlocked: true },
    { id: 3, title: 'Study Streak', icon: Clock, color: '#3B82F6', unlocked: true },
    { id: 4, title: 'Top Performer', icon: Star, color: '#8B5CF6', unlocked: false },
  ];

  const menuItems = [
    {
      id: 1,
      title: t.profile.settings,
      icon: User,
      route: '/account-settings',
      description: 'Manage your personal information',
    },
    {
      id: 2,
      title: t.profile.notifications,
      icon: Bell,
      route: '/notifications',
      description: 'Configure notification preferences',
      hasSwitch: true,
      switchValue: notificationsEnabled,
      onSwitchChange: setNotificationsEnabled,
    },
    {
      id: 3,
      title: t.profile.language,
      icon: Globe,
      route: '/language',
      description: 'Change app language',
      hasCustomAction: true,
      customComponent: 'language',
    },
    {
      id: 4,
      title: 'App Theme',
      icon: Moon,
      route: '/theme-selector',
      description: 'Choose your preferred color scheme',
    },
    {
      id: 5,
      title: 'Downloaded PDFs',
      icon: Download,
      route: '/downloads',
      description: 'Manage your downloaded content',
    },
    {
      id: 6,
      title: t.profile.privacy,
      icon: Shield,
      route: '/privacy',
      description: 'Privacy settings and security',
    },
    {
      id: 7,
      title: t.profile.help,
      icon: HelpCircle,
      route: '/help',
      description: 'Get help and contact support',
    },
  ];

  const handleMenuPress = (route: string) => {
    router.push(route);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            console.log('Logout confirmed');
            try {
              // Clear auth token from storage
              console.log('Clearing token from AsyncStorage...');
              await AsyncStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
              
              // Clear user data from AsyncStorage if any
              await AsyncStorage.removeItem('user');
              
              // Clear Redux state
              console.log('Clearing Redux state...');
              dispatch(clearAuth());
              
              // Clear API cache
              dispatch(userApi.util.resetApiState());
              dispatch(authApi.util.resetApiState());
              
              // Navigate to login - using push to ensure navigation
              console.log('Navigating to login screen...');
              router.push('/(auth)/login');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const styles = getStyles(Colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient
          colors={[Colors.primaryLight, Colors.primary]}
          style={styles.profileHeader}
        >
          <View style={styles.profileInfo}>
            {userProfile?.avatarUrl ? (
              <Image 
                source={{ uri: userProfile.avatarUrl }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <User size={32} color={Colors.white} />
              </View>
            )}
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>
                {userProfile?.fullName || userProfile?.username || 'Student'}
              </Text>
              <Text style={styles.profileEmail}>{userProfile?.email || ''}</Text>
              <Text style={styles.profileJoined}>
                Member since {userProfile?.created_at ? 
                  new Date(userProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) 
                  : 'N/A'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => router.push('/account-settings')}
          >
            <Settings size={20} color={Colors.white} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <BookOpen size={24} color={Colors.primaryLight} />
              <Text style={styles.statNumber}>{userStats.testsCompleted}</Text>
              <Text style={styles.statLabel}>Tests Completed</Text>
            </View>
            
            <View style={styles.statCard}>
              <Trophy size={24} color={Colors.warning} />
              <Text style={styles.statNumber}>#{userStats.rank}</Text>
              <Text style={styles.statLabel}>Current Rank</Text>
            </View>
            
            <View style={styles.statCard}>
              <Target size={24} color={Colors.success} />
              <Text style={styles.statNumber}>{userStats.averageScore}%</Text>
              <Text style={styles.statLabel}>Average Score</Text>
            </View>
            
            <View style={styles.statCard}>
              <Clock size={24} color="#8B5CF6" />
              <Text style={styles.statNumber}>{userStats.studyHours}h</Text>
              <Text style={styles.statLabel}>Study Hours</Text>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementContainer} >
            {achievements.map((achievement) => (
              <View 
                key={achievement.id} 
                style={[
                  styles.achievementCard,
                  !achievement.unlocked && styles.achievementCardLocked
                ]}
              >
                <View style={[
                  styles.achievementIcon,
                  { backgroundColor: `${achievement.color}20` },
                  !achievement.unlocked && styles.achievementIconLocked
                ]}>
                  <achievement.icon 
                    size={24} 
                    color={achievement.unlocked ? achievement.color : '#9CA3AF'} 
                  />
                </View>
                <Text style={[
                  styles.achievementTitle,
                  !achievement.unlocked && styles.achievementTitleLocked
                ]}>
                  {achievement.title}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/test-history')}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <BookOpen size={20} color="#6B7280" />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Test History</Text>
                <Text style={styles.menuItemDescription}>View your past test performance</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => !item.hasSwitch && handleMenuPress(item.route)}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <item.icon size={20} color="#6B7280" />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemDescription}>{item.description}</Text>
                </View>
              </View>
              
              <View style={styles.menuItemRight}>
                {item.hasSwitch ? (
                  <Switch
                    value={item.switchValue}
                    onValueChange={item.onSwitchChange}
                    trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                    thumbColor={item.switchValue ? '#FFFFFF' : '#FFFFFF'}
                  />
                ) : item.customComponent === 'language' ? (
                  <LanguageSelector showIcon={false} showText={true} />
                ) : item.rightText ? (
                  <Text style={styles.menuItemRightText}>{item.rightText}</Text>
                ) : (
                  <ChevronRight size={20} color="#9CA3AF" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#DC2626" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
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
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: Colors.primary,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  profileImagePlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 2,
  },
  profileJoined: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.7,
  },
  editButton: {
    padding: 8,
  },
  statsContainer: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSubtle,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  achievementCard: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
    width: 100,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  achievementCardLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementIconLocked: {
    backgroundColor: Colors.light,
  },
  achievementContainer: {
   paddingBottom: 24,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  achievementTitleLocked: {
    color: Colors.gray400,
  },
  menuItem: {
    backgroundColor: Colors.cardBackground,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: Colors.light,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: 12,
    color: Colors.textSubtle,
  },
  menuItemRight: {
    alignItems: 'center',
  },
  menuItemRightText: {
    fontSize: 14,
    color: Colors.textSubtle,
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.badgeDangerBg,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.danger,
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: Colors.gray400,
  },
});