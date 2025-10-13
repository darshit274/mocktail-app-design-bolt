import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { ThemeColors } from '@/types';
import { createResultsStyles } from '@/styles/resultsStyles';

interface PerformanceChartProps {
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalQuestions: number;
  t: any; // Translation object
  Colors: ThemeColors;
}

export const PerformanceChart = memo<PerformanceChartProps>(({
  correctCount,
  incorrectCount,
  unansweredCount,
  totalQuestions,
  t,
  Colors
}) => {
  const styles = createResultsStyles(Colors);

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{t.results.performanceBreakdown}</Text>
      <View style={styles.progressChart}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressSegment,
              {
                width: `${(correctCount / totalQuestions) * 100}%`,
                backgroundColor: Colors.success
              }
            ]}
          />
          <View
            style={[
              styles.progressSegment,
              {
                width: `${(incorrectCount / totalQuestions) * 100}%`,
                backgroundColor: Colors.danger
              }
            ]}
          />
          <View
            style={[
              styles.progressSegment,
              {
                width: `${(unansweredCount / totalQuestions) * 100}%`,
                backgroundColor: Colors.warning
              }
            ]}
          />
        </View>

        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.legendText}>
              {t.results?.correct || 'Correct'} ({correctCount})
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
            <Text style={styles.legendText}>
              {t.results?.incorrect || 'Wrong'} ({incorrectCount})
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
            <Text style={styles.legendText}>
              {t.results?.unanswered || 'Unanswered'} ({unansweredCount})
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

PerformanceChart.displayName = 'PerformanceChart';
