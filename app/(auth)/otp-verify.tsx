import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useVerifyOTPMutation, useLoginMutation } from '@/store/api/authApi';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { clearPendingVerification, setError, setCredentials } from '@/store/slices/authSlice';
import { AuthLayout, FormInput, GradientButton, LinkText } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { API_CONFIG } from '@/config/constants';
import { validateOTP } from '@/utils/validation';
import { handleApiError } from '@/utils/errorHandler';

export default function OtpVerifyScreen() {
  const [otp, setOtp] = useState('');
  const [resent, setResent] = useState(false);
  const [verified, setVerified] = useState(false);

  const dispatch = useDispatch();
  const { pendingVerification } = useSelector((state: RootState) => state.auth);
  const [verifyOTP, { isLoading }] = useVerifyOTPMutation();
  const [login] = useLoginMutation();
  const { t } = useLanguage();

  const handleVerify = async () => {
    // Use shared validation utility
    if (!otp.trim()) {
      Toast.show({
        type: 'error',
        text1: t.common.error,
        text2: t.auth.validation.otpRequired,
      });
      return;
    }
    if (!validateOTP(otp)) {
      Toast.show({
        type: 'error',
        text1: t.common.error,
        text2: t.auth.validation.otpLength,
      });
      return;
    }
    if (!pendingVerification.email) {
      Toast.show({
        type: 'error',
        text1: t.common.error,
        text2: t.auth.validation.noPendingVerification,
      });
      return;
    }

    try {
      await verifyOTP({
        email: pendingVerification.email!,
        otp: otp.trim(),
      }).unwrap();

      // Store the type before clearing verification state
      const verificationType = pendingVerification.type;
      
      setVerified(true);

      Toast.show({
        type: 'success',
        text1: t.auth.otpVerifiedSuccess,
        text2: verificationType === 'forgot-password' 
          ? 'OTP verified. You can now reset your password.' 
          : t.auth.accountVerified,
      });

      // Redirect based on verification type
      if (verificationType === 'forgot-password') {
        // Don't clear verification for forgot password - update-password screen needs the email
        setTimeout(() => router.push('/(auth)/update-password'), 1000);
      } else if (verificationType === 'login-verification') {
        // For login verification, automatically log the user in
        try {
          const loginResult = await login({
            email: pendingVerification.email!,
            password: pendingVerification.password!,
          }).unwrap();

          dispatch(setCredentials({ token: loginResult.token }));
          dispatch(clearPendingVerification());

          Toast.show({
            type: 'success',
            text1: 'Login Successful',
            text2: 'Welcome back! You are now logged in.',
          });

          setTimeout(() => router.push('/'), 1000);
        } catch (loginError) {
          // If auto-login fails, redirect to login screen
          dispatch(clearPendingVerification());
          Toast.show({
            type: 'error',
            text1: 'Email Verified',
            text2: 'Please login again to continue.',
          });
          setTimeout(() => router.push('/(auth)/login'), 1000);
        }
      } else {
        // For new registrations, clear verification and redirect to dashboard
        dispatch(clearPendingVerification());
        setTimeout(() => router.push('/'), 1000);
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || t.auth.otpVerificationFailed;
      dispatch(setError(errorMessage));
      Toast.show({
        type: 'error',
        text1: t.auth.verificationFailed,
        text2: errorMessage,
      });
    }
  };

  const handleResend = async () => {
    if (!pendingVerification.email) return;
    
    setResent(true);
    
    try {
      // Call appropriate resend API based on verification type
      if (pendingVerification.type === 'forgot-password') {
        // For forgot password, call forgot password API again
        await fetch(`${API_CONFIG.BASE_URL}/api/users/forgotPassword`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({ email: pendingVerification.email })
        });
      } else {
        // For registration or login verification, call resend OTP API
        await fetch(`${API_CONFIG.BASE_URL}/api/users/resend-otp`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({ email: pendingVerification.email })
        });
      }
      
      Toast.show({
        type: 'success',
        text1: t.auth.otpResent,
        text2: t.auth.newOtpSent,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to resend OTP. Please try again.',
      });
    }
    
    setTimeout(() => setResent(false), 3000);
  };


  return (
    <AuthLayout 
      title={t.auth.otpVerification} 
      subtitle={t.auth.otpSubtitle}
    >
      <FormInput
        label={t.auth.otpCode}
        placeholder={t.auth.enterOtp}
        keyboardType="number-pad"
        value={otp}
        onChangeText={setOtp}
        maxLength={4}
        editable={!verified}
        style={{ letterSpacing: 6, textAlign: 'center', fontSize: 20, fontWeight: '600' }}
      />

      <GradientButton
        title={verified ? t.auth.verified : isLoading ? t.auth.verifying : t.auth.verify}
        onPress={handleVerify}
        disabled={isLoading || verified}
        loading={isLoading}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
        <Text>{t.auth.didNotReceiveCode}</Text>
        <LinkText
          linkText={resent ? t.auth.otpSent : t.auth.resendOtp}
          onPress={handleResend}
          disabled={resent}
          style={[{ marginLeft: 5 }, resent ? { opacity: 0.5 } : undefined]}
        />
      </View>

      <LinkText
        prefix={t.auth.backTo}
        linkText={t.auth.login}
        onPress={() => router.push('/(auth)/login')}
      />
    </AuthLayout>
  );
}