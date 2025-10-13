import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

// =====================================================
// INTERFACES FOR DYNAMIC HIERARCHY
// =====================================================

export interface DynamicTestSeries {
  id: number;
  uuid: string;
  name: string;
  name_gujarati?: string;
  description?: string;
  description_gujarati?: string;
  title: string; // Backwards compatibility
  is_active: boolean;
  pricing_type: 'free' | 'paid';
  price: string;
  currency: string;
  discount_percentage: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  
  // Dynamic hierarchy metadata
  categories_count: number;
  total_questions: number;
  is_subscribed: boolean;
  
  // Backwards compatibility
  tests_count: number;
}

export interface DynamicCategory {
  id: number;
  uuid: string;
  name: string;
  name_gujarati?: string;
  description?: string;
  description_gujarati?: string;
  node_type: 'container' | 'question_holder' | 'unset';
  hierarchy_level: number;
  display_order: number;
  created_at: string;
  updated_at: string;
  
  // Metadata
  subcategories_count: number;
  questions_count: number;
  total_questions_count?: number;
  total_questions_recursive: number;
  has_subcategories: boolean;
  has_questions: boolean;
  has_questions_recursive: boolean;
}

export interface DynamicQuestion {
  id: number;
  uuid: string;
  question_text: string;
  question_text_gujarati?: string;
  
  // Options
  option_a: string;
  option_a_gujarati?: string;
  option_b: string;
  option_b_gujarati?: string;
  option_c: string;
  option_c_gujarati?: string;
  option_d: string;
  option_d_gujarati?: string;
  
  // Options formatted for quiz
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  explanation_gujarati?: string;
  marks: number;
  created_at: string;
  updated_at: string;
}

export interface Breadcrumb {
  id: number;
  uuid: string;
  name: string;
  hierarchy_level: number;
}

export interface CategoryStatistics {
  subcategories_count: number;
  questions_count: number;
  total_questions_recursive: number;
  hierarchy_level: number;
  is_leaf_category: boolean;
  has_questions_somewhere: boolean;
}

// API Response interfaces
export interface DynamicTestSeriesListResponse {
  success: boolean;
  data: DynamicTestSeries[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DynamicTestSeriesResponse {
  success: boolean;
  data: DynamicTestSeries & {
    categories: DynamicCategory[];
    content_type: 'categories';
  };
}

export interface DynamicCategoryResponse {
  success: boolean;
  data: {
    category: DynamicCategory & {
      testSeries: {
        id: number;
        uuid: string;
        name: string;
        pricing_type: 'free' | 'paid';
        is_active: boolean;
      };
      is_subscribed: boolean;
    };
    content_type: 'empty' | 'categories' | 'questions';
    content: DynamicCategory[] | DynamicQuestion[];
    breadcrumb: Breadcrumb[];
    statistics: CategoryStatistics;
  };
}

export interface DynamicQuestionsResponse {
  success: boolean;
  data: {
    category: {
      id: number;
      uuid: string;
      name: string;
      name_gujarati?: string;
      description?: string;
      description_gujarati?: string;
    };
    questions: DynamicQuestion[];
    metadata: {
      total_questions: number;
      language: string;
      shuffled: boolean;
    };
  };
}

export interface DynamicTestSeriesListParams {
  page?: number;
  limit?: number;
  search?: string;
  pricing_type?: 'free' | 'paid';
  is_featured?: boolean;
}

// =====================================================
// API SLICE
// =====================================================

export const dynamicHierarchyApi = createApi({
  reducerPath: 'dynamicHierarchyApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['DynamicTestSeries', 'DynamicCategory', 'DynamicQuestion', 'DynamicSolution'],
  
  endpoints: (builder) => ({
    
    // =====================================================
    // TEST SERIES ENDPOINTS
    // =====================================================
    
    // Get test series list (replaces old getTestSeries)
    getDynamicTestSeries: builder.query<DynamicTestSeriesListResponse, DynamicTestSeriesListParams>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.search) queryParams.append('search', params.search);
        if (params.pricing_type) queryParams.append('pricing_type', params.pricing_type);
        if (params.is_featured !== undefined) queryParams.append('is_featured', params.is_featured.toString());
        
        return `dynamic/test-series?${queryParams.toString()}`;
      },
      providesTags: ['DynamicTestSeries'],
    }),

    // Get test series by UUID (replaces old getTestSeriesById)
    getDynamicTestSeriesByUuid: builder.query<DynamicTestSeriesResponse, string>({
      query: (uuid) => `dynamic/test-series/${uuid}`,
      providesTags: (result, error, uuid) => [
        { type: 'DynamicTestSeries', id: uuid },
        'DynamicCategory'
      ],
    }),

    // =====================================================
    // CATEGORY NAVIGATION ENDPOINTS
    // =====================================================
    
    // Get category details (replaces old category/subcategory endpoints)
    getDynamicCategoryByUuid: builder.query<DynamicCategoryResponse, string>({
      query: (uuid) => `dynamic/categories/${uuid}`,
      providesTags: (result, error, uuid) => [
        { type: 'DynamicCategory', id: uuid },
        'DynamicQuestion'
      ],
    }),

    // =====================================================
    // QUIZ/QUESTION ENDPOINTS
    // =====================================================
    
    // Get questions for quiz (replaces old test questions endpoint)
    getDynamicQuestions: builder.query<DynamicQuestionsResponse, {
      categoryUuid: string;
      language?: 'english' | 'gujarati';
      shuffle?: boolean;
    }>({
      query: ({ categoryUuid, language = 'english', shuffle = false }) => {
        const queryParams = new URLSearchParams();
        queryParams.append('language', language);
        queryParams.append('shuffle', shuffle.toString());
        
        return `dynamic/categories/${categoryUuid}/questions?${queryParams.toString()}`;
      },
      providesTags: (result, error, { categoryUuid }) => [
        { type: 'DynamicQuestion', id: categoryUuid }
      ],
    }),

    // Get solutions for category quiz (replaces session-based solutions for dynamic hierarchy)
    getDynamicSolutions: builder.query<{
      success: boolean;
      data: {
        category: {
          id: number;
          uuid: string;
          name: string;
          name_gujarati?: string;
          description?: string;
          description_gujarati?: string;
        };
        solutions: {
          id: number;
          uuid: string;
          question_text: string | { english: string; gujarati: string };
          question_text_gujarati?: string;
          correct_answer: 'A' | 'B' | 'C' | 'D';
          explanation?: string | { english: string; gujarati: string };
          explanation_gujarati?: string;
          marks: number;
          options: {
            A: string | { english: string; gujarati: string };
            B: string | { english: string; gujarati: string };
            C: string | { english: string; gujarati: string };
            D: string | { english: string; gujarati: string };
          };
          option_a_gujarati?: string;
          option_b_gujarati?: string;
          option_c_gujarati?: string;
          option_d_gujarati?: string;
        }[];
        metadata: {
          total_questions: number;
          language: string;
        };
      };
    }, {
      categoryUuid: string;
      language?: 'english' | 'gujarati' | 'both';
    }>({
      query: ({ categoryUuid, language = 'both' }) => {
        const queryParams = new URLSearchParams();
        queryParams.append('language', language);

        return `dynamic/categories/${categoryUuid}/solutions?${queryParams.toString()}`;
      },
      providesTags: (result, error, { categoryUuid }) => [
        { type: 'DynamicSolution', id: categoryUuid }
      ],
    }),

    // =====================================================
    // UTILITY ENDPOINTS
    // =====================================================
    
    // Search across test series and categories
    searchDynamicContent: builder.query<{
      success: boolean;
      data: {
        test_series: DynamicTestSeries[];
        categories: DynamicCategory[];
        total_results: number;
      };
    }, {
      query: string;
      type?: 'all' | 'test_series' | 'categories';
    }>({
      query: ({ query, type = 'all' }) => {
        const queryParams = new URLSearchParams();
        queryParams.append('q', query);
        queryParams.append('type', type);
        
        return `dynamic/search?${queryParams.toString()}`;
      },
    }),

  }),
});

// Export hooks
export const {
  useGetDynamicTestSeriesQuery,
  useGetDynamicTestSeriesByUuidQuery,
  useGetDynamicCategoryByUuidQuery,
  useGetDynamicQuestionsQuery,
  useGetDynamicSolutionsQuery,
  useSearchDynamicContentQuery,
} = dynamicHierarchyApi;

// =====================================================
// BACKWARDS COMPATIBILITY HELPERS
// =====================================================

// Helper function to convert dynamic series to old format for existing components
export const convertDynamicSeriesToOldFormat = (series: DynamicTestSeries): any => {
  return {
    id: series.uuid, // Use UUID as ID for compatibility
    uuid: series.uuid,
    title: series.title || series.name,
    name: series.name,
    description: series.description,
    price: parseFloat(series.price),
    currency: series.currency,
    pricing_type: series.pricing_type,
    is_featured: series.is_featured,
    is_subscribed: series.is_subscribed,
    is_purchased: series.is_subscribed, // Map subscription to purchase for compatibility
    categories_count: series.categories_count,
    tests_count: series.tests_count,
    total_tests: series.total_questions,
    rating: 4.5, // Default rating
    rating_count: 100, // Default rating count
    purchase_count: 0, // Default purchase count
    difficulty: 'mixed' as const,
    language: 'English/Gujarati',
    created_at: series.created_at,
    updated_at: series.updated_at,
  };
};

// Helper function to convert dynamic category to old test format for existing components
export const convertDynamicCategoryToTestFormat = (category: DynamicCategory): any => {
  return {
    id: category.uuid,
    uuid: category.uuid,
    title: category.name,
    name: category.name,
    description: category.description,
    questions_count: category.questions_count,
    duration_minutes: 60, // Default duration
    total_marks: category.questions_count, // Assume 1 mark per question
    difficulty: 'medium' as const,
    is_active: true,
    created_at: category.created_at,
    updated_at: category.updated_at,
  };
};