import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';
import { Platform } from 'react-native';


export interface UserProfile {
  id: number;
  uuid: string;
  username: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  schoolName?: string;
  city?: string;
  state?: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  created_at: string;
  updated_at: string;
  stats?: UserStats;
}

export interface UserStats {
  testsCompleted: number;
  totalScore: number;
  averageScore: number;
  rank: number;
  studyHours: number;
  streak: number;
}

export interface TestHistoryItem {
  id: number;
  uuid: string;
  test: {
    id: number;
    uuid: string;
    title: string;
    duration_minutes: number;
    total_marks: number;
  };
  start_time: string;
  completed_at: string;
  time_taken: number;
  score: number;
  total_marks: number;
  percentage: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered: number;
}

export interface Subscription {
  id: number;
  test_series: {
    id: number;
    uuid: string;
    name: string;
    description: string;
    price: number;
  };
  start_date: string;
  expiry_date: string | null;
  is_active: boolean;
  transaction_id: string;
  amount: number;
}

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Profile', 'TestHistory', 'Subscriptions'],
  endpoints: (builder) => ({
    // Get user profile
    getProfile: builder.query<{ success: boolean; data: UserProfile }, void>({
      query: () => ({
        url: '/profile/profile',
        method: 'GET',
      }),
      providesTags: ['Profile'],
    }),

    // Update user profile
    updateProfile: builder.mutation<
      { success: boolean; message: string; data: UserProfile },
      Partial<UserProfile> & { avatar?: string | Blob }
    >({
      queryFn: async (profileData, api, extraOptions, baseQuery) => {
        const updatePayload: any = {
          fullName: profileData.fullName,
          email: profileData.email,
          phoneNumber: profileData.phoneNumber || '',
          dateOfBirth: profileData.dateOfBirth || null,
          schoolName: profileData.schoolName || '',
          city: profileData.city || '',
          state: profileData.state || '',
        };

        // Handle avatar upload - convert to base64 like web app
        if (profileData.avatar) {
          try {
            let base64String: string;

            if (profileData.avatar instanceof Blob) {
              // For web - convert blob to base64
              const reader = new FileReader();
              const base64Promise = new Promise<string>((resolve, reject) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
              });
              reader.readAsDataURL(profileData.avatar);
              base64String = await base64Promise;
            } else if (typeof profileData.avatar === 'string') {
              // For mobile - convert URI to base64
              if (profileData.avatar.startsWith('data:')) {
                // Already base64
                base64String = profileData.avatar;
              } else {
                // Convert file URI to base64
                const response = await fetch(profileData.avatar);
                const blob = await response.blob();
                const reader = new FileReader();
                const base64Promise = new Promise<string>((resolve, reject) => {
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.onerror = reject;
                });
                reader.readAsDataURL(blob);
                base64String = await base64Promise;
              }
            } else {
              throw new Error('Unsupported avatar format');
            }

            updatePayload.avatarBase64 = base64String;
            console.log('Avatar converted to base64, length:', base64String.length);
          } catch (error) {
            console.error('Failed to convert avatar to base64:', error);
            return { error: { status: 'CUSTOM_ERROR', data: 'Failed to process avatar image' } };
          }
        }

        console.log('Sending JSON update with payload keys:', Object.keys(updatePayload));

        // Use the baseQuery to make the actual request
        return baseQuery({
          url: '/profile/profile',
          method: 'PUT',
          body: updatePayload,
        });
      },
      invalidatesTags: ['Profile'],
    }),

    // Get test history
    getTestHistory: builder.query<
      {
        success: boolean;
        data: {
          sessions: TestHistoryItem[];
          pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
          };
        };
      },
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) => ({
        url: '/profile/profile/test-history',
        params: { page, limit },
      }),
      providesTags: ['TestHistory'],
    }),

    // Get user subscriptions
    getSubscriptions: builder.query<
      { success: boolean; data: Subscription[] },
      void
    >({
      query: () => ({
        url: '/profile/profile/subscriptions',
        method: 'GET',
      }),
      providesTags: ['Subscriptions'],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetTestHistoryQuery,
  useGetSubscriptionsQuery,
} = userApi;