import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeColors } from '@/types';
import { createResultsStyles } from '@/styles/resultsStyles';

interface ResultsHeaderProps {
  testTitle: string;
  percentage: number;
  translationTitle: string;
  translationScore: string;
  Colors: ThemeColors;
}

export const ResultsHeader = memo<ResultsHeaderProps>(({
  testTitle,
  percentage,
  translationTitle,
  translationScore,
  Colors
}) => {
  const styles = createResultsStyles(Colors);

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.primaryLight]}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>{translationTitle}</Text>
        <Text style={styles.headerSubtitle}>{testTitle}</Text>
      </View>

      <View style={styles.scoreCircle}>
        <Text style={styles.scorePercentage}>{Math.round(percentage)}%</Text>
        <Text style={styles.scoreLabel}>{translationScore}</Text>
      </View>
    </LinearGradient>
  );
});

ResultsHeader.displayName = 'ResultsHeader';
