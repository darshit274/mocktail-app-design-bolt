import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ArrowLeft, ShoppingBag, AlertCircle, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetDynamicTestSeriesQuery, DynamicTestSeries } from '@/store/api/dynamicHierarchyApi';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { TestSeriesCard } from '@/components/test-series';

export default function PurchasedSeriesScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const { theme } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(theme);

  // Fetch all test series
  const {
    data: testSeriesResponse,
    error: testSeriesError,
    isLoading: testSeriesLoading,
    refetch: refetchTestSeries,
  } = useGetDynamicTestSeriesQuery({
    page: 1,
    limit: 100, // Get all series
    search: searchQuery || undefined,
  });

  const allTestSeries = testSeriesResponse?.data || [];

  // Filter only purchased/subscribed series
  const purchasedSeries = useMemo(() => {
    return allTestSeries.filter(series => series.is_subscribed === true);
  }, [allTestSeries]);

  // Apply search filter
  const filteredSeries = useMemo(() => {
    if (!searchQuery) return purchasedSeries;

    const query = searchQuery.toLowerCase();
    return purchasedSeries.filter(series =>
      series.name?.toLowerCase().includes(query) ||
      series.title?.toLowerCase().includes(query) ||
      series.description?.toLowerCase().includes(query)
    );
  }, [purchasedSeries, searchQuery]);

  const handleTestSeriesSelect = useCallback((series: DynamicTestSeries) => {
    router.push({
      pathname: '/test/series-detail',
      params: {
        seriesUuid: series.uuid,
        title: series.name || series.title || 'Test Series',
      },
    });
  }, []);

  const handleBackPress = useCallback(() => {
    router.back();
  }, []);

  const renderErrorState = () => (
    <View style={[styles.centerContainer, { paddingTop: 60 }]}>
      <AlertCircle size={48} color={Colors.danger} />
      <Text style={[styles.errorTitle, { color: Colors.textPrimary }]}>
        Something went wrong
      </Text>
      <Text style={[styles.errorMessage, { color: Colors.textSubtle }]}>
        Please try again later
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: Colors.primary }]}
        onPress={refetchTestSeries}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={[styles.centerContainer, { paddingTop: 60 }]}>
      <ShoppingBag size={48} color={Colors.textSubtle} />
      <Text style={[styles.emptyTitle, { color: Colors.textPrimary }]}>
        No purchased series yet
      </Text>
      <Text style={[styles.emptyMessage, { color: Colors.textSubtle }]}>
        Purchase a test series to start learning
      </Text>
      <TouchableOpacity
        style={[styles.browseButton, { backgroundColor: Colors.primary }]}
        onPress={() => router.push('/test-series')}
      >
        <Text style={styles.browseButtonText}>Browse Test Series</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTestSeriesCard = useCallback((series: DynamicTestSeries, index: number) => {
    return (
      <TestSeriesCard
        series={series}
        index={index}
        accessData={{ hasAccess: true, accessType: 'subscription' }}
        buttonState={{ showEnrollButton: false, isDisabled: false, buttonText: 'Continue', buttonType: 'continue' }}
        onPress={handleTestSeriesSelect}
        onPurchase={() => {}} // No purchase action needed for purchased series
        Colors={Colors}
      />
    );
  }, [handleTestSeriesSelect, Colors]);

  const styles = useMemo(() => getStyles(Colors), [Colors]);

  const keyExtractor = useCallback((item: DynamicTestSeries) => item.id.toString(), []);

  const renderListHeaderComponent = useCallback(() => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Series</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textSubtle} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your series..."
            placeholderTextColor={Colors.textSubtle}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Stats */}
      {!testSeriesLoading && filteredSeries.length > 0 && (
        <View style={styles.statsContainer}>
          <Text style={[styles.statsText, { color: Colors.textSubtle }]}>
            {filteredSeries.length} {filteredSeries.length === 1 ? 'series' : 'series'} purchased
          </Text>
        </View>
      )}
    </>
  ), [searchQuery, filteredSeries.length, testSeriesLoading, styles, Colors, handleBackPress]);

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
      <FlatList
        data={filteredSeries}
        renderItem={({ item, index }) => renderTestSeriesCard(item, index)}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeaderComponent}
        ListEmptyComponent={testSeriesLoading ? (
          <View style={styles.content}>
            {Array.from({ length: 3 }).map((_, index) => (
              <View key={index} style={styles.seriesCard}>
                <SkeletonLoader width="70%" height={20} style={{ marginBottom: 8 }} />
                <SkeletonLoader width="100%" height={16} style={{ marginBottom: 16 }} />
                <View style={styles.skeletonStatsContainer}>
                  <SkeletonLoader width={80} height={16} />
                  <SkeletonLoader width={80} height={16} />
                  <SkeletonLoader width={80} height={16} />
                </View>
                <SkeletonLoader width="100%" height={48} style={{ marginTop: 16, borderRadius: 12 }} />
              </View>
            ))}
          </View>
        ) : (
          renderEmptyState()
        )}
        refreshControl={
          <RefreshControl
            refreshing={testSeriesLoading}
            onRefresh={refetchTestSeries}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={5}
        windowSize={10}
      />
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
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
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
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
  skeletonStatsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 20,
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
    marginBottom: 24,
  },
  browseButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
