import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Folder, FileText, Play, Lock, ChevronRight, CheckCircle } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { useGetDynamicCategoryByUuidQuery } from '@/store/api/dynamicHierarchyApi';
import { useGetTestHistoryQuery } from '@/store/api/userApi';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { LoadingState, ErrorState } from '@/components/shared';
import { SubscriptionRequiredModal } from '@/components/modals/SubscriptionRequiredModal';
import logger from '@/utils/logger';

const categoryLogger = logger.createLogger('CategoryDetail');

export default function CategoryDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    categoryUuid: string;
    categoryName: string;
    seriesUuid: string;
  }>();

  const [language, setLanguage] = useState<'english' | 'gujarati'>('gujarati');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [lockedTestName, setLockedTestName] = useState<string>('');

  const { theme } = useTheme();
  const Colors = getTheme(theme);
  const styles = getStyles(Colors);

  const {
    data: categoryData,
    isLoading,
    error,
    refetch,
  } = useGetDynamicCategoryByUuidQuery(params.categoryUuid);

  // Get subscription access for the test series
  const {
    accessData,
    loading: checkingAccess
  } = useSubscriptionAccess(params.seriesUuid);

  const hasSeriesAccess = accessData?.hasAccess || false;

  // Fetch test history to check if this test is completed
  const { data: testHistoryData } = useGetTestHistoryQuery({ page: 1, limit: 100 });

  // Debug logging
  React.useEffect(() => {
    if (testHistoryData) {
      categoryLogger.debug('Test History Data:', {
        totalSessions: testHistoryData?.data?.sessions?.length,
        sessions: testHistoryData?.data?.sessions,
        currentCategoryUuid: params.categoryUuid,
      });
    }
  }, [testHistoryData, params.categoryUuid]);

  // Check if current category test is completed
  const isTestCompleted = testHistoryData?.data?.sessions?.some(
    (session: any) => {
      const matches = session.test?.uuid === params.categoryUuid || session.uuid === params.categoryUuid;
      categoryLogger.debug('Checking session:', {
        sessionUuid: session.uuid,
        testUuid: session.test?.uuid,
        categoryUuid: params.categoryUuid,
        matches,
      });
      return matches;
    }
  ) || false;

  categoryLogger.info('Test completion status:', {
    categoryUuid: params.categoryUuid,
    isCompleted: isTestCompleted,
  });

  // Debug: Log render conditions
  React.useEffect(() => {
    if (categoryData?.data) {
      categoryLogger.debug('Render conditions:', {
        content_type: categoryData.data.content_type,
        hasContent: !!categoryData.data.content,
        isArray: Array.isArray(categoryData.data.content),
        contentLength: Array.isArray(categoryData.data.content) ? categoryData.data.content.length : 'N/A',
        isTestCompleted,
        categoryName: categoryData.data.category?.name,
      });
    }
  }, [categoryData, isTestCompleted]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LoadingState message="Loading category..." Colors={Colors} fullScreen />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ErrorState
          title="Error loading category"
          message="Unable to load category details. Please try again."
          onRetry={() => refetch()}
          retryText="Retry"
          Colors={Colors}
          fullScreen
        />
      </SafeAreaView>
    );
  }

  if (!categoryData?.data) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ErrorState
          title="Category not found"
          message="The requested category could not be found."
          onRetry={() => router.back()}
          retryText="Go Back"
          Colors={Colors}
          fullScreen
        />
      </SafeAreaView>
    );
  }

  const { category, content_type, content, breadcrumb, statistics } = categoryData.data;

  // Helper to determine if a subcategory is accessible
  const isSubcategoryAccessible = (subcategory: any) => {
    const isPaidSeries = categoryData?.data?.category?.testSeries?.pricing_type === 'paid';

    // Free series - all accessible
    if (!isPaidSeries) return true;

    // Paid series with subscription - all accessible
    if (hasSeriesAccess) return true;

    // Paid series without subscription
    // Containers are always navigable (no lock)
    if (subcategory.node_type === 'container') return true;

    // Question holders - check is_free_in_paid_series
    if (subcategory.node_type === 'question_holder') {
      return subcategory.is_free_in_paid_series === true;
    }

    // Default: not accessible
    return false;
  };

  const handleSubcategoryPress = (subcategory: any) => {
    const isPaidSeries = categoryData?.data?.category?.testSeries?.pricing_type === 'paid';
    const isAccessible = isSubcategoryAccessible(subcategory);

    // If not accessible, show stylish subscription modal
    if (isPaidSeries && !isAccessible) {
      // TODO: Track analytics for locked test click
      setLockedTestName(subcategory.name);
      setShowSubscriptionModal(true);
      return;
    }

    // Navigate to subcategory
    router.push({
      pathname: '/test/category-detail',
      params: {
        categoryUuid: subcategory.uuid,
        categoryName: subcategory.name,
        seriesUuid: params.seriesUuid,
      },
    });
  };

  const handleViewPlans = () => {
    setShowSubscriptionModal(false);
    router.push({
      pathname: '/test/series-detail',
      params: { seriesId: params.seriesUuid }
    });
  };

  const handleViewResults = () => {
    categoryLogger.info('View Results button pressed');
    router.push({
      pathname: '/test/test-attempts',
      params: {
        categoryUuid: params.categoryUuid,
        categoryName: params.categoryName,
        seriesUuid: params.seriesUuid,
      },
    });
  };

  const handleStartQuiz = () => {
    categoryLogger.info('Start Quiz button pressed');
    categoryLogger.debug('State check', {
      content_type,
      contentLength: Array.isArray(content) ? content.length : 'not array',
      pricing_type: categoryData?.data?.category?.testSeries?.pricing_type,
      hasSeriesAccess,
      checkingAccess
    });

    // Check if category has questions first
    if (!(content_type === 'questions' && Array.isArray(content) && content.length > 0)) {
      categoryLogger.warn('No questions available at this level');
      Toast.show({
        type: 'error',
        text1: 'No Questions at This Level',
        text2: 'Please navigate through subcategories to find questions.',
      });
      return;
    }

    // Check if this is a paid series and user has access
    if (categoryData?.data?.category?.testSeries?.pricing_type === 'paid' && !hasSeriesAccess) {
      categoryLogger.warn('Subscription required for quiz access');
      Alert.alert(
        'Subscription Required',
        'This test requires a subscription. Please purchase the test series to access this content.',
        [
          {
            text: 'View Plans',
            onPress: () => router.push({
              pathname: '/test/series-detail',
              params: { seriesId: params.seriesUuid }
            })
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      return;
    }

    // All checks passed, navigate to quiz
    categoryLogger.info('All checks passed, navigating to quiz');
    router.push({
      pathname: '/test/quiz',
      params: {
        categoryUuid: params.categoryUuid,
        categoryName: params.categoryName,
        seriesUuid: params.seriesUuid,
        language,
      },
    });
  };

  const renderBreadcrumb = () => (
    <View style={styles.breadcrumbContainer}>
      <View style={styles.breadcrumbHeader}>
        <Text style={styles.breadcrumbTitle}>
          Navigation Path (Level {breadcrumb.length - 1} of 6+)
        </Text>
        <Text style={styles.breadcrumbDepth}>
          📍 Current: Level {breadcrumb.length - 1}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.breadcrumbScroll}>
        {breadcrumb.map((item, index) => (
          <View key={item.uuid} style={styles.breadcrumbItem}>
            <View style={styles.breadcrumbLevel}>
              <Text style={styles.breadcrumbLevelText}>L{index}</Text>
            </View>
            <Text style={styles.breadcrumbText}>
              {item.name}
            </Text>
            {index < breadcrumb.length - 1 && (
              <Text style={styles.breadcrumbSeparator}> ▶ </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderContent = () => {
    if (content_type === 'categories' && Array.isArray(content)) {
      const isPaidSeries = categoryData?.data?.category?.testSeries?.pricing_type === 'paid';

      // Filter out unset items completely
      const visibleContent = content.filter((subcategory: any) =>
        subcategory.node_type !== 'unset'
      );

      return (
        <View style={styles.contentContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Subcategories (Level {category.hierarchy_level + 1})
            </Text>
            <Text style={styles.sectionSubtitle}>
              Navigate deeper to find questions - this hierarchy has {statistics?.total_questions_recursive || 0} questions at deeper levels
            </Text>
          </View>
          {visibleContent.map((subcategory: any) => {
            const isAccessible = isSubcategoryAccessible(subcategory);
            const isQuestionHolder = subcategory.node_type === 'question_holder';
            const isFreeInPaid = isPaidSeries && !hasSeriesAccess && isQuestionHolder && subcategory.is_free_in_paid_series === true;
            const isLocked = isPaidSeries && !hasSeriesAccess && isQuestionHolder && !isAccessible;

            return (
              <TouchableOpacity
                key={subcategory.uuid}
                style={[
                  styles.categoryItem,
                  isLocked && styles.categoryItemLocked
                ]}
                onPress={() => handleSubcategoryPress(subcategory)}
                activeOpacity={0.7}
              >
                {/* Left: Icon Section */}
                <View style={[
                  styles.categoryIconContainer,
                  isLocked && styles.categoryIconContainerLocked
                ]}>
                  {isLocked ? (
                    <Lock size={22} color={Colors.textSecondary} />
                  ) : (
                    <Folder size={22} color={Colors.primary} />
                  )}
                </View>

                {/* Middle: Content Section */}
                <View style={styles.categoryContent}>
                  <View style={styles.categoryTitleRow}>
                    <Text
                      style={[
                        styles.categoryTitle,
                        isLocked && styles.categoryTitleLocked
                      ]}
                      numberOfLines={2}
                    >
                      {language === 'gujarati'
                        ? (subcategory.name_gujarati || subcategory.name)
                        : (subcategory.name || subcategory.name_gujarati)}
                    </Text>
                  </View>

                  {/* Badges Row */}
                  <View style={styles.badgesRow}>
                    {isFreeInPaid && (
                      <View style={styles.freeBadge}>
                        <Text style={styles.freeBadgeText}>FREE</Text>
                      </View>
                    )}
                    {isLocked && (
                      <View style={styles.lockedBadge}>
                        <Text style={styles.lockedBadgeText}>LOCKED</Text>
                      </View>
                    )}
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelBadgeText}>Level {subcategory.hierarchy_level}</Text>
                    </View>
                  </View>

                  {/* Stats Row */}
                  {subcategory.total_questions_recursive > 0 && (
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{subcategory.total_questions_recursive}</Text>
                        <Text style={styles.statLabel}>Questions</Text>
                      </View>
                      {subcategory.has_subcategories && (
                        <View style={styles.statDivider} />
                      )}
                      {subcategory.has_subcategories && (
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>{subcategory.subcategories_count}</Text>
                          <Text style={styles.statLabel}>Sub-levels</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Right: Arrow Icon */}
                <View style={styles.categoryArrow}>
                  <ChevronRight
                    size={20}
                    color={isLocked ? Colors.textTertiary : Colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    if (content_type === 'questions' && Array.isArray(content)) {
      return (
        <View style={styles.contentContainer}>
          <View style={styles.questionsHeader}>
            <Text style={styles.sectionTitle}>
              Quiz Available
            </Text>
            <View style={styles.languageToggle}>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  language === 'english' && styles.languageButtonActive,
                ]}
                onPress={() => setLanguage('english')}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    language === 'english' && styles.languageButtonTextActive,
                  ]}
                >
                  EN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  language === 'gujarati' && styles.languageButtonActive,
                ]}
                onPress={() => setLanguage('gujarati')}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    language === 'gujarati' && styles.languageButtonTextActive,
                  ]}
                >
                  ગુ
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quiz Info Card */}
          <View style={styles.quizInfoCard}>
            <View style={styles.quizInfoRow}>
              <FileText size={20} color={Colors.primary} />
              <Text style={styles.quizInfoLabel}>Total Questions</Text>
              <Text style={styles.quizInfoValue}>{content.length}</Text>
            </View>
            <View style={styles.quizInfoRow}>
              <Play size={20} color={Colors.primary} />
              <Text style={styles.quizInfoLabel}>Language</Text>
              <Text style={styles.quizInfoValue}>
                {language === 'gujarati' ? 'ગુજરાતી' : 'English'}
              </Text>
            </View>
          </View>

          {/* Conditional buttons based on completion status */}
          {isTestCompleted ? (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.resultButton, { backgroundColor: Colors.success }]}
                onPress={handleViewResults}
              >
                <CheckCircle size={20} color="white" />
                <Text style={styles.resultButtonText}>View Results</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.retakeButton, { borderColor: Colors.primary }]}
                onPress={handleStartQuiz}
              >
                <Play size={20} color={Colors.primary} />
                <Text style={[styles.retakeButtonText, { color: Colors.primary }]}>Re-attempt</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.startQuizButton} onPress={handleStartQuiz}>
              <Play size={20} color="white" />
              <Text style={styles.startQuizText}>Take Test</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    // Show guidance for navigating deeper into the hierarchy
    return (
      <View style={styles.emptyContainer}>
        <Folder size={48} color={Colors.textSecondary} />
        <Text style={styles.emptyText}>Continue Navigation</Text>
        <Text style={styles.emptySubtext}>
          You're currently at Level {category.hierarchy_level}. This level contains subcategories but no questions.
        </Text>
        <Text style={styles.emptySubtext}>
          Keep navigating through subcategories to reach the question levels.
        </Text>
        {statistics?.has_questions_somewhere && (
          <View style={styles.emptyHintContainer}>
            <Text style={styles.emptyHintText}>
              🎯 {statistics.total_questions_recursive} questions waiting at deeper levels
            </Text>
            <Text style={styles.emptyActionText}>
              ⬇️ Tap on subcategories below to continue exploring
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Subscription Required Modal */}
      <SubscriptionRequiredModal
        visible={showSubscriptionModal}
        testName={lockedTestName}
        seriesName={categoryData?.data?.category?.testSeries?.name}
        onViewPlans={handleViewPlans}
        onCancel={() => setShowSubscriptionModal(false)}
        Colors={Colors}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {language === 'gujarati'
              ? (category.name_gujarati || category.name)
              : (category.name || category.name_gujarati)}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Breadcrumb */}
        {renderBreadcrumb()}

        {/* Category Description */}
        {(category.description || category.description_gujarati) && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>
              {language === 'gujarati'
                ? (category.description_gujarati || category.description)
                : (category.description || category.description_gujarati)}
            </Text>
          </View>
        )}

        {/* Content */}
        {renderContent()}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  breadcrumbContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  breadcrumbHeader: {
    marginBottom: 12,
  },
  breadcrumbTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  breadcrumbDepth: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  breadcrumbScroll: {
    marginTop: 8,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  breadcrumbLevel: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    minWidth: 28,
    alignItems: 'center',
  },
  breadcrumbLevelText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  breadcrumbText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  breadcrumbSeparator: {
    fontSize: 16,
    color: Colors.primary,
    marginHorizontal: 8,
    fontWeight: 'bold',
  },
  descriptionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryItemLocked: {
    opacity: 0.75,
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIconContainerLocked: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitleRow: {
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 21,
  },
  categoryTitleLocked: {
    color: Colors.textSecondary,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  freeBadge: {
    backgroundColor: Colors.success,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  lockedBadge: {
    backgroundColor: Colors.error,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  lockedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  levelBadge: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.border,
  },
  categoryArrow: {
    marginLeft: 8,
  },
  categoryMeta: {
    marginTop: 4,
  },
  categoryMetaText: {
    fontSize: 12,
    color: Colors.primary,
  },
  categoryRecursiveText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
    marginBottom: 4,
  },
  questionsRecursiveContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navigationHint: {
    fontSize: 11,
    color: Colors.primary,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  questionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  languageToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 6,
    padding: 2,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  languageButtonActive: {
    backgroundColor: Colors.primary,
  },
  languageButtonText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  languageButtonTextActive: {
    color: 'white',
  },
  quizInfoCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quizInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  quizInfoLabel: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  quizInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  startQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  startQuizText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  actionButtonsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  resultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
  },
  resultButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyHintContainer: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  emptyHintText: {
    fontSize: 14,
    color: Colors.success,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyActionText: {
    fontSize: 12,
    color: Colors.primary,
    textAlign: 'center',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
});