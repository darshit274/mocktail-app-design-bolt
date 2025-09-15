import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVerifyPaymentMutation } from '@/store/api/paymentApi';
import { CheckCircle } from 'lucide-react-native';

export default function PaymentSuccessScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(theme);
  const params = useLocalSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verifyPayment] = useVerifyPaymentMutation();

  useEffect(() => {
    const verifyPaymentStatus = async () => {
      try {
        if (!params.payment_id || !params.order_id || !params.signature) {
          throw new Error('Missing payment parameters');
        }

        const verifyResult = await verifyPayment({
          razorpay_order_id: params.order_id as string,
          razorpay_payment_id: params.payment_id as string,
          razorpay_signature: params.signature as string,
          subscription_id: params.subscription_id as string
        }).unwrap();

        console.log('Payment verification successful:', verifyResult);
        
        // Payment verified successfully
        setTimeout(() => {
          Alert.alert(
            t.payment?.paymentSuccess || 'Payment Successful!',
            `Payment of ₹${verifyResult.data.amount} completed successfully. Your subscription is now active.`,
            [{ 
              text: t.common?.ok || 'OK', 
              onPress: () => router.replace('/(tabs)')
            }]
          );
        }, 1500);

      } catch (error: any) {
        console.error('Payment verification failed:', error);
        
        Alert.alert(
          'Verification Failed',
          error.data?.message || 'Payment verification failed. Please contact support if payment was deducted.',
          [{ 
            text: t.common?.ok || 'OK', 
            onPress: () => router.replace('/(tabs)')
          }]
        );
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPaymentStatus();
  }, [params]);

  const styles = getStyles(Colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {isVerifying ? (
          <>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.verifyingText}>Verifying payment...</Text>
          </>
        ) : (
          <>
            <CheckCircle size={80} color={Colors.success} />
            <Text style={styles.successText}>Payment Processed</Text>
            <Text style={styles.messageText}>
              Please wait while we confirm your payment...
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  verifyingText: {
    fontSize: 18,
    color: Colors.textPrimary,
    marginTop: 20,
    fontWeight: '600',
  },
  successText: {
    fontSize: 24,
    color: Colors.success,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 16,
    color: Colors.textSubtle,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
});