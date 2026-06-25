import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useLoginMutation, useResendOTPMutation } from '@/store/api/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials, setError, setPendingVerification } from '@/store/slices/authSlice';
import { AuthLayout, FormInput, GradientButton, LinkText } from '@/components/shared';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { validateLoginForm } from '@/utils/validation';
import { handleApiError } from '@/utils/errorHandler';
import { getDeviceId } from '@/utils/deviceId';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { theme } = useTheme();
  const Colors = getTheme(theme);
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [resendOTP] = useResendOTPMutation();

  const handleLogin = async () => {
    // Use shared validation utility
    const validation = validateLoginForm(email, password, t);
    if (!validation.isValid) {
      Toast.show({
        type: 'error',
        text1: t.common.error,
        text2: validation.error,
      });
      return;
    }

    try {
      const deviceId = await getDeviceId();

      const result = await login({
        email: email.trim().toLowerCase(),
        password,
        device_id: deviceId,
      }).unwrap();

      dispatch(setCredentials({ token: result.token }));

      Toast.show({
        type: 'success',
        text1: t.auth.loginSuccess,
        text2: t.auth.welcomeBack,
      });

      router.push('/');
    } catch (error: any) {
      const errorMessage = error?.data?.message || t.auth.loginFailed;
      
      // Device mismatch — backend sends OTP and a deviceChangeToken for re-enrollment
      if (error?.data?.errorCode === 'DEVICE_VERIFICATION_REQUIRED' || errorMessage.includes('New device detected')) {
        const deviceChangeToken = error?.data?.deviceChangeToken;
        dispatch(setPendingVerification({
          email: email.trim().toLowerCase(),
          isOTPSent: true,
          type: 'device-verification',
          password,
          deviceChangeToken,
        }));
        Toast.show({
          type: 'info',
          text1: 'Verify Your Device',
          text2: 'An OTP has been sent to your email. Enter it to continue.',
        });
        router.push('/(auth)/otp-verify');
        return;
      }

      // Check if error is due to unverified email
      if (errorMessage.includes('Please verify your email before logging in') ||
          errorMessage.includes('verify your email') ||
          error?.status === 403) {
        
        try {
          // Automatically send OTP to user's email
          await resendOTP({ email: email.trim().toLowerCase() }).unwrap();
          
          // Set pending verification state with password for auto-login after verification
          dispatch(setPendingVerification({
            email: email.trim().toLowerCase(),
            isOTPSent: true,
            type: 'login-verification',
            password: password
          }));

          Toast.show({
            type: 'info',
            text1: 'Email Verification Required',
            text2: 'OTP sent to your email. Please verify to continue.',
          });

          // Navigate to OTP verification screen
          router.push('/(auth)/otp-verify');
          return;
          
        } catch (otpError) {
          // If OTP sending fails, fall back to showing the original error
          Toast.show({
            type: 'error',
            text1: 'Email Verification Required',
            text2: 'Please verify your email. Unable to send OTP automatically.',
          });
          return;
        }
      }
      
      // For other errors, show normal error message
      dispatch(setError(errorMessage));
      Toast.show({
        type: 'error',
        text1: t.auth.loginFailed,
        text2: errorMessage,
      });
    }
  };

  const styles = getStyles(Colors);

  return (
    <AuthLayout title={t.auth.welcomeBack} subtitle={t.auth.loginSubtitle}>
      <FormInput
        label={t.auth.email}
        placeholder={t.auth.enterEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <FormInput
        label={t.auth.password}
        placeholder={t.auth.enterPassword}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <LinkText
        linkText={t.auth.forgotPassword}
        onPress={() => router.push('/(auth)/forgot-password')}
        style={styles.forgotLink}
      />

      <GradientButton
        title={isLoading ? t.auth.loggingIn : t.auth.login}
        onPress={handleLogin}
        disabled={isLoading}
        loading={isLoading}
      />

      <LinkText
        prefix={t.auth.dontHaveAccount}
        linkText={t.auth.signup}
        onPress={() => router.push('/(auth)/signup')}
      />
    </AuthLayout>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: 0,
    marginBottom: 16,
  },
});
