import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import TestNotificationIntegration from '@/services/TestNotificationIntegration';
import { TestPerformanceNotificationService } from '@/services/TestPerformanceNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TestResultData {
  score: number;
  percentage: number;
  rank: number;
  previousBestRank?: number;
  testName: string;
  category?: string;
  isPersonalBest?: boolean;
  consecutiveTests?: number;
  testId?: string;
  seriesId?: string;
  sessionId?: string;
}

interface NotificationPreferences {
  achievements: boolean;
  personalBests: boolean;
  rankImprovements: boolean;
  perfectScores: boolean;
  streaks: boolean;
  topPerformer: boolean;
  studyReminders: boolean;
}

interface UseTestNotificationsReturn {
  // Functions
  processTestCompletion: (testResult: TestResultData) => Promise<void>;
  sendStudyReminder: (lastTestDate: Date, averageScore: number, weakCategories: string[]) => Promise<void>;
  scheduleDailyReminder: (timeOfDay?: string) => Promise<string | null>;
  sendMotivationalMessage: (percentage: number, rank?: number, testName?: string) => Promise<void>;
  sendImprovementSuggestions: (recentTests: Array<{
    percentage: number;
    category: string;
    timeSpent: number;
    difficulty: string;
  }>) => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<boolean>;
  
  // State
  preferences: NotificationPreferences | null;
  isInitialized: boolean;
  lastNotificationCheck: Date | null;
  
  // Actions
  checkForStudyReminders: () => Promise<void>;
  initializeNotifications: () => Promise<boolean>;
}

const STORAGE_KEYS = {
  LAST_NOTIFICATION_CHECK: 'last_notification_check',
  USER_UUID: 'user_uuid',
  LAST_TEST_DATE: 'last_test_date',
  AVERAGE_SCORE: 'average_score',
  WEAK_CATEGORIES: 'weak_categories',
};

export function useTestNotifications(): UseTestNotificationsReturn {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastNotificationCheck, setLastNotificationCheck] = useState<Date | null>(null);

  /**
   * Initialize the test notification system
   */
  const initializeNotifications = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🚀 Initializing test notifications hook...');
      
      const success = await TestNotificationIntegration.initialize();
      
      if (success) {
        // Load stored data
        await loadStoredData();
        setIsInitialized(true);
        console.log('✅ Test notifications hook initialized');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Failed to initialize test notifications hook:', error);
      return false;
    }
  }, []);

  /**
   * Load stored data from AsyncStorage
   */
  const loadStoredData = useCallback(async () => {
    try {
      const [lastCheckStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.LAST_NOTIFICATION_CHECK),
      ]);

      if (lastCheckStr) {
        setLastNotificationCheck(new Date(lastCheckStr));
      }
    } catch (error) {
      console.error('❌ Failed to load stored notification data:', error);
    }
  }, []);

  /**
   * Process test completion and trigger notifications
   */
  const processTestCompletion = useCallback(async (testResult: TestResultData): Promise<void> => {
    try {
      console.log('🔄 Processing test completion notifications...', testResult.testName);
      
      // Process notifications
      await TestNotificationIntegration.processTestCompletionNotifications(
        testResult,
        preferences || undefined
      );
      
      // Update stored data for future reminders
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.LAST_TEST_DATE, new Date().toISOString()),
        testResult.testId && AsyncStorage.setItem('last_test_id', testResult.testId),
      ]);
      
      console.log('✅ Test completion notifications processed');
    } catch (error) {
      console.error('❌ Failed to process test completion:', error);
    }
  }, [preferences]);

  /**
   * Send study reminder
   */
  const sendStudyReminder = useCallback(async (
    lastTestDate: Date,
    averageScore: number,
    weakCategories: string[]
  ): Promise<void> => {
    try {
      const userUuid = await AsyncStorage.getItem(STORAGE_KEYS.USER_UUID) || 'unknown';
      
      await TestNotificationIntegration.sendStudyReminder(
        lastTestDate,
        averageScore,
        weakCategories,
        userUuid
      );
      
      // Update last notification check
      const now = new Date();
      setLastNotificationCheck(now);
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_NOTIFICATION_CHECK, now.toISOString());
      
    } catch (error) {
      console.error('❌ Failed to send study reminder:', error);
    }
  }, []);

  /**
   * Schedule daily study reminder
   */
  const scheduleDailyReminder = useCallback(async (timeOfDay: string = '19:00'): Promise<string | null> => {
    try {
      const userUuid = await AsyncStorage.getItem(STORAGE_KEYS.USER_UUID) || 'unknown';
      
      return await TestNotificationIntegration.scheduleDailyStudyReminder(timeOfDay, userUuid);
    } catch (error) {
      console.error('❌ Failed to schedule daily reminder:', error);
      return null;
    }
  }, []);

  /**
   * Send motivational message
   */
  const sendMotivationalMessage = useCallback(async (
    percentage: number,
    rank?: number,
    testName?: string
  ): Promise<void> => {
    try {
      await TestNotificationIntegration.sendMotivationalMessage(percentage, rank, testName);
    } catch (error) {
      console.error('❌ Failed to send motivational message:', error);
    }
  }, []);

  /**
   * Send improvement suggestions
   */
  const sendImprovementSuggestions = useCallback(async (
    recentTests: Array<{
      percentage: number;
      category: string;
      timeSpent: number;
      difficulty: string;
    }>
  ): Promise<void> => {
    try {
      await TestNotificationIntegration.sendImprovementSuggestions(recentTests);
    } catch (error) {
      console.error('❌ Failed to send improvement suggestions:', error);
    }
  }, []);

  /**
   * Update notification preferences
   */
  const updatePreferences = useCallback(async (
    newPreferences: Partial<NotificationPreferences>
  ): Promise<boolean> => {
    try {
      const success = await TestNotificationIntegration.updateTestNotificationPreferences(newPreferences);
      
      if (success) {
        setPreferences(prev => ({
          ...prev,
          ...newPreferences,
        } as NotificationPreferences));
      }
      
      return success;
    } catch (error) {
      console.error('❌ Failed to update notification preferences:', error);
      return false;
    }
  }, []);

  /**
   * Check for study reminders based on last activity
   */
  const checkForStudyReminders = useCallback(async (): Promise<void> => {
    try {
      const [lastTestDateStr, avgScoreStr, weakCategoriesStr, userUuid] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.LAST_TEST_DATE),
        AsyncStorage.getItem(STORAGE_KEYS.AVERAGE_SCORE),
        AsyncStorage.getItem(STORAGE_KEYS.WEAK_CATEGORIES),
        AsyncStorage.getItem(STORAGE_KEYS.USER_UUID),
      ]);

      if (!lastTestDateStr || !userUuid) {
        console.log('ℹ️ No previous test data found for study reminders');
        return;
      }

      const lastTestDate = new Date(lastTestDateStr);
      const averageScore = parseFloat(avgScoreStr || '0');
      const weakCategories = weakCategoriesStr ? JSON.parse(weakCategoriesStr) : [];

      // Check if a reminder is needed
      const daysSinceLastTest = Math.floor(
        (Date.now() - lastTestDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastTest >= 3) {
        await TestNotificationIntegration.sendStudyReminder(
          lastTestDate,
          averageScore,
          weakCategories,
          userUuid
        );
      }
    } catch (error) {
      console.error('❌ Failed to check for study reminders:', error);
    }
  }, []);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    initializeNotifications();
  }, [initializeNotifications]);

  /**
   * Check for study reminders when app comes into focus
   */
  useFocusEffect(
    useCallback(() => {
      if (isInitialized) {
        checkForStudyReminders();
      }
    }, [isInitialized, checkForStudyReminders])
  );

  return {
    // Functions
    processTestCompletion,
    sendStudyReminder,
    scheduleDailyReminder,
    sendMotivationalMessage,
    sendImprovementSuggestions,
    updatePreferences,
    
    // State
    preferences,
    isInitialized,
    lastNotificationCheck,
    
    // Actions
    checkForStudyReminders,
    initializeNotifications,
  };
}

export default useTestNotifications;