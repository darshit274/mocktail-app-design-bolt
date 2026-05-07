import { createApi } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { baseQueryWithReauth } from './baseQuery';
import { AUTH_CONFIG } from '@/config/constants';

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  phone?: string;
  device_id?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  device_id?: string;
}

export interface OTPVerifyRequest {
  email: string;
  otp: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  newPassword: string;
}

export interface ResendOTPRequest {
  email: string;
}

export interface User {
  uuid: string;
  username: string;
  email: string;
  phone?: string;
  profileImage?: string;
  isEmailVerified: boolean;
  created_at: string;
}

export interface AuthResponse {
  message: string;
  token: string;
}

export interface MessageResponse {
  message: string;
}

export interface ProfileResponse {
  success: boolean;
  data: User;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth'],
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (credentials) => ({
        url: '/users/register',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Store token in AsyncStorage
          await AsyncStorage.setItem(AUTH_CONFIG.TOKEN_KEY, data.token);
        } catch (error) {
          console.error('Register failed:', error);
        }
      },
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/users/login',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Store token in AsyncStorage
          await AsyncStorage.setItem(AUTH_CONFIG.TOKEN_KEY, data.token);
        } catch (error) {
          console.error('Login failed:', error);
        }
      },
    }),
    verifyOTP: builder.mutation<MessageResponse, OTPVerifyRequest>({
      query: (credentials) => ({
        url: '/users/otp-verify',
        method: 'POST',
        body: credentials,
      }),
    }),
    forgotPassword: builder.mutation<MessageResponse, ForgotPasswordRequest>({
      query: (credentials) => ({
        url: '/users/forgotPassword',
        method: 'POST',
        body: credentials,
      }),
    }),
    resetPassword: builder.mutation<MessageResponse, ResetPasswordRequest>({
      query: (credentials) => ({
        url: '/users/resetPassword',
        method: 'POST',
        body: credentials,
      }),
    }),
    resendOTP: builder.mutation<MessageResponse, ResendOTPRequest>({
      query: (credentials) => ({
        url: '/users/resend-otp',
        method: 'POST',
        body: credentials,
      }),
    }),
    getProfile: builder.query<ProfileResponse, void>({
      query: () => ({
        url: '/users/profile',
        method: 'GET',
      }),
      providesTags: ['Auth'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useVerifyOTPMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useResendOTPMutation,
  useGetProfileQuery,
  useLazyGetProfileQuery,
} = authApi;