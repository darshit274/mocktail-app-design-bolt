import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  MinusCircle,
  Trophy,
  TrendingUp,
  Calendar,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetTestHistoryQuery } from '@/store/api/userApi';
import { format } from 'date-fns';

export default function TestHistoryScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(theme);
  const styles = getStyles(Colors);

  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useGetTestHistoryQuery({ page, limit: 10 });
  const [refreshing, setRefreshing] = React.useState(false);

  const sessions = data?.data?.sessions || [];
  const pagination = data?.data?.pagination;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleViewAllAttempts = (categoryUuid: string, categoryName: string, seriesUuid: string) => {
    router.push({
      pathname: '/test/test-attempts',
      params: {
        categoryUuid,
        categoryName,
        seriesUuid
      }
    });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return Colors.success;
    if (percentage >= 60) return Colors.warning;
    return Colors.danger;
  };

  const renderTestItem = (item: any) => {
    const bestScoreColor = getScoreColor(item.bestPercentage);
    const latestScoreColor = getScoreColor(item.latestPercentage);

    return (
      <View key={item.testUuid || item.categoryUuid} style={styles.testCard}>
        <View style={styles.testHeader}>
          <View style={styles.testInfo}>
            <Text style={styles.testTitle}>{item.testName}</Text>
            <Text style={styles.testSeriesName}>{item.testSeriesName}</Text>
            <View style={styles.testMeta}>
              <View style={styles.metaItem}>
                <Calendar size={14} color={Colors.textSubtle} />
                <Text style={styles.metaText}>
                  {format(new Date(item.completedAt), 'MMM dd, yyyy')}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Trophy size={14} color={Colors.textSubtle} />
                <Text style={styles.metaText}>
                  {item.totalAttempts} {item.totalAttempts === 1 ? 'Attempt' : 'Attempts'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statItem, styles.bestScoreStat]}>
            <Trophy size={16} color={bestScoreColor} />
            <Text style={[styles.statValue, { color: bestScoreColor }]}>
              {item.bestPercentage}%
            </Text>
            <Text style={styles.statLabel}>Best Score</Text>
            <Text style={styles.scoreText}>
              {item.bestScore}/{item.totalQuestions}
            </Text>
          </View>
          <View style={[styles.statItem, styles.latestScoreStat]}>
            <Clock size={16} color={latestScoreColor} />
            <Text style={[styles.statValue, { color: latestScoreColor }]}>
              {item.latestPercentage}%
            </Text>
            <Text style={styles.statLabel}>Latest Score</Text>
            <Text style={styles.scoreText}>
              {item.latestScore}/{item.totalQuestions}
            </Text>
          </View>
          <View style={[styles.statItem, styles.questionsStat]}>
            <CheckCircle size={16} color={Colors.primary} />
            <Text style={styles.statValue}>{item.totalQuestions}</Text>
            <Text style={styles.statLabel}>Questions</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.viewAllAttemptsButton}
            onPress={() => handleViewAllAttempts(
              item.categoryUuid || item.testUuid,
              item.categoryName || item.testName,
              item.testSeriesUuid
            )}
          >
            <Text style={styles.viewAllAttemptsText}>View All Attempts</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading && page === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Test History</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        {sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Trophy size={48} color={Colors.gray400} />
            <Text style={styles.emptyTitle}>No Tests Completed</Text>
            <Text style={styles.emptyText}>
              Your completed tests will appear here
            </Text>
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => router.push('/(tabs)/testseries')}
            >
              <Text style={styles.startButtonText}>Browse Test Series</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Performance Overview</Text>
              <View style={styles.summaryStats}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{sessions.length}</Text>
                  <Text style={styles.summaryLabel}>Tests Taken</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {Math.round(sessions.reduce((acc: number, s: any) => acc + s.totalAttempts, 0))}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Attempts</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {Math.round(sessions.reduce((acc: number, s: any) => acc + s.bestPercentage, 0) / sessions.length || 0)}%
                  </Text>
                  <Text style={styles.summaryLabel}>Avg Best Score</Text>
                </View>
              </View>
            </View>

            {sessions.map(renderTestItem)}

            {pagination && pagination.totalPages > 1 && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
                  onPress={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <Text style={styles.pageButtonText}>Previous</Text>
                </TouchableOpacity>
                <Text style={styles.pageInfo}>
                  Page {page} of {pagination.totalPages}
                </Text>
                <TouchableOpacity
                  style={[styles.pageButton, page >= pagination.totalPages && styles.pageButtonDisabled]}
                  onPress={() => setPage(p => p + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  <Text style={styles.pageButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSubtle,
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: Colors.primaryLight + '10',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primaryLight + '30',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSubtle,
  },
  testCard: {
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  testInfo: {
    flex: 1,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  testSeriesName: {
    fontSize: 14,
    color: Colors.textSubtle,
    marginBottom: 8,
  },
  testMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSubtle,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scorePercentage: {
    fontSize: 28,
    fontWeight: '700',
  },
  scoreText: {
    fontSize: 12,
    color: Colors.textSubtle,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  bestScoreStat: {
    borderRightWidth: 1,
    borderColor: Colors.border,
  },
  latestScoreStat: {
    borderRightWidth: 1,
    borderColor: Colors.border,
  },
  questionsStat: {},
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSubtle,
  },
  cardFooter: {
    marginTop: 12,
  },
  viewAllAttemptsButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewAllAttemptsText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 16,
  },
  pageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  pageButtonDisabled: {
    backgroundColor: Colors.gray300,
  },
  pageButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  pageInfo: {
    fontSize: 14,
    color: Colors.textSubtle,
  },
});