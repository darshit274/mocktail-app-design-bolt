/**
 * Options Grid Component
 * Created: 2025-01-11
 * Purpose: Displays answer options in a selectable grid (supports HTML rendering)
 */

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { Question, AnswerOption, ThemeColors } from '@/types';
import { createQuizStyles } from '@/styles/quizStyles';
import { getOptionText } from '@/utils/questionTransformers';

interface OptionsGridProps {
  question: Question;
  selectedOption: AnswerOption | null;
  useGujarati: boolean;
  onSelect: (questionId: string, option: AnswerOption) => void;
  Colors: ThemeColors;
}

export const OptionsGrid = memo<OptionsGridProps>(({
  question,
  selectedOption,
  useGujarati,
  onSelect,
  Colors
}) => {
  const styles = createQuizStyles(Colors);
  const options: AnswerOption[] = ['A', 'B', 'C', 'D'];
  const { width } = useWindowDimensions();

  return (
    <View style={styles.optionsContainer}>
      {options.map((option) => {
        const isSelected = selectedOption === option;
        const optionText = getOptionText(question, option, useGujarati);

        return (
          <TouchableOpacity
            key={option}
            style={[styles.optionContainer, isSelected && styles.optionSelected]}
            onPress={() => onSelect(question.id.toString(), option)}
          >
            <View style={[styles.optionCircle, isSelected && styles.optionCircleSelected]}>
              <Text style={[styles.optionLetter, isSelected && styles.optionLetterSelected]}>
                {option}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <RenderHTML
                contentWidth={width - 120}
                source={{ html: optionText || `<p>Option ${option}</p>` }}
                tagsStyles={{
                  body: {
                    color: isSelected ? Colors.primary : Colors.textPrimary,
                    fontSize: 16,
                    lineHeight: 24,
                    margin: 0,
                    padding: 0,
                  },
                  p: {
                    margin: 0,
                    padding: 0,
                    color: isSelected ? Colors.primary : Colors.textPrimary,
                  },
                  strong: {
                    fontWeight: 'bold',
                  },
                  em: {
                    fontStyle: 'italic',
                  },
                  img: {
                    maxWidth: '100%',
                    height: 'auto',
                  },
                }}
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

OptionsGrid.displayName = 'OptionsGrid';
