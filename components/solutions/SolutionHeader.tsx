import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, Grid3X3 } from 'lucide-react-native';
import { ThemeColors } from '@/types';
import { createSolutionsStyles } from '@/styles/solutionsStyles';

interface SolutionHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
  onBack: () => void;
  onGridOpen: () => void;
  Colors: ThemeColors;
}

export const SolutionHeader = memo<SolutionHeaderProps>(({
  currentQuestion,
  totalQuestions,
  onBack,
  onGridOpen,
  Colors
}) => {
  const styles = createSolutionsStyles(Colors);

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <ChevronLeft size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Solutions</Text>
        <Text style={styles.questionCounter}>
          Question {currentQuestion + 1} of {totalQuestions}
        </Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.controlButton} onPress={onGridOpen}>
          <Grid3X3 size={20} color={Colors.textSubtle} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

SolutionHeader.displayName = 'SolutionHeader';
