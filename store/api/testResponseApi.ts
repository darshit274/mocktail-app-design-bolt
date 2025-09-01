import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

// =====================
// TEST RESPONSE INTERFACES
// =====================

export interface TestSession {
  id: string;
  user_id: string;
  test_id: number;
  started_at: string;
  completed_at?: string;
  is_completed: boolean;
  is_submitted: boolean;
  remaining_time_seconds?: number;
  current_question_index: number;
  total_questions: number;
  session_data?: any;
  answers_data?: any;
  calculated_score?: number;
  total_correct: number;
  total_wrong: number;
  total_unanswered: number;
  total_marked_for_review: number;
  status: 'active' | 'paused' | 'completed' | 'expired' | 'cancelled';
}

export interface UserAnswer {
  id: number;
  test_session_id: string;
  question_id: number;
  selected_option?: 'A' | 'B' | 'C' | 'D';
  is_correct?: boolean;
  time_spent: number;
  is_flagged: boolean;
  is_visited: boolean;
}

export interface LeaderboardEntry {
  id: number;
  user_id: string;
  test_id: number;
  test_session_id: string;
  test_series_id?: number;
  category_id?: number;
  score: number;
  percentage: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered: number;
  time_taken_seconds: number;
  rank?: number;
  percentile?: number;
  completion_date: string;
  is_valid: boolean;
  user?: {
    uuid: string;
    username: string;
    fullName?: string;
    avatarUrl?: string;
  };
  test?: {
    id: number;
    name: string;
    duration_minutes: number;
  };
}

// =====================
// REQUEST/RESPONSE TYPES
// =====================

export interface StartTestSessionRequest {
  test_id: number;
  user_id: string;
}

export interface StartTestSessionResponse {
  success: boolean;
  message: string;
  data: {
    session: TestSession;
    test: {
      id: number;
      name: string;
      duration_minutes: number;
      total_questions: number;
      instructions?: string;
    };
  };
}

export interface SaveAnswerRequest {
  test_session_id: string;
  question_id: number;
  selected_option?: 'A' | 'B' | 'C' | 'D';
  time_spent?: number;
  is_flagged?: boolean;
}

export interface SaveAnswerResponse {
  success: boolean;
  message: string;
  data: {
    user_answer: UserAnswer;
    is_correct: boolean;
  };
}

export interface SubmitTestRequest {
  test_session_id: string;
}

export interface TestResults {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  flaggedQuestions: number;
  totalMarks: number;
  obtainedMarks: number;
  negativeMarks: number;
  finalScore: number;
  percentage: number;
  timeTakenSeconds: number;
}

export interface SubmitTestResponse {
  success: boolean;
  message: string;
  data: {
    session: TestSession;
    results: TestResults;
  };
}

export interface TestResultsDetailResponse {
  success: boolean;
  message: string;
  data: {
    session: TestSession;
    leaderboard_entry: LeaderboardEntry;
    answers: (UserAnswer & {
      question: {
        id: number;
        question_text: string;
        correct_answer: string;
        explanation?: string;
        marks: number;
      };
    })[];
  };
}

export interface LeaderboardResponse {
  success: boolean;
  message: string;
  data: {
    leaderboard: LeaderboardEntry[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalEntries: number;
      limit: number;
    };
    userRank?: {
      rank: number;
      score: number;
      percentage: number;
      percentile: number;
    };
  };
}

export interface UserTestHistory {
  id: number;
  score: number;
  percentage: number;
  rank?: number;
  percentile?: number;
  completion_date: string;
  test: {
    id: number;
    name: string;
    testSeries?: {
      id: number;
      name: string;
    };
  };
}

export interface UserTestHistoryResponse {
  success: boolean;
  message: string;
  data: {
    history: UserTestHistory[];
    statistics: {
      total_tests: number;
      avg_score: number;
      avg_percentage: number;
      best_score: number;
      worst_score: number;
      avg_rank: number;
      best_rank: number;
    };
    pagination: {
      currentPage: number;
      totalPages: number;
      totalEntries: number;
      limit: number;
    };
  };
}

export interface TestAnalyticsResponse {
  success: boolean;
  message: string;
  data: {
    test: {
      id: number;
      name: string;
      duration_minutes: number;
    };
    analytics: {
      total_attempts: number;
      avg_score: number;
      avg_percentage: number;
      highest_score: number;
      lowest_score: number;
      avg_time_taken_minutes: number;
      avg_correct: number;
      avg_wrong: number;
      avg_unanswered: number;
    };
    score_distribution: {
      score_range: string;
      count: number;
    }[];
  };
}

// =====================
// RTK QUERY API
// =====================

export const testResponseApi = createApi({
  reducerPath: 'testResponseApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['TestSession', 'LeaderboardEntry', 'UserTestHistory'],
  endpoints: (builder) => ({
    // =====================
    // TEST SESSION MANAGEMENT
    // =====================
    startTestSession: builder.mutation<StartTestSessionResponse, StartTestSessionRequest>({
      query: (body) => ({
        url: '/test-response/session/start',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TestSession'],
    }),

    saveAnswer: builder.mutation<SaveAnswerResponse, SaveAnswerRequest>({
      query: (body) => ({
        url: '/test-response/session/answer',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TestSession'],
    }),

    submitTest: builder.mutation<SubmitTestResponse, SubmitTestRequest>({
      query: (body) => ({
        url: '/test-response/session/submit',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TestSession', 'LeaderboardEntry'],
    }),

    getTestResults: builder.query<TestResultsDetailResponse, string>({
      query: (sessionId) => `/test-response/session/${sessionId}/results`,
      providesTags: ['TestSession'],
    }),

    // =====================
    // LEADERBOARD QUERIES
    // =====================
    getTestLeaderboard: builder.query<LeaderboardResponse, {
      testId: number;
      page?: number;
      limit?: number;
      userId?: string;
    }>({
      query: ({ testId, page = 1, limit = 50, userId }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (userId) params.append('user_id', userId);
        
        return `/test-response/leaderboard/test/${testId}?${params.toString()}`;
      },
      providesTags: ['LeaderboardEntry'],
    }),

    getTestSeriesLeaderboard: builder.query<LeaderboardResponse, {
      testSeriesId: number;
      page?: number;
      limit?: number;
      userId?: string;
    }>({
      query: ({ testSeriesId, page = 1, limit = 50, userId }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (userId) params.append('user_id', userId);
        
        return `/test-response/leaderboard/series/${testSeriesId}?${params.toString()}`;
      },
      providesTags: ['LeaderboardEntry'],
    }),

    getOverallLeaderboard: builder.query<LeaderboardResponse, {
      timeframe?: 'today' | 'week' | 'month' | 'all';
      page?: number;
      limit?: number;
    }>({
      query: ({ timeframe = 'all', page = 1, limit = 50 }) => {
        const params = new URLSearchParams({
          timeframe,
          page: page.toString(),
          limit: limit.toString(),
        });
        
        return `/test-response/leaderboard/overall?${params.toString()}`;
      },
      providesTags: ['LeaderboardEntry'],
    }),

    getCategoryLeaderboard: builder.query<LeaderboardResponse, {
      categoryId: number;
      page?: number;
      limit?: number;
      userId?: string;
    }>({
      query: ({ categoryId, page = 1, limit = 50, userId }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (userId) params.append('user_id', userId);
        
        return `/test-response/leaderboard/category/${categoryId}?${params.toString()}`;
      },
      providesTags: ['LeaderboardEntry'],
    }),

    // =====================
    // USER HISTORY AND ANALYTICS
    // =====================
    getUserTestHistory: builder.query<UserTestHistoryResponse, {
      userId: string;
      page?: number;
      limit?: number;
      testSeriesId?: number;
    }>({
      query: ({ userId, page = 1, limit = 20, testSeriesId }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (testSeriesId) params.append('test_series_id', testSeriesId.toString());
        
        return `/test-response/history/user/${userId}?${params.toString()}`;
      },
      providesTags: ['UserTestHistory'],
    }),

    getTestAnalytics: builder.query<TestAnalyticsResponse, number>({
      query: (testId) => `/test-response/analytics/test/${testId}`,
    }),
  }),
});

// Export hooks
export const {
  // Test session management
  useStartTestSessionMutation,
  useSaveAnswerMutation,
  useSubmitTestMutation,
  useGetTestResultsQuery,
  
  // Leaderboards
  useGetTestLeaderboardQuery,
  useGetTestSeriesLeaderboardQuery,
  useGetOverallLeaderboardQuery,
  useGetCategoryLeaderboardQuery,
  
  // User history and analytics
  useGetUserTestHistoryQuery,
  useGetTestAnalyticsQuery,
} = testResponseApi;