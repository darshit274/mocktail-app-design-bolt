import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';

interface OfflineQuestion {
  id: number;
  uuid: string;
  question_text: string;
  question_text_gujarati?: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  options_gujarati?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  explanation_gujarati?: string;
  marks: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
  subject_tag?: string;
  topic_tag?: string;
}

interface OfflineTest {
  id: string;
  testId: number;
  name: string;
  duration_minutes: number;
  questions: OfflineQuestion[];
  downloadedAt: string;
  lastAccessed: string;
  category: string;
  difficulty: string;
}

interface OfflineTestSession {
  id: string;
  testId: string;
  userId: string;
  startedAt: string;
  answers: {
    [questionId: number]: {
      selected_option?: 'A' | 'B' | 'C' | 'D';
      is_flagged: boolean;
      time_spent: number;
      is_visited: boolean;
    };
  };
  currentQuestionIndex: number;
  timeRemaining: number;
  isPaused: boolean;
  isCompleted: boolean;
  completedAt?: string;
}

interface OfflineTestResult {
  sessionId: string;
  testId: string;
  score: number;
  percentage: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  timeTaken: number;
  completedAt: string;
  synced: boolean;
}

export class OfflineTestService {
  private static readonly STORAGE_KEYS = {
    OFFLINE_TESTS: 'offline_tests',
    OFFLINE_SESSIONS: 'offline_sessions', 
    OFFLINE_RESULTS: 'offline_results',
    SYNC_QUEUE: 'sync_queue'
  };

  // =====================
  // DOWNLOAD MANAGEMENT
  // =====================

  /**
   * Download test for offline use
   */
  static async downloadTest(testId: number, testData: any): Promise<boolean> {
    try {
      const offlineTest: OfflineTest = {
        id: `offline_${testId}_${Date.now()}`,
        testId,
        name: testData.name,
        duration_minutes: testData.duration_minutes,
        questions: testData.questions,
        downloadedAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        category: testData.category || 'General',
        difficulty: testData.difficulty || 'medium'
      };

      const existingTests = await this.getDownloadedTests();
      const updatedTests = [...existingTests, offlineTest];
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.OFFLINE_TESTS, 
        JSON.stringify(updatedTests)
      );

      console.log(`✅ Test downloaded for offline use: ${testData.name}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to download test for offline use:', error);
      return false;
    }
  }

  /**
   * Get all downloaded tests
   */
  static async getDownloadedTests(): Promise<OfflineTest[]> {
    try {
      const testsData = await AsyncStorage.getItem(this.STORAGE_KEYS.OFFLINE_TESTS);
      return testsData ? JSON.parse(testsData) : [];
    } catch (error) {
      console.error('❌ Failed to get downloaded tests:', error);
      return [];
    }
  }

  /**
   * Get specific offline test
   */
  static async getOfflineTest(testId: string): Promise<OfflineTest | null> {
    try {
      const tests = await this.getDownloadedTests();
      const test = tests.find(t => t.id === testId);
      
      if (test) {
        // Update last accessed time
        test.lastAccessed = new Date().toISOString();
        await this.updateDownloadedTests(tests);
      }
      
      return test || null;
    } catch (error) {
      console.error('❌ Failed to get offline test:', error);
      return null;
    }
  }

  /**
   * Delete offline test
   */
  static async deleteOfflineTest(testId: string): Promise<boolean> {
    try {
      const tests = await this.getDownloadedTests();
      const updatedTests = tests.filter(t => t.id !== testId);
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.OFFLINE_TESTS,
        JSON.stringify(updatedTests)
      );

      // Also clean up related sessions and results
      await this.cleanupTestSessions(testId);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to delete offline test:', error);
      return false;
    }
  }

  /**
   * Update downloaded tests list
   */
  private static async updateDownloadedTests(tests: OfflineTest[]): Promise<void> {
    await AsyncStorage.setItem(
      this.STORAGE_KEYS.OFFLINE_TESTS,
      JSON.stringify(tests)
    );
  }

  // =====================
  // SESSION MANAGEMENT
  // =====================

  /**
   * Start offline test session
   */
  static async startOfflineSession(
    testId: string, 
    userId: string
  ): Promise<OfflineTestSession | null> {
    try {
      const test = await this.getOfflineTest(testId);
      if (!test) return null;

      const session: OfflineTestSession = {
        id: `session_${testId}_${Date.now()}`,
        testId,
        userId,
        startedAt: new Date().toISOString(),
        answers: {},
        currentQuestionIndex: 0,
        timeRemaining: test.duration_minutes * 60,
        isPaused: false,
        isCompleted: false
      };

      // Initialize answers for all questions
      test.questions.forEach(question => {
        session.answers[question.id] = {
          is_flagged: false,
          time_spent: 0,
          is_visited: false
        };
      });

      const sessions = await this.getOfflineSessions();
      sessions.push(session);
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.OFFLINE_SESSIONS,
        JSON.stringify(sessions)
      );

      return session;
    } catch (error) {
      console.error('❌ Failed to start offline session:', error);
      return null;
    }
  }

  /**
   * Update offline session
   */
  static async updateOfflineSession(session: OfflineTestSession): Promise<boolean> {
    try {
      const sessions = await this.getOfflineSessions();
      const sessionIndex = sessions.findIndex(s => s.id === session.id);
      
      if (sessionIndex >= 0) {
        sessions[sessionIndex] = { ...session };
        
        await AsyncStorage.setItem(
          this.STORAGE_KEYS.OFFLINE_SESSIONS,
          JSON.stringify(sessions)
        );
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Failed to update offline session:', error);
      return false;
    }
  }

  /**
   * Get offline session
   */
  static async getOfflineSession(sessionId: string): Promise<OfflineTestSession | null> {
    try {
      const sessions = await this.getOfflineSessions();
      return sessions.find(s => s.id === sessionId) || null;
    } catch (error) {
      console.error('❌ Failed to get offline session:', error);
      return null;
    }
  }

  /**
   * Get all offline sessions
   */
  private static async getOfflineSessions(): Promise<OfflineTestSession[]> {
    try {
      const sessionsData = await AsyncStorage.getItem(this.STORAGE_KEYS.OFFLINE_SESSIONS);
      return sessionsData ? JSON.parse(sessionsData) : [];
    } catch (error) {
      console.error('❌ Failed to get offline sessions:', error);
      return [];
    }
  }

  // =====================
  // ANSWER MANAGEMENT
  // =====================

  /**
   * Save answer in offline session
   */
  static async saveOfflineAnswer(
    sessionId: string,
    questionId: number,
    selectedOption: 'A' | 'B' | 'C' | 'D',
    timeSpent: number,
    isFlagged: boolean = false
  ): Promise<boolean> {
    try {
      const session = await this.getOfflineSession(sessionId);
      if (!session) return false;

      session.answers[questionId] = {
        selected_option: selectedOption,
        is_flagged: isFlagged,
        time_spent: timeSpent,
        is_visited: true
      };

      return await this.updateOfflineSession(session);
    } catch (error) {
      console.error('❌ Failed to save offline answer:', error);
      return false;
    }
  }

  /**
   * Toggle question flag in offline session
   */
  static async toggleOfflineFlag(
    sessionId: string, 
    questionId: number
  ): Promise<boolean> {
    try {
      const session = await this.getOfflineSession(sessionId);
      if (!session) return false;

      if (session.answers[questionId]) {
        session.answers[questionId].is_flagged = !session.answers[questionId].is_flagged;
      } else {
        session.answers[questionId] = {
          is_flagged: true,
          time_spent: 0,
          is_visited: true
        };
      }

      return await this.updateOfflineSession(session);
    } catch (error) {
      console.error('❌ Failed to toggle offline flag:', error);
      return false;
    }
  }

  // =====================
  // TEST COMPLETION
  // =====================

  /**
   * Complete offline test and calculate results
   */
  static async completeOfflineTest(sessionId: string): Promise<OfflineTestResult | null> {
    try {
      const session = await this.getOfflineSession(sessionId);
      const test = session ? await this.getOfflineTest(session.testId) : null;
      
      if (!session || !test) return null;

      // Calculate results
      let correctAnswers = 0;
      let wrongAnswers = 0;
      let unanswered = 0;
      let totalMarks = 0;
      let obtainedMarks = 0;

      test.questions.forEach(question => {
        const answer = session.answers[question.id];
        totalMarks += question.marks;

        if (answer?.selected_option) {
          if (answer.selected_option === question.correct_answer) {
            correctAnswers++;
            obtainedMarks += question.marks;
          } else {
            wrongAnswers++;
          }
        } else {
          unanswered++;
        }
      });

      const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
      const timeTaken = (test.duration_minutes * 60) - session.timeRemaining;

      const result: OfflineTestResult = {
        sessionId,
        testId: session.testId,
        score: obtainedMarks,
        percentage: Math.round(percentage * 100) / 100,
        correctAnswers,
        wrongAnswers,
        unanswered,
        timeTaken,
        completedAt: new Date().toISOString(),
        synced: false
      };

      // Mark session as completed
      session.isCompleted = true;
      session.completedAt = result.completedAt;
      await this.updateOfflineSession(session);

      // Save result
      const results = await this.getOfflineResults();
      results.push(result);
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.OFFLINE_RESULTS,
        JSON.stringify(results)
      );

      // Add to sync queue
      await this.addToSyncQueue({
        type: 'test_result',
        data: result,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      console.error('❌ Failed to complete offline test:', error);
      return null;
    }
  }

  /**
   * Get offline test results
   */
  static async getOfflineResults(): Promise<OfflineTestResult[]> {
    try {
      const resultsData = await AsyncStorage.getItem(this.STORAGE_KEYS.OFFLINE_RESULTS);
      return resultsData ? JSON.parse(resultsData) : [];
    } catch (error) {
      console.error('❌ Failed to get offline results:', error);
      return [];
    }
  }

  // =====================
  // SYNC MANAGEMENT
  // =====================

  /**
   * Check if device is online
   */
  static async isOnline(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected === true && netInfo.isInternetReachable === true;
  }

  /**
   * Add item to sync queue
   */
  private static async addToSyncQueue(item: any): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      queue.push(item);
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SYNC_QUEUE,
        JSON.stringify(queue)
      );
    } catch (error) {
      console.error('❌ Failed to add to sync queue:', error);
    }
  }

  /**
   * Get sync queue
   */
  private static async getSyncQueue(): Promise<any[]> {
    try {
      const queueData = await AsyncStorage.getItem(this.STORAGE_KEYS.SYNC_QUEUE);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('❌ Failed to get sync queue:', error);
      return [];
    }
  }

  /**
   * Sync offline data with server when online
   */
  static async syncWithServer(): Promise<{ success: boolean; synced: number; failed: number }> {
    try {
      const isConnected = await this.isOnline();
      if (!isConnected) {
        return { success: false, synced: 0, failed: 0 };
      }

      const queue = await this.getSyncQueue();
      let synced = 0;
      let failed = 0;
      const remainingQueue: any[] = [];

      for (const item of queue) {
        try {
          // Here you would make actual API calls to sync data
          // For now, we'll just simulate the sync
          
          if (item.type === 'test_result') {
            // Sync test result with server
            // const response = await syncTestResult(item.data);
            console.log('🔄 Syncing test result:', item.data.sessionId);
            
            // Mark as synced
            await this.markResultAsSynced(item.data.sessionId);
            synced++;
          }
          
          // Add other sync types as needed
          
        } catch (syncError) {
          console.error('❌ Failed to sync item:', syncError);
          remainingQueue.push(item);
          failed++;
        }
      }

      // Update sync queue with remaining items
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SYNC_QUEUE,
        JSON.stringify(remainingQueue)
      );

      console.log(`✅ Sync completed: ${synced} synced, ${failed} failed`);
      return { success: true, synced, failed };
    } catch (error) {
      console.error('❌ Sync failed:', error);
      return { success: false, synced: 0, failed: 0 };
    }
  }

  /**
   * Mark result as synced
   */
  private static async markResultAsSynced(sessionId: string): Promise<void> {
    try {
      const results = await this.getOfflineResults();
      const resultIndex = results.findIndex(r => r.sessionId === sessionId);
      
      if (resultIndex >= 0) {
        results[resultIndex].synced = true;
        
        await AsyncStorage.setItem(
          this.STORAGE_KEYS.OFFLINE_RESULTS,
          JSON.stringify(results)
        );
      }
    } catch (error) {
      console.error('❌ Failed to mark result as synced:', error);
    }
  }

  // =====================
  // CLEANUP UTILITIES
  // =====================

  /**
   * Clean up old sessions for a test
   */
  private static async cleanupTestSessions(testId: string): Promise<void> {
    try {
      const sessions = await this.getOfflineSessions();
      const updatedSessions = sessions.filter(s => s.testId !== testId);
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.OFFLINE_SESSIONS,
        JSON.stringify(updatedSessions)
      );
    } catch (error) {
      console.error('❌ Failed to cleanup test sessions:', error);
    }
  }

  /**
   * Clean up old offline data (older than 30 days)
   */
  static async cleanupOldData(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Clean up old tests
      const tests = await this.getDownloadedTests();
      const recentTests = tests.filter(t => 
        new Date(t.lastAccessed) > thirtyDaysAgo
      );
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.OFFLINE_TESTS,
        JSON.stringify(recentTests)
      );

      // Clean up old sessions
      const sessions = await this.getOfflineSessions();
      const recentSessions = sessions.filter(s =>
        new Date(s.startedAt) > thirtyDaysAgo
      );
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.OFFLINE_SESSIONS,
        JSON.stringify(recentSessions)
      );

      console.log('✅ Cleaned up old offline data');
    } catch (error) {
      console.error('❌ Failed to cleanup old data:', error);
    }
  }

  /**
   * Get storage usage statistics
   */
  static async getStorageStats(): Promise<{
    totalTests: number;
    activeSessions: number;
    pendingSync: number;
    storageSize: number;
  }> {
    try {
      const tests = await this.getDownloadedTests();
      const sessions = await this.getOfflineSessions();
      const results = await this.getOfflineResults();
      const syncQueue = await this.getSyncQueue();

      const activeSessions = sessions.filter(s => !s.isCompleted).length;
      const pendingSync = results.filter(r => !r.synced).length;

      // Estimate storage size (rough calculation)
      const dataStr = JSON.stringify({ tests, sessions, results, syncQueue });
      const storageSize = new Blob([dataStr]).size / 1024; // KB

      return {
        totalTests: tests.length,
        activeSessions,
        pendingSync,
        storageSize: Math.round(storageSize)
      };
    } catch (error) {
      console.error('❌ Failed to get storage stats:', error);
      return {
        totalTests: 0,
        activeSessions: 0,
        pendingSync: 0,
        storageSize: 0
      };
    }
  }
}

export default OfflineTestService;