import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useGetSessionDetailsQuery, useGetUserRankQuery } from '@/store/api/userApi';

export interface SubjectStats {
  total: number;
  correct: number;
  attempted: number;
  timeSpent: number;
}

export interface ResultsData {
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalQuestions: number;
  attempted: number;
  percentage: number;
  accuracy: number;
  score: string | string[];
  scoreWithNegativeMarking: number;
  testTitle: string | string[];
  passed: boolean;
  negativeMarkingEnabled: boolean;
  negativeMarks: string;
  finalScore: string;
  subjectStats: Record<string, SubjectStats>;
  totalTimeTaken: number;
  rank: number;
  totalUsers: number;
  percentile: number;
}

export const useResultsData = (): ResultsData => {
  const params = useLocalSearchParams();
  const {
    sessionId,
    score,
    percentage,
    passed,
    testTitle,
    correctAnswers,
    wrongAnswers,
    unanswered,
    negativeMarkingEnabled,
    negativeMarks,
    finalScore,
    totalTimeTaken,
  } = params;

  // Fetch from API if sessionId is provided
  const { data: sessionData, isLoading } = useGetSessionDetailsQuery(
    sessionId as string,
    {
      skip: !sessionId, // Skip if no sessionId
    }
  );

  // Fetch user rank data (always fetch for all results)
  const { data: rankData } = useGetUserRankQuery();

  // For now, subject stats is empty since we're using params
  // This would be populated if we fetch from API
  const subjectStats: Record<string, SubjectStats> = useMemo(() => ({}), []);

  // If sessionId is provided and data is fetched, use API data
  if (sessionId && sessionData?.data) {
    const apiData = sessionData.data;

    // Calculate attempted questions
    const attempted = apiData.correct + apiData.wrong;

    // Calculate accuracy: (Correct / Attempted) × 100
    const accuracy = attempted > 0 ? Math.round((apiData.correct / attempted) * 100) : 0;

    // Calculate score with negative marking: (Correct × 1) - (Wrong × 0.25)
    const scoreWithNegativeMarking = (apiData.correct * 1) - (apiData.wrong * 0.25);

    return {
      correctCount: apiData.correct,
      incorrectCount: apiData.wrong,
      unansweredCount: apiData.notAttempted,
      totalQuestions: apiData.totalQuestions,
      attempted,
      percentage: apiData.percentage,
      accuracy,
      score: apiData.obtainedMarks.toString(),
      scoreWithNegativeMarking,
      testTitle: apiData.testName,
      passed: apiData.percentage >= 50,
      negativeMarkingEnabled: apiData.wrong > 0, // Enable if there are wrong answers
      negativeMarks: (apiData.wrong * 0.25).toFixed(2),
      finalScore: scoreWithNegativeMarking.toFixed(2),
      subjectStats,
      totalTimeTaken: apiData.timeSpent,
      rank: rankData?.data?.rank || 0,
      totalUsers: rankData?.data?.totalUsers || 0,
      percentile: rankData?.data?.percentile || 0,
    };
  }

  // Fallback to URL params (for backward compatibility)
  const correctCount = parseInt(correctAnswers as string) || 0;
  const incorrectCount = parseInt(wrongAnswers as string) || 0;
  const unansweredCount = parseInt(unanswered as string) || 0;
  const totalQuestions = correctCount + incorrectCount + unansweredCount;
  const attempted = correctCount + incorrectCount;
  const accuracy = attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0;
  const scoreWithNegativeMarking = (correctCount * 1) - (incorrectCount * 0.25);

  return {
    correctCount,
    incorrectCount,
    unansweredCount,
    totalQuestions,
    attempted,
    percentage: Number(percentage) || 0,
    accuracy,
    score: score || '0',
    scoreWithNegativeMarking,
    testTitle: testTitle || 'Quiz',
    passed: passed === 'true',
    negativeMarkingEnabled: negativeMarkingEnabled === 'true',
    negativeMarks: (negativeMarks as string) || (incorrectCount * 0.25).toFixed(2),
    finalScore: (finalScore as string) || scoreWithNegativeMarking.toFixed(2),
    subjectStats,
    totalTimeTaken: parseInt(totalTimeTaken as string) || 0,
    rank: rankData?.data?.rank || 0,
    totalUsers: rankData?.data?.totalUsers || 0,
    percentile: rankData?.data?.percentile || 0,
  };
};
