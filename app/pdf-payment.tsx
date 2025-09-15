import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, FileText, IndianRupee, ShieldCheck, CreditCard } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useCreatePDFPaymentOrderMutation,
  useVerifyPDFPaymentMutation,
  useCheckPDFAccessQuery
} from '@/store/api/pdfPaymentApi';
import { WebView } from 'react-native-webview';
import { API_CONFIG } from '@/config/constants';

export default function PDFPaymentScreen() {
  const params = useLocalSearchParams();
  const { pdfId, title, price, currency, description } = params;

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success' | 'failed'>('details');
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [currentSubscriptionId, setCurrentSubscriptionId] = useState<string | null>(null);

  const { theme } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(theme);
  const styles = getStyles(Colors);

  const { user } = useSelector((state: RootState) => state.auth);

  // API hooks
  const [createOrder, { isLoading: creatingOrder }] = useCreatePDFPaymentOrderMutation();
  const [verifyPayment, { isLoading: verifyingPayment }] = useVerifyPDFPaymentMutation();

  // Check if user already has access
  const {
    data: accessData,
    isLoading: checkingAccess,
    refetch: recheckAccess
  } = useCheckPDFAccessQuery({ pdfId: pdfId as string }, { skip: !pdfId });

  // Redirect if user already has access
  useEffect(() => {
    if (accessData?.success && accessData.data.hasAccess) {
      Alert.alert(
        'Already Purchased',
        'You already have access to this PDF.',
        [
          {
            text: 'View PDF',
            onPress: () => router.replace(`/pdf-viewer?pdfId=${pdfId}`)
          },
          {
            text: 'Go Back',
            onPress: () => router.back()
          }
        ]
      );
    }
  }, [accessData, pdfId]);

  const formatPrice = (amount: string | string[], curr: string | string[]) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : parseFloat(amount[0] || '0');
    const currencySymbol = curr === 'INR' ? '₹' : '$';
    return `${currencySymbol}${numAmount.toFixed(2)}`;
  };

  // Helper function to create Razorpay hosted checkout URL
  const createRazorpayPaymentURL = (orderData: any) => {
    const baseURL = (API_CONFIG.BASE_URL || 'http://localhost:3000') + '/api/payments/checkout';
    const params = new URLSearchParams({
      keyId: orderData.keyId,
      amount: orderData.amount.toString(),
      currency: orderData.currency,
      name: 'MockTale',
      description: `Payment for ${orderData.itemDetails.name}`,
      itemName: orderData.itemDetails.name,
      itemPrice: orderData.itemDetails.price.toString(),
      subscriptionId: orderData.subscriptionId
    });

    return `${baseURL}/${orderData.orderId}?${params.toString()}`;
  };

  // Handle payment verification
  const handlePaymentVerification = async (paymentData: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => {
    if (!currentSubscriptionId) {
      console.error('No subscription ID available for verification');
      return;
    }

    try {
      console.log('Verifying payment...', {
        ...paymentData,
        subscription_id: currentSubscriptionId
      });

      const verificationResult = await verifyPayment({
        ...paymentData,
        subscription_id: currentSubscriptionId
      }).unwrap();

      console.log('Payment verification successful:', verificationResult);

      // Close WebView and show success
      setShowPaymentWebView(false);
      setPaymentStep('success');

      // Recheck access to update UI
      await recheckAccess();

      // Navigate to PDF after 2 seconds
      setTimeout(() => {
        router.replace(`/pdf-viewer?pdfId=${pdfId}`);
      }, 2000);

    } catch (verificationError: any) {
      console.error('Payment verification failed:', verificationError);

      setShowPaymentWebView(false);
      setPaymentStep('failed');

      Alert.alert(
        'Verification Failed',
        verificationError.data?.message || 'Payment was successful but verification failed. Please contact support if you were charged.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePurchase = async () => {
    if (!user?.uuid) {
      Alert.alert('Error', 'Please login to purchase');
      return;
    }

    if (!pdfId) {
      Alert.alert('Error', 'PDF not found');
      return;
    }

    try {
      setIsProcessing(true);
      setPaymentStep('processing');

      console.log('🔄 Creating PDF payment order...');

      // Step 1: Create payment order
      const orderResponse = await createOrder({
        pdfId: pdfId as string,
        planType: 'pdf_purchase'
      }).unwrap();

      if (!orderResponse.success) {
        throw new Error('Failed to create payment order');
      }

      console.log('✅ Payment order created:', orderResponse.data);

      // Store subscription ID for later verification
      setCurrentSubscriptionId(orderResponse.data.subscriptionId);

      // Step 2: Create Razorpay payment URL for web-based checkout
      const checkoutUrl = createRazorpayPaymentURL(orderResponse.data);

      console.log('Opening Razorpay in-app checkout:', checkoutUrl);

      // Open the payment URL in WebView modal
      setPaymentUrl(checkoutUrl);
      setShowPaymentWebView(true);

    } catch (error: any) {
      console.error('❌ Payment failed:', error);
      setPaymentStep('failed');
      Alert.alert(
        'Payment Failed',
        error.data?.message || 'There was an error processing your payment. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => setPaymentStep('details')
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => router.back()
          }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle WebView navigation state changes to detect payment completion
  const handleWebViewNavigationStateChange = async (navState: any) => {
    const { url } = navState;
    console.log('WebView navigation:', url);

    // Check if the URL contains payment success parameters
    if (url.includes('payment-success')) {
      console.log('Payment completed successfully!');

      // Extract payment parameters from URL
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const paymentId = urlParams.get('payment_id');
      const orderId = urlParams.get('order_id');
      const signature = urlParams.get('signature');

      if (paymentId && orderId && signature) {
        await handlePaymentVerification({
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderId,
          razorpay_signature: signature,
        });
      }
    }

    // Check if the URL indicates payment failure
    if (url.includes('payment-failed') || url.includes('error')) {
      console.log('Payment failed');
      setShowPaymentWebView(false);
      setPaymentStep('failed');

      Alert.alert(
        'Payment Failed',
        'Payment could not be completed. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Handle messages from WebView (for more reliable communication)
  const handleWebViewMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('WebView message:', message);

      if (message.type === 'PAYMENT_SUCCESS') {
        console.log('Payment successful via message:', message.data);

        // Extract payment details from message
        const { payment_id, order_id, signature } = message.data;

        if (payment_id && order_id && signature) {
          // Use the payment verification flow
          await handlePaymentVerification({
            razorpay_payment_id: payment_id,
            razorpay_order_id: order_id,
            razorpay_signature: signature
          });
        }
      }
    } catch (error) {
      console.log('Error parsing WebView message:', error);
    }
  };

  const renderPaymentDetails = () => (
    <View style={styles.content}>
      {/* PDF Info */}
      <View style={styles.pdfCard}>
        <View style={styles.pdfIcon}>
          <FileText size={32} color={Colors.primary} />
        </View>
        <View style={styles.pdfInfo}>
          <Text style={styles.pdfTitle}>{title}</Text>
          {description && (
            <Text style={styles.pdfDescription}>{description}</Text>
          )}
        </View>
      </View>

      {/* Price Details */}
      <View style={styles.priceCard}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>PDF Price</Text>
          <Text style={styles.priceValue}>
            {formatPrice(price as string, currency as string)}
          </Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.priceRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>
            {formatPrice(price as string, currency as string)}
          </Text>
        </View>
      </View>

      {/* Features */}
      <View style={styles.featuresCard}>
        <Text style={styles.featuresTitle}>What you get:</Text>
        <View style={styles.feature}>
          <ShieldCheck size={16} color={Colors.success} />
          <Text style={styles.featureText}>Lifetime access to PDF</Text>
        </View>
        <View style={styles.feature}>
          <FileText size={16} color={Colors.success} />
          <Text style={styles.featureText}>Download and view offline</Text>
        </View>
        <View style={styles.feature}>
          <CreditCard size={16} color={Colors.success} />
          <Text style={styles.featureText}>Secure payment processing</Text>
        </View>
      </View>

      {/* Purchase Button */}
      <TouchableOpacity
        style={[styles.purchaseButton, isProcessing && styles.purchaseButtonDisabled]}
        onPress={handlePurchase}
        disabled={isProcessing || creatingOrder || verifyingPayment}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Text style={styles.purchaseButtonText}>
            Purchase for {formatPrice(price as string, currency as string)}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderProcessing = () => (
    <View style={styles.statusContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.statusTitle}>Processing Payment...</Text>
      <Text style={styles.statusDescription}>Please wait while we process your payment</Text>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.statusContainer}>
      <ShieldCheck size={64} color={Colors.success} />
      <Text style={styles.statusTitle}>Payment Successful!</Text>
      <Text style={styles.statusDescription}>
        You now have access to this PDF. Redirecting to PDF viewer...
      </Text>
    </View>
  );

  const renderFailed = () => (
    <View style={styles.statusContainer}>
      <Text style={styles.statusTitle}>Payment Failed</Text>
      <Text style={styles.statusDescription}>
        There was an error processing your payment. Please try again.
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => setPaymentStep('details')}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  if (checkingAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Checking access...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Purchase PDF</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      {paymentStep === 'details' && renderPaymentDetails()}
      {paymentStep === 'processing' && renderProcessing()}
      {paymentStep === 'success' && renderSuccess()}
      {paymentStep === 'failed' && renderFailed()}

      {/* Payment WebView Modal */}
      <Modal
        visible={showPaymentWebView}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              style={styles.closeWebViewButton}
              onPress={() => {
                setShowPaymentWebView(false);
                Alert.alert(
                  'Payment Cancelled',
                  'Payment was cancelled. You can try again anytime.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <Text style={styles.closeWebViewButtonText}>✕ Close</Text>
            </TouchableOpacity>
            <Text style={styles.webViewHeaderTitle}>Secure Payment</Text>
            <View style={styles.placeholder} />
          </View>

          {paymentUrl && (
            <WebView
              source={{ uri: paymentUrl }}
              style={styles.webView}
              onNavigationStateChange={handleWebViewNavigationStateChange}
              onMessage={handleWebViewMessage}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.webViewLoadingText}>Loading secure payment...</Text>
                </View>
              )}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
              mixedContentMode="compatibility"
              allowsFullscreenVideo={true}
            />
          )}
        </SafeAreaView>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  pdfCard: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  pdfIcon: {
    marginRight: 12,
  },
  pdfInfo: {
    flex: 1,
  },
  pdfTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  pdfDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  priceCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  featuresCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  purchaseButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonDisabled: {
    opacity: 0.7,
  },
  purchaseButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  statusDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 20,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeWebViewButton: {
    padding: 8,
  },
  closeWebViewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  webViewHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    zIndex: 999,
  },
  webViewLoadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
});