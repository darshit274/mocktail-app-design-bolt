/**
 * Test Series Card Component
 * Created: 2025-01-13
 * Purpose: Memoized card component for displaying test series in lists
 * Optimized: React.memo for preventing unnecessary re-renders
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, Play, Lock, CircleCheck as CheckCircle } from 'lucide-react-native';
import { DynamicTestSeries } from '@/store/api/dynamicHierarchyApi';
import { ThemeColors } from '@/types';

/**
 * Props for TestSeriesCard component
 * @interface TestSeriesCardProps
 */
interface TestSeriesCardProps {
  /** Test series data object containing all series information */
  series: DynamicTestSeries;
  /** Index of the card in the list (used by FlatList) */
  index: number;
  /** Access data containing user's access status and payment info */
  accessData: any;
  /** Button state object controlling CTA button behavior and text */
  buttonState: any;
  /** Callback when card is pressed (navigate to series details) */
  onPress: (series: DynamicTestSeries) => void;
  /** Callback when purchase button is pressed (initiate purchase flow) */
  onPurchase: (series: DynamicTestSeries) => void;
  /** Theme colors object for consistent styling */
  Colors: ThemeColors;
}

/**
 * TestSeriesCard Component
 *
 * A comprehensive card component for displaying test series information in a list.
 * Shows series name, rating, student count, description, pricing, and enrollment status.
 *
 * **Display Information**:
 * - Series title and description
 * - Star rating and student enrollment count
 * - Test count, validity period, and access type
 * - Pricing (regular, discounted, or free)
 * - Enrollment badges ("Free Access", "Enrolled", "Pending Payment")
 *
 * **Interactive Elements**:
 * - Card press: Navigate to series details
 * - Purchase button: Initiate purchase flow for locked series
 * - Continue button: Resume enrolled series
 *
 * **Performance**:
 * - Wrapped with React.memo to prevent unnecessary re-renders
 * - Optimized for FlatList virtualization
 * - Minimal prop dependencies for efficient memoization
 *
 * **Access States**:
 * - `hasAccess=true`: Shows "Enrolled" or "Free Access" badge + Continue button
 * - `hasAccess=false` + `showEnrollButton=true`: Shows enroll button with lock icon
 * - `hasAccess=false` + `showEnrollButton=false`: Shows "Start Free" button
 * - `hasPendingPayment=true`: Shows "Pending Payment" badge
 *
 * @component
 * @example
 * ```tsx
 * <FlatList
 *   data={testSeries}
 *   renderItem={({ item, index }) => (
 *     <TestSeriesCard
 *       series={item}
 *       index={index}
 *       accessData={accessDataMap[item.id]}
 *       buttonState={getSeriesButtonState(accessData)}
 *       onPress={handleSeriesSelect}
 *       onPurchase={handlePurchase}
 *       Colors={Colors}
 *     />
 *   )}
 *   keyExtractor={(item) => item.id.toString()}
 * />
 * ```
 *
 * @param {TestSeriesCardProps} props - Component props
 * @returns {React.ReactElement} Rendered test series card
 */
export const TestSeriesCard = memo<TestSeriesCardProps>(({
  series,
  index,
  accessData,
  buttonState,
  onPress,
  onPurchase,
  Colors
}) => {
  const hasAccess = accessData?.hasAccess || false;

  return (
    <TouchableOpacity
      style={[styles.seriesCard, { backgroundColor: Colors.cardBackground, shadowColor: Colors.shadow }]}
      onPress={() => onPress(series)}
    >
      {/* Header */}
      <View style={styles.seriesHeader}>
        <View style={styles.seriesHeaderLeft}>
          <Text style={[styles.seriesTitle, { color: Colors.textPrimary }]}>
            {series.name || series.title}
          </Text>
        </View>
        {hasAccess && (
          <View style={[styles.purchasedBadge, { backgroundColor: Colors.badgeSuccessBg }]}>
            <CheckCircle size={16} color={Colors.success} />
            <Text style={[styles.purchasedText, { color: Colors.success }]}>
              {accessData?.accessType === 'free' ? 'Free' : 'Enrolled'}
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
        <Text style={[styles.seriesDescription, { color: Colors.textSubtle }]} numberOfLines={2}>
          {series.description}
        </Text>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Clock size={16} color={Colors.textSubtle} />
          <Text style={[styles.statText, { color: Colors.textSubtle }]}>{series?.validity_days} days</Text>
        </View>
        <View style={styles.statItem}>
          <Play size={16} color={Colors.textSubtle} />
          <Text style={[styles.statText, { color: Colors.textSubtle }]}>
            {series.tests_count || series.total_tests || 0} tests
          </Text>
        </View>
      </View>

      {/* Price and Action */}
      <View style={styles.actionContainer}>
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: Colors.textPrimary }]}>₹{series.price}</Text>
          {series.original_price && series.original_price > series.price && (
            <>
              <Text style={[styles.originalPrice, { color: Colors.textSubtle }]}>
                ₹{series.original_price}
              </Text>
              <View style={[styles.discountBadge, { backgroundColor: Colors.badgeDangerBg }]}>
                <Text style={[styles.discountText, { color: Colors.danger }]}>
                  {Math.round((1 - series.price / series.original_price) * 100)}% OFF
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.buttonContainer}>
          {hasAccess ? (
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: Colors.success }]}
              onPress={() => onPress(series)}
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
                    { backgroundColor: Colors.primaryLight },
                    buttonState.isDisabled && { opacity: 0.5 }
                  ]}
                  onPress={() => onPurchase(series)}
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
                  style={[styles.startButton, { backgroundColor: Colors.success }]}
                  onPress={() => onPress(series)}
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
});

TestSeriesCard.displayName = 'TestSeriesCard';

const styles = StyleSheet.create({
  seriesCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 20,
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
    marginBottom: 4,
  },
  purchasedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  purchasedText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  seriesDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
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
  },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  discountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
