import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Download, Eye, FileText, Calendar, Filter, Star, AlertCircle, ShoppingCart, Lock } from 'lucide-react-native';
import { router } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetPDFsQuery, useGetPDFCategoriesQuery, useIncrementPDFViewMutation, PDFListParams } from '@/store/api/pdfApi';
import { PDFListSkeleton, CategorySkeleton, SearchSkeleton } from '@/components/shared/SkeletonLoader';
import PDFCard from '@/components/pdfs/PDFCard';
import { API_CONFIG } from '@/config/constants';

export default function PDFsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  
  const { theme } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(theme);

  // API queries
  const queryParams: PDFListParams = useMemo(() => ({
    page: currentPage,
    limit: 10,
    search: searchQuery || undefined,
    category: selectedCategory !== 'All' ? selectedCategory : undefined,
    sortBy: 'created_at',
    sortOrder: 'DESC',
  }), [currentPage, searchQuery, selectedCategory]);

  const {
    data: pdfResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetPDFsQuery(queryParams);

  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useGetPDFCategoriesQuery();

  const [incrementPDFView] = useIncrementPDFViewMutation();

  const categories = useMemo(() => {
    const defaultCategories = [{ key: 'All', label: t.pdfs?.categories?.all || 'All' }];
    
    if (categoriesResponse?.data) {
      const dynamicCategories = categoriesResponse.data.map(category => ({
        key: category.name,
        label: category.name,
        color: category.color,
        icon: category.icon
      }));
      return [...defaultCategories, ...dynamicCategories];
    }
    
    // Fallback to hardcoded categories if API fails
    return [
      ...defaultCategories,
      { key: 'Study Material', label: t.pdfs?.categories?.studyMaterial || 'Study Material' },
      { key: 'Previous Papers', label: t.pdfs?.categories?.previousPapers || 'Previous Papers' },
      { key: 'Solutions', label: t.pdfs?.categories?.solutions || 'Solutions' },
      { key: 'Notes', label: t.pdfs?.categories?.notes || 'Notes' }
    ];
  }, [categoriesResponse, t.pdfs?.categories]);

  const pdfData = pdfResponse?.data || [];
  const pagination = pdfResponse?.pagination;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing PDFs:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);


  const handlePreview = useCallback(async (pdfId: string) => {
    try {
      // Increment view count
      await incrementPDFView(pdfId);
      
      // Open PDF viewer directly from backend
      const pdfViewerUrl = `${API_CONFIG.BASE_URL}/api/pdfs/${pdfId}/secure-view`;
      
      // For web, open in new tab
      if (Platform.OS === 'web') {
        window.open(pdfViewerUrl, '_blank');
      } else {
        // For mobile, navigate to a simple WebView wrapper
        router.push(`/pdf-viewer?pdfId=${pdfId}&url=${encodeURIComponent(pdfViewerUrl)}`);
      }
    } catch (error) {
      console.error('Error tracking PDF view:', error);
      // Still open PDF even if view tracking fails
      const pdfViewerUrl = `${API_CONFIG.BASE_URL}/api/pdfs/${pdfId}/secure-view`;
      
      if (Platform.OS === 'web') {
        window.open(pdfViewerUrl, '_blank');
      } else {
        router.push(`/pdf-viewer?pdfId=${pdfId}&url=${encodeURIComponent(pdfViewerUrl)}`);
      }
    }
  }, [incrementPDFView]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when changing category
  }, []);

  // Memoize styles to prevent recalculation on every render
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.pdfs?.title || 'PDFs'}</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={Colors.textSubtle} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        {isLoading && !pdfData.length ? (
          <SearchSkeleton />
        ) : (
          <View style={styles.searchBar}>
            <Search size={20} color={Colors.textSubtle} />
            <TextInput
              style={styles.searchInput}
              placeholder={t.pdfs?.searchPlaceholder || 'Search PDFs...'}
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor={Colors.textSubtle}
            />
          </View>
        )}
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        {categoriesLoading ? (
          <CategorySkeleton />
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.key && styles.categoryChipActive,
                  category.color && selectedCategory === category.key && { backgroundColor: category.color }
                ]}
                onPress={() => handleCategoryChange(category.key)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.key && styles.categoryTextActive
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* PDF List */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryLight}
            colors={[Colors.primaryLight]}
          />
        }
      >
        {isLoading && !pdfData.length ? (
          <PDFListSkeleton count={5} />
        ) : isError ? (
          <View style={styles.errorState}>
            <AlertCircle size={48} color={Colors.danger} />
            <Text style={styles.errorTitle}>Failed to load PDFs</Text>
            <Text style={styles.errorDescription}>
              {(error as any)?.data?.message || 'Something went wrong. Please try again.'}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : pdfData.length > 0 ? (
          pdfData.map((pdf) => (
            <PDFCard
              key={pdf.id}
              pdf={pdf}
              onPreview={handlePreview}
              formatDate={formatDate}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <FileText size={48} color={Colors.gray400} />
            <Text style={styles.emptyTitle}>{t.pdfs?.noPDFsFound || 'No PDFs found'}</Text>
            <Text style={styles.emptyDescription}>
              {t.pdfs?.tryAdjusting || 'Try adjusting your search or filters'}
            </Text>
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
    color: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  pdfCard: {
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
  pdfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pdfHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  pdfIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: Colors.chip,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pdfInfo: {
    flex: 1,
  },
  pdfTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  pdfMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pdfSize: {
    fontSize: 12,
    color: Colors.textSubtle,
  },
  pdfSeparator: {
    fontSize: 12,
    color: Colors.textSubtle,
    marginHorizontal: 6,
  },
  pdfPages: {
    fontSize: 12,
    color: Colors.textSubtle,
  },
  premiumBadge: {
    backgroundColor: Colors.premiumBadge,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumText: {
    fontSize: 10,
    color: Colors.premiumText,
    fontWeight: '600',
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
  pdfDescription: {
    fontSize: 14,
    color: Colors.textSubtle,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tagChip: {
    backgroundColor: Colors.chip,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: Colors.primaryLight,
    fontWeight: '500',
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
    flexDirection: 'row',
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  viewButtonText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textSubtle,
    textAlign: 'center',
  },
  errorState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.danger,
    marginTop: 16,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 14,
    color: Colors.textSubtle,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
});