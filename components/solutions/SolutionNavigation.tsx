import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ThemeColors } from '@/types';
import { createSolutionsStyles } from '@/styles/solutionsStyles';

interface SolutionNavigationProps {
  currentQuestion: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  Colors: ThemeColors;
}

export const SolutionNavigation = memo<SolutionNavigationProps>(({
  currentQuestion,
  totalQuestions,
  onPrevious,
  onNext,
  Colors
}) => {
  const styles = createSolutionsStyles(Colors);
  const isFirstQuestion = currentQuestion === 0;
  const isLastQuestion = currentQuestion === totalQuestions - 1;

  return (
    <View style={styles.navigationFooter}>
      <TouchableOpacity
        style={[
          styles.navFooterButton,
          isFirstQuestion && styles.navFooterButtonDisabled,
        ]}
        onPress={onPrevious}
        disabled={isFirstQuestion}
      >
        <ChevronLeft
          size={20}
          color={isFirstQuestion ? Colors.gray400 : Colors.textPrimary}
        />
        <Text
          style={[
            styles.navFooterButtonText,
            isFirstQuestion && styles.navFooterButtonTextDisabled,
          ]}
        >
          Previous
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.navFooterButton,
          isLastQuestion && styles.navFooterButtonDisabled,
        ]}
        onPress={onNext}
        disabled={isLastQuestion}
      >
        <Text
          style={[
            styles.navFooterButtonText,
            isLastQuestion && styles.navFooterButtonTextDisabled,
          ]}
        >
          Next
        </Text>
        <ChevronRight
          size={20}
          color={isLastQuestion ? Colors.gray400 : Colors.textPrimary}
        />
      </TouchableOpacity>
    </View>
  );
});

SolutionNavigation.displayName = 'SolutionNavigation';
