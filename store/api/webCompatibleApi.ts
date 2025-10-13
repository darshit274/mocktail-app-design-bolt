import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

// =====================
// WEB-COMPATIBLE INTERFACES (EXACT MATCH TO WEB)
// =====================

export interface WebQuizSubmissionRequest {
  userId: string;
  testSeriesId: string;
  answers: Array<{
    questionId: number;
    selectedOption: 'A' | 'B' | 'C' | 'D' | null;
    isCorrect: boolean;
    timeSpent?: number;
    isMarkedForReview?: boolean;
  }>;
  totalQuestions?: number; // IMPORTANT: Actual total question count for proper calculation
  totalTimeSpent?: number;
  markedForReviewCount?: number;
}

export interface WebQuizSubmissionResponse {
  success: boolean;
  message: string;
  data: {
    leaderboardEntryId?: number;
    score: number;
    percentage: number;
    correctAnswers: number;
    totalQuestions: number;
    passed: boolean;
    timeTaken: number;
    rank?: number;
  };
}

export interface WebLeaderboardEntry {
  userId: string;
  name: string;
  totalScore: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  timeTaken: number;
  completionDate: string;
  rank: number;
  avatar?: string;
}

export interface WebLeaderboardResponse {
  success: boolean;
  data: WebLeaderboardEntry[];
}

export interface WebQuestionResponse {
  success: boolean;
  data: {
    category: {
      id: number;
      uuid: string;
      name: string;
      description?: string;
    };
    questions: Array<{
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
      correct_answer: string;
      explanation?: string;
      explanation_gujarati?: string;
      marks: number;
    }>;
    metadata: {
      total_questions: number;
      language: string;
      shuffled: boolean;
    };
  };
}

// =====================
// WEB-COMPATIBLE API (MATCHES WORKING WEB ENDPOINTS)
// =====================

export const webCompatibleApi = createApi({
  reducerPath: 'webCompatibleApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['WebQuiz', 'WebLeaderboard'],
  endpoints: (builder) => ({

    // Quiz Questions - Dynamic Categories (EXACT WEB MATCH)
    getDynamicQuestionsWeb: builder.query<WebQuestionResponse, {
      categoryUuid: string;
      language?: string;
      shuffle?: boolean;
    }>({
      query: ({ categoryUuid, language = 'english', shuffle = true }) => ({
        url: `/dynamic/categories/${categoryUuid}/questions`,
        method: 'GET',
        params: { language, shuffle },
      }),
      providesTags: ['WebQuiz'],
    }),

    // Quiz Submission (EXACT WEB MATCH)
    submitQuizWeb: builder.mutation<WebQuizSubmissionResponse, WebQuizSubmissionRequest>({
      query: (body) => ({
        url: '/quiz/submit',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WebQuiz', 'WebLeaderboard'],
    }),

    // Test Series Leaderboard (EXACT WEB MATCH)
    getTestSeriesLeaderboardWeb: builder.query<WebLeaderboardResponse, {
      testSeriesUuid: string;
      limit?: number;
    }>({
      query: ({ testSeriesUuid, limit = 20 }) => {
        console.log('🌐 Calling EXACT web leaderboard API:', `/leaderboard/test-series/${testSeriesUuid}`);
        return {
          url: `/leaderboard/test-series/${testSeriesUuid}`,
          method: 'GET',
          params: limit ? { limit } : undefined,
        };
      },
      providesTags: ['WebLeaderboard'],
    }),

    // Global Leaderboard (EXACT WEB MATCH)
    getGlobalLeaderboardWeb: builder.query<WebLeaderboardResponse, {
      limit?: number;
    }>({
      query: ({ limit = 20 }) => ({
        url: '/leaderboard',
        method: 'GET',
        params: limit ? { limit } : undefined,
      }),
      providesTags: ['WebLeaderboard'],
    }),

  }),
});

// Export hooks
export const {
  useGetDynamicQuestionsWebQuery,
  useSubmitQuizWebMutation,
  useGetTestSeriesLeaderboardWebQuery,
  useGetGlobalLeaderboardWebQuery,
} = webCompatibleApi;