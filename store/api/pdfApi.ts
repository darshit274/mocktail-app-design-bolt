import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

export interface PDFCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order: number;
  is_active?: boolean;
}

export interface PDF {
  id: string;
  title: string;
  description?: string;
  category_id: number;
  file_path: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  access_level: 'free' | 'premium' | 'restricted';
  test_series_id?: string;
  exam_type_id?: number;
  tags?: string[];
  download_count: number;
  view_count: number;
  is_active: boolean;
  is_featured: boolean;
  test_id?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
  category?: PDFCategory;
  // Pricing — note that price/discount_percentage arrive as STRINGS from the
  // backend (Sequelize DECIMAL → JSON string). Always coerce with Number()
  // before calling .toFixed() or doing arithmetic.
  price?: string | number;
  currency?: string;
  is_free?: boolean;
  discount_percentage?: string | number;
  subscription_required?: boolean;
  preview_pages?: number;
  display_order?: number;
}

export interface PDFListResponse {
  success: boolean;
  data: PDF[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PDFResponse {
  success: boolean;
  data: PDF;
}

export interface PDFDownloadResponse {
  success: boolean;
  data: {
    download_url: string;
    filename: string;
    size: number;
  };
}

export interface PDFCategoriesResponse {
  success: boolean;
  data: PDFCategory[];
}

// ===== Hierarchy types (categories with sub-categories tree) =====
export interface PDFHierarchyCategory {
  id: number;
  uuid: string;
  name: string;
  name_gujarati?: string | null;
  description?: string | null;
  description_gujarati?: string | null;
  icon?: string | null;
  color?: string | null;
  node_type: 'unset' | 'container' | 'pdf_holder';
  hierarchy_level: number;
  display_order: number;
  subcategories_count?: number;
  pdfs_count?: number;
}

export interface PDFHierarchyRootsResponse {
  success: boolean;
  data: PDFHierarchyCategory[];
}

export interface PDFHierarchyCategoryContentResponse {
  success: boolean;
  data: {
    category: PDFHierarchyCategory & {
      parent_category?: {
        id: number;
        uuid: string;
        name: string;
        name_gujarati?: string | null;
        hierarchy_level: number;
      } | null;
    };
    content_type: 'empty' | 'categories' | 'pdfs';
    content: PDFHierarchyCategory[] | PDF[];
    statistics: { subcategories_count: number; pdfs_count: number };
  };
}

export interface PDFFiltersResponse {
  success: boolean;
  data: {
    categories: string[];
    subjects: string[];
  };
}

export interface PDFStatsResponse {
  success: boolean;
  data: {
    total_pdfs: number;
    free_pdfs: number;
    paid_pdfs: number;
    total_downloads: number;
    category_stats: Array<{
      category: string;
      count: number;
      downloads: number;
    }>;
    top_downloads: Array<{
      id: string;
      title: string;
      download_count: number;
      category: string;
    }>;
  };
}

export interface PDFListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  subject?: string;
  is_free?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  access_level?: 'free' | 'premium' | 'restricted';
}

export const pdfApi = createApi({
  reducerPath: 'pdfApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['PDF', 'PDFCategory', 'PDFStats'],
  endpoints: (builder) => ({
    // Get PDFs with pagination and filters
    getPDFs: builder.query<PDFListResponse, PDFListParams>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value.toString());
          }
        });

        return {
          url: `/pdfs?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'PDF' as const, id })),
              { type: 'PDF', id: 'LIST' },
            ]
          : [{ type: 'PDF', id: 'LIST' }],
    }),

    // Get single PDF by ID
    getPDFById: builder.query<PDFResponse, string>({
      query: (id) => ({
        url: `/pdfs/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'PDF', id }],
    }),

    // Get PDF download URL
    getPDFDownloadUrl: builder.mutation<PDFDownloadResponse, string>({
      query: (id) => ({
        url: `/pdfs/${id}/download`,
        method: 'GET',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'PDF', id }],
    }),

    // Get PDF categories
    getPDFCategories: builder.query<PDFCategoriesResponse, void>({
      query: () => ({
        url: '/pdfs/categories',
        method: 'GET',
      }),
      providesTags: ['PDFCategory'],
    }),

    // Get PDF filters (categories and subjects)
    getPDFFilters: builder.query<PDFFiltersResponse, void>({
      query: () => ({
        url: '/pdfs/filters',
        method: 'GET',
      }),
      providesTags: ['PDFCategory'],
    }),

    // Get PDF statistics
    getPDFStats: builder.query<PDFStatsResponse, void>({
      query: () => ({
        url: '/pdfs/stats',
        method: 'GET',
      }),
      providesTags: ['PDFStats'],
    }),

    // Increment view count
    incrementPDFView: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/pdfs/${id}/view`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'PDF', id },
        { type: 'PDFStats' },
      ],
    }),

    // ===== Hierarchy: root categories + drill-down =====
    getPDFHierarchyRoots: builder.query<PDFHierarchyRootsResponse, void>({
      query: () => ({ url: '/pdfs/hierarchy/roots', method: 'GET' }),
      providesTags: ['PDFCategory'],
    }),

    getPDFHierarchyCategory: builder.query<PDFHierarchyCategoryContentResponse, string>({
      query: (categoryUuid) => ({
        url: `/pdfs/hierarchy/categories/${categoryUuid}`,
        method: 'GET',
      }),
      providesTags: (result, error, categoryUuid) => [{ type: 'PDFCategory', id: categoryUuid }],
    }),
  }),
});

export const {
  useGetPDFsQuery,
  useLazyGetPDFsQuery,
  useGetPDFByIdQuery,
  useLazyGetPDFByIdQuery,
  useGetPDFDownloadUrlMutation,
  useGetPDFCategoriesQuery,
  useGetPDFFiltersQuery,
  useGetPDFStatsQuery,
  useIncrementPDFViewMutation,
  useGetPDFHierarchyRootsQuery,
  useGetPDFHierarchyCategoryQuery,
} = pdfApi;