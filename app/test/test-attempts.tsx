import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, CheckCircle, XCircle, Award } from 'lucide-react-native';
import { format } from 'date-fns';

import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useGetTestAttemptsQuery } from '@/store/api/userApi';

export default function TestAttemptsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    categoryUuid: string;
    categoryName: string;
    seriesUuid: string;
  }>();

  const { theme } = useTheme();
  const Colors = getTheme(theme);
  const styles = getStyles(Colors);

  // Use RTK Query hook
  const {
    data: attemptsResponse,
    isLoading,
    error,
    refetch,
  } = useGetTestAttemptsQuery(params.categoryUuid);

  const attemptsData = attemptsResponse?.data;

  const handleAttemptPress = (sessionId: number) => {
    console.log('📍 [TestAttempts] Navigating to result for session:', sessionId);
    router.push({
      pathname: '/test/results',
      params: {
        sessionId: sessionId.toString(),
        categoryUuid: params.categoryUuid,
        categoryName: params.categoryName,
        seriesUuid: params.seriesUuid,
      },
    });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return Colors.success;
    if (percentage >= 60) return Colors.warning;
    return Colors.danger;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Test Attempts</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading attempts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !attemptsData) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Test Attempts</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <XCircle size={48} color={Colors.danger} />
          <Text style={styles.errorText}>
            {error ? 'Failed to load attempts' : 'No attempts found'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test Attempts</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Test Info Card */}
        <View style={styles.testInfoCard}>
          <Text style={styles.testName}>{attemptsData.testName}</Text>
          <View style={styles.testStatsRow}>
            <View style={styles.testStat}>
              <Text style={styles.testStatValue}>{attemptsData.totalAttempts}</Text>
              <Text style={styles.testStatLabel}>Total Attempts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.testStat}>
              <Text style={styles.testStatValue}>
                {Math.round(
                  attemptsData.attempts.reduce((sum, a) => sum + a.percentage, 0) /
                    attemptsData.attempts.length
                )}%
              </Text>
              <Text style={styles.testStatLabel}>Avg Score</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.testStat}>
              <Text style={styles.testStatValue}>
                {Math.max(...attemptsData.attempts.map(a => a.percentage))}%
              </Text>
              <Text style={styles.testStatLabel}>Best Score</Text>
            </View>
          </View>
        </View>

        {/* Attempts List */}
        <View style={styles.attemptsContainer}>
          <Text style={styles.sectionTitle}>All Attempts</Text>
          {attemptsData.attempts.map((attempt) => {
            const scoreColor = getScoreColor(attempt.percentage);
            const attemptDate = new Date(attempt.completedAt);

            return (
              <TouchableOpacity
                key={attempt.sessionId}
                style={styles.attemptCard}
                onPress={() => handleAttemptPress(attempt.sessionId)}
                activeOpacity={0.7}
              >
                {/* Attempt Badge */}
                <View style={[styles.attemptBadge, { backgroundColor: scoreColor }]}>
                  <Text style={styles.attemptNumber}>#{attempt.attemptNumber}</Text>
                </View>

                {/* Attempt Details */}
                <View style={styles.attemptContent}>
                  <View style={styles.attemptHeader}>
                    <Text style={styles.attemptDate}>
                      {format(attemptDate, 'MMM dd, yyyy • hh:mm a')}
                    </Text>
                    <View style={styles.attemptTime}>
                      <Clock size={14} color={Colors.textSecondary} />
                      <Text style={styles.attemptTimeText}>{attempt.timeTaken}</Text>
                    </View>
                  </View>

                  {/* Score Display */}
                  <View style={styles.scoreContainer}>
                    <View style={styles.scoreCircle}>
                      <Text style={[styles.scorePercentage, { color: scoreColor }]}>
                        {attempt.percentage}%
                      </Text>
                      <Text style={styles.scoreText}>
                        {attempt.score}/{attempt.totalQuestions}
                      </Text>
                    </View>

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                      <View style={styles.statItem}>
                        <CheckCircle size={16} color={Colors.success} />
                        <Text style={styles.statItemValue}>{attempt.correct}</Text>
                        <Text style={styles.statItemLabel}>Correct</Text>
                      </View>
                      <View style={styles.statItem}>
                        <XCircle size={16} color={Colors.danger} />
                        <Text style={styles.statItemValue}>{attempt.wrong}</Text>
                        <Text style={styles.statItemLabel}>Wrong</Text>
                      </View>
                      <View style={styles.statItem}>
                        <View style={[styles.iconPlaceholder, { backgroundColor: Colors.textTertiary }]} />
                        <Text style={styles.statItemValue}>{attempt.unanswered}</Text>
                        <Text style={styles.statItemLabel}>Skipped</Text>
                      </View>
                    </View>
                  </View>

                  {/* Best Score Badge */}
                  {attempt.percentage === Math.max(...attemptsData.attempts.map(a => a.percentage)) && (
                    <View style={styles.bestScoreBadge}>
                      <Award size={14} color={Colors.warning} />
                      <Text style={styles.bestScoreText}>Best Score</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
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
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  testInfoCard: {
    margin: 16,
    padding: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  testName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  testStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  testStat: {
    alignItems: 'center',
  },
  testStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  testStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  attemptsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  attemptCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  attemptBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attemptNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  attemptContent: {
    flex: 1,
  },
  attemptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  attemptDate: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  attemptTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attemptTimeText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreCircle: {
    alignItems: 'center',
  },
  scorePercentage: {
    fontSize: 28,
    fontWeight: '700',
  },
  scoreText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statsGrid: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  statItemLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  iconPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  bestScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.warningLight || '#FFF4E5',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  bestScoreText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.warning,
  },
});
