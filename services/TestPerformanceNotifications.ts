import { Alert } from 'react-native';
import { router } from 'expo-router';

export interface PerformanceAchievement {
  id: string;
  type: 'high_score' | 'rank_improvement' | 'streak' | 'milestone' | 'perfect_score' | 'top_performer';
  title: string;
  message: string;
  score?: number;
  rank?: number;
  previousRank?: number;
  streak?: number;
  testName?: string;
  category?: string;
  icon: string;
  color: string;
  actionLabel?: string;
  actionRoute?: string;
  actionParams?: any;
}

export class TestPerformanceNotificationService {
  
  /**
   * Analyze test results and generate appropriate achievement notifications
   */
  static async checkAndNotifyAchievements(
    testResult: {
      score: number;
      percentage: number;
      rank: number;
      previousBestRank?: number;
      testName: string;
      category?: string;
      isPersonalBest?: boolean;
      consecutiveTests?: number;
    }
  ): Promise<PerformanceAchievement[]> {
    const achievements: PerformanceAchievement[] = [];
    
    // Perfect Score Achievement
    if (testResult.percentage === 100) {
      achievements.push({
        id: 'perfect_score',
        type: 'perfect_score',
        title: '🎯 Perfect Score!',
        message: `Incredible! You scored 100% on ${testResult.testName}. Absolutely flawless performance!`,
        score: testResult.score,
        testName: testResult.testName,
        icon: '🎯',
        color: '#FFD700',
        actionLabel: 'View Results',
        actionRoute: '/test/enhanced-results'
      });
    }
    
    // High Score Achievement (90%+)
    else if (testResult.percentage >= 90) {
      achievements.push({
        id: 'high_score',
        type: 'high_score',
        title: '🏆 Excellent Performance!',
        message: `Outstanding! You scored ${testResult.percentage.toFixed(1)}% on ${testResult.testName}. You're in the top tier!`,
        score: testResult.score,
        testName: testResult.testName,
        icon: '🏆',
        color: '#4CAF50',
        actionLabel: 'View Leaderboard',
        actionRoute: '/test/enhanced-leaderboard'
      });
    }
    
    // Rank Improvement Achievement
    if (testResult.previousBestRank && testResult.rank < testResult.previousBestRank) {
      const improvement = testResult.previousBestRank - testResult.rank;
      achievements.push({
        id: 'rank_improvement',
        type: 'rank_improvement',
        title: '📈 Rank Improved!',
        message: `Amazing progress! You moved up ${improvement} positions to rank #${testResult.rank} on ${testResult.testName}!`,
        rank: testResult.rank,
        previousRank: testResult.previousBestRank,
        testName: testResult.testName,
        icon: '📈',
        color: '#2196F3',
        actionLabel: 'View Leaderboard',
        actionRoute: '/test/enhanced-leaderboard'
      });
    }
    
    // Top 10 Achievement
    if (testResult.rank <= 10) {
      achievements.push({
        id: 'top_performer',
        type: 'top_performer',
        title: '⭐ Top 10 Performer!',
        message: `Exceptional! You're ranked #${testResult.rank} on ${testResult.testName}. You're among the best performers!`,
        rank: testResult.rank,
        testName: testResult.testName,
        icon: '⭐',
        color: '#FF9800',
        actionLabel: 'View Leaderboard',
        actionRoute: '/test/enhanced-leaderboard'
      });
    }
    
    // Personal Best Achievement
    if (testResult.isPersonalBest && testResult.percentage >= 70) {
      achievements.push({
        id: 'milestone',
        type: 'milestone',
        title: '🎉 Personal Best!',
        message: `New personal record! ${testResult.percentage.toFixed(1)}% on ${testResult.testName} is your best score yet!`,
        score: testResult.score,
        testName: testResult.testName,
        icon: '🎉',
        color: '#9C27B0',
        actionLabel: 'View Progress',
        actionRoute: '/test/performance-dashboard'
      });
    }
    
    // Streak Achievement (consecutive good performances)
    if (testResult.consecutiveTests && testResult.consecutiveTests >= 3 && testResult.percentage >= 75) {
      achievements.push({
        id: 'streak',
        type: 'streak',
        title: '🔥 Hot Streak!',
        message: `You're on fire! ${testResult.consecutiveTests} consecutive tests with 75%+ scores. Keep it up!`,
        streak: testResult.consecutiveTests,
        testName: testResult.testName,
        icon: '🔥',
        color: '#FF5722',
        actionLabel: 'View Progress',
        actionRoute: '/test/performance-dashboard'
      });
    }
    
    return achievements;
  }
  
  /**
   * Display achievement notification to user
   */
  static async displayAchievement(achievement: PerformanceAchievement) {
    return new Promise<void>((resolve) => {
      Alert.alert(
        achievement.title,
        achievement.message,
        [
          {
            text: 'Later',
            style: 'cancel',
            onPress: () => resolve()
          },
          {
            text: achievement.actionLabel || 'View',
            style: 'default',
            onPress: () => {
              if (achievement.actionRoute) {
                router.push({
                  pathname: achievement.actionRoute,
                  params: achievement.actionParams || {}
                });
              }
              resolve();
            }
          }
        ]
      );
    });
  }
  
  /**
   * Show multiple achievements in sequence
   */
  static async displayAchievements(achievements: PerformanceAchievement[]) {
    for (const achievement of achievements) {
      await this.displayAchievement(achievement);
      // Small delay between notifications
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  /**
   * Create motivational messages based on performance
   */
  static getMotivationalMessage(percentage: number, rank?: number): string {
    if (percentage === 100) {
      return "Perfect! You've mastered this topic completely. 🎯";
    } else if (percentage >= 90) {
      return "Excellent work! You're performing at an elite level. 🏆";
    } else if (percentage >= 80) {
      return "Great job! You have a strong grasp of the material. 👍";
    } else if (percentage >= 70) {
      return "Good progress! You're on the right track. Keep practicing! 📚";
    } else if (percentage >= 60) {
      return "You're getting there! Review the solutions and try again. 💪";
    } else if (percentage >= 50) {
      return "Don't give up! Every attempt is a step forward. 🚀";
    } else {
      return "Keep learning! Focus on understanding the concepts first. 📖";
    }
  }
  
  /**
   * Get improvement suggestions based on performance patterns
   */
  static getImprovementSuggestions(
    recentTests: Array<{
      percentage: number;
      category: string;
      timeSpent: number;
      difficulty: string;
    }>
  ): string[] {
    const suggestions: string[] = [];
    
    if (recentTests.length === 0) return suggestions;
    
    const avgPercentage = recentTests.reduce((sum, test) => sum + test.percentage, 0) / recentTests.length;
    const avgTime = recentTests.reduce((sum, test) => sum + test.timeSpent, 0) / recentTests.length;
    
    // Performance-based suggestions
    if (avgPercentage < 60) {
      suggestions.push("📚 Focus on reviewing fundamental concepts before attempting tests");
      suggestions.push("🎯 Try easier tests first to build confidence");
    } else if (avgPercentage < 75) {
      suggestions.push("📖 Review explanations for questions you got wrong");
      suggestions.push("⏱️ Practice time management during tests");
    } else if (avgPercentage >= 85) {
      suggestions.push("🚀 Challenge yourself with harder difficulty levels");
      suggestions.push("🏆 Compete in leaderboards to stay motivated");
    }
    
    // Time-based suggestions
    if (avgTime < 30) {
      suggestions.push("🤔 Take more time to carefully read each question");
      suggestions.push("✅ Double-check your answers before submitting");
    } else if (avgTime > 90) {
      suggestions.push("⚡ Practice solving questions faster");
      suggestions.push("📝 Focus on key information in questions");
    }
    
    // Category-specific suggestions
    const categoryPerformance = new Map<string, number[]>();
    recentTests.forEach(test => {
      if (!categoryPerformance.has(test.category)) {
        categoryPerformance.set(test.category, []);
      }
      categoryPerformance.get(test.category)!.push(test.percentage);
    });
    
    categoryPerformance.forEach((scores, category) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (avgScore < 65) {
        suggestions.push(`🎓 Focus more practice on ${category} topics`);
      }
    });
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
  }
  
  /**
   * Create study reminder notifications
   */
  static createStudyReminder(
    lastTestDate: Date,
    averageScore: number,
    weakCategories: string[]
  ): PerformanceAchievement | null {
    const daysSinceLastTest = Math.floor(
      (Date.now() - lastTestDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastTest >= 3) {
      let message = `It's been ${daysSinceLastTest} days since your last test. `;
      
      if (averageScore < 70 && weakCategories.length > 0) {
        message += `Consider practicing ${weakCategories[0]} topics to improve your performance.`;
      } else if (averageScore >= 80) {
        message += `You're doing great! Keep up the momentum with a quick practice test.`;
      } else {
        message += `Regular practice helps maintain your skills. Ready for a challenge?`;
      }
      
      return {
        id: 'study_reminder',
        type: 'milestone',
        title: '📚 Time to Practice!',
        message,
        icon: '📚',
        color: '#3F51B5',
        actionLabel: 'Take a Test',
        actionRoute: '/test/enhanced-quiz'
      };
    }
    
    return null;
  }
}

export default TestPerformanceNotificationService;