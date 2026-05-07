import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, store } from '@/store/store';
import { useAuth } from '@/hooks/useAuth';
import { setPendingVerification } from '@/store/slices/authSlice';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { LoadingState } from '@/components/shared';
import { TIMING } from '@/utils/appConstants';
import logger from '@/utils/logger';

const indexLogger = logger.createLogger('Index');

export default function Index() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const Colors = getTheme(theme);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { initializeAuthState } = useAuth();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    const initializeAndRoute = async () => {
      if (hasNavigated) return; // Prevent multiple navigations

      indexLogger.info('Starting app initialization');

      try {
        // Wait for layout to be ready
        await new Promise(resolve => setTimeout(resolve, TIMING.LAYOUT_READY_DELAY));

        // Initialize auth state first
        await initializeAuthState();

        // Wait a bit for the auth state to propagate
        await new Promise(resolve => setTimeout(resolve, TIMING.AUTH_STATE_PROPAGATION));

        // Get the current auth state after initialization
        const currentState = store.getState().auth;
        indexLogger.info('Auth state after initialization', {
          isAuthenticated: currentState.isAuthenticated,
          hasUser: !!currentState.user,
          isEmailVerified: currentState.user?.isEmailVerified
        });

        // Route based on auth state
        if (!currentState.isAuthenticated) {
          indexLogger.info('Not authenticated, navigating to login');
          setHasNavigated(true);
          router.replace('/(auth)/login');
        } else if (currentState.user?.isEmailVerified === false) {
          indexLogger.info('Email not verified, navigating to OTP verification');
          // Restore pendingVerification so the OTP screen knows which email to verify
          // when the user reopens the app after killing it mid-signup. The password
          // isn't available in this case — the OTP screen will fall back to login.
          if (currentState.user?.email && !currentState.pendingVerification?.email) {
            dispatch(setPendingVerification({
              email: currentState.user.email,
              isOTPSent: true,
              type: 'registration',
            }));
          }
          setHasNavigated(true);
          router.replace('/(auth)/otp-verify');
        } else {
          indexLogger.info('Authenticated and verified, navigating to main app');
          setHasNavigated(true);
          router.replace('/(tabs)');
        }
      } catch (error) {
        indexLogger.error('Initialization error', error);
        // Fallback to login on any error
        if (!hasNavigated) {
          setHasNavigated(true);
          router.replace('/(auth)/login');
        }
      }
    };

    initializeAndRoute();
  }, [hasNavigated]);

  // Show loading screen while initializing
  return (
    <View style={{
      flex: 1,
      backgroundColor: Colors.background
    }}>
      <LoadingState message="Initializing..." Colors={Colors} fullScreen />
    </View>
  );
}