import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useReviewAnswersQuery, useGetSessionSolutionsQuery } from '@/store/api/quizApi';
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
  isMarkedForReview?: boolean;  // ✅ Track if question was marked for review
}

interface UseSolutionsDataReturn {
  questions: SolutionQuestion[];
  isLoading: boolean;
  error: any;
  isCategoryQuiz: boolean;
}

export const useSolutionsData = (selectedLanguage?: 'english' | 'gujarati'): UseSolutionsDataReturn => {
  const params = useLocalSearchParams();
  const { sessionId, categoryUuid } = params;
  const { t } = useLanguage();

  // Use selectedLanguage parameter if provided, otherwise fall back to context language
  const effectiveLanguage = selectedLanguage || t.language;

  console.log('[useSolutionsData] Language settings:', {
    selectedLanguage,
    tLanguage: t.language,
    effectiveLanguage
  });

  // Determine quiz type - prioritize sessionId over categoryUuid
  // If sessionId exists, it's ALWAYS a session-based quiz (even if categoryUuid is also present)
  const isCategoryQuiz = !sessionId && !!categoryUuid;

  console.log('[useSolutionsData] Quiz type detection:', {
    sessionId,
    categoryUuid,
    isCategoryQuiz,
    willCallSessionAPI: !!sessionId,
    willCallCategoryAPI: isCategoryQuiz
  });

  // Fetch review data for session-based quizzes
  // ✅ CHANGED: Use getSessionSolutions instead of reviewAnswers (matches web app API)
  const {
    data: reviewData,
    isLoading: loadingReview,
    error: reviewError
  } = useGetSessionSolutionsQuery({
    session_id: sessionId as string,
  }, {
    skip: !sessionId,  // ✅ FIXED: Only skip if no sessionId (don't check categoryUuid)
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

  // Transform test-history API response (used by web app)
  const transformTestHistorySolutions = (solutions: any[]): SolutionQuestion[] => {
    if (!solutions) return [];

    console.log('[transformTestHistorySolutions] Received', solutions.length, 'solutions from API');
    console.log('[transformTestHistorySolutions] Sample solution data:', solutions[0]);

    return solutions.map((sol, index) => {
      const useGujarati = effectiveLanguage === 'gujarati';

      const questionText = useGujarati
        ? (sol.questionTextGujarati || sol.questionText || 'No question available')
        : (sol.questionText || sol.questionTextGujarati || 'No question available');

      const explanation = useGujarati
        ? (sol.explanationGujarati || sol.explanation || 'No explanation available.')
        : (sol.explanation || sol.explanationGujarati || 'No explanation available.');

      // Backend returns options.{A,B,C,D} pre-resolved to one language (English by
      // default since we don't pass `language` to /test-history/:id/solutions),
      // plus raw optionsEnglish.{A,B,C,D} and optionsGujarati.{A,B,C,D}.
      // The original code only read `sol.options` so Gujarati was being ignored.
      const getOption = (optionKey: string) => {
        if (useGujarati) {
          return sol.optionsGujarati?.[optionKey]
            || sol.options?.[optionKey]
            || sol.optionsEnglish?.[optionKey]
            || `Option ${optionKey}`;
        }
        return sol.optionsEnglish?.[optionKey]
          || sol.options?.[optionKey]
          || sol.optionsGujarati?.[optionKey]
          || `Option ${optionKey}`;
      };

      const transformed = {
        id: sol.questionId || index + 1,
        question: questionText,
        options: [getOption('A'), getOption('B'), getOption('C'), getOption('D')],
        correctAnswer: sol.correctAnswer ? ['A', 'B', 'C', 'D'].indexOf(sol.correctAnswer) : 0,
        userAnswer: sol.userAnswer ? ['A', 'B', 'C', 'D'].indexOf(sol.userAnswer) : undefined,
        explanation: explanation,
        subject: 'General',
        difficulty: 'Medium' as const,
        timeSpent: sol.timeSpent || 0,
        isMarkedForReview: sol.isMarked || false,
      };

      if (index === 0) {
        console.log('[transformTestHistorySolutions] Sample transformation:', {
          input: { userAnswer: sol.userAnswer, correctAnswer: sol.correctAnswer, isMarked: sol.isMarked },
          output: { userAnswer: transformed.userAnswer, correctAnswer: transformed.correctAnswer, isMarkedForReview: transformed.isMarkedForReview }
        });
      }

      return transformed;
    });
  };

  // Transform API data to SolutionQuestion format
  const transformQuestions = (apiQuestions: any[]): SolutionQuestion[] => {
    if (!apiQuestions) return [];

    console.log('[transformQuestions] Received', apiQuestions.length, 'questions from API');
    console.log('[transformQuestions] Sample question data:', apiQuestions[0]);

    return apiQuestions.map((q, index) => {
      const useGujarati = effectiveLanguage === 'gujarati';

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

      const transformed = {
        id: q.id || index + 1,
        question: questionText,
        options: [getOption('A'), getOption('B'), getOption('C'), getOption('D')],
        correctAnswer: q.correct_option ? ['A', 'B', 'C', 'D'].indexOf(q.correct_option) : 0,
        userAnswer: q.selected_option ? ['A', 'B', 'C', 'D'].indexOf(q.selected_option) : undefined,
        explanation: explanation,
        subject: q.subject || 'General',
        difficulty: q.difficulty_level === 'easy' ? 'Easy' : q.difficulty_level === 'medium' ? 'Medium' : 'Hard',
        timeSpent: q.time_spent || 0,
        isMarkedForReview: q.is_flagged || q.is_marked_for_review || false,  // ✅ Track marked status
      };

      if (index === 0) {
        console.log('[transformQuestions] Sample transformation:', {
          input: { selected_option: q.selected_option, correct_option: q.correct_option, is_flagged: q.is_flagged },
          output: { userAnswer: transformed.userAnswer, correctAnswer: transformed.correctAnswer, isMarkedForReview: transformed.isMarkedForReview }
        });
      }

      return transformed;
    });
  };

  // Transform category solutions with intelligent language handling
  const transformCategorySolutions = (solutions: any[]): SolutionQuestion[] => {
    if (!solutions) return [];

    console.log('[transformCategorySolutions] Transforming with language:', effectiveLanguage);

    return solutions.map((solution, index) => {
      const useGujarati = effectiveLanguage === 'gujarati';

      console.log('[transformCategorySolutions] Question', index + 1, ':', {
        useGujarati,
        effectiveLanguage,
        questionText: solution.question_text,
        options: solution.options
      });

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
        isMarkedForReview: false,  // ✅ Category solutions don't have marked status (immediate viewing)
      };
    });
  };

  // Memoize the transformed questions
  const questions = useMemo(() => {
    let result: SolutionQuestion[] = [];

    if (isCategoryQuiz) {
      console.log('[useSolutionsData] Using category quiz data:', categoryData?.data);
      result = transformCategorySolutions(categoryData?.data?.solutions || []);
    } else {
      console.log('[useSolutionsData] Using session-based data:', reviewData?.data);
      // ✅ CHANGED: Use transformTestHistorySolutions for the new API response format
      result = transformTestHistorySolutions(reviewData?.data?.solutions || []);
    }

    console.log('[useSolutionsData] Final transformed questions:', result.length, 'questions');
    if (result.length > 0) {
      console.log('[useSolutionsData] First question sample:', {
        userAnswer: result[0].userAnswer,
        correctAnswer: result[0].correctAnswer,
        isMarkedForReview: result[0].isMarkedForReview
      });
    }

    return result;
  }, [isCategoryQuiz, categoryData, reviewData, effectiveLanguage]);

  return {
    questions,
    isLoading: isCategoryQuiz ? loadingCategory : loadingReview,
    error: isCategoryQuiz ? categoryError : reviewError,
    isCategoryQuiz,
  };
};
