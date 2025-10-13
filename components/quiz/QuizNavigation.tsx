/**
 * Quiz Navigation Component
 * Created: 2025-01-11
 * Purpose: Navigation buttons for quiz (Previous, Next, Submit)
 */

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ThemeColors } from '@/types';
import { createQuizStyles } from '@/styles/quizStyles';

interface QuizNavigationProps {
  currentQuestion: number;
  totalQuestions: number;
  isLastQuestion: boolean;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  Colors: ThemeColors;
}

export const QuizNavigation = memo<QuizNavigationProps>(({
  currentQuestion,
  totalQuestions,
  isLastQuestion,
  isSubmitting,
  onPrevious,
  onNext,
  onSubmit,
  Colors
}) => {
  const styles = createQuizStyles(Colors);
  const isFirstQuestion = currentQuestion === 0;

  return (
    <View style={styles.navigationContainer}>
      {/* Previous Button */}
      <TouchableOpacity
        style={[styles.navButton, isFirstQuestion && styles.navButtonDisabled]}
        onPress={onPrevious}
        disabled={isFirstQuestion}
      >
        <ChevronLeft
          size={16}
          color={isFirstQuestion ? Colors.textSecondary : Colors.text}
        />
        <Text style={[styles.navButtonText, isFirstQuestion && styles.navButtonTextDisabled]}>
          Previous
        </Text>
      </TouchableOpacity>

      {/* Next or Submit Button */}
      {isLastQuestion ? (
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={isSubmitting}
        >
          <View style={styles.submitButtonContent}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Quiz</Text>
            )}
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.navButton} onPress={onNext}>
          <Text style={styles.navButtonText}>Next</Text>
          <ChevronRight size={16} color={Colors.text} />
        </TouchableOpacity>
      )}
    </View>
  );
});

QuizNavigation.displayName = 'QuizNavigation';
