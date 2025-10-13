import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, Target } from 'lucide-react-native';
import { ThemeColors } from '@/types';
import { createResultsStyles } from '@/styles/resultsStyles';

interface StatsOverviewProps {
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  score: string | string[];
  t: any; // Translation object
  Colors: ThemeColors;
}

export const StatsOverview = memo<StatsOverviewProps>(({
  correctCount,
  incorrectCount,
  unansweredCount,
  score,
  t,
  Colors
}) => {
  const styles = createResultsStyles(Colors);

  return (
    <>
      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <CheckCircle size={24} color={Colors.success} />
          <Text style={styles.statNumber}>{correctCount}</Text>
          <Text style={styles.statLabel}>{t.results?.correct || 'Correct'}</Text>
        </View>

        <View style={styles.statCard}>
          <XCircle size={24} color={Colors.danger} />
          <Text style={styles.statNumber}>{incorrectCount}</Text>
          <Text style={styles.statLabel}>{t.results?.incorrect || 'Wrong'}</Text>
        </View>

        <View style={styles.statCard}>
          <AlertCircle size={24} color={Colors.warning} />
          <Text style={styles.statNumber}>{unansweredCount}</Text>
          <Text style={styles.statLabel}>{t.results?.unanswered || 'Skipped'}</Text>
        </View>
      </View>

      {/* Detailed Stats */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <CheckCircle size={20} color={Colors.primaryLight} />
              <Text style={styles.detailLabel}>{t.results.correctAnswers}</Text>
            </View>
            <Text style={styles.detailValue}>{correctCount}</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <XCircle size={20} color={Colors.accent} />
              <Text style={styles.detailLabel}>{t.results.incorrectAnswers}</Text>
            </View>
            <Text style={styles.detailValue}>{incorrectCount}</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <AlertCircle size={20} color={Colors.accent} />
              <Text style={styles.detailLabel}>{t.results.unanswered}</Text>
            </View>
            <Text style={styles.detailValue}>{unansweredCount}</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Target size={20} color={Colors.primaryLight} />
              <Text style={styles.detailLabel}>{t.results.totalScore}</Text>
            </View>
            <Text style={styles.detailValue}>{score}</Text>
          </View>
        </View>
      </View>
    </>
  );
});

StatsOverview.displayName = 'StatsOverview';
