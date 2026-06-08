/**
 * PDFs tab — root of the PDF hierarchy.
 * Mirrors the test-series series-detail visual style: cards with icon bubble,
 * badges, child/PDF count, chevron right. Tapping a card drills into the
 * recursive /pdf-category screen.
 */
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Folder, FileText, AlertCircle, ChevronRight, BookOpen } from 'lucide-react-native';
import { router } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetPDFHierarchyRootsQuery, PDFHierarchyCategory } from '@/store/api/pdfApi';
import { CategorySkeleton } from '@/components/shared/SkeletonLoader';
import DisplayHtml from '@/components/common/DisplayHtml';

export default function PDFsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(theme);
  const styles = getStyles(Colors);

  const { data, isLoading, isError, error, refetch } = useGetPDFHierarchyRootsQuery();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refetch(); } catch (_) { /* ignore */ }
    finally { setRefreshing(false); }
  }, [refetch]);

  const handleOpen = useCallback((category: PDFHierarchyCategory) => {
    router.push({
      pathname: '/pdf-category',
      params: { categoryUuid: category.uuid, categoryName: category.name },
    });
  }, []);

  const categories = data?.data || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t.pdfs?.title || 'PDFs'}</Text>
          <Text style={styles.headerSubtitle}>Browse by category</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
      >
        {isLoading ? (
          <CategorySkeleton />
        ) : isError ? (
          <View style={styles.stateBox}>
            <AlertCircle size={48} color={Colors.danger} />
            <Text style={styles.stateTitle}>Failed to load categories</Text>
            <Text style={styles.stateDescription}>
              {(error as any)?.data?.message || 'Something went wrong. Pull to refresh.'}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : categories.length === 0 ? (
          <View style={styles.stateBox}>
            <BookOpen size={48} color={Colors.textSubtle} />
            <Text style={styles.stateTitle}>No PDF categories yet</Text>
            <Text style={styles.stateDescription}>Check back soon — content is being prepared.</Text>
          </View>
        ) : (
          categories.map((cat) => (
            <CategoryCard key={cat.uuid} category={cat} onPress={() => handleOpen(cat)} Colors={Colors} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface CategoryCardProps {
  category: PDFHierarchyCategory;
  onPress: () => void;
  Colors: any;
}

// Reused on both the root tab and the recursive /pdf-category screen so the
// look-and-feel matches the test-series series-detail screen exactly.
export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onPress, Colors }) => {
  const styles = getStyles(Colors);
  const isLeaf = category.node_type === 'pdf_holder';
  const subCount = category.subcategories_count || 0;
  const pdfCount = category.pdfs_count || 0;

  return (
    <View style={styles.categoryCard}>
      <TouchableOpacity style={styles.categoryHeader} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.categoryIcon, { backgroundColor: Colors.primary }]}>
          {isLeaf ? <FileText size={20} color={Colors.white} /> : <Folder size={20} color={Colors.white} />}
        </View>
        <View style={styles.categoryInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8 }}>
            <Text style={[styles.categoryName, { color: Colors.textPrimary, flex: 1 }]} numberOfLines={1}>
              {category.name}
            </Text>
            {isLeaf && (
              <View style={[styles.badge, { backgroundColor: Colors.primary }]}>
                <Text style={styles.badgeText}>PDFs</Text>
              </View>
            )}
          </View>
          <View style={styles.categoryStats}>
            <Text style={[styles.categoryStatsText, { color: Colors.textSubtle }]}>
              {isLeaf
                ? `${pdfCount} ${pdfCount === 1 ? 'PDF' : 'PDFs'}`
                : `${subCount} ${subCount === 1 ? 'subcategory' : 'subcategories'}`}
            </Text>
          </View>
          {category.description ? (
            <DisplayHtml source={{ html: category.description }} />
          ) : null}
        </View>
        <ChevronRight size={20} color={Colors.textSubtle} />
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (Colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.muted,
  },
  headerTitle: { fontSize: 24, fontWeight: '600', color: Colors.textPrimary },
  headerSubtitle: { fontSize: 14, color: Colors.textSubtle, marginTop: 2 },
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 32 },

  stateBox: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  stateTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginTop: 12 },
  stateDescription: { fontSize: 14, color: Colors.textSubtle, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  retryButton: {
    marginTop: 16, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 8, backgroundColor: Colors.primary,
  },
  retryButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // === Match test-series series-detail visual style ===
  categoryCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.muted,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  categoryIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 16, fontWeight: '600' },
  categoryStats: { marginTop: 2 },
  categoryStatsText: { fontSize: 12 },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: 'white' },
});
