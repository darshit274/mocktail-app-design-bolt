import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

// Updated to match backend TestSeries structure
export interface TestSeries {
  id: number;
  uuid: string;
  name: string; // Backend uses 'name', not 'title'
  name_gujarati?: string;
  description?: string;
  description_gujarati?: string;
  title?: string; // Computed field for backwards compatibility
  is_active: boolean;
  pricing_type: 'free' | 'paid';
  price: number;
  currency: string;
  original_price?: number;
  discount_percentage?: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  
  // Computed fields added by backend
  categories_count?: number;
  tests_count?: number;
  is_subscribed?: boolean;
  
  // Backwards compatibility fields
  total_tests?: number;
  free_tests?: number;
  duration_months?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  language?: string;
  instructions?: string;
  negative_marking?: boolean;
  negative_marks?: number;
  pass_percentage?: number;
  purchase_count?: number;
  rating?: number;
  rating_count?: number;
  topics?: string[];
  is_purchased?: boolean;
  purchased_at?: string;
  expires_at?: string;
}

export interface TestSeriesCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  series_count: number;
}

export interface TestSeriesListResponse {
  success: boolean;
  data: TestSeries[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TestSeriesResponse {
  success: boolean;
  data: TestSeries;
}

export interface TestSeriesCategoriesResponse {
  success: boolean;
  data: TestSeriesCategory[];
}

export interface TestSeriesStatsResponse {
  success: boolean;
  data: {
    total_series: number;
    purchased_series: number;
    featured_series: number;
    total_tests: number;
    completed_tests: number;
    average_score: number;
    category_stats: Array<{
      category: string;
      count: number;
      purchased: number;
    }>;
    price_range: {
      min: number;
      max: number;
      average: number;
    };
  };
}

export interface TestSeriesListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  exam_type?: string;
  price_min?: number;
  price_max?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  language?: string;
  sortBy?: 'created_at' | 'title' | 'price' | 'rating' | 'purchase_count';
  sortOrder?: 'ASC' | 'DESC';
  is_featured?: boolean;
  is_purchased?: boolean;
}

export interface PurchaseRequest {
  series_id: string;
  payment_method: 'razorpay' | 'stripe' | 'upi';
  payment_details?: any;
}

export interface PurchaseResponse {
  success: boolean;
  data: {
    order_id: string;
    payment_url?: string;
    amount: number;
    currency: string;
    expires_at: string;
  };
}

export interface VerifyPurchaseRequest {
  order_id: string;
  payment_id: string;
  signature?: string;
}

export interface VerifyPurchaseResponse {
  success: boolean;
  data: {
    purchase_id: string;
    series_id: string;
    status: 'completed' | 'failed';
    expires_at: string;
  };
}

export interface TestSeriesTest {
  id: string;
  title: string;
  description?: string;
  duration: number;
  total_questions: number;
  marks_per_question: number;
  negative_marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  is_free: boolean;
  order_index: number;
  is_active: boolean;
  attempts_allowed: number;
  user_attempts?: number;
  best_score?: number;
  last_attempted?: string;
  is_locked: boolean;
}

export interface SeriesTestsResponse {
  success: boolean;
  data: TestSeriesTest[];
}

export const testSeriesApi = createApi({
  reducerPath: 'testSeriesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['TestSeries', 'TestSeriesCategory', 'TestSeriesStats', 'Purchase', 'SeriesTests'],
  endpoints: (builder) => ({
    // Get test series with pagination and filters
    getTestSeries: builder.query<TestSeriesListResponse, TestSeriesListParams>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value.toString());
          }
        });

        return {
          url: `/test-series?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'TestSeries' as const, id })),
              { type: 'TestSeries', id: 'LIST' },
            ]
          : [{ type: 'TestSeries', id: 'LIST' }],
    }),

    // Get single test series by ID
    getTestSeriesById: builder.query<TestSeriesResponse, string>({
      query: (id) => ({
        url: `/test-series/by-id/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'TestSeries', id }],
    }),

    // Get test series categories
    getTestSeriesCategories: builder.query<TestSeriesCategoriesResponse, void>({
      query: () => ({
        url: '/test-series/categories',
        method: 'GET',
      }),
      providesTags: ['TestSeriesCategory'],
    }),

    // Get test series statistics
    getTestSeriesStats: builder.query<TestSeriesStatsResponse, void>({
      query: () => ({
        url: '/test-series/stats',
        method: 'GET',
      }),
      providesTags: ['TestSeriesStats'],
    }),

    // Get tests in a specific test series
    getSeriesTests: builder.query<SeriesTestsResponse, string>({
      query: (seriesId) => ({
        url: `/test-series/by-id/${seriesId}/tests`,
        method: 'GET',
      }),
      providesTags: (result, error, seriesId) => [
        { type: 'TestSeries', id: seriesId },
        { type: 'SeriesTests', id: seriesId },
      ],
    }),

    // Purchase test series
    purchaseTestSeries: builder.mutation<PurchaseResponse, PurchaseRequest>({
      query: (body) => ({
        url: '/test-series/purchase',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Purchase'],
    }),

    // Verify purchase
    verifyPurchase: builder.mutation<VerifyPurchaseResponse, VerifyPurchaseRequest>({
      query: (body) => ({
        url: '/test-series/verify-purchase',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TestSeries', 'Purchase', 'TestSeriesStats'],
    }),

    // Get user's purchased test series
    getPurchasedSeries: builder.query<{
      success: boolean;
      data: Array<TestSeries & {
        purchase_date: string;
        expires_at: string;
        tests_completed: number;
        progress_percentage: number;
      }>;
    }, void>({
      query: () => ({
        url: '/test-series/purchased',
        method: 'GET',
      }),
      providesTags: ['Purchase'],
    }),

    // Get user's progress in a test series
    getSeriesProgress: builder.query<{
      success: boolean;
      data: {
        series_id: string;
        total_tests: number;
        completed_tests: number;
        progress_percentage: number;
        average_score: number;
        best_score: number;
        total_time_spent: number;
        last_activity: string;
        test_progress: Array<{
          test_id: string;
          title: string;
          attempts: number;
          best_score: number;
          status: 'not_started' | 'in_progress' | 'completed';
        }>;
      };
    }, string>({
      query: (seriesId) => ({
        url: `/test-series/${seriesId}/progress`,
        method: 'GET',
      }),
      providesTags: (result, error, seriesId) => [
        { type: 'TestSeries', id: seriesId },
        { type: 'SeriesTests', id: seriesId },
      ],
    }),

    // Rate test series
    rateTestSeries: builder.mutation<{
      success: boolean;
      data: { new_rating: number; rating_count: number };
    }, { seriesId: string; rating: number; review?: string }>({
      query: ({ seriesId, rating, review }) => ({
        url: `/test-series/${seriesId}/rate`,
        method: 'POST',
        body: { rating, review },
      }),
      invalidatesTags: (result, error, { seriesId }) => [
        { type: 'TestSeries', id: seriesId },
        'TestSeriesStats',
      ],
    }),
  }),
});

export const {
  useGetTestSeriesQuery,
  useLazyGetTestSeriesQuery,
  useGetTestSeriesByIdQuery,
  useLazyGetTestSeriesByIdQuery,
  useGetTestSeriesCategoriesQuery,
  useGetTestSeriesStatsQuery,
  useGetSeriesTestsQuery,
  usePurchaseTestSeriesMutation,
  useVerifyPurchaseMutation,
  useGetPurchasedSeriesQuery,
  useGetSeriesProgressQuery,
  useRateTestSeriesMutation,
} = testSeriesApi;