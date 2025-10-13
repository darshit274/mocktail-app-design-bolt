import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useReviewAnswersQuery } from '@/store/api/quizApi';
import { useGetDynamicSolutionsQuery } from '@/store/api/dynamicHierarchyApi';
import { useLanguage } from '@/contexts/LanguageContext';

export interface SolutionQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer?: number;
  explanation: string;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeSpent: number;
  reattemptAnswer?: number;
}

interface UseSolutionsDataReturn {
  questions: SolutionQuestion[];
  isLoading: boolean;
  error: any;
  isCategoryQuiz: boolean;
}

export const useSolutionsData = (): UseSolutionsDataReturn => {
  const params = useLocalSearchParams();
  const { sessionId, categoryUuid } = params;
  const { t } = useLanguage();

  // Determine quiz type
  const isCategoryQuiz = !!categoryUuid;

  // Fetch review data for session-based quizzes
  const {
    data: reviewData,
    isLoading: loadingReview,
    error: reviewError
  } = useReviewAnswersQuery({
    session_id: sessionId as string,
  }, {
    skip: !sessionId || isCategoryQuiz,
  });

  // Fetch solutions for category-based quizzes with both languages
  const {
    data: categoryData,
    isLoading: loadingCategory,
    error: categoryError
  } = useGetDynamicSolutionsQuery({
    categoryUuid: categoryUuid as string,
    language: 'both',
  }, {
    skip: !isCategoryQuiz,
  });

  // Transform API data to SolutionQuestion format
  const transformQuestions = (apiQuestions: any[]): SolutionQuestion[] => {
    if (!apiQuestions) return [];

    return apiQuestions.map((q, index) => {
      const useGujarati = t.language === 'gujarati';

      // Get question text with fallback
      const questionText = useGujarati
        ? (q.question_text_gujarati || q.question_text || 'No question available')
        : (q.question_text || q.question_text_gujarati || 'No question available');

      // Get options with fallback
      const getOption = (optionKey: string) => {
        const gujaratiKey = `option_${optionKey.toLowerCase()}_gujarati`;
        const englishKey = `option_${optionKey.toLowerCase()}`;

        if (useGujarati) {
          return q[gujaratiKey] || q.options?.[optionKey] || q[englishKey] || `Option ${optionKey}`;
        } else {
          return q[englishKey] || q.options?.[optionKey] || q[gujaratiKey] || `Option ${optionKey}`;
        }
      };

      // Get explanation with fallback
      const explanation = useGujarati
        ? (q.explanation_gujarati || q.explanation || 'No explanation available.')
        : (q.explanation || q.explanation_gujarati || 'No explanation available.');

      return {
        id: q.id || index + 1,
        question: questionText,
        options: [getOption('A'), getOption('B'), getOption('C'), getOption('D')],
        correctAnswer: q.correct_option ? ['A', 'B', 'C', 'D'].indexOf(q.correct_option) : 0,
        userAnswer: q.selected_option ? ['A', 'B', 'C', 'D'].indexOf(q.selected_option) : undefined,
        explanation: explanation,
        subject: q.subject || 'General',
        difficulty: q.difficulty_level === 'easy' ? 'Easy' : q.difficulty_level === 'medium' ? 'Medium' : 'Hard',
        timeSpent: q.time_spent || 0,
      };
    });
  };

  // Transform category solutions with intelligent language handling
  const transformCategorySolutions = (solutions: any[]): SolutionQuestion[] => {
    if (!solutions) return [];

    return solutions.map((solution, index) => {
      const useGujarati = t.language === 'gujarati';

      // Helper to extract value from both format or fallback
      const extractValue = (value: any, gujaratiBackup?: any) => {
        // If value is an object with english/gujarati keys (language=both response)
        if (value && typeof value === 'object' && ('english' in value || 'gujarati' in value)) {
          if (useGujarati) {
            return value.gujarati || value.english || gujaratiBackup || 'Content not available';
          } else {
            return value.english || value.gujarati || gujaratiBackup || 'Content not available';
          }
        }
        // If value is a string (single language response)
        return value || gujaratiBackup || 'Content not available';
      };

      // Extract question text with intelligent fallback
      const questionText = extractValue(
        solution.question_text,
        solution.question_text_gujarati
      );

      // Extract options with intelligent fallback
      const getOption = (optionKey: string) => {
        const option = solution.options?.[optionKey];
        const gujaratiBackup = solution[`option_${optionKey.toLowerCase()}_gujarati`];
        return extractValue(option, gujaratiBackup);
      };

      // Extract explanation with intelligent fallback
      const explanation = extractValue(
        solution.explanation,
        solution.explanation_gujarati
      );

      return {
        id: solution.id || index + 1,
        question: questionText,
        options: [getOption('A'), getOption('B'), getOption('C'), getOption('D')],
        correctAnswer: solution.correct_answer ? ['A', 'B', 'C', 'D'].indexOf(solution.correct_answer) : 0,
        userAnswer: undefined,
        explanation: explanation,
        subject: 'General',
        difficulty: 'Medium',
        timeSpent: 0,
      };
    });
  };

  // Memoize the transformed questions
  const questions = useMemo(() => {
    if (isCategoryQuiz) {
      return transformCategorySolutions(categoryData?.data?.solutions || []);
    } else {
      return transformQuestions(reviewData?.data?.questions || []);
    }
  }, [isCategoryQuiz, categoryData, reviewData, t.language]);

  return {
    questions,
    isLoading: isCategoryQuiz ? loadingCategory : loadingReview,
    error: isCategoryQuiz ? categoryError : reviewError,
    isCategoryQuiz,
  };
};
