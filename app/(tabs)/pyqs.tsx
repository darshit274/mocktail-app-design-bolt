import DisplayHtml from '@/components/common/DisplayHtml';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { PYQTest, useGetPreviousYearsTestsQuery } from '@/store/api/pyqApi';
import { getTheme } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { AlertCircle, FileText, Play } from 'lucide-react-native';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PYQsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(theme);
  const [page, setPage] = useState(1);

  // API call
  const {
    data: pyqData,
    error: pyqError,
    isLoading: pyqLoading,
    refetch: refetchPYQs,
  } = useGetPreviousYearsTestsQuery({
    page,
    limit: 20,
  });

  const pyqTests = pyqData?.data?.tests || [];
  const pagination = pyqData?.data?.pagination;

  const handleStartTest = (test: PYQTest) => {
    // Navigate to series-detail page using dynamic hierarchy format
    router.push({
      pathname: '/test/series-detail',
      params: {
        seriesUuid: test.uuid,
        title: test.name || 'Previous Years Paper',
      },
    });
  };

  const renderErrorState = () => (
    <View style={[styles.centerContainer, { paddingTop: 60 }]}>
      <AlertCircle size={48} color={Colors.danger} />
      <Text style={[styles.errorTitle, { color: Colors.textPrimary }]}>
        {t.common?.error || 'Something went wrong'}
      </Text>
      <Text style={[styles.errorMessage, { color: Colors.textSubtle }]}>
        {t.common?.tryAgain || 'Please try again later'}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: Colors.primary }]}
        onPress={refetchPYQs}
      >
        <Text style={styles.retryButtonText}>{t.common?.retry || 'Retry'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={[styles.centerContainer, { paddingTop: 60 }]}>
      <FileText size={48} color={Colors.textSubtle} />
      <Text style={[styles.emptyTitle, { color: Colors.textPrimary }]}>
        No Previous Years Papers
      </Text>
      <Text style={[styles.emptyMessage, { color: Colors.textSubtle }]}>
        Check back later for new papers
      </Text>
    </View>
  );

  const renderTestCard = (test: PYQTest) => (
    <TouchableOpacity
      key={test.uuid}
      style={styles.testCard}
      onPress={() => handleStartTest(test)}
    >
      <View style={styles.testHeader}>
        <View style={styles.testTitleContainer}>
          <Text style={styles.testTitle}>{test.name}</Text>
          {test.description && (
            <View style={styles.testDescription}>
              <DisplayHtml
                source={{
                  html: test.description || ''
                }}
              />
            </View>
          )}
        </View>
      </View>

      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        style={styles.startButton}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Play size={16} color={Colors.white} />
        <Text style={styles.startButtonText}>View Paper</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const styles = getStyles(Colors);

  // Show error state if there's an error
  if (pyqError) {
    return (
      <SafeAreaView style={styles.container}>
        {renderErrorState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pyqLoading}
            onRefresh={refetchPYQs}
            colors={['#9333ea']}
            tintColor={'#9333ea'}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Previous Years Papers</Text>
            <Text style={styles.headerSubtitle}>Practice with actual exam papers</Text>
          </View>
          {pagination && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                {pagination.totalItems} papers available
              </Text>
            </View>
          )}
        </View>

        {/* PYQ Tests List */}
        <View style={styles.testsContainer}>
          {pyqLoading ? (
            // Show skeleton loaders
            Array.from({ length: 5 }).map((_, index) => (
              <SkeletonLoader key={index} width="100%" height={180} style={styles.testCardSkeleton} />
            ))
          ) : pyqTests.length === 0 ? (
            renderEmptyState()
          ) : (
            pyqTests.map((test) => renderTestCard(test))
          )}
        </View>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
              onPress={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              <Text style={styles.paginationButtonText}>Previous</Text>
            </TouchableOpacity>
            <Text style={styles.paginationText}>
              Page {pagination.currentPage} of {pagination.totalPages}
            </Text>
            <TouchableOpacity
              style={[styles.paginationButton, !pagination.hasMore && styles.paginationButtonDisabled]}
              onPress={() => setPage(page + 1)}
              disabled={!pagination.hasMore}
            >
              <Text style={styles.paginationButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
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
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSubtle,
  },
  statsContainer: {
    marginTop: 8,
  },
  statsText: {
    fontSize: 12,
    color: '#9333ea',
    fontWeight: '600',
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeCategoryButton: {
    backgroundColor: '#9333ea',
    borderColor: '#9333ea',
  },
  categoryText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  activeCategoryText: {
    color: Colors.white,
  },
  categorySkeleton: {
    marginRight: 8,
    borderRadius: 20,
  },
  testsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  testCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testCardSkeleton: {
    borderRadius: 12,
    marginBottom: 16,
  },
  testHeader: {
    marginBottom: 12,
  },
  testTitleContainer: {
    marginBottom: 8,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  testDescription: {
    fontSize: 13,
    color: Colors.textSubtle,
    lineHeight: 18,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  testStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: Colors.textSubtle,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  startButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#9333ea',
    borderRadius: 8,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  paginationText: {
    fontSize: 14,
    color: Colors.textSubtle,
  },
});
