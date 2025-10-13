import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

// Type definitions based on backend API spec
export interface FreeInPaidCategory {
  uuid: string;
  name: string;
  name_gujarati: string;
  description: string;
  description_gujarati: string;
  test_duration_minutes: number;
  questions_count: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
  series: {
    uuid: string;
    title: string;
    title_gujarati: string;
    price: number;
    currency: string;
  };
  hierarchy_path: Array<{
    uuid: string;
    name: string;
    name_gujarati: string;
    node_type: string;
  }>;
  breadcrumb: string;
  breadcrumb_gujarati: string;
}

export interface FreeInPaidSeries {
  uuid: string;
  title: string;
  title_gujarati: string;
  description: string;
  description_gujarati: string;
  is_paid: boolean;
  price: number;
  currency: string;
  is_featured: boolean;
  free_categories_count: number;
}

export interface AllFreeInPaidCategoriesResponse {
  success: boolean;
  data: {
    categories: FreeInPaidCategory[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface FreeInPaidSeriesResponse {
  success: boolean;
  data: {
    series: FreeInPaidSeries[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface FreeInPaidCategoriesForSeriesResponse {
  success: boolean;
  data: {
    series: {
      uuid: string;
      title: string;
      title_gujarati: string;
      description: string;
      description_gujarati: string;
      is_paid: boolean;
      price: number;
      currency: string;
    };
    freeCategories: Array<{
      uuid: string;
      name: string;
      name_gujarati: string;
      description: string;
      description_gujarati: string;
      node_type: string;
      hierarchy_level: number;
      test_duration_minutes: number;
      negative_marking_enabled: boolean;
      negative_marks_per_wrong: number;
      questions_count: number;
      hierarchy_path: Array<{
        uuid: string;
        name: string;
        name_gujarati: string;
        node_type: string;
      }>;
    }>;
  };
}

export interface FreeInPaidListParams {
  page?: number;
  limit?: number;
}

export const freeInPaidApi = createApi({
  reducerPath: 'freeInPaidApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['FreeInPaidCategory', 'FreeInPaidSeries'],
  endpoints: (builder) => ({
    // Get all free categories from ALL paid series (main discovery page)
    getAllFreeInPaidCategories: builder.query<AllFreeInPaidCategoriesResponse, FreeInPaidListParams>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();

        if (params.page) searchParams.append('page', params.page.toString());
        if (params.limit) searchParams.append('limit', params.limit.toString());

        return {
          url: `/tests/free-in-paid/all?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result) =>
        result?.data?.categories
          ? [
              ...result.data.categories.map(({ uuid }) => ({ type: 'FreeInPaidCategory' as const, id: uuid })),
              { type: 'FreeInPaidCategory', id: 'LIST' },
            ]
          : [{ type: 'FreeInPaidCategory', id: 'LIST' }],
    }),

    // Get all PAID test series that have at least one free category
    getFreeInPaidSeries: builder.query<FreeInPaidSeriesResponse, FreeInPaidListParams>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();

        if (params.page) searchParams.append('page', params.page.toString());
        if (params.limit) searchParams.append('limit', params.limit.toString());

        return {
          url: `/tests/free-in-paid?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result) =>
        result?.data?.series
          ? [
              ...result.data.series.map(({ uuid }) => ({ type: 'FreeInPaidSeries' as const, id: uuid })),
              { type: 'FreeInPaidSeries', id: 'LIST' },
            ]
          : [{ type: 'FreeInPaidSeries', id: 'LIST' }],
    }),

    // Get free categories for a specific paid series with hierarchy paths
    getFreeInPaidCategoriesForSeries: builder.query<FreeInPaidCategoriesForSeriesResponse, string>({
      query: (seriesUuid) => ({
        url: `/tests/free-in-paid/${seriesUuid}`,
        method: 'GET',
      }),
      providesTags: (result, error, seriesUuid) => [
        { type: 'FreeInPaidSeries', id: seriesUuid },
        { type: 'FreeInPaidCategory', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetAllFreeInPaidCategoriesQuery,
  useLazyGetAllFreeInPaidCategoriesQuery,
  useGetFreeInPaidSeriesQuery,
  useLazyGetFreeInPaidSeriesQuery,
  useGetFreeInPaidCategoriesForSeriesQuery,
  useLazyGetFreeInPaidCategoriesForSeriesQuery,
} = freeInPaidApi;
