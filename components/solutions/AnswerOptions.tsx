import React, { memo } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';
import { ThemeColors } from '@/types';
import { createSolutionsStyles } from '@/styles/solutionsStyles';
import { SolutionQuestion } from '@/hooks/solutions/useSolutionsData';

interface AnswerOptionsProps {
  question: SolutionQuestion;
  currentQuestionIndex: number;
  reattemptMode: boolean;
  hasReattempted: boolean;
  isOriginallyCorrect: boolean;
  reattemptAnswer?: number;
  onReattemptAnswer: (questionIndex: number, answerIndex: number) => void;
  Colors: ThemeColors;
}

export const AnswerOptions = memo<AnswerOptionsProps>(({
  question,
  currentQuestionIndex,
  reattemptMode,
  hasReattempted,
  isOriginallyCorrect,
  reattemptAnswer,
  onReattemptAnswer,
  Colors
}) => {
  const styles = createSolutionsStyles(Colors);
  const { width } = useWindowDimensions();

  return (
    <View style={styles.optionsContainer}>
      {question.options.map((option, index) => {
        const isCorrect = index === question.correctAnswer;
        const isUserAnswer = index === question.userAnswer;
        const isReattemptAnswer = index === reattemptAnswer;
        const showOriginalAnswers = !reattemptMode || hasReattempted || isOriginallyCorrect;

        // Styling conditions
        const showCorrectStyling = showOriginalAnswers && isCorrect;
        const showIncorrectStyling = showOriginalAnswers && isUserAnswer && !isCorrect;
        const showReattemptCorrect = reattemptMode && hasReattempted && isReattemptAnswer && isCorrect;
        const showReattemptIncorrect = reattemptMode && hasReattempted && isReattemptAnswer && !isCorrect;

        // Determine text color for RenderHTML
        const getOptionTextColor = () => {
          if (showCorrectStyling || showReattemptCorrect) return Colors.success;
          if (showIncorrectStyling || showReattemptIncorrect) return Colors.danger;
          if (isReattemptAnswer) return Colors.primary;
          return Colors.textPrimary;
        };

        // Reattempt mode - clickable options
        if (reattemptMode && !hasReattempted && !isOriginallyCorrect) {
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionCard,
                isReattemptAnswer && styles.selectedOption,
              ]}
              onPress={() => onReattemptAnswer(currentQuestionIndex, index)}
            >
              <View
                style={[
                  styles.optionIndicator,
                  isReattemptAnswer && styles.selectedIndicator,
                ]}
              >
                <Text
                  style={[
                    styles.optionLetter,
                    isReattemptAnswer && styles.optionLetterActive,
                  ]}
                >
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <RenderHTML
                  contentWidth={width - 140}
                  source={{ html: option || `<p>Option ${String.fromCharCode(65 + index)}</p>` }}
                  tagsStyles={{
                    body: {
                      color: getOptionTextColor(),
                      fontSize: 16,
                      lineHeight: 24,
                      margin: 0,
                      padding: 0,
                    },
                    p: {
                      margin: 0,
                      padding: 0,
                      color: getOptionTextColor(),
                    },
                    img: {
                      maxWidth: '100%',
                      height: 'auto',
                    },
                  }}
                />
              </View>

              {isReattemptAnswer && <CheckCircle size={20} color={Colors.primary} />}
            </TouchableOpacity>
          );
        }

        // Regular display mode or after reattempt
        return (
          <View
            key={index}
            style={[
              styles.optionCard,
              showCorrectStyling && styles.correctOption,
              showIncorrectStyling && styles.incorrectOption,
              showReattemptCorrect && styles.reattemptCorrectOption,
              showReattemptIncorrect && styles.reattemptIncorrectOption,
            ]}
          >
            <View
              style={[
                styles.optionIndicator,
                showCorrectStyling && styles.correctIndicator,
                showIncorrectStyling && styles.incorrectIndicator,
                showReattemptCorrect && styles.correctIndicator,
                showReattemptIncorrect && styles.incorrectIndicator,
              ]}
            >
              <Text
                style={[
                  styles.optionLetter,
                  (showCorrectStyling || showIncorrectStyling || showReattemptCorrect || showReattemptIncorrect) &&
                    styles.optionLetterActive,
                ]}
              >
                {String.fromCharCode(65 + index)}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <RenderHTML
                contentWidth={width - 140}
                source={{ html: option || `<p>Option ${String.fromCharCode(65 + index)}</p>` }}
                tagsStyles={{
                  body: {
                    color: getOptionTextColor(),
                    fontSize: 16,
                    lineHeight: 24,
                    margin: 0,
                    padding: 0,
                  },
                  p: {
                    margin: 0,
                    padding: 0,
                    color: getOptionTextColor(),
                  },
                  img: {
                    maxWidth: '100%',
                    height: 'auto',
                  },
                }}
              />
            </View>

            {showCorrectStyling && <CheckCircle size={20} color={Colors.success} />}
            {showIncorrectStyling && <XCircle size={20} color={Colors.danger} />}
            {showReattemptCorrect && <CheckCircle size={20} color={Colors.success} />}
            {showReattemptIncorrect && <XCircle size={20} color={Colors.danger} />}
          </View>
        );
      })}
    </View>
  );
});

AnswerOptions.displayName = 'AnswerOptions';
