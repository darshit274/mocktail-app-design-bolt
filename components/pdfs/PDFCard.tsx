import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FileText, Calendar, Download, Star, Eye, ShoppingCart, Lock } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCheckPDFAccessQuery } from '@/store/api/pdfPaymentApi';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface PDFCardProps {
  pdf: {
    id: string;
    title: string;
    description: string;
    access_level: string;
    price?: number;
    currency?: string;
    is_free?: boolean;
    file_size: number;
    original_filename: string;
    download_count: number;
    created_at: string;
    tags?: string[];
  };
  onPreview: (pdfId: string) => void;
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
}

export default function PDFCard({ pdf, onPreview, formatFileSize, formatDate }: PDFCardProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(theme);
  const styles = getStyles(Colors);

  // Check PDF access for premium PDFs
  const {
    data: accessData,
    isLoading: checkingAccess
  } = useCheckPDFAccessQuery(
    { pdfId: pdf.id },
    { skip: pdf.access_level === 'free' || pdf.is_free }
  );

  const isPremium = pdf.access_level === 'premium' && !pdf.is_free;
  const hasAccess = !isPremium || accessData?.data?.hasAccess || false;
  const canPurchase = isPremium && !hasAccess && accessData?.data?.canPurchase !== false;

  const formatPrice = () => {
    if (!pdf.price) return '';
    const currency = pdf.currency === 'INR' ? '₹' : '$';
    // Convert to number in case price is a string
    const numericPrice = typeof pdf.price === 'string' ? parseFloat(pdf.price) : pdf.price;
    return `${currency}${numericPrice.toFixed(2)}`;
  };

  const handlePurchase = () => {
    router.push({
      pathname: '/pdf-payment',
      params: {
        pdfId: pdf.id,
        title: pdf.title,
        price: pdf.price?.toString() || '0',
        currency: pdf.currency || 'INR',
        description: pdf.description,
      },
    });
  };

  const renderActionButtons = () => {
    if (isPremium && !hasAccess) {
      return (
        <View style={styles.actionContainer}>
          {/* Preview Button (if available) */}
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => onPreview(pdf.id)}
          >
            <Eye size={16} color={Colors.textSecondary} />
            <Text style={styles.previewButtonText}>Preview</Text>
          </TouchableOpacity>

          {/* Buy Button */}
          <TouchableOpacity
            style={styles.buyButton}
            onPress={handlePurchase}
            disabled={!canPurchase}
          >
            <ShoppingCart size={16} color={Colors.white} />
            <Text style={styles.buyButtonText}>
              Buy {formatPrice()}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Free PDF or user has access
    return (
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => onPreview(pdf.id)}
        >
          <Eye size={16} color={Colors.white} />
          <Text style={styles.viewButtonText}>
            {hasAccess ? 'View PDF' : 'View PDF'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.pdfCard}>
      {/* Header */}
      <View style={styles.pdfHeader}>
        <View style={styles.pdfHeaderLeft}>
          <View style={styles.pdfIconContainer}>
            <FileText size={24} color={Colors.primaryLight} />
          </View>
          <View style={styles.pdfInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.pdfTitle}>{pdf.title}</Text>
              {isPremium && !hasAccess && (
                <Lock size={16} color={Colors.warning} />
              )}
            </View>
            <View style={styles.pdfMeta}>
              <Text style={styles.pdfSize}>{formatFileSize(pdf.file_size)}</Text>
              <Text style={styles.pdfSeparator}>•</Text>
              <Text style={styles.pdfPages}>{pdf.original_filename}</Text>
              {isPremium && (
                <>
                  <Text style={styles.pdfSeparator}>•</Text>
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumText}>
                      {hasAccess ? 'Owned' : 'Premium'}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.ratingContainer}>
          <Star size={14} color={Colors.warning} fill={Colors.warning} />
          <Text style={styles.rating}>4.5</Text>
        </View>
      </View>

      {/* Price Display for Premium PDFs */}
      {isPremium && !hasAccess && pdf.price && (
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price:</Text>
          <Text style={styles.priceValue}>{formatPrice()}</Text>
        </View>
      )}

      {/* Description */}
      <Text style={styles.pdfDescription}>{pdf.description}</Text>

      {/* Tags */}
      {pdf.tags && pdf.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {pdf.tags.map((tag, index) => (
            <View key={index} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Download size={14} color={Colors.textSubtle} />
          <Text style={styles.statText}>{pdf.download_count} downloads</Text>
        </View>
        <View style={styles.statItem}>
          <Calendar size={14} color={Colors.textSubtle} />
          <Text style={styles.statText}>{formatDate(pdf.created_at)}</Text>
        </View>
      </View>

      {/* Actions */}
      {renderActionButtons()}
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  pdfCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    alignItems: 'flex-start',
  },
  pdfIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primaryExtraLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pdfInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pdfTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  pdfMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  pdfSize: {
    fontSize: 12,
    color: Colors.textSubtle,
  },
  pdfPages: {
    fontSize: 12,
    color: Colors.textSubtle,
  },
  pdfSeparator: {
    fontSize: 12,
    color: Colors.textSubtle,
    marginHorizontal: 6,
  },
  premiumBadge: {
    backgroundColor: Colors.warning,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: Colors.primaryExtraLight,
    borderRadius: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  pdfDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tagChip: {
    backgroundColor: Colors.primaryExtraLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: Colors.textSubtle,
    marginLeft: 4,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  viewButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  buyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buyButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});