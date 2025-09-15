import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTheme } from '@/theme';
import { Bell, Clock, CheckCircle, AlertCircle, BookOpen } from 'lucide-react-native';
import { 
  useGetUserNotificationsQuery, 
  useMarkNotificationAsReadMutation,
  NotificationItem 
} from '@/store/api/notificationsApi';
import Toast from 'react-native-toast-message';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const Colors = getTheme(theme);
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: notificationsData,
    error,
    isLoading,
    refetch,
  } = useGetUserNotificationsQuery({
    page,
    limit: 20,
  });

  const [markAsRead] = useMarkNotificationAsReadMutation();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsRead(notificationId).unwrap();
      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('notifications.markedAsRead'),
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('notifications.markReadError'),
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconProps = {
      size: 24,
      color: Colors.primary,
    };

    switch (type) {
      case 'quiz_reminder':
        return <Clock {...iconProps} />;
      case 'test_result':
        return <CheckCircle {...iconProps} />;
      case 'new_content':
        return <BookOpen {...iconProps} />;
      case 'subscription':
        return <AlertCircle {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return t('common.justNow');
    } else if (diffInHours < 24) {
      return t('common.hoursAgo', { count: diffInHours });
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => {
    const isRead = !!item.read_at;

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          {
            backgroundColor: isRead 
              ? Colors.cardBackground 
              : isDarkMode 
                ? Colors.primaryLight + '20' 
                : Colors.primaryLight + '10',
            borderColor: Colors.border,
          },
        ]}
        onPress={() => {
          if (!isRead) {
            handleMarkAsRead(item.id);
          }
          // Handle navigation based on notification type and data
          if (item.data?.navigation) {
            // Navigate to specific screen
            console.log('Navigate to:', item.data.navigation, item.data.navigationData);
          }
        }}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View style={styles.iconContainer}>
              {getNotificationIcon(item.type)}
            </View>
            <View style={styles.headerText}>
              <Text
                style={[
                  styles.notificationTitle,
                  {
                    color: Colors.textPrimary,
                    fontWeight: isRead ? 'normal' : 'bold',
                  },
                ]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.notificationTime,
                  { color: Colors.textSubtle },
                ]}
              >
                {formatDate(item.created_at)}
              </Text>
            </View>
            {!isRead && (
              <View
                style={[
                  styles.unreadIndicator,
                  { backgroundColor: Colors.primary },
                ]}
              />
            )}
          </View>
          <Text
            style={[
              styles.notificationBody,
              {
                color: Colors.textSubtle,
                fontWeight: isRead ? 'normal' : '500',
              },
            ]}
            numberOfLines={3}
          >
            {item.body}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Bell size={64} color={Colors.textSubtle} />
      <Text style={[styles.emptyStateTitle, { color: Colors.textPrimary }]}>
        {t('notifications.noNotifications')}
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: Colors.textSubtle }]}>
        {t('notifications.notificationsWillAppearHere')}
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingState}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={[styles.loadingText, { color: Colors.textSubtle }]}>
        {t('common.loading')}
      </Text>
    </View>
  );

  if (isLoading && !notificationsData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
        <View style={styles.errorState}>
          <AlertCircle size={64} color={Colors.error} />
          <Text style={[styles.errorTitle, { color: Colors.textPrimary }]}>
            {t('common.errorOccurred')}
          </Text>
          <Text style={[styles.errorSubtitle, { color: Colors.textSubtle }]}>
            {t('notifications.failedToLoadNotifications')}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={[styles.retryButtonText, { color: Colors.background }]}>
              {t('common.retry')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const notifications = notificationsData?.data || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>
          {t('notifications.title')}
        </Text>
        {notifications.length > 0 && (
          <Text style={[styles.headerSubtitle, { color: Colors.textSubtle }]}>
            {t('notifications.totalNotifications', { count: notificationsData?.pagination.total || 0 })}
          </Text>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotificationItem}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  notificationItem: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  headerText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    marginBottom: 4,
    lineHeight: 22,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 6,
  },
  notificationBody: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 36,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});