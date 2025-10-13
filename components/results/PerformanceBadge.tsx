import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Award } from 'lucide-react-native';
import { ThemeColors } from '@/types';
import { createResultsStyles } from '@/styles/resultsStyles';

interface PerformanceBadgeProps {
  percentage: number;
  getPerformanceText: (percentage: number) => string;
  Colors: ThemeColors;
}

export const PerformanceBadge = memo<PerformanceBadgeProps>(({
  percentage,
  getPerformanceText,
  Colors
}) => {
  const styles = createResultsStyles(Colors);

  return (
    <View style={styles.performanceBadge}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        style={styles.performanceGradient}
      >
        <Award size={24} color={Colors.white} />
        <Text style={styles.performanceText}>
          {getPerformanceText(percentage)}
        </Text>
      </LinearGradient>
    </View>
  );
});

PerformanceBadge.displayName = 'PerformanceBadge';
