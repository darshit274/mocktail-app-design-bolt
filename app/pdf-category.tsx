/**
 * Recursive PDF category screen — same visual language as test/series-detail.
 * Drills through the tree:
 *   - container category → renders sub-category cards
 *   - pdf_holder category → renders PDF cards
 *   - empty → empty state
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Folder, AlertCircle, BookOpen, Lock, ShoppingCart } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import {
  useGetPDFHierarchyCategoryQuery,
  PDFHierarchyCategory,
  PDF,
} from '@/store/api/pdfApi';
import { useCheckPDFCategoryAccessQuery } from '@/store/api/pdfPaymentApi';
import { CategorySkeleton, PDFListSkeleton } from '@/components/shared/SkeletonLoader';
import PDFCard from '@/components/pdfs/PDFCard';
import { API_CONFIG } from '@/config/constants';
import { CategoryCard } from './(tabs)/pdfs';

export default function PdfCategoryScreen() {
  const { categoryUuid, categoryName } = useLocalSearchParams<{
    categoryUuid: string;
    categoryName?: string;
  }>();
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();
  const Colors = getTheme(theme);
  const styles = getStyles(Colors);

  const { data: response, isLoading, isError, error, refetch } = useGetPDFHierarchyCategoryQuery(
    categoryUuid!,
    { skip: !categoryUuid },
  );

  const data = response?.data;
  const contentType = data?.content_type;
  const headerTitle = data?.category?.name || categoryName || 'PDFs';

  // Category-level pricing: the backend returns the EFFECTIVE pricing for this
  // branch (resolved from the root category). One purchase unlocks the tree.
  const isPaidCategory = data?.category?.pricing_type === 'paid';
  const {
    data: accessData,
    refetch: refetchAccess,
  } = useCheckPDFCategoryAccessQuery(
    { categoryUuid: categoryUuid as string },
    { skip: !categoryUuid || !isPaidCategory },
  );
  const hasAccess = !isPaidCategory || accessData?.data?.hasAccess === true;
  const accessCategory = accessData?.data?.category;

  const discountedPrice = useMemo(() => {
    if (accessCategory) return accessCategory.discounted_price;
    const base = Number(data?.category?.price || 0);
    const discount = Number(data?.category?.discount_percentage || 0);
    return discount > 0 ? base * (1 - discount / 100) : base;
  }, [accessCategory, data?.category?.price, data?.category?.discount_percentage]);

  const categoryPurchaseParams = useMemo(() => ({
    categoryUuid: (accessCategory?.uuid || categoryUuid) as string,
    name: accessCategory?.name || headerTitle,
    price: discountedPrice,
    description: data?.category?.description || undefined,
  }), [accessCategory, categoryUuid, headerTitle, discountedPrice, data?.category?.description]);

  const goToCategoryCheckout = useCallback(() => {
    router.push({
      pathname: '/pdf-payment',
      params: {
        categoryUuid: categoryPurchaseParams.categoryUuid,
        title: categoryPurchaseParams.name,
        price: categoryPurchaseParams.price.toString(),
        currency: 'INR',
        description: categoryPurchaseParams.description || '',
      },
    });
  }, [categoryPurchaseParams]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
      if (isPaidCategory) await refetchAccess();
    } catch (_) { /* ignore */ }
    finally { setRefreshing(false); }
  }, [refetch, refetchAccess, isPaidCategory]);

  const handleOpenSubCategory = useCallback((cat: PDFHierarchyCategory) => {
    router.push({
      pathname: '/pdf-category',
      params: { categoryUuid: cat.uuid, categoryName: cat.name },
    });
  }, []);

  const handleOpenPdf = useCallback((pdfId: string) => {
    if (isPaidCategory && !hasAccess) {
      Alert.alert(
        'Purchase Required',
        'Buy this category once to unlock all PDFs inside it.',
        [
          { text: 'Buy Now', onPress: goToCategoryCheckout },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }
    const pdfViewerUrl = `${API_CONFIG.BASE_URL}/api/pdfs/${pdfId}/secure-view`;
    router.push(`/pdf-viewer?pdfId=${pdfId}&url=${encodeURIComponent(pdfViewerUrl)}`);
  }, [isPaidCategory, hasAccess, goToCategoryCheckout]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header — mirrors series-detail header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{headerTitle}</Text>
          {data?.category?.parent_category && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              in {data.category.parent_category.name}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
      >
        {/* Paid category banner — same one-tap purchase flow as test series */}
        {!isLoading && !isError && isPaidCategory && !hasAccess && (
          <View style={styles.purchaseBanner}>
            <View style={styles.purchaseBannerLeft}>
              <Lock size={20} color={Colors.warning} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.purchaseBannerTitle}>Premium category</Text>
                <Text style={styles.purchaseBannerSubtitle}>
                  One purchase unlocks every PDF inside.
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.purchaseBannerButton} onPress={goToCategoryCheckout}>
              <ShoppingCart size={16} color="#fff" />
              <Text style={styles.purchaseBannerButtonText}>Buy ₹{Number(discountedPrice).toFixed(0)}</Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoading ? (
          contentType === 'pdfs' ? <PDFListSkeleton count={5} /> : <CategorySkeleton />
        ) : isError ? (
          <View style={styles.stateBox}>
            <AlertCircle size={48} color={Colors.danger} />
            <Text style={styles.stateTitle}>Failed to load</Text>
            <Text style={styles.stateDescription}>
              {(error as any)?.data?.message || 'Something went wrong. Pull to refresh.'}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : contentType === 'empty' ? (
          <View style={styles.stateBox}>
            <BookOpen size={48} color={Colors.textSubtle} />
            <Text style={styles.stateTitle}>Nothing here yet</Text>
            <Text style={styles.stateDescription}>This category will be populated soon.</Text>
          </View>
        ) : contentType === 'categories' ? (
          (data!.content as PDFHierarchyCategory[]).map((sub) => (
            <CategoryCard
              key={sub.uuid}
              category={sub}
              onPress={() => handleOpenSubCategory(sub)}
              Colors={Colors}
            />
          ))
        ) : (
          (data!.content as PDF[]).map((pdf) => (
            <PDFCard
              key={pdf.id}
              pdf={pdf}
              onPreview={handleOpenPdf}
              categoryPurchase={isPaidCategory && !hasAccess ? categoryPurchaseParams : undefined}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.muted,
  },
  backButton: { padding: 8, marginRight: 4 },
  headerTitleContainer: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  headerSubtitle: { fontSize: 12, color: Colors.textSubtle, marginTop: 2 },
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 32 },

  stateBox: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  stateTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginTop: 12 },
  stateDescription: { fontSize: 14, color: Colors.textSubtle, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.primary },
  retryButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // Paid category purchase banner
  purchaseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warning,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  purchaseBannerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  purchaseBannerTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  purchaseBannerSubtitle: { fontSize: 12, color: Colors.textSubtle, marginTop: 2 },
  purchaseBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  purchaseBannerButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
