import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '../store';
import { logout } from '../slices/authSlice';
import { API_CONFIG, AUTH_CONFIG } from '@/config/constants';
import { router } from 'expo-router';

const baseQuery = fetchBaseQuery({
  baseUrl: `${API_CONFIG.BASE_URL}/api`,
  prepareHeaders: async (headers, { getState }) => {
    let token = (getState() as RootState).auth.token;
    
    // If no token in Redux, try to get it from AsyncStorage as fallback
    if (!token) {
      try {
        token = await AsyncStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      } catch (error) {
        console.error('Error getting token from AsyncStorage:', error);
      }
    }
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('content-type', 'application/json');
    
    // Add ngrok bypass header if using ngrok
    if (API_CONFIG.BASE_URL.includes('ngrok')) {
      headers.set('ngrok-skip-browser-warning', 'true');
    }
    
    return headers;
  },
});

// These message substrings mean the token itself is invalid/expired — safe to force logout
const FORCE_LOGOUT_MESSAGES = [
  'session was ended',
  'logged in from another device',
  'token has expired',
  'invalid token',
  'please login again',
  'token not found',
  'no authorization header',
];

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const errorData = result.error.data as any;
    const message: string = (errorData?.message || '').toLowerCase();

    const isHardAuthFailure = FORCE_LOGOUT_MESSAGES.some(phrase => message.includes(phrase));

    if (isHardAuthFailure) {
      console.log('Hard auth failure, logging out:', message);
      await AsyncStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      api.dispatch(logout());
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 100);
    } else {
      // Soft 401 (e.g. permission denied on a specific resource) — don't wipe the session
      console.warn('401 received but not forcing logout:', message);
    }
  }

  return result;
};