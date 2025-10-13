import { useState, useCallback } from 'react';

interface UsePracticeModeReturn {
  reattemptMode: boolean;
  reattemptAnswers: { [key: number]: number };
  hasReattempted: { [key: number]: boolean };
  toggleReattemptMode: () => void;
  handleReattemptAnswer: (questionIndex: number, answerIndex: number) => void;
  resetReattempt: (questionIndex: number) => void;
  getReattemptStatus: (questionIndex: number, correctAnswer: number) => 'not_attempted' | 'correct' | 'incorrect';
}

export const usePracticeMode = (): UsePracticeModeReturn => {
  const [reattemptMode, setReattemptMode] = useState(false);
  const [reattemptAnswers, setReattemptAnswers] = useState<{ [key: number]: number }>({});
  const [hasReattempted, setHasReattempted] = useState<{ [key: number]: boolean }>({});

  const toggleReattemptMode = useCallback(() => {
    setReattemptMode(prev => !prev);
  }, []);

  const handleReattemptAnswer = useCallback((questionIndex: number, answerIndex: number) => {
    setReattemptAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex,
    }));
    setHasReattempted(prev => ({
      ...prev,
      [questionIndex]: true,
    }));
  }, []);

  const resetReattempt = useCallback((questionIndex: number) => {
    setReattemptAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[questionIndex];
      return newAnswers;
    });
    setHasReattempted(prev => ({
      ...prev,
      [questionIndex]: false,
    }));
  }, []);

  const getReattemptStatus = useCallback((questionIndex: number, correctAnswer: number) => {
    const reattemptAnswer = reattemptAnswers[questionIndex];
    if (reattemptAnswer === undefined) return 'not_attempted';
    return reattemptAnswer === correctAnswer ? 'correct' : 'incorrect';
  }, [reattemptAnswers]);

  return {
    reattemptMode,
    reattemptAnswers,
    hasReattempted,
    toggleReattemptMode,
    handleReattemptAnswer,
    resetReattempt,
    getReattemptStatus,
  };
};
