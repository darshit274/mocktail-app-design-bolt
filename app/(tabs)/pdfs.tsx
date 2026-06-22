/**
 * PDFs tab — root of the PDF hierarchy.
 * Mirrors the test-series series-detail visual style: cards with icon bubble,
 * badges, child/PDF count, chevron right. Tapping a card drills into the
 * recursive /pdf-category screen.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Folder, FileText, AlertCircle, ChevronRight, BookOpen, CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetPDFHierarchyRootsQuery, PDFHierarchyCategory } from '@/store/api/pdfApi';
import { useGetUserSubscriptionsQuery } from '@/store/api/pdfPaymentApi';
import { CategorySkeleton } from '@/components/shared/SkeletonLoader';
import DisplayHtml from '@/components/common/DisplayHtml';

type FilterTab = 'all' | 'free' | 'paid' | 'purchased';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'free',      label: 'Free' },
  { key: 'paid',      label: 'Paid' },
  { key: 'purchased', label: 'Purchased' },
];

export default function PDFsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const { theme } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(theme);
  const styles = getStyles(Colors);

  const { data, isLoading, isError, error, refetch } = useGetPDFHierarchyRootsQuery();
  const { data: subsData } = useGetUserSubscriptionsQuery();

  // Build a Set of purchased PDF category UUIDs from the user's subscription metadata.
  // The endpoint already filters for completed+active subs, so no status check needed here.
  const purchasedUuids = useMemo(() => {
    const subs = subsData?.data?.subscriptions || [];
    return new Set<string>(
      subs
        .filter((s) => s.metadata?.plan_type === 'pdf_category' && s.metadata?.pdf_category_uuid)
        .map((s) => s.metadata!.pdf_category_uuid as string)
    );
  }, [subsData]);

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

  const filteredCategories = useMemo(() => {
    switch (activeFilter) {
      case 'free':      return categories.filter((c) => c.pricing_type === 'free');
      case 'paid':      return categories.filter((c) => c.pricing_type === 'paid');
      case 'purchased': return categories.filter((c) => purchasedUuids.has(c.uuid));
      default:          return categories;
    }
  }, [categories, activeFilter, purchasedUuids]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t.pdfs?.title || 'PDFs'}</Text>
          <Text style={styles.headerSubtitle}>Browse by category</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterTabText, activeFilter === tab.key && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
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
        ) : filteredCategories.length === 0 ? (
          <View style={styles.stateBox}>
            <BookOpen size={48} color={Colors.textSubtle} />
            <Text style={styles.stateTitle}>
              {activeFilter === 'purchased' ? 'No purchased categories' : 'No PDF categories yet'}
            </Text>
            <Text style={styles.stateDescription}>
              {activeFilter === 'purchased'
                ? 'Categories you purchase will appear here.'
                : 'Check back soon — content is being prepared.'}
            </Text>
          </View>
        ) : (
          filteredCategories.map((cat) => (
            <CategoryCard
              key={cat.uuid}
              category={cat}
              onPress={() => handleOpen(cat)}
              Colors={Colors}
              isPurchased={purchasedUuids.has(cat.uuid)}
            />
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
  isPurchased?: boolean;
}

// Reused on both the root tab and the recursive /pdf-category screen so the
// look-and-feel matches the test-series series-detail screen exactly.
export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onPress, Colors, isPurchased = false }) => {
  const styles = getStyles(Colors);
  const isLeaf = category.node_type === 'pdf_holder';
  const subCount = category.subcategories_count || 0;
  const pdfCount = category.pdfs_count || 0;
  // Pricing badge — only root categories carry pricing_type (the tree inherits it)
  const isPaid = category.pricing_type === 'paid';
  const isRestricted = category.pricing_type === 'restricted';
  const basePrice = Number(category.price || 0);
  const discount = Number(category.discount_percentage || 0);
  const finalPrice = discount > 0 ? basePrice * (1 - discount / 100) : basePrice;

  return (
    <View style={[styles.categoryCard, isPurchased && styles.categoryCardPurchased]}>
      <TouchableOpacity style={styles.categoryHeader} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.categoryIcon, { backgroundColor: isPurchased ? Colors.success : Colors.primary }]}>
          {isPurchased
            ? <CheckCircle size={20} color={Colors.white} />
            : isLeaf ? <FileText size={20} color={Colors.white} /> : <Folder size={20} color={Colors.white} />}
        </View>
        <View style={styles.categoryInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8 }}>
            <Text style={[styles.categoryName, { color: Colors.textPrimary, flex: 1 }]} numberOfLines={1}>
              {category.name}
            </Text>
            {isPurchased ? (
              <View style={[styles.badge, { backgroundColor: Colors.success }]}>
                <Text style={styles.badgeText}>Purchased</Text>
              </View>
            ) : isPaid ? (
              <View style={[styles.badge, { backgroundColor: Colors.warning }]}>
                <Text style={styles.badgeText}>₹{finalPrice.toFixed(0)}</Text>
              </View>
            ) : isRestricted ? (
              <View style={[styles.badge, { backgroundColor: Colors.danger }]}>
                <Text style={styles.badgeText}>Restricted</Text>
              </View>
            ) : null}
            {isLeaf && !isPurchased && (
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
        </View>
        <ChevronRight size={20} color={Colors.textSubtle} />
      </TouchableOpacity>
      {/* Description outside TouchableOpacity so Read more doesn't trigger navigation */}
      {category.description ? (
        <View style={styles.categoryDescription}>
          <DisplayHtml source={{ html: category.description }} maxHeight={44} />
        </View>
      ) : null}
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

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.muted,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: Colors.light,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSubtle,
  },
  filterTabTextActive: {
    color: Colors.white,
  },

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
  categoryCardPurchased: {
    borderColor: Colors.success,
    borderWidth: 1.5,
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
  categoryDescription: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: 'white' },
});
