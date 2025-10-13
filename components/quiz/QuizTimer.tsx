/**
 * Quiz Timer Component
 * Created: 2025-01-11
 * Purpose: Displays countdown timer with warning when time is low
 */

import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { Clock } from 'lucide-react-native';
import { ThemeColors } from '@/types';
import { createQuizStyles } from '@/styles/quizStyles';

interface QuizTimerProps {
  timeRemaining: number;
  formatTime: (seconds: number) => string;
  isTimeLow: boolean;
  Colors: ThemeColors;
}

export const QuizTimer = memo<QuizTimerProps>(({
  timeRemaining,
  formatTime,
  isTimeLow,
  Colors
}) => {
  const styles = createQuizStyles(Colors);

  return (
    <View style={styles.timerContainer}>
      <Clock size={16} color={isTimeLow ? Colors.error : Colors.primary} />
      <Text style={[styles.timerText, isTimeLow && styles.timerWarning]}>
        {formatTime(timeRemaining)}
      </Text>
    </View>
  );
});

QuizTimer.displayName = 'QuizTimer';
