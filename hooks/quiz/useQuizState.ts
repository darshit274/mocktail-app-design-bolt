/**
 * Quiz State Management Hook
 * Created: 2025-01-11
 * Purpose: Manages all quiz state (answers, flags, questions, language)
 */

import { useState, useCallback } from 'react';
import { Question, AnswerOption, QuizLanguage } from '@/types';

export interface UseQuizStateReturn {
  // Questions
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
  currentQuestion: number;
  setCurrentQuestion: (index: number) => void;

  // Answers
  selectedAnswers: Record<string, AnswerOption>;
  handleAnswerSelect: (questionId: string, option: AnswerOption) => void;

  // Flags
  flaggedQuestions: Set<string>;
  handleFlagQuestion: (questionId: string) => void;

  // Language
  selectedQuizLanguage: QuizLanguage;
  setSelectedQuizLanguage: (language: QuizLanguage) => void;

  // UI State
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;

  // Modal State
  showLanguageSelection: boolean;
  setShowLanguageSelection: (show: boolean) => void;
  showNegativeMarkingWarning: boolean;
  setShowNegativeMarkingWarning: (show: boolean) => void;
  showSubmitConfirmation: boolean;
  setShowSubmitConfirmation: (show: boolean) => void;

  // Quiz State
  quizStarted: boolean;
  setQuizStarted: (started: boolean) => void;
  negativeMarkingEnabled: boolean;
  setNegativeMarkingEnabled: (enabled: boolean) => void;
  negativeMarksPerWrong: number;
  setNegativeMarksPerWrong: (marks: number) => void;
}

export const useQuizState = (): UseQuizStateReturn => {
  // Question State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Answer State
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, AnswerOption>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

  // Language State
  const [selectedQuizLanguage, setSelectedQuizLanguage] = useState<QuizLanguage>('gujarati');

  // UI State
  const [showGrid, setShowGrid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);
  const [showNegativeMarkingWarning, setShowNegativeMarkingWarning] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);

  // Quiz Settings State
  const [quizStarted, setQuizStarted] = useState(false);
  const [negativeMarkingEnabled, setNegativeMarkingEnabled] = useState(false);
  const [negativeMarksPerWrong, setNegativeMarksPerWrong] = useState(0);

  // Answer Selection Handler - Allows unselecting by tapping the same option
  const handleAnswerSelect = useCallback((questionId: string, option: AnswerOption) => {
    setSelectedAnswers(prev => {
      // If the same option is tapped, unselect it
      if (prev[questionId] === option) {
        const newAnswers = { ...prev };
        delete newAnswers[questionId];
        return newAnswers;
      }
      // Otherwise, select the new option
      return {
        ...prev,
        [questionId]: option
      };
    });
  }, []);

  // Flag Toggle Handler
  const handleFlagQuestion = useCallback((questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  }, []);

  return {
    // Questions
    questions,
    setQuestions,
    currentQuestion,
    setCurrentQuestion,

    // Answers
    selectedAnswers,
    handleAnswerSelect,

    // Flags
    flaggedQuestions,
    handleFlagQuestion,

    // Language
    selectedQuizLanguage,
    setSelectedQuizLanguage,

    // UI State
    showGrid,
    setShowGrid,
    isSubmitting,
    setIsSubmitting,

    // Modal State
    showLanguageSelection,
    setShowLanguageSelection,
    showNegativeMarkingWarning,
    setShowNegativeMarkingWarning,
    showSubmitConfirmation,
    setShowSubmitConfirmation,

    // Quiz State
    quizStarted,
    setQuizStarted,
    negativeMarkingEnabled,
    setNegativeMarkingEnabled,
    negativeMarksPerWrong,
    setNegativeMarksPerWrong,
  };
};
