import DisplayHtml from '@/components/common/DisplayHtml';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { FreeTest, useGetFreeTestCategoriesQuery, useGetFreeTestsQuery, useGetFreeTestStatsQuery } from '@/store/api/freeTestsApi';
import { getTheme } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { AlertCircle, BookOpen, Play } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FreeTestsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(theme);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // API calls
  const {
    data: testsData,
    error: testsError,
    isLoading: testsLoading,
    refetch: refetchTests,
  } = useGetFreeTestsQuery({
    page,
    limit: 20,
    search: searchQuery,
    category: selectedCategory || undefined,
    sortBy: 'created_at',
    sortOrder: 'DESC',
  });

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
  } = useGetFreeTestCategoriesQuery();

  const {
    data: statsData,
    isLoading: statsLoading,
  } = useGetFreeTestStatsQuery();

  // Prepare categories with "All" option
  const categories = [
    { key: '', label: t.freeTests.categories.all },
    ...(categoriesData?.data?.map(cat => ({
      key: cat.name,
      label: cat.name,
    })) || []),
  ];

  const freeTests = testsData?.data || [];
  const pagination = testsData?.pagination;

  const getDifficultyColor = (difficulty: string | undefined) => {
    if (!difficulty) return Colors.textSubtle;
    switch (difficulty.toLowerCase()) {
      case 'easy': return Colors.success;
      case 'medium': return Colors.warning;
      case 'hard': return Colors.danger;
      default: return Colors.textSubtle;
    }
  };

  const handleStartTest = (test: FreeTest) => {
    // Free tests are actually test series - navigate to series detail page
    // which shows the categories available in the series
    router.push({
      pathname: '/test/series-detail',
      params: {
        seriesUuid: test.uuid,
        title: test.title || test.name,
      },
    });
  };

  const renderErrorState = () => (
    <View style={[styles.centerContainer, { paddingTop: 60 }]}>
      <AlertCircle size={48} color={Colors.danger} />
      <Text style={[styles.errorTitle, { color: Colors.textPrimary }]}>
        {t.common.error || 'Something went wrong'}
      </Text>
      <Text style={[styles.errorMessage, { color: Colors.textSubtle }]}>
        {t.common.tryAgain || 'Please try again later'}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: Colors.primary }]}
        onPress={refetchTests}
      >
        <Text style={styles.retryButtonText}>{t.common.retry || 'Retry'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={[styles.centerContainer, { paddingTop: 60 }]}>
      <BookOpen size={48} color={Colors.textSubtle} />
      <Text style={[styles.emptyTitle, { color: Colors.textPrimary }]}>
        {t.freeTests.noTests || 'No tests available'}
      </Text>
      <Text style={[styles.emptyMessage, { color: Colors.textSubtle }]}>
        {t.freeTests.checkBackLater || 'Check back later for new tests'}
      </Text>
    </View>
  );

  const renderTestCard = (test: FreeTest) => (
    <TouchableOpacity
      key={test.id}
      style={styles.testCard}
      onPress={() => handleStartTest(test)}
    >
      <View style={styles.testHeader}>
        <View style={styles.testTitleContainer}>
          <Text style={styles.testTitle}>{test.title}</Text>
          {/* {console.log(test.description)} */}
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
        <Text style={styles.startButtonText}>{t.freeTests.startTest}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const styles = getStyles(Colors);

  // Show error state if there's an error
  if (testsError) {
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
            refreshing={testsLoading}
            onRefresh={refetchTests}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{t.freeTests.title}</Text>
            <Text style={styles.headerSubtitle}>{t.freeTests.subtitle}</Text>
          </View>
          {!statsLoading && statsData?.data && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                {statsData.data.total_tests} {t.freeTests.testsAvailable || 'tests available'}
              </Text>
            </View>
          )}
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categoriesLoading ? (
            // Show skeleton loaders for categories
            Array.from({ length: 5 }).map((_, index) => (
              <SkeletonLoader key={index} width={80} height={32} style={styles.categorySkeleton} />
            ))
          ) : (
            categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.key && styles.activeCategoryButton
                ]}
                onPress={() => setSelectedCategory(category.key)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.key && styles.activeCategoryText
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Free Tests List */}
        <View style={styles.testsContainer}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === '' ? t.freeTests.allFreeTests : categories.find(c => c.key === selectedCategory)?.label}
            {pagination && ` (${pagination.total})`}
          </Text>

          {testsLoading ? (
            // Show skeleton loaders for tests
            Array.from({ length: 3 }).map((_, index) => (
              <View key={index} style={styles.testCard}>
                <SkeletonLoader width="100%" height={20} style={{ marginBottom: 8 }} />
                <SkeletonLoader width="80%" height={16} style={{ marginBottom: 16 }} />
                <View style={styles.testStats}>
                  <SkeletonLoader width={60} height={16} />
                  <SkeletonLoader width={60} height={16} />
                  <SkeletonLoader width={60} height={16} />
                </View>
                <SkeletonLoader width="100%" height={48} style={{ marginTop: 16, borderRadius: 12 }} />
              </View>
            ))
          ) : freeTests.length === 0 ? (
            renderEmptyState()
          ) : (
            freeTests.map(renderTestCard)
          )}

          {/* Load More Button */}
          {pagination && pagination.page < pagination.totalPages && (
            <TouchableOpacity
              style={[styles.loadMoreButton, { borderColor: Colors.primary }]}
              onPress={() => setPage(prev => prev + 1)}
              disabled={testsLoading}
            >
              {testsLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={[styles.loadMoreText, { color: Colors.primary }]}>
                  {t.common.loadMore || 'Load More'}
                </Text>
              )}
            </TouchableOpacity>
          )}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSubtle,
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light,
    borderWidth: 1,
    borderColor: Colors.muted,
  },
  activeCategoryButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSubtle,
  },
  activeCategoryText: {
    color: Colors.white,
  },
  testsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  testCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  testHeader: {
    marginBottom: 20,
  },
  testTitleContainer: {
    marginBottom: 0,
  },
  testTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  testDescription: {
    fontSize: 14,
    color: Colors.textSubtle,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.chip,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSubtle,
  },
  testStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: Colors.textSubtle,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  centerContainer: {
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
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    marginTop: 8,
  },
  statsText: {
    fontSize: 14,
    color: Colors.textSubtle,
  },
  categorySkeleton: {
    borderRadius: 16,
    marginRight: 12,
  },
  loadMoreButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '600',
  },
});