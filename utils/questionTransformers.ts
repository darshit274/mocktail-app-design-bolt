/**
 * Question transformation utilities
 * Created: 2025-01-11
 * Purpose: Shared functions for transforming and formatting quiz questions
 * Used by: web-quiz.tsx, solutions.tsx
 */

import { Question, AnswerOption, QuizLanguage } from '@/types';

/**
 * Preserves line breaks in text by converting escaped newlines
 */
export const preserveLineBreaks = (text: string): string => {
  if (!text) return '';
  // Handle both actual newlines and escaped newlines from Excel/database
  return text.replace(/\\n/g, '\n');
};

/**
 * Gets question text with language fallback
 * @param question - The question object
 * @param useGujarati - Whether to prefer Gujarati text
 * @returns Formatted question text
 */
export const getQuestionText = (
  question: Question,
  useGujarati: boolean
): string => {
  let text = '';
  if (useGujarati) {
    text = question.question_text_gujarati || question.question_text || 'No question available';
  } else {
    text = question.question_text || question.question_text_gujarati || 'No question available';
  }
  return preserveLineBreaks(text);
};

/**
 * Gets option text with language fallback
 * @param question - The question object
 * @param optionKey - The option letter (A, B, C, or D)
 * @param useGujarati - Whether to prefer Gujarati text
 * @returns Formatted option text
 */
export const getOptionText = (
  question: Question,
  optionKey: AnswerOption,
  useGujarati: boolean
): string => {
  const gujaratiKey = `option_${optionKey.toLowerCase()}_gujarati` as keyof Question;
  const englishKey = `option_${optionKey.toLowerCase()}` as keyof Question;

  let text = '';
  if (useGujarati) {
    text = (question[gujaratiKey] as string) || (question[englishKey] as string) || `Option ${optionKey}`;
  } else {
    text = (question[englishKey] as string) || (question[gujaratiKey] as string) || `Option ${optionKey}`;
  }
  return preserveLineBreaks(text);
};

/**
 * Gets explanation text with language fallback
 * @param question - The question object
 * @param useGujarati - Whether to prefer Gujarati text
 * @returns Formatted explanation text
 */
export const getExplanation = (
  question: Question,
  useGujarati: boolean
): string => {
  const explanation = useGujarati
    ? (question.explanation_gujarati || question.explanation || 'No explanation available.')
    : (question.explanation || question.explanation_gujarati || 'No explanation available.');
  return preserveLineBreaks(explanation);
};

/**
 * Transforms raw API question data to typed Question interface
 * @param question - Raw question data from API
 * @param index - Question index for fallback ID
 * @returns Transformed Question object
 */
export const transformQuestion = (
  question: any,
  index: number
): Question => {
  return {
    id: question.id || index + 1,
    question_text: question.question_text || '',
    question_text_gujarati: question.question_text_gujarati || '',
    option_a: question.option_a || '',
    option_a_gujarati: question.option_a_gujarati || '',
    option_b: question.option_b || '',
    option_b_gujarati: question.option_b_gujarati || '',
    option_c: question.option_c || '',
    option_c_gujarati: question.option_c_gujarati || '',
    option_d: question.option_d || '',
    option_d_gujarati: question.option_d_gujarati || '',
    correct_answer: (question.correct_answer || question.correct_option || 'A') as AnswerOption,
    correct_option: question.correct_option as AnswerOption,
    explanation: question.explanation || '',
    explanation_gujarati: question.explanation_gujarati || '',
    subject: question.subject || 'General',
    difficulty_level: question.difficulty_level || 'medium',
    marks: question.marks,
    time_spent: question.time_spent || 0,
    selected_option: question.selected_option,
    is_correct: question.is_correct,
  };
};

/**
 * Transforms array of raw questions to typed array
 * @param questions - Array of raw question data
 * @returns Array of transformed Question objects
 */
export const transformQuestions = (questions: any[]): Question[] => {
  if (!questions || !Array.isArray(questions)) return [];
  return questions.map((q, index) => transformQuestion(q, index));
};

/**
 * Gets array of option texts for a question
 * @param question - The question object
 * @param useGujarati - Whether to prefer Gujarati text
 * @returns Array of 4 option texts [A, B, C, D]
 */
export const getOptionsArray = (
  question: Question,
  useGujarati: boolean
): string[] => {
  return (['A', 'B', 'C', 'D'] as AnswerOption[]).map(option =>
    getOptionText(question, option, useGujarati)
  );
};

/**
 * Checks if an answer is correct
 * @param question - The question object
 * @param selectedOption - The selected option
 * @returns True if answer is correct
 */
export const isAnswerCorrect = (
  question: Question,
  selectedOption: AnswerOption | null
): boolean => {
  if (!selectedOption) return false;
  const correctAnswer = question.correct_answer || question.correct_option;
  return selectedOption === correctAnswer;
};
