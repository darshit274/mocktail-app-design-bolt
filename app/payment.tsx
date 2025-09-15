import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, CreditCard, Smartphone, Wallet, Shield, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetTestSeriesByIdQuery } from '@/store/api/testSeriesApi';
import { useCreatePaymentOrderMutation, useVerifyPaymentMutation } from '@/store/api/paymentApi';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { WebView } from 'react-native-webview';
import { Modal } from 'react-native';
import { API_CONFIG } from '@/config/constants';

export default function PaymentScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(theme);
  const { seriesId } = useLocalSearchParams<{ seriesId: string }>();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [currentSubscriptionId, setCurrentSubscriptionId] = useState<string | null>(null);

  // Payment API hooks
  const [createPaymentOrder] = useCreatePaymentOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();

  // Fetch test series data from API
  const { 
    data: seriesResponse, 
    isLoading, 
    isError, 
    error 
  } = useGetTestSeriesByIdQuery(seriesId || '', {
    skip: !seriesId
  });

  const series = seriesResponse?.data;

  // Calculate discount percentage
  const calculateDiscount = () => {
    if (!series?.original_price || !series?.price) return 0;
    return Math.round((1 - series.price / series.original_price) * 100);
  };

  // Format duration
  const formatDuration = () => {
    if (!series?.subscription_duration_days) return '';
    const months = Math.round(series.subscription_duration_days / 30);
    return months > 1 ? `${months} months` : `${months} month`;
  };

  // Generate features list
  const getFeatures = () => {
    if (!series) return [];
    
    const features = [];
    
    if (series.tests_count) {
      features.push(t.payment.features.fullLengthTests.replace('{count}', series.tests_count.toString()));
    }
    
    if (series.demo_tests_count) {
      features.push(t.payment.features.freeTests.replace('{count}', series.demo_tests_count.toString()));
    }
    
    features.push(t.payment.features.detailedSolutions);
    features.push(t.payment.features.performanceAnalytics);
    features.push(t.payment.features.multiLanguage);
    
    if (series.subscription_duration_days) {
      features.push(t.payment.features.validity.replace('{duration}', formatDuration()));
    }
    
    return features;
  };

  // Helper function to create Razorpay hosted checkout URL
  const createRazorpayPaymentURL = (orderData: any) => {
    const baseURL = ( API_CONFIG.BASE_URL || 'http://localhost:3000')+'/api/payments/checkout';
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

      Alert.alert(
        '🎉 Payment Successful!',
        `Your payment has been verified successfully!\n\nPayment ID: ${verificationResult.data.paymentId}\nAmount: ₹${verificationResult.data.amount}`,
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigate back to refresh the subscription status
              router.back();
            }
          }
        ]
      );

    } catch (verificationError: any) {
      console.error('Payment verification failed:', verificationError);

      setShowPaymentWebView(false);

      Alert.alert(
        'Verification Failed',
        verificationError.data?.message || 'Payment was successful but verification failed. Please contact support if you were charged.',
        [{ text: 'OK' }]
      );
    }
  };

  const paymentMethods = [
    {
      id: 'razorpay',
      name: 'Razorpay',
      description: t.payment.razorpayDesc,
      icon: CreditCard,
      recommended: true
    },
    {
      id: 'upi',
      name: t.payment.upi,
      description: t.payment.upiDesc,
      icon: Smartphone,
      recommended: false
    },
    {
      id: 'wallet',
      name: t.payment.digitalWallet,
      description: t.payment.walletDesc,
      icon: Wallet,
      recommended: false
    }
  ];

  const handlePayment = async () => {
    if (!series || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Step 1: Create payment order
      console.log('Creating payment order for series:', seriesId);
      const orderResult = await createPaymentOrder({
        testSeriesId: seriesId,
        planType: 'test_series'
      }).unwrap();

      console.log('Payment order created:', orderResult);

      // Store subscription ID for later verification
      setCurrentSubscriptionId(orderResult.data.subscriptionId);

      // Step 2: Create Razorpay payment URL for web-based checkout
      const checkoutUrl = createRazorpayPaymentURL(orderResult.data);

      console.log('Opening Razorpay in-app checkout:', checkoutUrl);

      // Open the payment URL in WebView modal
      setPaymentUrl(checkoutUrl);
      setShowPaymentWebView(true);

    } catch (orderError: any) {
      console.error('Failed to create payment order:', orderError);
      Alert.alert(
        'Order Creation Failed',
        orderError.data?.message || 'Failed to create payment order. Please try again.',
        [{ text: t.common.ok || 'OK' }]
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
      } else {
        // Fallback for older flow
        setTimeout(() => {
          setShowPaymentWebView(false);

          Alert.alert(
            '🎉 Payment Successful!',
            'Your payment has been processed successfully. You now have access to this test series.',
            [
              {
                text: 'Continue',
                onPress: () => {
                  router.back();
                }
              }
            ]
          );
        }, 2000);
      }
    }
    
    // Check if the URL indicates payment failure
    if (url.includes('payment-failed') || url.includes('error')) {
      console.log('Payment failed');
      setShowPaymentWebView(false);
      
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
        } else {
          // Fallback for incomplete data
          setShowPaymentWebView(false);

          Alert.alert(
            '🎉 Payment Successful!',
            `Your payment has been processed successfully!\n\nPayment ID: ${payment_id || 'N/A'}`,
            [
              {
                text: 'Continue',
                onPress: () => {
                  router.back();
                }
              }
            ]
          );
        }
      }
    } catch (error) {
      console.log('Error parsing WebView message:', error);
    }
  };

  const styles = getStyles(Colors);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.payment.purchaseTestSeries}</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.skeletonLoadingContainer}>
          <SkeletonLoader height={200} style={{ margin: 20, borderRadius: 16 }} />
          <SkeletonLoader height={250} style={{ margin: 20, marginTop: 0, borderRadius: 16 }} />
          <SkeletonLoader height={300} style={{ margin: 20, marginTop: 0, borderRadius: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (isError || !series) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.payment.purchaseTestSeries}</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {t.common.errorLoadingData || 'Failed to load test series details'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>{t.common.goBack || 'Go Back'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.payment.purchaseTestSeries}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Series Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{series.name || series.title}</Text>
          <Text style={styles.summaryDescription}>{series.description || ''}</Text>
          
          <View style={styles.featuresList}>
            {getFeatures().map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <CheckCircle size={16} color={Colors.success} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Price Summary */}
        <View style={styles.priceCard}>
          <Text style={styles.priceCardTitle}>{t.payment.priceDetails}</Text>
          
          {series.original_price && series.original_price > series.price && (
            <>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{t.payment.originalPrice}</Text>
                <Text style={styles.originalPrice}>₹{series.original_price}</Text>
              </View>
              
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{t.payment.discount} ({calculateDiscount()}% {t.payment.off})</Text>
                <Text style={styles.discountAmount}>-₹{series.original_price - series.price}</Text>
              </View>
              
              <View style={styles.divider} />
            </>
          )}
          
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>{t.payment.totalAmount}</Text>
            <Text style={styles.totalPrice}>₹{series.price}</Text>
          </View>

          {series.original_price && series.original_price > series.price && (
            <View style={styles.savingsHighlight}>
              <Text style={styles.savingsText}>
                {t.payment.youSave.replace('{amount}', `₹${series.original_price - series.price}`)}
              </Text>
            </View>
          )}
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentCard}>
          <Text style={styles.paymentTitle}>{t.payment.selectPaymentMethod}</Text>
          
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                selectedPaymentMethod === method.id && styles.selectedPaymentMethod
              ]}
              onPress={() => setSelectedPaymentMethod(method.id)}
            >
              <View style={styles.paymentMethodLeft}>
                <View style={[
                  styles.paymentIcon,
                  selectedPaymentMethod === method.id && styles.selectedPaymentIcon
                ]}>
                  <method.icon 
                    size={24} 
                    color={selectedPaymentMethod === method.id ? Colors.primary : Colors.textSubtle} 
                  />
                </View>
                <View>
                  <View style={styles.paymentMethodHeader}>
                    <Text style={styles.paymentMethodName}>{method.name}</Text>
                    {method.recommended && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedText}>{t.payment.recommended}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.paymentMethodDesc}>{method.description}</Text>
                </View>
              </View>
              
              <View style={[
                styles.radioButton,
                selectedPaymentMethod === method.id && styles.selectedRadioButton
              ]}>
                {selectedPaymentMethod === method.id && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Shield size={20} color={Colors.success} />
          <Text style={styles.securityText}>
            {t.payment.securePayment}
          </Text>
        </View>

        {/* Payment Button */}
        <View style={styles.paymentButtonContainer}>
          <TouchableOpacity
            style={[styles.paymentButton, isProcessing && styles.paymentButtonDisabled]}
            onPress={handlePayment}
            disabled={isProcessing}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryLight]}
              style={styles.paymentGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isProcessing ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.white} />
                  <Text style={styles.paymentButtonText}>Processing...</Text>
                </View>
              ) : (
                <Text style={styles.paymentButtonText}>
                  {t.payment.payNow.replace('{amount}', `₹${series.price}`)}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          <Text style={styles.paymentNote}>
            {t.payment.termsNote}
          </Text>
        </View>
        </ScrollView>

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
                    [{ text: t.common.ok || 'OK' }]
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  summaryCard: {
    backgroundColor: Colors.cardBackground,
    margin: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  summaryDescription: {
    fontSize: 14,
    color: Colors.textSubtle,
    lineHeight: 20,
    marginBottom: 20,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  priceCard: {
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  priceCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.textSubtle,
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.textSubtle,
    textDecorationLine: 'line-through',
  },
  discountAmount: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.muted,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  savingsHighlight: {
    backgroundColor: Colors.success + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  savingsText: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '500',
    textAlign: 'center',
  },
  paymentCard: {
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.muted,
    marginBottom: 12,
  },
  selectedPaymentMethod: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedPaymentIcon: {
    backgroundColor: Colors.primary + '20',
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  recommendedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: Colors.success,
    borderRadius: 10,
  },
  recommendedText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '500',
  },
  paymentMethodDesc: {
    fontSize: 12,
    color: Colors.textSubtle,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioButton: {
    borderColor: Colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  securityText: {
    fontSize: 14,
    color: Colors.textSubtle,
  },
  paymentButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  paymentButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  paymentButtonDisabled: {
    opacity: 0.6,
  },
  paymentGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  paymentButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  paymentNote: {
    fontSize: 12,
    color: Colors.textSubtle,
    textAlign: 'center',
    lineHeight: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skeletonLoadingContainer: {
    flex: 1,
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
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
    borderBottomColor: Colors.muted,
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
    color: Colors.textPrimary,
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
    color: Colors.textSubtle,
    marginTop: 16,
  },
});