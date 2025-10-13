/**
 * Quiz Header Component
 * Created: 2025-01-11
 * Purpose: Quiz header with title and controls
 */

import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, Grid3X3 } from 'lucide-react-native';
import { ThemeColors } from '@/types';
import { createQuizStyles } from '@/styles/quizStyles';
import { QuizTimer } from './QuizTimer';

interface QuizHeaderProps {
  title: string;
  timeRemaining: number;
  formatTime: (seconds: number) => string;
  isTimeLow: boolean;
  onBack: () => void;
  onGridOpen: () => void;
  Colors: ThemeColors;
}

export const QuizHeader = memo<QuizHeaderProps>(({
  title,
  timeRemaining,
  formatTime,
  isTimeLow,
  onBack,
  onGridOpen,
  Colors
}) => {
  const styles = createQuizStyles(Colors);

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack}>
        <ChevronLeft size={24} color={Colors.text} />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>{title}</Text>

      <View style={styles.headerRight}>
        <QuizTimer
          timeRemaining={timeRemaining}
          formatTime={formatTime}
          isTimeLow={isTimeLow}
          Colors={Colors}
        />
        <TouchableOpacity style={styles.gridButton} onPress={onGridOpen}>
          <Grid3X3 size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

QuizHeader.displayName = 'QuizHeader';
