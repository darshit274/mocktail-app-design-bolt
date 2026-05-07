import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useVerifyOTPMutation, useLoginMutation } from '@/store/api/authApi';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { clearPendingVerification, setError, setCredentials, logout } from '@/store/slices/authSlice';
import { AuthLayout, FormInput, GradientButton, LinkText } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { API_CONFIG, AUTH_CONFIG } from '@/config/constants';
import { validateOTP } from '@/utils/validation';
import { handleApiError } from '@/utils/errorHandler';
import { getDeviceId } from '@/utils/deviceId';

export default function OtpVerifyScreen() {
  const [otp, setOtp] = useState('');
  const [resent, setResent] = useState(false);
  const [verified, setVerified] = useState(false);

  const dispatch = useDispatch();
  const { pendingVerification } = useSelector((state: RootState) => state.auth);
  const [verifyOTP, { isLoading }] = useVerifyOTPMutation();
  const [login] = useLoginMutation();
  const { t } = useLanguage();

  // After OTP verify, log the user in with a fresh login so the token carries a
  // sessionId (single-device enforcement) and device_id is recorded on the user.
  // Falls back to the login screen if the password isn't available (e.g. the app
  // was killed between signup and OTP verify, then reopened).
  const autoLoginAfterVerify = async (verificationType: 'registration' | 'login-verification') => {
    const email = pendingVerification.email;
    const password = pendingVerification.password;

    const fallbackToLogin = async (message: string) => {
      // Wipe the now-stale signup token so the login screen starts clean
      await AsyncStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      dispatch(logout());
      Toast.show({
        type: 'info',
        text1: 'Email Verified',
        text2: message,
      });
      setTimeout(() => router.push('/(auth)/login'), 800);
    };

    if (!email || !password) {
      await fallbackToLogin('Please login to continue.');
      return;
    }

    try {
      const deviceId = await getDeviceId();
      const loginResult = await login({
        email,
        password,
        device_id: deviceId,
      }).unwrap();

      dispatch(setCredentials({ token: loginResult.token }));
      dispatch(clearPendingVerification());

      Toast.show({
        type: 'success',
        text1: verificationType === 'registration' ? 'Welcome to MockTale!' : 'Login Successful',
        text2: verificationType === 'registration'
          ? 'Your account is ready. Taking you to your dashboard.'
          : 'Welcome back! You are now logged in.',
      });

      setTimeout(() => router.push('/'), 800);
    } catch (loginError: any) {
      const errMsg = loginError?.data?.message || '';
      // Device lock — surface the real reason rather than generic fallback
      if (errMsg.includes('linked to another device') || errMsg.includes('contact admin')) {
        dispatch(clearPendingVerification());
        await AsyncStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
        dispatch(logout());
        Toast.show({
          type: 'error',
          text1: 'Device Restricted',
          text2: 'This account is locked to another device. Contact admin to reset.',
        });
        setTimeout(() => router.push('/(auth)/login'), 800);
        return;
      }
      await fallbackToLogin('Please login to continue.');
    }
  };

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
      } else if (verificationType === 'login-verification' || verificationType === 'registration') {
        // Both flows finish the same way: auto-login so the user lands on the
        // dashboard with a proper session-bound token and locked device_id,
        // instead of being bounced to the login screen.
        await autoLoginAfterVerify(verificationType);
      } else {
        // Unknown verification type — fall back to dashboard
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