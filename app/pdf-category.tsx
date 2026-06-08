/**
 * Recursive PDF category screen — same visual language as test/series-detail.
 * Drills through the tree:
 *   - container category → renders sub-category cards
 *   - pdf_holder category → renders PDF cards
 *   - empty → empty state
 */
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Folder, AlertCircle, BookOpen } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import {
  useGetPDFHierarchyCategoryQuery,
  PDFHierarchyCategory,
  PDF,
} from '@/store/api/pdfApi';
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refetch(); } catch (_) { /* ignore */ }
    finally { setRefreshing(false); }
  }, [refetch]);

  const handleOpenSubCategory = useCallback((cat: PDFHierarchyCategory) => {
    router.push({
      pathname: '/pdf-category',
      params: { categoryUuid: cat.uuid, categoryName: cat.name },
    });
  }, []);

  const handleOpenPdf = useCallback((pdfId: string) => {
    const pdfViewerUrl = `${API_CONFIG.BASE_URL}/api/pdfs/${pdfId}/secure-view`;
    router.push(`/pdf-viewer?pdfId=${pdfId}&url=${encodeURIComponent(pdfViewerUrl)}`);
  }, []);

  const data = response?.data;
  const contentType = data?.content_type;
  const headerTitle = data?.category?.name || categoryName || 'PDFs';

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
            <PDFCard key={pdf.id} pdf={pdf} onPreview={handleOpenPdf} />
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
});
