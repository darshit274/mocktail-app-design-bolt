/**
 * Question Navigator Grid Component
 * Created: 2025-01-11
 * Purpose: Grid view for navigating between all quiz questions
 */

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Question, AnswerOption, ThemeColors } from '@/types';
import { createQuizStyles } from '@/styles/quizStyles';

interface QuestionNavigatorGridProps {
  questions: Question[];
  currentQuestion: number;
  selectedAnswers: Record<string, AnswerOption>;
  flaggedQuestions: Set<string>;
  onSelectQuestion: (index: number) => void;
  onClose: () => void;
  onSubmit: () => void;
  Colors: ThemeColors;
}

export const QuestionNavigatorGrid = memo<QuestionNavigatorGridProps>(({
  questions,
  currentQuestion,
  selectedAnswers,
  flaggedQuestions,
  onSelectQuestion,
  onClose,
  onSubmit,
  Colors
}) => {
  const styles = createQuizStyles(Colors);

  // Get question status color
  const getQuestionStatusColor = (index: number): string => {
    const question = questions[index];
    if (!question) return Colors.muted;

    // Current question - highlight with primary color
    if (index === currentQuestion) {
      return Colors.primary;
    }

    // Flagged questions - show warning color
    if (flaggedQuestions.has(question.id.toString())) {
      return Colors.warning;
    }

    // Answered questions - show success color
    if (selectedAnswers[question.id]) {
      return Colors.success;
    }

    // Unanswered questions - show muted color
    return Colors.muted;
  };

  return (
    <View style={styles.gridContainer}>
      {/* Header */}
      <View style={styles.gridHeader}>
        <Text style={styles.gridTitle}>Question Navigator</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.gridClose}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Answered</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
          <Text style={styles.legendText}>Flagged</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>Current</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.muted }]} />
          <Text style={styles.legendText}>Unanswered</Text>
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.gridSubmitButton} onPress={onSubmit}>
        <Text style={styles.gridSubmitButtonText}>Submit Quiz</Text>
      </TouchableOpacity>

      {/* Question Grid */}
      <ScrollView style={styles.gridScrollView}>
        <View style={styles.grid}>
          {questions.map((question, index) => {
            const statusColor = getQuestionStatusColor(index);
            const isCurrent = index === currentQuestion;

            return (
              <TouchableOpacity
                key={question.id}
                style={[styles.gridItem, { backgroundColor: statusColor }]}
                onPress={() => onSelectQuestion(index)}
              >
                <Text style={[styles.gridItemText, isCurrent && styles.gridItemTextCurrent]}>
                  {index + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
});

QuestionNavigatorGrid.displayName = 'QuestionNavigatorGrid';
