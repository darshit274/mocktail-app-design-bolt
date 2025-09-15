import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, BookOpen, Shield, Lock, ShoppingCart } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetPDFByIdQuery } from '@/store/api/pdfApi';
import { useCheckPDFAccessQuery } from '@/store/api/pdfPaymentApi';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { API_CONFIG } from '@/config/constants';
import SecureBase64PDFViewer from '@/components/SecureBase64PDFViewer';
// Conditional import for expo-screen-capture
let ScreenCapture: any = null;
try {
  ScreenCapture = require('expo-screen-capture');
} catch (error) {
  console.warn('expo-screen-capture not available:', error);
}

export default function PDFViewerScreen() {
  const { pdfId } = useLocalSearchParams<{ pdfId: string }>();
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(isDarkMode);

  const {
    data: pdfResponse,
    isLoading,
    isError,
    error,
  } = useGetPDFByIdQuery(pdfId!, {
    skip: !pdfId,
  });

  // Check PDF access for premium PDFs
  const {
    data: accessData,
    isLoading: checkingAccess,
    error: accessError,
  } = useCheckPDFAccessQuery(
    { pdfId: pdfId! },
    { skip: !pdfId || !pdfResponse?.data || pdfResponse.data.access_level === 'free' }
  );

  const pdf = pdfResponse?.data;
  const isPremium = pdf?.access_level === 'premium' && !pdf?.is_free;
  const hasAccess = !isPremium || accessData?.data?.hasAccess || false;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isSecure, setIsSecure] = useState(true);

  useEffect(() => {
    // Enable screenshot prevention when screen is mounted
    const activateScreenshotPrevention = async () => {
      if (Platform.OS !== 'web' && ScreenCapture) {
        try {
          await ScreenCapture.preventScreenCaptureAsync();
          setIsSecure(true);
        } catch (error) {
          console.error('Failed to prevent screenshots:', error);
          setIsSecure(false);
        }
      } else if (!ScreenCapture) {
        console.warn('Screenshot prevention not available - expo-screen-capture module not loaded');
        setIsSecure(false);
      }
    };

    activateScreenshotPrevention();

    // Cleanup: Re-enable screenshots when leaving the screen
    return () => {
      if (Platform.OS !== 'web' && ScreenCapture) {
        ScreenCapture.allowScreenCaptureAsync().catch(console.error);
      }
    };
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handlePurchase = () => {
    if (!pdf) return;

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

  const styles = getStyles(Colors);

  // Show loading state
  if (isLoading || (isPremium && checkingAccess)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <SkeletonLoader width={120} height={20} borderRadius={4} />
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.content}>
          <View style={styles.pdfInfo}>
            <SkeletonLoader width="80%" height={24} borderRadius={4} />
            <SkeletonLoader width="60%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
            <SkeletonLoader width="100%" height={14} borderRadius={4} style={{ marginTop: 12 }} />
            <SkeletonLoader width="90%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
          </View>

          <View style={styles.viewerContainer}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primaryLight} />
              <Text style={styles.loadingText}>Loading PDF...</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !pdf) {
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
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.errorContainer}>
          <BookOpen size={64} color={Colors.danger} />
          <Text style={styles.errorTitle}>Failed to load PDF</Text>
          <Text style={styles.errorDescription}>
            {(error as any)?.data?.message || 'The PDF could not be loaded. Please try again.'}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Check access for premium PDFs
  if (isPremium && !hasAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Purchase Required</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.accessDeniedContainer}>
          <Lock size={64} color={Colors.warning} />
          <Text style={styles.accessDeniedTitle}>Premium PDF</Text>
          <Text style={styles.accessDeniedDescription}>
            This PDF requires a purchase to view. Purchase now to get unlimited access.
          </Text>

          {/* PDF Info */}
          <View style={styles.purchaseInfo}>
            <Text style={styles.pdfTitle}>{pdf.title}</Text>
            {pdf.description && (
              <Text style={styles.pdfDescription}>{pdf.description}</Text>
            )}
            {pdf.price && (
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Price:</Text>
                <Text style={styles.priceValue}>
                  {pdf.currency === 'INR' ? '₹' : '$'}{pdf.price.toFixed(2)}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.purchaseActions}>
            <TouchableOpacity
              style={styles.purchaseButton}
              onPress={handlePurchase}
            >
              <ShoppingCart size={16} color={Colors.white} />
              <Text style={styles.purchaseButtonText}>
                Purchase PDF
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.goBackButton}
              onPress={() => router.back()}
            >
              <Text style={styles.goBackButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {pdf.title}
        </Text>
        <View style={styles.headerActions}>
          {isSecure && (
            <View style={styles.securityBadge}>
              <Shield size={16} color={Colors.success} />
              <Text style={styles.securityText}>Secure</Text>
            </View>
          )}
          {totalPages > 0 && (
            <Text style={styles.pageCounter}>
              {currentPage}/{totalPages}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {/* PDF Info */}
        <View style={styles.pdfInfo}>
          <Text style={styles.pdfTitle}>{pdf.title}</Text>
          <View style={styles.pdfMeta}>
            <Text style={styles.metaText}>Size: {formatFileSize(pdf.file_size)}</Text>
            <Text style={styles.metaSeparator}>•</Text>
            <Text style={styles.metaText}>
              {pdf.access_level === 'premium' ? 'Premium' : 'Free'}
            </Text>
            <Text style={styles.metaSeparator}>•</Text>
            <Text style={styles.metaText}>
              {formatDate(pdf.created_at)}
            </Text>
          </View>
          {pdf.description && (
            <Text style={styles.pdfDescription}>{pdf.description}</Text>
          )}
        </View>

        {/* PDF Viewer Container */}
        <View style={styles.viewerContainer}>
          <SecureBase64PDFViewer
            pdfId={pdf.id}
            style={styles.pdf}
            onLoadComplete={(numberOfPages) => {
              console.log(`PDF loaded with ${numberOfPages} pages`);
              setTotalPages(numberOfPages);
            }}
            onError={(error) => {
              console.error('PDF loading error:', error);
              Alert.alert('Error', 'Failed to load PDF. Please try again.');
            }}
          />
        </View>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.muted,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  securityText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  pageCounter: {
    fontSize: 14,
    color: Colors.textSubtle,
    fontWeight: '500',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  pdfInfo: {
    padding: 20,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.muted,
  },
  pdfTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  pdfMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 14,
    color: Colors.textSubtle,
  },
  metaSeparator: {
    fontSize: 14,
    color: Colors.textSubtle,
    marginHorizontal: 8,
  },
  pdfDescription: {
    fontSize: 14,
    color: Colors.textSubtle,
    lineHeight: 20,
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSubtle,
    marginTop: 16,
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
    color: Colors.danger,
    marginTop: 16,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 14,
    color: Colors.textSubtle,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.white,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  purchaseInfo: {
    width: '100%',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  pdfTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  pdfDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  purchaseActions: {
    width: '100%',
    gap: 12,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  purchaseButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  goBackButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  goBackButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  customLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});