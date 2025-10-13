import React, { useState } from 'react';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useForgotPasswordMutation } from '@/store/api/authApi';
import { useDispatch } from 'react-redux';
import { setPendingVerification, setError } from '@/store/slices/authSlice';
import { AuthLayout, FormInput, GradientButton, LinkText } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { validateEmail } from '@/utils/validation';
import { handleApiError } from '@/utils/errorHandler';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  
  const dispatch = useDispatch();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const { t } = useLanguage();

  const handleReset = async () => {
    // Use shared validation utility
    if (!email.trim()) {
      Toast.show({
        type: 'error',
        text1: t.common.error,
        text2: t.auth.validation.emailRequired,
      });
      return;
    }
    if (!validateEmail(email)) {
      Toast.show({
        type: 'error',
        text1: t.common.error,
        text2: t.auth.validation.invalidEmail,
      });
      return;
    }

    try {
      await forgotPassword({
        email: email.trim().toLowerCase(),
      }).unwrap();

      dispatch(setPendingVerification({ 
        email: email.trim().toLowerCase(), 
        isOTPSent: true,
        type: 'forgot-password'
      }));
      setSent(true);

      Toast.show({
        type: 'success',
        text1: t.auth.resetEmailSent,
        text2: t.auth.resetEmailSentMessage,
      });

      setTimeout(() => router.push('/(auth)/otp-verify'), 1000);
    } catch (error: any) {
      const errorMessage = error?.data?.message || t.auth.resetEmailFailed;
      dispatch(setError(errorMessage));
      Toast.show({
        type: 'error',
        text1: t.auth.resetEmailFailed,
        text2: errorMessage,
      });
    }
  };

  return (
    <AuthLayout 
      title={t.auth.forgotPassword} 
      subtitle={t.auth.forgotPasswordSubtitle}
    >
      <FormInput
        label={t.auth.email}
        placeholder={t.auth.enterEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        editable={!sent}
      />

      <GradientButton
        title={sent ? t.auth.emailSent : isLoading ? t.auth.sending : t.auth.resetPassword}
        onPress={handleReset}
        disabled={isLoading || sent || !email}
        loading={isLoading}
      />

      <LinkText
        prefix={t.auth.rememberPassword}
        linkText={t.auth.login}
        onPress={() => router.push('/(auth)/login')}
      />
    </AuthLayout>
  );
}


