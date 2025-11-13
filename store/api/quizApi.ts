import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

// Updated interface to match backend question structure
export interface QuizQuestion {
  id: number;
  uuid: string;
  question_text: string;
  question_text_gujarati?: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  options_gujarati?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  marks: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
  question_type: string;
  subject?: string;
  topic?: string;
  explanation?: string;
  explanation_gujarati?: string;
}

// Updated to match backend TestSession structure
export interface QuizSession {
  id: number;
  uuid: string;
  user_id: number;
  test_id: number;
  start_time: string;
  end_time?: string;
  status: 'not_started' | 'in_progress' | 'paused' | 'completed' | 'timed_out' | 'abandoned' | 'terminated';
  time_remaining: number; // in seconds
  total_time_spent: number;
  is_demo: boolean;
  language: string;
  created_at: string;
  updated_at: string;
}

// Updated to match backend API structure
export interface StartTestRequest {
  testUuid: string;
  language?: string;
}

// Updated to match backend start test response
export interface StartTestResponse {
  success: boolean;
  data: {
    session_id: string;
    status: string;
    started_at: string;
    time_remaining: number;
    is_demo: boolean;
    is_resuming?: boolean;
  };
}

// For getting questions after starting test
export interface TestQuestionsResponse {
  success: boolean;
  data: {
    questions: QuizQuestion[];
    test_info: {
      id: number;
      uuid: string;
      title: string;
      duration_minutes: number;
      total_marks: number;
      is_demo: boolean;
    };
  };
}

// Updated to match what backend expects
export interface SaveAnswerRequest {
  session_uuid: string;
  question_id: number;
  selected_option: 'A' | 'B' | 'C' | 'D' | null;
  time_spent: number; // in seconds
  is_flagged?: boolean;
}

export interface SaveAnswerResponse {
  success: boolean;
  data: {
    saved: boolean;
    time_remaining: number;
  };
}

// Updated to match backend test submission
export interface SubmitTestRequest {
  session_uuid: string;
  answers: Array<{
    question_id: number;
    selected_option: 'A' | 'B' | 'C' | 'D' | null;
    time_spent: number;
    is_flagged?: boolean;
  }>;
  submitted_at: string;
  time_taken: number;
}

// Updated to match backend test submission response
export interface SubmitTestResponse {
  success: boolean;
  data: {
    session_id: string;
    result_id?: string;
    total_score: number;
    correct_answers: number;
    wrong_answers: number;
    unanswered: number;
    percentage: number;
    passed: boolean;
    time_taken: number;
    rank?: number;
    total_participants?: number;
  };
}

// For pause/resume functionality
export interface PauseResumeRequest {
  session_uuid: string;
  action: 'pause' | 'resume';
}

export interface PauseResumeResponse {
  success: boolean;
  data: {
    status: 'active' | 'paused';
    time_remaining: number;
    paused_at?: string;
    resumed_at?: string;
  };
}

export interface GetSessionStatusResponse {
  success: boolean;
  data: {
    session: QuizSession;
    saved_answers: Array<{
      question_id: string;
      selected_option: 'A' | 'B' | 'C' | 'D' | null;
      is_flagged: boolean;
      time_spent: number;
    }>;
    statistics: {
      answered: number;
      unanswered: number;
      flagged: number;
      time_elapsed: number;
    };
  };
}

export interface ReviewAnswersRequest {
  session_id: string;
}

export interface ReviewAnswersResponse {
  success: boolean;
  data: {
    questions: Array<QuizQuestion & {
      selected_option: 'A' | 'B' | 'C' | 'D' | null;
      correct_option: 'A' | 'B' | 'C' | 'D';
      is_correct: boolean;
      marks_obtained: number;
      time_spent: number;
      explanation?: string;
    }>;
    result_summary: {
      total_score: number;
      percentage: number;
      grade: string;
      passed: boolean;
      rank?: number;
    };
  };
}

export const quizApi = createApi({
  reducerPath: 'quizApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['QuizSession', 'QuizResult', 'SavedAnswers'],
  endpoints: (builder) => ({
    // Start a new test session using backend API
    startTest: builder.mutation<StartTestResponse, StartTestRequest>({
      query: ({ testUuid, language = 'en' }) => ({
        url: `/tests/${testUuid}/start`,
        method: 'POST',
        body: { language },
      }),
      invalidatesTags: ['QuizSession'],
    }),

    // Get questions for a test
    getTestQuestions: builder.query<TestQuestionsResponse, string>({
      query: (testUuid) => ({
        url: `/tests/${testUuid}/questions`,
        method: 'GET',
      }),
    }),

    // Get single test by UUID for test info
    getTestByUuid: builder.query<{
      success: boolean;
      data: {
        id: number;
        uuid: string;
        title: string;
        description?: string;
        duration_minutes: number;
        total_marks: number;
        passing_marks: number;
        is_active: boolean;
        questions_count: number;
      };
    }, string>({
      query: (testUuid) => ({
        url: `/tests/${testUuid}`,
        method: 'GET',
      }),
    }),

    // Save individual answer (will need backend implementation)
    saveAnswer: builder.mutation<{ success: boolean }, SaveAnswerRequest>({
      query: (body) => ({
        url: `/test-sessions/${body.session_uuid}/answers`,
        method: 'POST',
        body: {
          question_id: body.question_id,
          selected_option: body.selected_option,
          time_spent: body.time_spent,
          is_flagged: body.is_flagged,
        },
      }),
      invalidatesTags: (result, error, { session_uuid }) => [
        { type: 'SavedAnswers', id: session_uuid },
      ],
    }),

    // Pause or resume test session (will need backend implementation)
    pauseResumeTest: builder.mutation<PauseResumeResponse, PauseResumeRequest>({
      query: (body) => ({
        url: `/test-sessions/${body.session_uuid}/${body.action}`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { session_uuid }) => [
        { type: 'QuizSession', id: session_uuid },
      ],
    }),

    // Submit test and get results (will need backend implementation)
    submitTest: builder.mutation<SubmitTestResponse, SubmitTestRequest>({
      query: (body) => ({
        url: `/test-sessions/${body.session_uuid}/submit`,
        method: 'POST',
        body: {
          answers: body.answers,
          submitted_at: body.submitted_at,
          time_taken: body.time_taken,
        },
      }),
      invalidatesTags: (result, error, { session_uuid }) => [
        { type: 'QuizSession', id: session_uuid },
        'QuizResult',
      ],
    }),

    // Get detailed review of answers (after submission)
    reviewAnswers: builder.query<ReviewAnswersResponse, ReviewAnswersRequest>({
      query: ({ session_id }) => ({
        url: `/test-sessions/${session_id}/review`,
        method: 'GET',
      }),
      providesTags: (result, error, { session_id }) => [
        { type: 'QuizResult', id: session_id },
        { type: 'QuizSession', id: session_id },
      ],
    }),

    // ✅ NEW: Get session solutions (same API as web app)
    getSessionSolutions: builder.query<ReviewAnswersResponse, ReviewAnswersRequest>({
      query: ({ session_id }) => ({
        url: `/test-history/${session_id}/solutions`,
        method: 'GET',
      }),
      providesTags: (result, error, { session_id }) => [
        { type: 'QuizResult', id: session_id },
        { type: 'QuizSession', id: session_id },
      ],
    }),

    // Get user's quiz history
    getQuizHistory: builder.query<{
      success: boolean;
      data: Array<{
        id: string;
        test_title: string;
        test_type: 'free' | 'series' | 'series-free';
        score: number;
        percentage: number;
        grade: string;
        passed: boolean;
        completed_at: string;
        time_taken: number;
        rank?: number;
        attempt_number: number;
      }>;
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }, { page?: number; limit?: number; test_type?: string }>(
      {
        query: (params = {}) => {
          const searchParams = new URLSearchParams();
          
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              searchParams.append(key, value.toString());
            }
          });

          return {
            url: `/quiz/history?${searchParams.toString()}`,
            method: 'GET',
          };
        },
        providesTags: ['QuizResult'],
      }
    ),

    // Get leaderboard for a specific test/quiz
    getQuizLeaderboard: builder.query<{
      success: boolean;
      data: Array<{
        rank: number;
        user_id: string;
        username: string;
        score: number;
        percentage: number;
        time_taken: number;
        completed_at: string;
        is_current_user?: boolean;
      }>;
    }, { test_id: string; test_type: string; limit?: number }>(
      {
        query: ({ test_id, test_type, limit = 50 }) => ({
          url: `/quiz/leaderboard/${test_type}/${test_id}?limit=${limit}`,
          method: 'GET',
        }),
        providesTags: (result, error, { test_id, test_type }) => [
          { type: 'QuizResult', id: `${test_type}-${test_id}` },
        ],
      }
    ),

    // Validate test access (using existing subscription access endpoint)
    validateTestAccess: builder.query<{
      success: boolean;
      data: {
        has_access: boolean;
        subscription_type: 'free' | 'paid' | null;
        can_access_demo: boolean;
        demo_tests_remaining: number;
        reason?: string;
      };
    }, { testSeriesUuid: string }>({
      query: ({ testSeriesUuid }) => ({
        url: `/test-series/${testSeriesUuid}/subscription-access`,
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useStartTestMutation,
  useGetTestQuestionsQuery,
  useGetTestByUuidQuery,
  useSaveAnswerMutation,
  usePauseResumeTestMutation,
  useSubmitTestMutation,
  useReviewAnswersQuery,
  useLazyReviewAnswersQuery,
  useGetSessionSolutionsQuery,  // ✅ NEW: Export the session solutions hook
  useGetQuizHistoryQuery,
  useGetQuizLeaderboardQuery,
  useValidateTestAccessQuery,
  useLazyValidateTestAccessQuery,
} = quizApi;