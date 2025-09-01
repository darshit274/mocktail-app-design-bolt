import { notificationService, NotificationData } from './NotificationService';
import { TestPerformanceNotificationService, PerformanceAchievement } from './TestPerformanceNotifications';
import { router } from 'expo-router';

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

export class TestNotificationIntegration {
  
  /**
   * Process test completion and send appropriate notifications
   */
  static async processTestCompletionNotifications(
    testResult: TestResultData,
    userPreferences?: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      console.log('🔄 Processing test completion notifications...', testResult.testName);
      
      // Get user's notification preferences
      const preferences = await this.getTestNotificationPreferences();
      const finalPreferences = { ...preferences, ...userPreferences };
      
      // Check if notifications are disabled
      if (!finalPreferences.achievements) {
        console.log('📵 Achievement notifications disabled by user');
        return;
      }
      
      // Get achievements from the performance notification service
      const achievements = await TestPerformanceNotificationService.checkAndNotifyAchievements(testResult);
      
      if (achievements.length === 0) {
        console.log('ℹ️ No achievements to notify for this test');
        return;
      }
      
      // Filter achievements based on user preferences
      const filteredAchievements = achievements.filter(achievement => 
        this.shouldSendAchievement(achievement, finalPreferences)
      );
      
      if (filteredAchievements.length === 0) {
        console.log('📵 All achievements filtered out by user preferences');
        return;
      }
      
      // Send notifications for each achievement
      for (const achievement of filteredAchievements) {
        await this.sendAchievementNotification(achievement, testResult);
      }
      
      console.log(`✅ Sent ${filteredAchievements.length} achievement notifications`);
      
    } catch (error) {
      console.error('❌ Failed to process test completion notifications:', error);
    }
  }
  
  /**
   * Send individual achievement notification
   */
  private static async sendAchievementNotification(
    achievement: PerformanceAchievement,
    testResult: TestResultData
  ): Promise<void> {
    try {
      const notificationData: NotificationData = {
        id: `achievement_${achievement.id}_${Date.now()}`,
        title: achievement.title,
        body: achievement.message,
        type: 'test_result',
        priority: this.getNotificationPriority(achievement.type),
        sound: true,
        vibrate: true,
        data: {
          type: 'test_achievement',
          achievementType: achievement.type,
          testId: testResult.testId,
          seriesId: testResult.seriesId,
          sessionId: testResult.sessionId,
          navigationData: {
            route: achievement.actionRoute || '/test/enhanced-results',
            params: achievement.actionParams || {
              testId: testResult.testId,
              sessionId: testResult.sessionId
            }
          }
        }
      };
      
      // Send local notification
      const success = await notificationService.sendLocalNotification(notificationData);
      
      if (success) {
        console.log(`📤 Achievement notification sent: ${achievement.title}`);
      } else {
        console.warn(`⚠️ Failed to send achievement notification: ${achievement.title}`);
      }
      
    } catch (error) {
      console.error('❌ Failed to send achievement notification:', error);
    }
  }
  
  /**
   * Send study reminder notification
   */
  static async sendStudyReminder(
    lastTestDate: Date,
    averageScore: number,
    weakCategories: string[],
    userUuid: string
  ): Promise<void> {
    try {
      const preferences = await this.getTestNotificationPreferences();
      
      if (!preferences.studyReminders) {
        console.log('📵 Study reminders disabled by user');
        return;
      }
      
      const reminder = TestPerformanceNotificationService.createStudyReminder(
        lastTestDate,
        averageScore,
        weakCategories
      );
      
      if (!reminder) {
        console.log('ℹ️ No study reminder needed at this time');
        return;
      }
      
      const notificationData: NotificationData = {
        id: `study_reminder_${userUuid}_${Date.now()}`,
        title: reminder.title,
        body: reminder.message,
        type: 'quiz_reminder',
        priority: 'default',
        sound: true,
        vibrate: false,
        data: {
          type: 'study_reminder',
          lastTestDays: Math.floor((Date.now() - lastTestDate.getTime()) / (1000 * 60 * 60 * 24)),
          averageScore,
          weakCategories,
          navigationData: {
            route: reminder.actionRoute || '/test/enhanced-quiz',
            params: reminder.actionParams || {}
          }
        }
      };
      
      const success = await notificationService.sendLocalNotification(notificationData);
      
      if (success) {
        console.log('📚 Study reminder notification sent');
      } else {
        console.warn('⚠️ Failed to send study reminder notification');
      }
      
    } catch (error) {
      console.error('❌ Failed to send study reminder:', error);
    }
  }
  
  /**
   * Schedule daily study reminder
   */
  static async scheduleDailyStudyReminder(
    timeOfDay: string = '19:00',
    userUuid: string
  ): Promise<string | null> {
    try {
      const preferences = await this.getTestNotificationPreferences();
      
      if (!preferences.studyReminders) {
        console.log('📵 Study reminders disabled by user');
        return null;
      }
      
      // Create notification for tomorrow at the specified time
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const [hours, minutes] = timeOfDay.split(':').map(Number);
      tomorrow.setHours(hours, minutes, 0, 0);
      
      const notificationData: NotificationData = {
        id: `daily_study_${userUuid}_${tomorrow.toISOString()}`,
        title: '📚 Time to Study!',
        body: 'Ready to boost your knowledge? Take a practice test and improve your skills!',
        type: 'quiz_reminder',
        priority: 'default',
        sound: true,
        vibrate: false,
        data: {
          type: 'daily_study_reminder',
          scheduledTime: timeOfDay,
          navigationData: {
            route: '/test/enhanced-quiz',
            params: {}
          }
        }
      };
      
      const notificationId = await notificationService.scheduleNotification(
        notificationData,
        tomorrow
      );
      
      if (notificationId) {
        console.log(`⏰ Daily study reminder scheduled for ${timeOfDay}`);
      }
      
      return notificationId;
      
    } catch (error) {
      console.error('❌ Failed to schedule daily study reminder:', error);
      return null;
    }
  }
  
  /**
   * Send motivational message based on recent performance
   */
  static async sendMotivationalMessage(
    percentage: number,
    rank?: number,
    testName?: string
  ): Promise<void> {
    try {
      const preferences = await this.getTestNotificationPreferences();
      
      if (!preferences.achievements) {
        console.log('📵 Achievement notifications disabled by user');
        return;
      }
      
      const message = TestPerformanceNotificationService.getMotivationalMessage(percentage, rank);
      
      const notificationData: NotificationData = {
        id: `motivational_${Date.now()}`,
        title: '💪 Keep Going!',
        body: message,
        type: 'general',
        priority: 'default',
        sound: false,
        vibrate: false,
        data: {
          type: 'motivational_message',
          percentage,
          rank,
          testName,
          navigationData: {
            route: '/test/performance-dashboard',
            params: {}
          }
        }
      };
      
      const success = await notificationService.sendLocalNotification(notificationData);
      
      if (success) {
        console.log('💬 Motivational message sent');
      }
      
    } catch (error) {
      console.error('❌ Failed to send motivational message:', error);
    }
  }
  
  /**
   * Send improvement suggestions notification
   */
  static async sendImprovementSuggestions(
    recentTests: Array<{
      percentage: number;
      category: string;
      timeSpent: number;
      difficulty: string;
    }>
  ): Promise<void> {
    try {
      const preferences = await this.getTestNotificationPreferences();
      
      if (!preferences.achievements) {
        console.log('📵 Achievement notifications disabled by user');
        return;
      }
      
      const suggestions = TestPerformanceNotificationService.getImprovementSuggestions(recentTests);
      
      if (suggestions.length === 0) {
        console.log('ℹ️ No improvement suggestions available');
        return;
      }
      
      const notificationData: NotificationData = {
        id: `improvement_suggestions_${Date.now()}`,
        title: '💡 Performance Insights',
        body: `Here are some tips to improve: ${suggestions[0]}`,
        type: 'general',
        priority: 'default',
        sound: false,
        vibrate: false,
        data: {
          type: 'improvement_suggestions',
          suggestions,
          navigationData: {
            route: '/test/performance-dashboard',
            params: {}
          }
        }
      };
      
      const success = await notificationService.sendLocalNotification(notificationData);
      
      if (success) {
        console.log('💡 Improvement suggestions sent');
      }
      
    } catch (error) {
      console.error('❌ Failed to send improvement suggestions:', error);
    }
  }
  
  /**
   * Handle notification tap navigation
   */
  static handleNotificationNavigation(notificationData: any): void {
    try {
      const { type, navigationData } = notificationData;
      
      if (!navigationData || !navigationData.route) {
        console.warn('⚠️ No navigation data in notification');
        return;
      }
      
      console.log('🧭 Handling notification navigation:', type, navigationData);
      
      // Navigate to the specified route with params
      if (navigationData.params && Object.keys(navigationData.params).length > 0) {
        router.push({
          pathname: navigationData.route,
          params: navigationData.params
        });
      } else {
        router.push(navigationData.route);
      }
      
    } catch (error) {
      console.error('❌ Failed to handle notification navigation:', error);
      // Fallback to home screen
      router.push('/');
    }
  }
  
  /**
   * Get notification priority based on achievement type
   */
  private static getNotificationPriority(achievementType: string): 'default' | 'high' | 'max' {
    switch (achievementType) {
      case 'perfect_score':
      case 'rank_improvement':
        return 'high';
      case 'top_performer':
      case 'milestone':
        return 'high';
      case 'high_score':
      case 'streak':
        return 'default';
      default:
        return 'default';
    }
  }
  
  /**
   * Check if achievement should be sent based on user preferences
   */
  private static shouldSendAchievement(
    achievement: PerformanceAchievement,
    preferences: NotificationPreferences
  ): boolean {
    switch (achievement.type) {
      case 'perfect_score':
        return preferences.perfectScores;
      case 'rank_improvement':
        return preferences.rankImprovements;
      case 'milestone':
        return preferences.personalBests;
      case 'streak':
        return preferences.streaks;
      case 'top_performer':
        return preferences.topPerformer;
      case 'high_score':
      default:
        return preferences.achievements;
    }
  }
  
  /**
   * Get test notification preferences
   */
  private static async getTestNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const generalPreferences = await notificationService.getNotificationPreferences();
      
      // Derive test-specific preferences from general preferences
      return {
        achievements: generalPreferences.testResults,
        personalBests: generalPreferences.testResults,
        rankImprovements: generalPreferences.testResults,
        perfectScores: generalPreferences.testResults,
        streaks: generalPreferences.testResults,
        topPerformer: generalPreferences.testResults,
        studyReminders: generalPreferences.quizReminders,
      };
      
    } catch (error) {
      console.error('❌ Failed to get test notification preferences:', error);
      return this.getDefaultTestNotificationPreferences();
    }
  }
  
  /**
   * Get default test notification preferences
   */
  private static getDefaultTestNotificationPreferences(): NotificationPreferences {
    return {
      achievements: true,
      personalBests: true,
      rankImprovements: true,
      perfectScores: true,
      streaks: true,
      topPerformer: true,
      studyReminders: true,
    };
  }
  
  /**
   * Update test notification preferences
   */
  static async updateTestNotificationPreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      // Update general notification preferences to match test preferences
      const generalPreferences = {
        testResults: preferences.achievements !== undefined ? preferences.achievements : true,
        quizReminders: preferences.studyReminders !== undefined ? preferences.studyReminders : true,
      };
      
      const success = await notificationService.updateNotificationPreferences(generalPreferences);
      
      if (success) {
        console.log('✅ Test notification preferences updated');
      }
      
      return success;
      
    } catch (error) {
      console.error('❌ Failed to update test notification preferences:', error);
      return false;
    }
  }
  
  /**
   * Initialize test notification integration
   */
  static async initialize(): Promise<boolean> {
    try {
      console.log('🚀 Initializing test notification integration...');
      
      // Ensure base notification service is initialized
      const isNotificationServiceReady = await notificationService.initialize();
      
      if (!isNotificationServiceReady) {
        console.warn('⚠️ Base notification service failed to initialize');
        return false;
      }
      
      console.log('✅ Test notification integration initialized successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize test notification integration:', error);
      return false;
    }
  }
}

export default TestNotificationIntegration;