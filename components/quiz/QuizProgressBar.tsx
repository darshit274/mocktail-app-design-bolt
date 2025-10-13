/**
 * Quiz Progress Bar Component
 * Created: 2025-01-11
 * Purpose: Shows quiz progress and current question number
 */

import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { ThemeColors } from '@/types';
import { createQuizStyles } from '@/styles/quizStyles';

interface QuizProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
  Colors: ThemeColors;
}

export const QuizProgressBar = memo<QuizProgressBarProps>(({
  currentQuestion,
  totalQuestions,
  Colors
}) => {
  const styles = createQuizStyles(Colors);
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {currentQuestion + 1} of {totalQuestions}
      </Text>
    </View>
  );
});

QuizProgressBar.displayName = 'QuizProgressBar';
