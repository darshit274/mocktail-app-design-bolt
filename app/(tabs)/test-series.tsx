import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Star, Clock, Users, Play, Lock, CircleCheck as CheckCircle, ShoppingCart, Gift, AlertCircle, ChevronRight, BookOpen, Award } from 'lucide-react-native';
import { router } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetDynamicTestSeriesQuery, DynamicTestSeries, convertDynamicSeriesToOldFormat } from '@/store/api/dynamicHierarchyApi';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useMultipleSubscriptionAccess, getSeriesButtonState } from '@/hooks/useSubscriptionAccess';

export default function TestSeriesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  
  const { theme } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(theme);

  // API calls using new dynamic hierarchy API
  const {
    data: testSeriesResponse,
    error: testSeriesError,
    isLoading: testSeriesLoading,
    refetch: refetchTestSeries,
  } = useGetDynamicTestSeriesQuery({
    page,
    limit: 20,
    search: searchQuery || undefined,
  });

  const testSeries = testSeriesResponse?.data || [];
  const pagination = testSeriesResponse?.pagination;

  // Get subscription access data for all test series
  const seriesIds = testSeries.map(series => series.id);
  const { accessDataMap, loading: accessLoading } = useMultipleSubscriptionAccess(seriesIds);

  const handleTestSeriesSelect = (series: DynamicTestSeries) => {
    // Navigate to categories list for this test series using new dynamic structure
    router.push({
      pathname: '/test/series-detail',
      params: {
        seriesUuid: series.uuid, // Use UUID instead of ID
        title: series.name || series.title || 'Test Series',
      },
    });
  };

  const handlePurchase = (series: DynamicTestSeries) => {
    const accessData = accessDataMap[series.id];
    const buttonState = getSeriesButtonState(accessData);
    
    // Prevent purchase if already subscribed or payment is pending
    if (!buttonState.showEnrollButton || buttonState.isDisabled) {
      return;
    }
    
    router.push({
      pathname: '/payment',
      params: {
        seriesId: series.id.toString(),
        title: series.name || series.title || 'Test Series',
        price: series.price.toString(),
        type: 'test-series',
      },
    });
  };

  const handleStartTest = (series: TestSeries) => {
    // Navigate to test series categories
    handleTestSeriesSelect(series);
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
        onPress={refetchTestSeries}
      >
        <Text style={styles.retryButtonText}>{t.common.retry || 'Retry'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={[styles.centerContainer, { paddingTop: 60 }]}>
      <ShoppingCart size={48} color={Colors.textSubtle} />
      <Text style={[styles.emptyTitle, { color: Colors.textPrimary }]}>
        {t.testSeries?.noSeries || 'No test series available'}
      </Text>
      <Text style={[styles.emptyMessage, { color: Colors.textSubtle }]}>
        {t.testSeries?.checkBackLater || 'Check back later for new series'}
      </Text>
    </View>
  );

  const renderTestSeriesCard = (series: DynamicTestSeries, index: number) => {
    const accessData = accessDataMap[series.id];
    const buttonState = getSeriesButtonState(accessData);
    const hasAccess = accessData?.hasAccess || false;

    return (
    <TouchableOpacity
      key={series.id}
      style={styles.seriesCard}
      onPress={() => handleTestSeriesSelect(series)}
    >
      {/* Header */}
      <View style={styles.seriesHeader}>
        <View style={styles.seriesHeaderLeft}>
          <Text style={styles.seriesTitle}>{series.name || series.title}</Text>
          <View style={styles.ratingContainer}>
            <Star size={14} color={Colors.warning} fill={Colors.warning} />
            <Text style={styles.rating}>{series.rating || 4.5}</Text>
            <Text style={styles.studentsCount}>({series.purchase_count || 0} students)</Text>
          </View>
        </View>
        {hasAccess && (
          <View style={styles.purchasedBadge}>
            <CheckCircle size={16} color={Colors.success} />
            <Text style={styles.purchasedText}>
              {accessData?.accessType === 'free' ? 'Free Access' : 'Enrolled'}
            </Text>
          </View>
        )}
        {accessData?.hasPendingPayment && (
          <View style={[styles.purchasedBadge, { backgroundColor: Colors.warning + '20' }]}>
            <Clock size={16} color={Colors.warning} />
            <Text style={[styles.purchasedText, { color: Colors.warning }]}>Pending Payment</Text>
          </View>
        )}
      </View>

      {/* Description */}
      {series.description && (
        <Text style={styles.seriesDescription} numberOfLines={2}>{series.description}</Text>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Clock size={16} color={Colors.textSubtle} />
          <Text style={styles.statText}>12 months</Text>
        </View>
        <View style={styles.statItem}>
          <Play size={16} color={Colors.textSubtle} />
          <Text style={styles.statText}>{series.tests_count || series.total_tests || 0} tests</Text>
        </View>
        <View style={styles.statItem}>
          <Award size={16} color={Colors.textSubtle} />
          <Text style={styles.statText}>Full Access</Text>
        </View>
      </View>

      {/* Price and Action */}
      <View style={styles.actionContainer}>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>₹{series.price}</Text>
          {series.original_price && series.original_price > series.price && (
            <>
              <Text style={styles.originalPrice}>₹{series.original_price}</Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  {Math.round((1 - series.price / series.original_price) * 100)}% OFF
                </Text>
              </View>
            </>
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          {hasAccess ? (
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => handleTestSeriesSelect(series)}
            >
              <Text style={styles.startButtonText}>
                {buttonState.buttonText === 'Start Free' ? 'Start Free' : 'Continue'}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              {buttonState.showEnrollButton ? (
                <TouchableOpacity 
                  style={[
                    styles.purchaseButton,
                    buttonState.isDisabled && { opacity: 0.5 }
                  ]}
                  onPress={() => handlePurchase(series)}
                  disabled={buttonState.isDisabled}
                >
                  {buttonState.buttonType === 'pending' ? (
                    <Clock size={16} color={Colors.white} />
                  ) : (
                    <Lock size={16} color={Colors.white} />
                  )}
                  <Text style={styles.purchaseButtonText}>
                    {buttonState.buttonText}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.startButton}
                  onPress={() => handleTestSeriesSelect(series)}
                >
                  <Text style={styles.startButtonText}>Start Free</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
  };

  const styles = getStyles(Colors);

  // Show error state if there's an error
  if (testSeriesError) {
    return (
      <SafeAreaView style={styles.container}>
        {renderErrorState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Test Series</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textSubtle} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search test series..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Test Series List */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={testSeriesLoading}
            onRefresh={refetchTestSeries}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {testSeriesLoading ? (
          // Show skeleton loaders for test series
          Array.from({ length: 3 }).map((_, index) => (
            <View key={index} style={styles.seriesCard}>
              <SkeletonLoader width="70%" height={20} style={{ marginBottom: 8 }} />
              <SkeletonLoader width="100%" height={16} style={{ marginBottom: 16 }} />
              <View style={styles.statsContainer}>
                <SkeletonLoader width={80} height={16} />
                <SkeletonLoader width={80} height={16} />
                <SkeletonLoader width={80} height={16} />
              </View>
              <SkeletonLoader width="100%" height={48} style={{ marginTop: 16, borderRadius: 12 }} />
            </View>
          ))
        ) : testSeries.length === 0 ? (
          renderEmptyState()
        ) : (
          testSeries.map((series, index) => renderTestSeriesCard(series, index))
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.muted,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  filterButton: {
    padding: 8,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.light,
    borderRadius: 20,
  },
  backButtonText: {
    color: Colors.primaryLight,
    fontWeight: '500',
    fontSize: 14,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.cardBackground,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.muted,
    maxHeight: 60,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: Colors.primaryLight,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSubtle,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  categoriesSection: {
    flex: 1,
  },
  testSeriesSection: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  categoryCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.muted,
  },
  categoryCardSelected: {
    borderColor: Colors.primaryLight,
    borderWidth: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  subCategoriesPreview: {
    borderTopWidth: 1,
    borderTopColor: Colors.muted,
    paddingTop: 12,
  },
  subCategoriesTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subCategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  subCategoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
    maxWidth: 120,
  },
  subCategoryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  moreSubCategories: {
    fontSize: 11,
    fontStyle: 'italic',
    alignSelf: 'center',
    marginLeft: 4,
  },
  seriesCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  seriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  seriesHeaderLeft: {
    flex: 1,
  },
  seriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginLeft: 4,
  },
  studentsCount: {
    fontSize: 12,
    color: Colors.textSubtle,
    marginLeft: 4,
  },
  purchasedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.badgeSuccessBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  purchasedText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
    marginLeft: 4,
  },
  seriesDescription: {
    fontSize: 14,
    color: Colors.textSubtle,
    lineHeight: 20,
    marginBottom: 12,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  topicChip: {
    backgroundColor: Colors.chip,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  topicText: {
    fontSize: 12,
    color: Colors.primaryLight,
    fontWeight: '500',
  },
  moreTopics: {
    fontSize: 12,
    color: Colors.textSubtle,
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    fontSize: 12,
    color: Colors.textSubtle,
    marginLeft: 4,
  },
  actionContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginVertical: -4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  currency: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSubtle,
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.textSubtle,
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  discountBadge: {
    backgroundColor: Colors.badgeDangerBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  discountText: {
    fontSize: 10,
    color: Colors.danger,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  freeTestButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  freeTestText: {
    fontSize: 14,
    color: Colors.primaryLight,
    fontWeight: '500',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  purchaseButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  startButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  categorySkeleton: {
    borderRadius: 16,
    marginRight: 12,
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
});
