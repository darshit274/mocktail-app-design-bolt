import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star, Clock, Play, Lock, Users, Gift, Award, BookOpen, ChevronRight, Folder } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  useGetDynamicTestSeriesByUuidQuery,
  DynamicTestSeries,
  DynamicCategory,
  convertDynamicCategoryToTestFormat
} from '@/store/api/dynamicHierarchyApi';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import Toast from 'react-native-toast-message';
import { useSubscriptionAccess, getSeriesButtonState } from '@/hooks/useSubscriptionAccess';

export default function SeriesDetailScreen() {
  const { seriesUuid, title } = useLocalSearchParams<{ seriesUuid: string; title: string }>();
  
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

  // Get subscription access data for this series
  const { accessData, loading: accessLoading, error: accessError } = useSubscriptionAccess(series?.id);
  const buttonState = getSeriesButtonState(accessData);
  const hasAccess = accessData?.hasAccess || false;

  const handleCategorySelect = (categoryUuid: string, categoryTitle: string) => {
    // Check subscription access before allowing navigation
    if (series.pricing_type === 'paid' && !hasAccess) {
      Alert.alert(
        'Subscription Required',
        'This test series requires a subscription. Please purchase to access the content.',
        [
          {
            text: 'View Plans',
            onPress: handlePurchase
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      return;
    }

    // Navigate to category detail to show proper hierarchy navigation
    router.push({
      pathname: '/test/category-detail',
      params: {
        categoryUuid: categoryUuid,
        categoryName: categoryTitle,
        seriesUuid: seriesUuid!,
      },
    });
  };

  const handlePurchase = () => {
    if (!series) return;
    
    // Check if user already has access or payment is pending
    if (!buttonState.showEnrollButton || buttonState.isDisabled) {
      if (accessData?.hasPendingPayment) {
        Toast.show({
          type: 'info',
          text1: 'Payment Pending',
          text2: 'You have a recent pending payment for this series.',
        });
      } else if (hasAccess) {
        Toast.show({
          type: 'info',
          text1: 'Already Enrolled',
          text2: 'You already have access to this test series.',
        });
      }
      return;
    }
    
    router.push({
      pathname: '/payment',
      params: {
        seriesId: series.id,
        title: series.title,
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

  const renderCategoryCard = (category: DynamicCategory, index: number) => (
    <TouchableOpacity
      key={category.uuid}
      style={styles.categoryCard}
      onPress={() => handleCategorySelect(category.uuid, category.name)}
    >
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: Colors.primary }]}>
          <Folder size={20} color={Colors.white} />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={[styles.categoryName, { color: Colors.textPrimary }]}>
            {category.name}
          </Text>
          <View style={styles.categoryStats}>
            <Text style={[styles.categoryStatsText, { color: Colors.textSubtle }]}>
              {category.has_subcategories 
                ? `${category.subcategories_count} subcategories`
                : `${category.questions_count} questions`}
            </Text>
          </View>
          {category.description && (
            <Text style={[styles.categoryDescription, { color: Colors.textSubtle }]}>
              {category.description}
            </Text>
          )}
        </View>
        <ChevronRight size={20} color={Colors.textSubtle} />
      </View>
    </TouchableOpacity>
  );

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
            <Text style={[styles.seriesDescription, { color: Colors.textSubtle }]}>
              {t.language === 'gujarati' && series.description_gujarati
                ? series.description_gujarati
                : series.description}
            </Text>
          )}

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Star size={16} color={Colors.warning} />
              <Text style={[styles.statText, { color: Colors.textSubtle }]}>
                {series.rating || 4.5} rating
              </Text>
            </View>
            <View style={styles.statItem}>
              <Users size={16} color={Colors.textSubtle} />
              <Text style={[styles.statText, { color: Colors.textSubtle }]}>
                {series.purchase_count || 0} enrolled
              </Text>
            </View>
            <View style={styles.statItem}>
              <Award size={16} color={Colors.textSubtle} />
              <Text style={[styles.statText, { color: Colors.textSubtle }]}>
                {series.difficulty_level}
              </Text>
            </View>
          </View>

          {/* Access Information */}
          <View style={styles.accessInfo}>
            {hasAccess ? (
              <View style={[styles.accessBadge, { backgroundColor: Colors.badgeSuccessBg }]}>
                <Text style={[styles.accessText, { color: Colors.success }]}>
                  ✓ {accessData?.accessType === 'free' ? 'Free access available' : 'You have access to this series'}
                </Text>
              </View>
            ) : accessData?.hasPendingPayment ? (
              <View style={[styles.accessBadge, { backgroundColor: Colors.badgeWarningBg }]}>
                <Text style={[styles.accessText, { color: Colors.warning }]}>
                  ⏳ Payment pending - please complete payment
                </Text>
              </View>
            ) : (
              <View style={[styles.accessBadge, { backgroundColor: Colors.badgeWarningBg }]}>
                <Text style={[styles.accessText, { color: Colors.warning }]}>
                  🔒 Purchase required for full access
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <View style={styles.priceContainer}>
              {series.pricing_type === 'free' || series.is_free ? (
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
              {(accessData?.testSeries?.pricing_type === 'free' || series.pricing_type === 'free') && !hasAccess && (
                <TouchableOpacity 
                  style={[styles.freeTestButton, { borderColor: Colors.primaryLight }]}
                  onPress={handleStartFreeTest}
                >
                  <Gift size={16} color={Colors.primaryLight} />
                  <Text style={[styles.freeTestText, { color: Colors.primaryLight }]}>
                    Try Free
                  </Text>
                </TouchableOpacity>
              )}

              {hasAccess ? (
                <TouchableOpacity 
                  style={[styles.continueButton, { backgroundColor: Colors.success }]}
                  onPress={() => {
                    // Navigate to first available category
                    if (categories.length > 0) {
                      const firstCategory = categories[0];
                      handleCategorySelect(firstCategory.uuid, firstCategory.name);
                    }
                  }}
                >
                  <Text style={[styles.continueButtonText, { color: Colors.white }]}>
                    {accessData?.accessType === 'free' ? 'Start Learning' : 'Continue Learning'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  {buttonState.showEnrollButton ? (
                    <TouchableOpacity 
                      style={[
                        styles.purchaseButton, 
                        { 
                          backgroundColor: buttonState.isDisabled ? Colors.textSubtle : Colors.primaryLight,
                          opacity: buttonState.isDisabled ? 0.7 : 1
                        }
                      ]}
                      onPress={handlePurchase}
                      disabled={buttonState.isDisabled}
                    >
                      {buttonState.buttonType === 'pending' ? (
                        <Clock size={16} color={Colors.white} />
                      ) : (
                        <Lock size={16} color={Colors.white} />
                      )}
                      <Text style={[styles.purchaseButtonText, { color: Colors.white }]}>
                        {buttonState.buttonText}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.continueButton, { backgroundColor: Colors.success }]}
                      onPress={handleStartFreeTest}
                    >
                      <Text style={[styles.continueButtonText, { color: Colors.white }]}>
                        Start Learning
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
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
});