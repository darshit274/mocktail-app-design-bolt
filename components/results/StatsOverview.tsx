import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, Target, Trophy, Percent, Clock } from 'lucide-react-native';
import { ThemeColors } from '@/types';
import { createResultsStyles } from '@/styles/resultsStyles';

interface StatsOverviewProps {
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalQuestions: number;
  attempted: number;
  accuracy: number;
  score: string | string[];
  scoreWithNegativeMarking: number;
  rank: number;
  totalUsers: number;
  percentile: number;
  totalTimeTaken: number;
  t: any; // Translation object
  Colors: ThemeColors;
}

export const StatsOverview = memo<StatsOverviewProps>(({
  correctCount,
  incorrectCount,
  unansweredCount,
  totalQuestions,
  attempted,
  accuracy,
  score,
  scoreWithNegativeMarking,
  rank,
  totalUsers,
  percentile,
  totalTimeTaken,
  t,
  Colors
}) => {
  const styles = createResultsStyles(Colors);

  // Format time
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <>
      {/* Quick Stats - Top Row */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Trophy size={24} color={Colors.primary} />
          <Text style={styles.statNumber}>{rank}/{totalUsers}</Text>
          <Text style={styles.statLabel}>Rank</Text>
        </View>

        <View style={styles.statCard}>
          <Target size={24} color={Colors.success} />
          <Text style={styles.statNumber}>{attempted}/{totalQuestions}</Text>
          <Text style={styles.statLabel}>Attempted</Text>
        </View>

        <View style={styles.statCard}>
          <CheckCircle size={24} color={Colors.success} />
          <Text style={styles.statNumber}>{accuracy}%</Text>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>

        <View style={styles.statCard}>
          <Percent size={24} color={Colors.primary} />
          <Text style={styles.statNumber}>{percentile.toFixed(2)}%</Text>
          <Text style={styles.statLabel}>Percentile</Text>
        </View>
      </View>

      {/* Second Row - Answer Stats */}
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
              <Target size={20} color={Colors.primaryLight} />
              <Text style={styles.detailLabel}>Attempted</Text>
            </View>
            <Text style={styles.detailValue}>{attempted}/{totalQuestions}</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <CheckCircle size={20} color={Colors.primaryLight} />
              <Text style={styles.detailLabel}>Correct</Text>
            </View>
            <Text style={styles.detailValue}>{correctCount}</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Percent size={20} color={Colors.accent} />
              <Text style={styles.detailLabel}>Percentile</Text>
            </View>
            <Text style={styles.detailValue}>{percentile.toFixed(2)}%</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <CheckCircle size={20} color={Colors.accent} />
              <Text style={styles.detailLabel}>Accuracy</Text>
            </View>
            <Text style={styles.detailValue}>{accuracy}%</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Clock size={20} color={Colors.accent} />
              <Text style={styles.detailLabel}>Time</Text>
            </View>
            <Text style={styles.detailValue}>{formatTime(totalTimeTaken)}</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Trophy size={20} color={Colors.primaryLight} />
              <Text style={styles.detailLabel}>Rank</Text>
            </View>
            <Text style={styles.detailValue}>{rank}</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Target size={20} color={Colors.primaryLight} />
              <Text style={styles.detailLabel}>Score (with -0.25 marking)</Text>
            </View>
            <Text style={styles.detailValue}>{scoreWithNegativeMarking.toFixed(2)}/{totalQuestions}</Text>
          </View>
        </View>
      </View>
    </>
  );
});

StatsOverview.displayName = 'StatsOverview';
