import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { ThemeColors } from '@/types';
import { createResultsStyles } from '@/styles/resultsStyles';

interface NegativeMarkingCardProps {
  correctCount: number;
  negativeMarks: string;
  finalScore: string;
  Colors: ThemeColors;
}

export const NegativeMarkingCard = memo<NegativeMarkingCardProps>(({
  correctCount,
  negativeMarks,
  finalScore,
  Colors
}) => {
  const styles = createResultsStyles(Colors);

  return (
    <View style={styles.negativeMarkingCard}>
      <View style={styles.negativeMarkingHeader}>
        <AlertTriangle size={20} color={Colors.warning} />
        <Text style={styles.negativeMarkingTitle}>Negative Marking Applied</Text>
      </View>
      <View style={styles.negativeMarkingContent}>
        <View style={styles.negativeMarkingRow}>
          <Text style={styles.negativeMarkingLabel}>Correct Answers</Text>
          <Text style={styles.negativeMarkingValue}>+{correctCount}</Text>
        </View>
        <View style={styles.negativeMarkingRow}>
          <Text style={styles.negativeMarkingLabel}>Negative Marks</Text>
          <Text style={[styles.negativeMarkingValue, styles.negativeMarkingNegative]}>
            -{parseFloat(negativeMarks || '0').toFixed(2)}
          </Text>
        </View>
        <View style={styles.negativeMarkingDivider} />
        <View style={styles.negativeMarkingRow}>
          <Text style={styles.negativeMarkingLabelFinal}>Final Score</Text>
          <Text style={styles.negativeMarkingValueFinal}>
            {parseFloat(finalScore || '0').toFixed(2)}
          </Text>
        </View>
      </View>
      <View style={styles.negativeMarkingFooter}>
        <Text style={styles.negativeMarkingFooterText}>
          ℹ️ Wrong answers received penalty as per negative marking rules
        </Text>
      </View>
    </View>
  );
});

NegativeMarkingCard.displayName = 'NegativeMarkingCard';
