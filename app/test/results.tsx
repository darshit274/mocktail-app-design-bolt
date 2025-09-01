import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Clock, Target, TrendingUp, ChevronRight, Award, Users, BookOpen, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReviewAnswersQuery } from '@/store/api/quizApi';

const { width } = Dimensions.get('window');

export default function TestResultsScreen() {
  console.log('📊 Results screen mounted');
  const params = useLocalSearchParams();
  console.log('📊 Received params:', params);
  const { resultId, sessionId, score, percentage, passed, testTitle, correctAnswers, wrongAnswers, unanswered, categoryUuid, categoryName } = params;
  
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis'>('overview');
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(isDarkMode);
  const styles = getStyles(Colors);
  
  // Early return if no params
  if (!params || Object.keys(params).length === 0) {
    console.log('⚠️ No params received in results screen');
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: Colors.textPrimary }]}>Loading results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Use passed parameters directly if available, otherwise fetch from API
  const hasDirectParams = correctAnswers && wrongAnswers && unanswered;
  
  // Fetch detailed results from API only if we don't have direct params
  const { 
    data: reviewData, 
    isLoading: loadingResults,
    error: resultsError 
  } = useReviewAnswersQuery({
    session_id: sessionId as string,
    result_id: resultId as string,
  }, {
    skip: !sessionId || !resultId || hasDirectParams,
  });

  const results = reviewData?.data;
  const questions = results?.questions || [];
  const resultSummary = results?.result_summary;

  // Calculate metrics from params or API data
  const correctCount = hasDirectParams ? parseInt(correctAnswers as string) : questions.filter(q => q.is_correct).length;
  const incorrectCount = hasDirectParams ? parseInt(wrongAnswers as string) : questions.filter(q => !q.is_correct && q.selected_option !== null).length;
  const unansweredCount = hasDirectParams ? parseInt(unanswered as string) : questions.filter(q => q.selected_option === null).length;
  const totalQuestions = correctCount + incorrectCount + unansweredCount;
  const totalTimeTaken = questions.reduce((sum, q) => sum + q.time_spent, 0);
  
  // Group by subject for analysis
  const subjectStats = questions.reduce((acc, question) => {
    const subject = question.subject;
    if (!acc[subject]) {
      acc[subject] = { total: 0, correct: 0, attempted: 0, timeSpent: 0 };
    }
    acc[subject].total++;
    acc[subject].timeSpent += question.time_spent;
    if (question.selected_option !== null) {
      acc[subject].attempted++;
      if (question.is_correct) {
        acc[subject].correct++;
      }
    }
    return acc;
  }, {} as Record<string, { total: number; correct: number; attempted: number; timeSpent: number }>);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const getPerformanceColor = (percentage: number) => {
    // Home screen does not use colored badges, so always use Colors.primaryLight for highlights
    return Colors.primaryLight;
  };

  const getPerformanceText = (percentage: number) => {
    if (percentage >= 80) return t.results.excellent;
    if (percentage >= 60) return t.results.good;
    return t.results.needsImprovement;
  };

  const handleViewSolutions = () => {
    console.log('🔍 View Solutions clicked with params:', {
      sessionId: sessionId || 'mock-session',
      resultId: resultId || 'mock-result',
      testTitle: testTitle || 'Test Solutions',
    });
    router.push({
      pathname: '/test/solutions',
      params: {
        sessionId: sessionId || 'mock-session',
        resultId: resultId || 'mock-result',
        testTitle: testTitle || 'Test Solutions',
        categoryUuid: categoryUuid,
        categoryName: categoryName,
      },
    });
  };

  const handleViewLeaderboard = () => {
    router.push({
      pathname: '/test/enhanced-leaderboard',
      params: {
        type: 'test',
        id: sessionId || resultId,
        title: testTitle || categoryName || 'Test Results',
        showTimeframe: 'true',
      },
    });
  };

  const handleRetakeTest = () => {
    // Navigate back to the test with same parameters
    router.push({
      pathname: '/test/quiz',
      params: {
        testId: params.testId,
        testType: params.testType,
        seriesId: params.seriesId,
        title: params.title,
      },
    });
  };

  // Show loading state while fetching results (only if we don't have direct params)
  if (loadingResults && !hasDirectParams) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: Colors.textPrimary }]}>
            Loading Results...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if results failed to load (only if we don't have direct params)
  if ((resultsError || (!results && !hasDirectParams)) && !hasDirectParams) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={Colors.danger} />
          <Text style={[styles.errorTitle, { color: Colors.textPrimary }]}>
            Error Loading Results
          </Text>
          <Text style={[styles.errorMessage, { color: Colors.textSubtle }]}>
            Failed to load test results. Please try again.
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t.results?.testCompleted || 'Test Completed'}</Text>
          <Text style={styles.headerSubtitle}>{testTitle || params.title || 'Quiz'}</Text>
        </View>
        
        <View style={styles.scoreCircle}>
          <Text style={styles.scorePercentage}>{Math.round(Number(percentage) || 0)}%</Text>
          <Text style={styles.scoreLabel}>{t.results?.score || 'Score'}</Text>
        </View>
      </LinearGradient>

      {/* Performance Badge */}
      <View style={styles.performanceBadge}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryLight]}
          style={styles.performanceGradient}
        >
          <Award size={24} color={Colors.white} />
          <Text style={styles.performanceText}>{getPerformanceText(Number(percentage) || 0) || 'Good Job!'}</Text>
        </LinearGradient>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            {t.results.overview}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analysis' && styles.activeTab]}
          onPress={() => setActiveTab('analysis')}
        >
          <Text style={[styles.tabText, activeTab === 'analysis' && styles.activeTabText]}>
            {t.results.analysis}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' ? (
          <>
            {/* Quick Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <CheckCircle size={24} color={Colors.success} />
                <Text style={styles.statNumber}>{correctCount}</Text>
                <Text style={styles.statLabel}>{t.results?.correct || 'Correct'}</Text>
              </View>
              
              <View style={styles.statCard}>
                <XCircle size={24} color={Colors.danger} />
                <Text style={styles.statNumber}>{incorrectCount}</Text>
                <Text style={styles.statLabel}>{t.results?.incorrect || 'Wrong'}</Text>
              </View>
              
              <View style={styles.statCard}>
                <AlertCircle size={24} color={Colors.warning} />
                <Text style={styles.statNumber}>{unansweredCount}</Text>
                <Text style={styles.statLabel}>{t.results?.unanswered || 'Skipped'}</Text>
              </View>
            </View>

            {/* Detailed Stats */}
            <View style={styles.detailsContainer}>
              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <CheckCircle size={20} color={Colors.primaryLight} />
                    <Text style={styles.detailLabel}>{t.results.correctAnswers}</Text>
                  </View>
                  <Text style={styles.detailValue}>{correctCount}</Text>
                </View>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <XCircle size={20} color={Colors.accent} />
                    <Text style={styles.detailLabel}>{t.results.incorrectAnswers}</Text>
                  </View>
                  <Text style={styles.detailValue}>{incorrectCount}</Text>
                </View>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <AlertCircle size={20} color={Colors.accent} />
                    <Text style={styles.detailLabel}>{t.results.unanswered}</Text>
                  </View>
                  <Text style={styles.detailValue}>{unansweredCount}</Text>
                </View>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Target size={20} color={Colors.primaryLight} />
                    <Text style={styles.detailLabel}>{t.results.totalScore}</Text>
                  </View>
                  <Text style={styles.detailValue}>{resultSummary?.total_score || score}</Text>
                </View>
              </View>
            </View>

            {/* Progress Chart */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>{t.results.performanceBreakdown}</Text>
              <View style={styles.progressChart}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressSegment, 
                      { 
                        width: `${(correctCount / totalQuestions) * 100}%`,
                        backgroundColor: Colors.success
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.progressSegment, 
                      { 
                        width: `${(incorrectCount / totalQuestions) * 100}%`,
                        backgroundColor: Colors.danger
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.progressSegment, 
                      { 
                        width: `${(unansweredCount / totalQuestions) * 100}%`,
                        backgroundColor: Colors.warning
                      }
                    ]} 
                  />
                </View>
                
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
                    <Text style={styles.legendText}>{t.results?.correct || 'Correct'} ({correctCount})</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
                    <Text style={styles.legendText}>{t.results?.incorrect || 'Wrong'} ({incorrectCount})</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
                    <Text style={styles.legendText}>{t.results?.unanswered || 'Unanswered'} ({unansweredCount})</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Subject-wise Analysis */}
            <View style={styles.analysisContainer}>
              <Text style={styles.analysisTitle}>{t.results.subjectWisePerformance}</Text>
              
              {Object.entries(subjectStats).map(([subject, stats]) => {
                const accuracy = stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0;
                return (
                  <View key={subject} style={styles.subjectCard}>
                    <View style={styles.subjectHeader}>
                      <BookOpen size={20} color={Colors.textLink} />
                      <Text style={styles.subjectName}>{subject}</Text>
                    </View>
                    <View style={styles.subjectStats}>
                      <Text style={styles.subjectScore}>{stats.correct}/{stats.total}</Text>
                      <Text style={styles.subjectPercentage}>{Math.round(accuracy)}%</Text>
                    </View>
                    <View style={styles.subjectProgress}>
                      <View style={[styles.subjectProgressBar, { width: `${accuracy}%` }]} />
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Time Analysis */}
            <View style={styles.timeAnalysisContainer}>
              <Text style={styles.analysisTitle}>{t.results.timeAnalysis}</Text>
              <View style={styles.timeCard}>
                <Text style={styles.timeLabel}>{t.results.avgTimePerQuestion}</Text>
                <Text style={styles.timeValue}>{totalQuestions > 0 ? Math.round(totalTimeTaken / totalQuestions) : 0}s</Text>
              </View>
              <View style={styles.timeCard}>
                <Text style={styles.timeLabel}>{t.results.totalTimeSpent}</Text>
                <Text style={styles.timeValue}>{formatTime(totalTimeTaken)}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleViewSolutions}>
          <BookOpen size={20} color={Colors.primary} />
          <Text style={styles.actionButtonText}>{t.results.viewSolutions}</Text>
          <ChevronRight size={16} color={Colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleViewLeaderboard}>
          <Trophy size={20} color={Colors.primary} />
          <Text style={styles.actionButtonText}>{t.results.viewLeaderboard}</Text>
          <ChevronRight size={16} color={Colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.retakeButton} onPress={handleRetakeTest}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryLight]}
            style={styles.retakeGradient}
          >
            <Text style={styles.retakeButtonText}>{t.results.retakeTest}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  scorePercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  scoreLabel: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.9,
  },
  performanceBadge: {
    alignItems: 'center',
    marginTop: -20,
    marginBottom: 20,
  },
  performanceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  performanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: Colors.primaryLight,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSubtle,
  },
  activeTabText: {
    color: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
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
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryLight,
  },
  chartContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  progressChart: {
    marginBottom: 16,
  },
  progressBar: {
    flexDirection: 'row',
    height: 8,
    backgroundColor: Colors.light,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressSegment: {
    height: '100%',
  },
  chartLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSubtle,
  },
  analysisContainer: {
    marginBottom: 20,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  subjectCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  subjectStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectScore: {
    fontSize: 14,
    color: Colors.textSubtle,
  },
  subjectPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  subjectProgress: {
    height: 4,
    backgroundColor: Colors.light,
    borderRadius: 2,
    overflow: 'hidden',
  },
  subjectProgressBar: {
    height: '100%',
    backgroundColor: Colors.textLink,
  },
  timeAnalysisContainer: {
    marginBottom: 20,
  },
  timeCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  timeLabel: {
    fontSize: 14,
    color: Colors.textSubtle,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.muted,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
    flex: 1,
    marginLeft: 12,
  },
  retakeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  retakeGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
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
  errorMessage: {
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
});