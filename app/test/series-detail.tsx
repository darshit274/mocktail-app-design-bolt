import DisplayHtml from '@/components/common/DisplayHtml';
import { SubscriptionRequiredModal } from '@/components/modals/SubscriptionRequiredModal';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getSeriesButtonState, useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import {
  DynamicCategory,
  useGetDynamicTestSeriesByUuidQuery
} from '@/store/api/dynamicHierarchyApi';
import { useGetTestHistoryQuery } from '@/store/api/userApi';
import { getTheme } from '@/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, BookOpen, ChevronRight, FileQuestion, Folder, Lock } from 'lucide-react-native';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function SeriesDetailScreen() {
  const { seriesUuid, title } = useLocalSearchParams<{ seriesUuid: string; title: string }>();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [lockedCategoryName, setLockedCategoryName] = useState<string>('');

  const { theme } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(theme);

  // API calls using new dynamic hierarchy API
  const {
    data: seriesData,
    error: seriesError,
    isLoading: seriesLoading,
    refetch: refetchSeries,
  } = useGetDynamicTestSeriesByUuidQuery(seriesUuid!, {
    skip: !seriesUuid,
  });

  // Extract series and categories data
  const series = seriesData?.data;
  const categories = series?.categories || [];


  // Use is_subscribed from series data directly (faster, no extra API call)

  // Only fetch subscription details if needed for button state
  const { accessData, loading: accessLoading, error: accessError } = useSubscriptionAccess(series?.id);
  const buttonState = getSeriesButtonState(accessData);
  const hasAccess = series?.is_subscribed || accessData?.hasAccess || false;

  // Fetch test history to check completion status
  const { data: testHistoryData } = useGetTestHistoryQuery({ page: 1, limit: 100 });

  // Debug: Log test history data
  React.useEffect(() => {
    if (testHistoryData) {
      console.log('📊 [SeriesDetail] Test History Data:', JSON.stringify(testHistoryData, null, 2));
    }
  }, [testHistoryData]);

  // Helper to check if a category test is completed (MATCHES WEB APP LOGIC)
  const isCategoryCompleted = (categoryUuid: string) => {
    if (!testHistoryData || !testHistoryData.data || !testHistoryData.data.sessions) {
      return false;
    }


    // Check multiple UUID fields to match (same as web app logic)
    const completed = testHistoryData?.data?.sessions?.some((item: any) => {
      const matchesCategoryUuid = item.categoryUuid === categoryUuid;
      const matchesTestUuid = item.testUuid === categoryUuid;
      return matchesCategoryUuid || matchesTestUuid;
    });

    console.log(`✅ [SeriesDetail] Category ${categoryUuid} completed:`, completed);
    return completed;
  };

  // Helper to check if category is accessible
  const isCategoryAccessible = (category: DynamicCategory) => {
    const isPaidSeries = series?.pricing_type === 'paid';

    // Free series - all accessible
    if (!isPaidSeries) return true;

    // Paid series with subscription - all accessible
    if (hasAccess) return true;

    // Paid series without subscription
    // Containers are always navigable
    if (category.node_type === 'container') return true;

    // Question holders - check is_free_in_paid_series
    if (category.node_type === 'question_holder') {
      return category.is_free_in_paid_series === true;
    }

    // Default: not accessible
    return false;
  };

  const handleCategorySelect = (category: DynamicCategory) => {
    const isAccessible = isCategoryAccessible(category);
    const isPaidSeries = series?.pricing_type === 'paid';

    // If not accessible, show modal
    if (isPaidSeries && !isAccessible) {
      setLockedCategoryName(category.name);
      setShowSubscriptionModal(true);
      return;
    }

    // Navigate to category detail
    router.push({
      pathname: '/test/category-detail',
      params: {
        categoryUuid: category.uuid,
        categoryName: category.name,
        seriesUuid: seriesUuid!,
      },
    });
  };

  const handleViewPlans = () => {
    setShowSubscriptionModal(false);
    handlePurchase();
  };

  const handlePurchase = () => {
    if (!series) return;

    // Check if user already has access
    if (hasAccess) {
      Toast.show({
        type: 'info',
        text1: 'Already Enrolled',
        text2: 'You already have access to this test series.',
      });
      return;
    }

    // Navigate to payment
    router.push({
      pathname: '/payment',
      params: {
        seriesId: series.id,
        title: series.title || series.name,
        price: series.price,
        type: 'test-series',
      },
    });
  };

  const handleStartFreeTest = () => {
    // In dynamic hierarchy, we navigate to first category that might have free content
    if (categories && categories.length > 0) {
      // Navigate to the first category to explore content
      router.push({
        pathname: '/test/category-detail',
        params: {
          categoryUuid: categories[0].uuid,
          categoryName: categories[0].name,
          seriesUuid: series.uuid,
        },
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'No Categories Available',
        text2: 'No free tests are available in this series.',
      });
    }
  };

  const handleViewResults = (categoryUuid: string, categoryName: string) => {
    router.push({
      pathname: '/test/test-attempts',
      params: {
        categoryUuid,
        categoryName,
        seriesUuid: seriesUuid!,
      },
    });
  };

  const renderCategoryCard = (category: DynamicCategory, index: number) => {
    const isPaidSeries = series?.pricing_type === 'paid';
    const isAccessible = isCategoryAccessible(category);
    const isQuestionHolder = category.node_type === 'question_holder';
    const isFreeInPaid = isPaidSeries && !hasAccess && isQuestionHolder && category.is_free_in_paid_series === true;
    const isLocked = isPaidSeries && !hasAccess && isQuestionHolder && !isAccessible;
    const isCompleted = isCategoryCompleted(category.uuid);

    // Hide unset items
    if (category.node_type === 'unset') return null;

    return (
      <View
        key={category.uuid}
        style={[styles.categoryCard, isLocked && styles.lockedTestCard]}
      >
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => handleCategorySelect(category)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.categoryIcon,
            { backgroundColor: isLocked ? Colors.textSubtle : Colors.primary }
          ]}>
            {isLocked ? (
              <Lock size={20} color={Colors.white} />
            ) : category.node_type === 'question_holder' ? (
              <FileQuestion size={20} color={Colors.white} />
            ) : (
              <Folder size={20} color={Colors.white} />
            )}
          </View>
          <View style={styles.categoryInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8 }}>
              <Text style={[
                styles.categoryName,
                { color: isLocked ? Colors.textSubtle : Colors.textPrimary, flex: 1 }
              ]}>
                {category.name}
              </Text>
              {isCompleted && (
                <View style={{
                  backgroundColor: Colors.success,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: 'white' }}>COMPLETED</Text>
                </View>
              )}
              {isFreeInPaid && (
                <View style={{
                  backgroundColor: Colors.success,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: 'white' }}>FREE</Text>
                </View>
              )}
              {isLocked && (
                <View style={{
                  backgroundColor: Colors.error,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: 'white' }}>LOCKED</Text>
                </View>
              )}
            </View>
            <View style={styles.categoryStats}>
              <Text style={[styles.categoryStatsText, { color: Colors.textSubtle }]}>
                {category.has_subcategories
                  ? `${category.subcategories_count} subcategories`
                  : `${category.questions_count} questions`}
              </Text>
            </View>
            {category.description && (
              <DisplayHtml
                source={{
                  html: category.description || ''
                }}
              />
            )}
          </View>
          <ChevronRight size={20} color={isLocked ? Colors.textTertiary : Colors.textSubtle} />
        </TouchableOpacity>

        {/* Action button for question holders */}
        {isQuestionHolder && !isLocked && (
          <View style={styles.singleButtonContainer}>
            {isCompleted ? (
              <TouchableOpacity
                style={[styles.singleActionButton, { backgroundColor: Colors.success }]}
                onPress={() => handleViewResults(category.uuid, category.name)}
              >
                <Text style={styles.singleActionButtonText}>Result</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.singleActionButton, { backgroundColor: Colors.textSubtle }]}
                onPress={() => handleCategorySelect(category)}
              >
                <Text style={styles.singleActionButtonText}>Take Test</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const styles = getStyles(Colors);

  if (seriesLoading || !series) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <SkeletonLoader width={150} height={20} />
          </View>
        </View>

        {/* Loading Content */}
        <ScrollView style={styles.content}>
          <View style={styles.seriesInfo}>
            <SkeletonLoader width="80%" height={28} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="100%" height={16} style={{ marginBottom: 16 }} />
            <SkeletonLoader width="60%" height={16} style={{ marginBottom: 16 }} />
          </View>

          <View style={styles.categoriesSection}>
            <SkeletonLoader width={120} height={20} style={{ marginBottom: 16 }} />
            {Array.from({ length: 3 }).map((_, index) => (
              <View key={index} style={styles.categoryCard}>
                <SkeletonLoader width="100%" height={60} style={{ borderRadius: 12 }} />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (seriesError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>

        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: Colors.textPrimary }]}>
            Failed to load test series
          </Text>
          <Text style={[styles.errorMessage, { color: Colors.textSubtle }]}>
            Please try again later
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Colors.primary }]}
            onPress={refetchSeries}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Subscription Required Modal */}
      <SubscriptionRequiredModal
        visible={showSubscriptionModal}
        testName={lockedCategoryName}
        seriesName={series?.name || series?.title}
        onViewPlans={handleViewPlans}
        onCancel={() => setShowSubscriptionModal(false)}
        Colors={Colors}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {series.name || series.title}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={seriesLoading}
            onRefresh={() => {
              refetchSeries();
            }}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Series Information */}
        <View style={styles.seriesInfo}>
          <Text style={[styles.seriesTitle, { color: Colors.textPrimary }]}>
            {series.name || series.title}
          </Text>

          {(series.description || series.description_gujarati) && (
            <DisplayHtml
              source={{
                html: t.language === 'gujarati' && series.description_gujarati
                  ? series.description_gujarati
                  : series.description || ''
              }}
            />
          )}

          {/* Access Information */}
          <View style={styles.accessInfo}>
            {hasAccess ? (
              <View style={[styles.accessBadge, { backgroundColor: Colors.badgeSuccessBg }]}>
                <Text style={[styles.accessText, { color: Colors.success }]}>
                  ✓ {series.pricing_type === 'free' ? 'Free access available' : 'You have access to this series'}
                </Text>
              </View>
            ) : series.pricing_type === 'paid' ? (
              <View style={[styles.accessBadge, { backgroundColor: Colors.badgeWarningBg }]}>
                <Text style={[styles.accessText, { color: Colors.warning }]}>
                  🔒 Purchase required for full access
                </Text>
              </View>
            ) : null}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <View style={styles.priceContainer}>
              {series.pricing_type === 'free' || series.is_free_in_paid_series || series.pricing_type === 'previous_years_question_papers' ? (
                <Text style={[styles.price, { color: Colors.success }]}>Free</Text>
              ) : (
                <>
                  <Text style={[styles.price, { color: Colors.textPrimary }]}>
                    ₹{series.price}
                  </Text>
                  <Text style={[styles.currency, { color: Colors.textSubtle }]}>
                    {series.currency || 'INR'}
                  </Text>
                </>
              )}
            </View>

            <View style={styles.buttonContainer}>
              {hasAccess ? (
                <TouchableOpacity
                  style={[styles.continueButton, { backgroundColor: Colors.success }]}
                  onPress={() => {
                    // Navigate to first available category
                    if (categories.length > 0) {
                      handleCategorySelect(categories[0]);
                    }
                  }}
                >
                  <Text style={[styles.continueButtonText, { color: Colors.white }]}>
                    Continue Learning
                  </Text>
                </TouchableOpacity>
              ) : series.pricing_type === 'free' || series.pricing_type === 'previous_years_question_papers' ? (
                <TouchableOpacity
                  style={[styles.continueButton, { backgroundColor: Colors.success }]}
                  onPress={handleStartFreeTest}
                >
                  <Text style={[styles.continueButtonText, { color: Colors.white }]}>
                    Start Learning
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.purchaseButton, { backgroundColor: Colors.primaryLight }]}
                  onPress={handlePurchase}
                >
                  <Lock size={16} color={Colors.white} />
                  <Text style={[styles.purchaseButtonText, { color: Colors.white }]}>
                    Enroll Now
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Tests Section */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>
              Available Categories
            </Text>
            <Text style={[styles.sectionSubtitle, { color: Colors.textSubtle }]}>
              {categories.length} categories available
            </Text>
          </View>

          {categories.length === 0 ? (
            <View style={styles.emptyState}>
              <BookOpen size={48} color={Colors.textSubtle} />
              <Text style={[styles.emptyTitle, { color: Colors.textPrimary }]}>
                No categories available
              </Text>
              <Text style={[styles.emptyMessage, { color: Colors.textSubtle }]}>
                Categories will be added soon
              </Text>
            </View>
          ) : (
            categories.map((category, index) => renderCategoryCard(category, index))
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.muted,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  seriesInfo: {
    padding: 20,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.muted,
  },
  seriesTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  seriesDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
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
    fontSize: 14,
    marginLeft: 4,
  },
  accessInfo: {
    marginBottom: 16,
  },
  accessBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  accessText: {
    fontSize: 14,
    fontWeight: '500',
  },
  demoText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
  },
  currency: {
    fontSize: 16,
    marginLeft: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  freeTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
  },
  freeTestText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  continueButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  categoriesSection: {
    padding: 20,
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
  },
  categoryCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  lockedTestCard: {
    opacity: 0.6,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  categoryStats: {
    flexDirection: 'row',
  },
  categoryStatsText: {
    fontSize: 12,
  },
  categoryDescription: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  bestScore: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
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
  singleButtonContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.muted,
    alignItems: 'flex-end',
  },
  singleActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  singleActionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
  },
});