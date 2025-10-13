import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ThemeColors } from '@/types';
import { createSolutionsStyles } from '@/styles/solutionsStyles';
import { SolutionQuestion } from '@/hooks/solutions/useSolutionsData';

interface QuestionNavigatorGridProps {
  questions: SolutionQuestion[];
  currentQuestion: number;
  getAnswerStatus: (question: SolutionQuestion, index: number) => string;
  getStatusColor: (status: string) => string;
  onQuestionSelect: (index: number) => void;
  onClose: () => void;
  Colors: ThemeColors;
}

export const QuestionNavigatorGrid = memo<QuestionNavigatorGridProps>(({
  questions,
  currentQuestion,
  getAnswerStatus,
  getStatusColor,
  onQuestionSelect,
  onClose,
  Colors
}) => {
  const styles = createSolutionsStyles(Colors);

  return (
    <View style={styles.gridContainer}>
      <View style={styles.gridHeader}>
        <Text style={styles.gridTitle}>Question Navigator</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.gridClose}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Correct</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
          <Text style={styles.legendText}>Incorrect</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
          <Text style={styles.legendText}>Unanswered</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>Current</Text>
        </View>
      </View>

      <ScrollView>
        <View style={styles.grid}>
          {questions.map((question, index) => {
            const status = getAnswerStatus(question, index);
            const isCurrent = index === currentQuestion;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.gridItem,
                  {
                    backgroundColor: isCurrent ? Colors.primary : getStatusColor(status),
                  },
                ]}
                onPress={() => {
                  onQuestionSelect(index);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.gridItemText,
                    {
                      color: isCurrent || status !== 'unanswered' ? Colors.white : Colors.textSubtle,
                    },
                  ]}
                >
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
