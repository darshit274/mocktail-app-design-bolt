/**
 * Test Results Screen - REFACTORED
 * Created: 2025-01-11
 * Original: 881 lines → Refactored: ~200 lines
 * Purpose: Display quiz results with performance breakdown and analysis
 */

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleAlert as AlertCircle } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ThemeColors } from '@/types';
import { createResultsStyles } from '@/styles/resultsStyles';
import { useResultsData } from '@/hooks/results/useResultsData';
import {
  ResultsHeader,
  PerformanceBadge,
  StatsOverview,
  NegativeMarkingCard,
  PerformanceChart,
  SubjectAnalysis,
  ResultsActions,
} from '@/components/results';

export default function TestResultsScreen() {
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(theme) as ThemeColors;
  const styles = createResultsStyles(Colors);

  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis'>('overview');

  // Custom hook for results data
  const resultsData = useResultsData();

  // Helper functions
  const getPerformanceText = useCallback((percentage: number) => {
    if (percentage >= 80) return t.results.excellent;
    if (percentage >= 60) return t.results.good;
    return t.results.needsImprovement;
  }, [t]);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  }, []);

  // Action handlers
  const handleViewSolutions = useCallback(() => {
    router.push({
      pathname: '/test/solutions',
      params: {
        sessionId: params.sessionId || 'mock-session',
        resultId: params.resultId || 'mock-result',
        testTitle: resultsData.testTitle || 'Test Solutions',
        categoryUuid: params.categoryUuid,
        categoryName: params.categoryName,
        selectedLanguage: params.selectedLanguage || 'gujarati', // Pass selected language
      },
    });
  }, [params, resultsData.testTitle]);

  const handleViewLeaderboard = useCallback(() => {
    router.push({
      pathname: '/test/leaderboard',
      params: {
        seriesUuid: params.seriesUuid,
        categoryUuid: params.categoryUuid,
        categoryName: params.categoryName,
        testTitle: resultsData.testTitle,
      },
    });
  }, [params, resultsData.testTitle]);

  const handleRetakeTest = useCallback(() => {
    // Navigate to web-quiz with all necessary parameters
    router.push({
      pathname: '/test/web-quiz',
      params: {
        categoryUuid: params.categoryUuid,
        categoryName: params.categoryName,
        seriesUuid: params.seriesUuid,
        testTitle: params.title || resultsData.testTitle,
      },
    });
  }, [params, resultsData.testTitle]);

  // Early return if no params
  if (!params || Object.keys(params).length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: Colors.textPrimary }]}>
            Loading results...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ResultsHeader
        testTitle={resultsData.testTitle as string}
        percentage={resultsData.percentage}
        translationTitle={t.results?.testCompleted || 'Test Completed'}
        translationScore={t.results?.score || 'Score'}
        Colors={Colors}
      />

      {/* Performance Badge */}
      <PerformanceBadge
        percentage={resultsData.percentage}
        getPerformanceText={getPerformanceText}
        Colors={Colors}
      />

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
            {/* Stats Overview */}
            <StatsOverview
              correctCount={resultsData.correctCount}
              incorrectCount={resultsData.incorrectCount}
              unansweredCount={resultsData.unansweredCount}
              totalQuestions={resultsData.totalQuestions}
              attempted={resultsData.attempted}
              accuracy={resultsData.accuracy}
              score={resultsData.score}
              scoreWithNegativeMarking={resultsData.scoreWithNegativeMarking}
              rank={resultsData.rank}
              totalUsers={resultsData.totalUsers}
              percentile={resultsData.percentile}
              totalTimeTaken={resultsData.totalTimeTaken}
              t={t}
              Colors={Colors}
            />

            {/* Negative Marking Card */}
            {resultsData.negativeMarkingEnabled && (
              <NegativeMarkingCard
                correctCount={resultsData.correctCount}
                negativeMarks={resultsData.negativeMarks}
                finalScore={resultsData.finalScore}
                Colors={Colors}
              />
            )}

            {/* Performance Chart */}
            <PerformanceChart
              correctCount={resultsData.correctCount}
              incorrectCount={resultsData.incorrectCount}
              unansweredCount={resultsData.unansweredCount}
              totalQuestions={resultsData.totalQuestions}
              t={t}
              Colors={Colors}
            />
          </>
        ) : (
          <>
            {/* Subject Analysis */}
            <SubjectAnalysis
              subjectStats={resultsData.subjectStats}
              totalQuestions={resultsData.totalQuestions}
              totalTimeTaken={resultsData.totalTimeTaken}
              formatTime={formatTime}
              t={t}
              Colors={Colors}
            />
          </>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <ResultsActions
        onViewSolutions={handleViewSolutions}
        onViewLeaderboard={handleViewLeaderboard}
        onRetakeTest={handleRetakeTest}
        t={t}
        Colors={Colors}
      />
    </SafeAreaView>
  );
}
