import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Clock, BookOpen, Award, AlertCircle, ChevronRight, Gift } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useGetAllFreeInPaidCategoriesQuery, FreeInPaidCategory } from '@/store/api/freeInPaidApi';

export default function FreeInPaidTestsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(theme);
  const [page, setPage] = useState(1);

  // API Integration
  const {
    data,
    error,
    isLoading,
    refetch,
  } = useGetAllFreeInPaidCategoriesQuery({
    page,
    limit: 12,
  });

  const freeCategories = data?.data?.categories || [];
  const pagination = data?.data?.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return Colors.success;
      case 'medium': return Colors.warning;
      case 'hard': return Colors.danger;
      default: return Colors.textSubtle;
    }
  };

  const handleStartQuiz = (category: FreeInPaidCategory) => {
    // Navigate to category detail page with proper parameters
    router.push({
      pathname: '/test/category-detail',
      params: {
        categoryUuid: category.uuid,
        categoryName: category.name,
        seriesUuid: category.series.uuid,
      },
    });
  };

  const handleRefresh = async () => {
    await refetch();
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
        onPress={handleRefresh}
      >
        <Text style={styles.retryButtonText}>{t.common.retry || 'Retry'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={[styles.centerContainer, { paddingTop: 60 }]}>
      <Gift size={48} color={Colors.textSubtle} />
      <Text style={[styles.emptyTitle, { color: Colors.textPrimary }]}>
        No Free Samples Available
      </Text>
      <Text style={[styles.emptyMessage, { color: Colors.textSubtle }]}>
        There are currently no free quiz samples from paid test series. Check back later!
      </Text>
    </View>
  );

  const renderCategoryCard = (category: FreeInPaidCategory) => (
    <TouchableOpacity
      key={category.uuid}
      style={[styles.categoryCard, { backgroundColor: Colors.cardBackground }]}
      onPress={() => handleStartQuiz(category)}
    >
      {/* Series Badge */}
      <View style={styles.cardHeader}>
        <View style={[styles.seriesBadge, { backgroundColor: Colors.primary + '20' }]}>
          <BookOpen size={14} color={Colors.primary} />
          <Text style={[styles.seriesText, { color: Colors.primary }]} numberOfLines={1}>
            {category.series.title}
          </Text>
        </View>
        <View style={[styles.freeBadge, { backgroundColor: Colors.success + '20' }]}>
          <Gift size={12} color={Colors.success} />
          <Text style={[styles.freeText, { color: Colors.success }]}>FREE</Text>
        </View>
      </View>

      {/* Category Title */}
      <Text style={[styles.categoryTitle, { color: Colors.textPrimary }]} numberOfLines={2}>
        {category.name}
      </Text>

      {/* Description */}
      {category.description && (
        <Text style={[styles.categoryDescription, { color: Colors.textSubtle }]} numberOfLines={2}>
          {category.description}
        </Text>
      )}

      {/* Breadcrumb Path */}
      <View style={[styles.breadcrumbContainer, { backgroundColor: Colors.light }]}>
        <Text style={[styles.breadcrumbText, { color: Colors.textSubtle }]} numberOfLines={1}>
          {t.language === 'gujarati' && category.breadcrumb_gujarati
            ? category.breadcrumb_gujarati
            : category.breadcrumb}
        </Text>
      </View>

      {/* Metadata */}
      <View style={styles.metadataContainer}>
        <View style={styles.metadataRow}>
          <View style={styles.metadataItem}>
            <BookOpen size={16} color={Colors.textSubtle} />
            <Text style={[styles.metadataText, { color: Colors.textSubtle }]}>
              {category.questions_count} Questions
            </Text>
          </View>
          <View style={styles.metadataItem}>
            <Clock size={16} color={Colors.textSubtle} />
            <Text style={[styles.metadataText, { color: Colors.textSubtle }]}>
              {category.test_duration_minutes} mins
            </Text>
          </View>
        </View>
        <View style={[styles.difficultyBadge, { borderColor: getDifficultyColor(category.difficulty_level) }]}>
          <Text style={[styles.difficultyText, { color: getDifficultyColor(category.difficulty_level) }]}>
            {category.difficulty_level.charAt(0).toUpperCase() + category.difficulty_level.slice(1)}
          </Text>
        </View>
      </View>

      {/* CTA Button */}
      <LinearGradient
        colors={[Colors.success, Colors.success + 'DD']}
        style={styles.startButton}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Play size={16} color={Colors.white} fill={Colors.white} />
        <Text style={styles.startButtonText}>Start Free Quiz</Text>
        <ChevronRight size={16} color={Colors.white} />
      </LinearGradient>

      {/* Series Price Tag */}
      <View style={styles.priceTag}>
        <Text style={[styles.priceText, { color: Colors.textSubtle }]}>
          Full series: {category.series.currency} {category.series.price}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const styles = getStyles(Colors);

  // Show error state if there's an error
  if (error) {
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
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Gift size={28} color={Colors.primary} />
          </View>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>
              Free Samples
            </Text>
            <Text style={[styles.headerSubtitle, { color: Colors.textSubtle }]}>
              Try before you buy - Free quizzes from premium series
            </Text>
          </View>
        </View>

        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: Colors.info + '15' }]}>
          <Award size={20} color={Colors.info} />
          <Text style={[styles.infoBannerText, { color: Colors.info }]}>
            These are FREE samples from our PAID test series
          </Text>
        </View>

        {/* Categories Grid */}
        <View style={styles.categoriesContainer}>
          <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>
            Available Free Samples
            {pagination.total > 0 && ` (${pagination.total})`}
          </Text>

          {isLoading ? (
            // Skeleton Loaders
            <View style={styles.gridContainer}>
              {Array.from({ length: 6 }).map((_, index) => (
                <View key={index} style={[styles.categoryCard, { backgroundColor: Colors.cardBackground }]}>
                  <SkeletonLoader width="100%" height={20} style={{ marginBottom: 8 }} />
                  <SkeletonLoader width="80%" height={16} style={{ marginBottom: 8 }} />
                  <SkeletonLoader width="100%" height={16} style={{ marginBottom: 16 }} />
                  <View style={styles.metadataRow}>
                    <SkeletonLoader width={80} height={16} />
                    <SkeletonLoader width={80} height={16} />
                  </View>
                  <SkeletonLoader width="100%" height={48} style={{ marginTop: 16, borderRadius: 12 }} />
                </View>
              ))}
            </View>
          ) : freeCategories.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.gridContainer}>
              {freeCategories.map(renderCategoryCard)}
            </View>
          )}

          {/* Load More Button */}
          {pagination && pagination.page < pagination.totalPages && (
            <TouchableOpacity
              style={[styles.loadMoreButton, { borderColor: Colors.primary }]}
              onPress={() => setPage(prev => prev + 1)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={[styles.loadMoreText, { color: Colors.primary }]}>
                  Load More Samples
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  gridContainer: {
    gap: 16,
  },
  categoryCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  seriesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    flex: 1,
  },
  seriesText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  freeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 24,
  },
  categoryDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  breadcrumbContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  breadcrumbText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metadataContainer: {
    marginBottom: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 14,
    fontWeight: '500',
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  priceTag: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  priceText: {
    fontSize: 12,
    fontWeight: '500',
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
    color: '#FFFFFF',
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
  loadMoreButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
