import React, { useState } from 'react';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useRegisterMutation } from '@/store/api/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials, setPendingVerification, setError } from '@/store/slices/authSlice';
import { AuthLayout, FormInput, GradientButton, LinkText } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { validateSignupForm } from '@/utils/validation';
import { handleApiError } from '@/utils/errorHandler';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const { t } = useLanguage();

  const handleSignup = async () => {
    // Use shared validation utility
    const validation = validateSignupForm(name, email, password, confirmPassword, t);
    if (!validation.isValid) {
      Toast.show({
        type: 'error',
        text1: t.common.error,
        text2: validation.error,
      });
      return;
    }

    try {
      const result = await register({
        username: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
      }).unwrap();

      dispatch(setCredentials({ token: result.token }));
      dispatch(setPendingVerification({ 
        email: email.trim().toLowerCase(), 
        isOTPSent: true,
        type: 'registration'
      }));

      Toast.show({
        type: 'success',
        text1: t.auth.signupSuccess,
        text2: t.auth.otpSentSuccess,
      });

      router.push('/(auth)/otp-verify');
    } catch (error: any) {
      const errorMessage = error?.data?.message || t.auth.signupFailed;
      dispatch(setError(errorMessage));
      Toast.show({
        type: 'error',
        text1: t.auth.signupFailed,
        text2: errorMessage,
      });
    }
  };

  return (
    <AuthLayout title={t.auth.createAccount} subtitle={t.auth.signupSubtitle}>
      <FormInput
        label={t.auth.name}
        placeholder={t.auth.enterName}
        value={name}
        onChangeText={setName}
      />

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
        placeholder={t.auth.createPassword}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <FormInput
        label={t.auth.confirmPassword}
        placeholder={t.auth.confirmYourPassword}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <FormInput
        label={t.auth.phone}
        placeholder={t.auth.enterPhone}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <GradientButton
        title={isLoading ? t.auth.signingUp : t.auth.signup}
        onPress={handleSignup}
        disabled={isLoading}
        loading={isLoading}
      />

      <LinkText
        prefix={t.auth.alreadyHaveAccount}
        linkText={t.auth.login}
        onPress={() => router.push('/(auth)/login')}
      />
    </AuthLayout>
  );
}

