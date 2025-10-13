/**
 * Quiz-related TypeScript interfaces
 * Created: 2025-01-11
 * Purpose: Strong typing for quiz, questions, and results
 */

export interface Question {
  id: number;
  question_text: string;
  question_text_gujarati: string;
  option_a: string;
  option_a_gujarati: string;
  option_b: string;
  option_b_gujarati: string;
  option_c: string;
  option_c_gujarati: string;
  option_d: string;
  option_d_gujarati: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  correct_option?: 'A' | 'B' | 'C' | 'D'; // Alias for backend compatibility
  explanation: string;
  explanation_gujarati: string;
  subject: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  marks?: number;
  time_spent?: number;
  selected_option?: 'A' | 'B' | 'C' | 'D' | null;
  is_correct?: boolean;
}

export interface QuizAnswer {
  questionId: number;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  isCorrect: boolean;
  timeSpent: number;
  isMarkedForReview: boolean;
}

export interface QuizSubmission {
  userId: string;
  testSeriesId: string;
  answers: QuizAnswer[];
  totalTimeSpent: number;
  markedForReviewCount: number;
}

export interface QuizResult {
  leaderboardEntryId: number;
  score: number;
  percentage: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuestions: number;
  totalMarks?: number;
  obtainedMarks?: number;
  negativeMarks?: number;
  finalScore?: number;
}

export interface CategoryInfo {
  uuid: string;
  name: string;
  name_gujarati?: string;
  negative_marking_enabled: boolean;
  negative_marks_per_wrong: number;
  is_free_in_paid?: boolean;
}

export interface TestSessionData {
  sessionId: string;
  resultId?: string;
  testTitle: string;
  categoryUuid?: string;
  categoryName?: string;
  seriesUuid?: string;
  score: number;
  percentage: number;
  passed: boolean;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  negativeMarkingEnabled?: boolean;
  negativeMarks?: number;
  finalScore?: number;
}

export type AnswerOption = 'A' | 'B' | 'C' | 'D';
export type QuizLanguage = 'english' | 'gujarati';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
