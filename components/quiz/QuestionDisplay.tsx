/**
 * Question Display Component
 * Created: 2025-01-11
 * Purpose: Displays question text with flag option (supports HTML rendering)
 */

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { Flag } from 'lucide-react-native';
import { Question, ThemeColors } from '@/types';
import { createQuizStyles } from '@/styles/quizStyles';
import { getQuestionText } from '@/utils/questionTransformers';

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  isFlagged: boolean;
  useGujarati: boolean;
  onFlag: (questionId: string) => void;
  Colors: ThemeColors;
}

export const QuestionDisplay = memo<QuestionDisplayProps>(({
  question,
  questionNumber,
  isFlagged,
  useGujarati,
  onFlag,
  Colors
}) => {
  const styles = createQuizStyles(Colors);
  const questionText = getQuestionText(question, useGujarati);
  const { width } = useWindowDimensions();

  return (
    <View style={styles.questionContainer}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionNumber}>Q{questionNumber}.</Text>
        <TouchableOpacity onPress={() => onFlag(question.id.toString())}>
          <Flag
            size={20}
            color={isFlagged ? Colors.warning : Colors.textSecondary}
            fill={isFlagged ? Colors.warning : 'none'}
          />
        </TouchableOpacity>
      </View>
      <RenderHTML
        contentWidth={width - 80}
        source={{ html: questionText || '<p>No question available</p>' }}
        tagsStyles={{
          body: {
            color: Colors.textPrimary,
            fontSize: 18,
            lineHeight: 26,
          },
          p: {
            marginBottom: 8,
            color: Colors.textPrimary,
          },
          strong: {
            fontWeight: 'bold',
            color: Colors.text,
          },
          em: {
            fontStyle: 'italic',
          },
          ul: {
            marginLeft: 16,
          },
          ol: {
            marginLeft: 16,
          },
          li: {
            marginBottom: 4,
          },
          img: {
            maxWidth: '100%',
            height: 'auto',
          },
        }}
      />
    </View>
  );
});

QuestionDisplay.displayName = 'QuestionDisplay';
