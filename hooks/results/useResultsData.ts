import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useGetSessionDetailsQuery } from '@/store/api/userApi';
import { useGetTestSeriesLeaderboardWebQuery } from '@/store/api/webCompatibleApi';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

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
    seriesUuid, // ✅ ADD: Get seriesUuid from params
  } = params;

  // Get current user's UUID from Redux store
  const userUuid = useSelector((state: RootState) => state.auth.user?.uuid);

  // Fetch from API if sessionId is provided
  const { data: sessionData, isLoading } = useGetSessionDetailsQuery(
    sessionId as string,
    {
      skip: !sessionId, // Skip if no sessionId
    }
  );

  // ✅ NEW: Fetch test-series specific leaderboard to get user's rank
  const { data: leaderboardData } = useGetTestSeriesLeaderboardWebQuery(
    { testSeriesUuid: seriesUuid as string, limit: 100 },
    { skip: !seriesUuid }
  );

  // Calculate user's rank from leaderboard data
  const userRank = useMemo(() => {
    if (!leaderboardData?.data || !userUuid) {
      return { rank: 0, totalUsers: 0 };
    }

    const userEntry = leaderboardData.data.find((entry: any) => entry.userId === userUuid);
    const totalUsers = leaderboardData.metadata?.total || leaderboardData.data.length;

    return {
      rank: userEntry?.rank || 0,
      totalUsers: totalUsers,
    };
  }, [leaderboardData, userUuid]);

  // For now, subject stats is empty since we're using params
  // This would be populated if we fetch from API
  const subjectStats: Record<string, SubjectStats> = useMemo(() => ({}), []);

  // ✅ FIX: Wrap in useMemo to ensure re-render when userRank changes
  return useMemo(() => {
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
        rank: userRank.rank, // ✅ FIXED: Use test-series specific rank
        totalUsers: userRank.totalUsers, // ✅ FIXED: Use test-series specific total
        percentile: 0, // Percentile not calculated yet
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
      rank: userRank.rank, // ✅ FIXED: Use test-series specific rank
      totalUsers: userRank.totalUsers, // ✅ FIXED: Use test-series specific total
      percentile: 0, // Percentile not calculated yet
    };
  }, [
    sessionId,
    sessionData,
    correctAnswers,
    wrongAnswers,
    unanswered,
    percentage,
    score,
    testTitle,
    passed,
    negativeMarkingEnabled,
    negativeMarks,
    finalScore,
    totalTimeTaken,
    userRank.rank, // ✅ FIXED: Use primitive values, not object reference
    userRank.totalUsers, // ✅ FIXED: Use primitive values, not object reference
    subjectStats,
  ]);
};
