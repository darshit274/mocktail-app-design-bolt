import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

export interface PYQTest {
  id: number;
  uuid: string;
  name: string;
  name_gujarati?: string;
  description?: string;
  description_gujarati?: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  total_tests: number;
  total_questions: number;
  estimated_duration: number;
  is_featured: boolean;
  is_active: boolean;
  hasAccess: boolean;
  created_at: string;
  updated_at: string;
}

export interface PYQListResponse {
  success: boolean;
  message: string;
  data: {
    tests: PYQTest[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasMore: boolean;
    };
  };
}

export interface PYQListParams {
  page?: number;
  limit?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'all';
  sort?: 'newest' | 'oldest' | 'popular' | 'easy' | 'hard';
  search?: string;
  is_featured?: boolean;
}

export const pyqApi = createApi({
  reducerPath: 'pyqApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['PYQ'],
  endpoints: (builder) => ({
    // Get Previous Years Question Papers with pagination and filters
    getPreviousYearsTests: builder.query<PYQListResponse, PYQListParams>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();

        if (params.page) searchParams.append('page', params.page.toString());
        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.difficulty && params.difficulty !== 'all') {
          searchParams.append('difficulty', params.difficulty);
        }
        if (params.sort) searchParams.append('sort', params.sort);
        if (params.search) searchParams.append('search', params.search);
        if (params.is_featured !== undefined) {
          searchParams.append('is_featured', params.is_featured.toString());
        }

        return {
          url: `/tests/previous-years?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result) =>
        result?.data?.tests
          ? [
              ...result.data.tests.map(({ uuid }) => ({ type: 'PYQ' as const, id: uuid })),
              { type: 'PYQ', id: 'LIST' },
            ]
          : [{ type: 'PYQ', id: 'LIST' }],
    }),

    // Get single PYQ test by UUID
    getPYQTestByUuid: builder.query<{ success: boolean; data: PYQTest }, string>({
      query: (uuid) => ({
        url: `/tests/series/${uuid}`,
        method: 'GET',
      }),
      providesTags: (result, error, uuid) => [{ type: 'PYQ', id: uuid }],
    }),
  }),
});

export const {
  useGetPreviousYearsTestsQuery,
  useLazyGetPreviousYearsTestsQuery,
  useGetPYQTestByUuidQuery,
  useLazyGetPYQTestByUuidQuery,
} = pyqApi;
