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
  testId: string;
  testName: string;
  testNameGujarati?: string;
  testUuid: string;
  testSeriesName: string;
  testSeriesNameGujarati?: string;
  testSeriesUuid: string;
  categoryName: string;
  categoryNameGujarati?: string;
  categoryUuid: string;
  subCategoryName?: string | null;
  subCategoryUuid?: string | null;
  hierarchyPath: string;
  isFreeInPaidSeries: boolean;
  pricingType: string;
  latestSessionId: string;
  completedAt: string;
  latestScore: number;
  latestPercentage: number;
  bestScore: number;
  bestPercentage: number;
  totalAttempts: number;
  totalQuestions: number;
  attempted: number;
  timeTaken: string;
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

export interface DashboardStats {
  totalTests: number;
  completedTests: number;
  totalScore: number;
  rank: number | null;
  totalStudents: number;
  activeSubscriptions: number;
  recentActivity: Array<{
    id: number;
    sessionUuid: string;
    type: string;
    title: string;
    date: string;
    score: number;
    total: number;
    percentage: number;
  }>;
}

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Profile', 'TestHistory', 'Subscriptions', 'Dashboard'],
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
      query: ({ page = 1, limit = 100 }) => ({
        url: '/test-history',
        params: { page, limit },
      }),
      transformResponse: (response: any) => {
        // Backend returns: { data: { history: [...], pagination: {...} } }
        // Pass through the aggregated test history data
        return {
          success: true,
          data: {
            sessions: response.data.history || [],
            pagination: response.data.pagination,
          },
        };
      },
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

    // Get dashboard stats
    getDashboardStats: builder.query<
      { success: boolean; message: string; data: DashboardStats },
      void
    >({
      query: () => ({
        url: '/dashboard/stats',
        method: 'GET',
      }),
      providesTags: ['Dashboard'],
    }),

    // Get test attempts for a specific test/category
    getTestAttempts: builder.query<
      {
        success: boolean;
        data: {
          testId: string;
          testName: string;
          testUuid: string;
          totalAttempts: number;
          attempts: Array<{
            attemptNumber: number;
            sessionId: number;
            completedAt: string;
            score: number;
            percentage: number;
            totalQuestions: number;
            attempted: number;
            correct: number;
            wrong: number;
            unanswered: number;
            timeTaken: string;
          }>;
        };
      },
      string
    >({
      query: (categoryUuid) => ({
        url: `/test-history/test/${categoryUuid}/attempts`,
        method: 'GET',
      }),
      providesTags: ['TestHistory'],
    }),

    // Get session details by sessionId
    getSessionDetails: builder.query<
      {
        success: boolean;
        message: string;
        data: {
          sessionId: number;
          testId: number;
          testName: string;
          testUuid: string;
          categoryName: string;
          completedAt: string;
          totalQuestions: number;
          attempted: number;
          correct: number;
          wrong: number;
          notAttempted: number;
          markedForReview: number;
          totalMarks: number;
          obtainedMarks: number;
          negativeMarks: number;
          finalScore: number;
          percentage: number;
          accuracy: number;
          timeSpent: number;
        };
      },
      string | number
    >({
      query: (sessionId) => ({
        url: `/test-history/${sessionId}`,
        method: 'GET',
      }),
      providesTags: ['TestHistory'],
    }),

    // Get user's rank and percentile
    getUserRank: builder.query<
      {
        success: boolean;
        message: string;
        data: {
          rank: number;
          totalScore: number;
          testsCompleted: number;
          bestScore?: number;
          bestPercentage?: number;
          percentile: number;
          totalUsers: number;
          dataSource: string;
        };
      },
      void
    >({
      query: () => ({
        url: '/leaderboard/my-rank',
        method: 'GET',
      }),
      providesTags: ['TestHistory'],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetTestHistoryQuery,
  useGetSubscriptionsQuery,
  useGetDashboardStatsQuery,
  useGetTestAttemptsQuery,
  useGetSessionDetailsQuery,
  useGetUserRankQuery,
} = userApi;