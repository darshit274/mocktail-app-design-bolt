import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState, store } from '@/store/store';
import { useAuth } from '@/hooks/useAuth';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function Index() {
  const router = useRouter();
  const { theme } = useTheme();
  const Colors = getTheme(theme);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { initializeAuthState } = useAuth();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    const initializeAndRoute = async () => {
      if (hasNavigated) return; // Prevent multiple navigations
      
      console.log('🚀 Index: Starting app initialization...');
      
      try {
        // Wait for layout to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Initialize auth state first
        await initializeAuthState();
        
        // Wait a bit for the auth state to propagate
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Get the current auth state after initialization
        const currentState = store.getState().auth;
        console.log('🚀 Index: Auth state after initialization:', {
          isAuthenticated: currentState.isAuthenticated,
          hasUser: !!currentState.user,
          isEmailVerified: currentState.user?.isEmailVerified
        });
        
        // Route based on auth state
        if (!currentState.isAuthenticated) {
          console.log('🚀 Index: Not authenticated, going to login');
          setHasNavigated(true);
          router.replace('/(auth)/login');
        } else if (currentState.user?.isEmailVerified === false) {
          console.log('🚀 Index: Email not verified, going to OTP');
          setHasNavigated(true);
          router.replace('/(auth)/otp-verify');
        } else {
          console.log('🚀 Index: Authenticated and verified, going to tabs');
          setHasNavigated(true);
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('🚀 Index: Initialization error:', error);
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
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: Colors.background 
    }}>
      <ActivityIndicator size="large" color={Colors.textLink} />
    </View>
  );
}