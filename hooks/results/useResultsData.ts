import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';

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
  percentage: number;
  score: string | string[];
  testTitle: string | string[];
  passed: boolean;
  negativeMarkingEnabled: boolean;
  negativeMarks: string;
  finalScore: string;
  subjectStats: Record<string, SubjectStats>;
  totalTimeTaken: number;
}

export const useResultsData = (): ResultsData => {
  const params = useLocalSearchParams();
  const {
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
  } = params;

  // Calculate metrics from params
  const correctCount = parseInt(correctAnswers as string) || 0;
  const incorrectCount = parseInt(wrongAnswers as string) || 0;
  const unansweredCount = parseInt(unanswered as string) || 0;
  const totalQuestions = correctCount + incorrectCount + unansweredCount;

  // For now, subject stats is empty since we're using params
  // This would be populated if we fetch from API
  const subjectStats: Record<string, SubjectStats> = useMemo(() => ({}), []);

  return {
    correctCount,
    incorrectCount,
    unansweredCount,
    totalQuestions,
    percentage: Number(percentage) || 0,
    score: score || '0',
    testTitle: testTitle || 'Quiz',
    passed: passed === 'true',
    negativeMarkingEnabled: negativeMarkingEnabled === 'true',
    negativeMarks: (negativeMarks as string) || '0',
    finalScore: (finalScore as string) || (score as string) || '0',
    subjectStats,
    totalTimeTaken: 0, // Would come from API if needed
  };
};
