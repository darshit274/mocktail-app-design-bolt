import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { BookOpen } from 'lucide-react-native';
import { ThemeColors } from '@/types';
import { createResultsStyles } from '@/styles/resultsStyles';
import { SubjectStats } from '@/hooks/results/useResultsData';

interface SubjectAnalysisProps {
  subjectStats: Record<string, SubjectStats>;
  totalQuestions: number;
  totalTimeTaken: number;
  formatTime: (seconds: number) => string;
  t: any; // Translation object
  Colors: ThemeColors;
}

export const SubjectAnalysis = memo<SubjectAnalysisProps>(({
  subjectStats,
  totalQuestions,
  totalTimeTaken,
  formatTime,
  t,
  Colors
}) => {
  const styles = createResultsStyles(Colors);

  return (
    <>
      {/* Subject-wise Analysis */}
      {Object.keys(subjectStats).length > 0 && (
        <View style={styles.analysisContainer}>
          <Text style={styles.analysisTitle}>{t.results.subjectWisePerformance}</Text>

          {Object.entries(subjectStats).map(([subject, stats]) => {
            const accuracy = stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0;
            return (
              <View key={subject} style={styles.subjectCard}>
                <View style={styles.subjectHeader}>
                  <BookOpen size={20} color={Colors.textLink} />
                  <Text style={styles.subjectName}>{subject}</Text>
                </View>
                <View style={styles.subjectStats}>
                  <Text style={styles.subjectScore}>{stats.correct}/{stats.total}</Text>
                  <Text style={styles.subjectPercentage}>{Math.round(accuracy)}%</Text>
                </View>
                <View style={styles.subjectProgress}>
                  <View style={[styles.subjectProgressBar, { width: `${accuracy}%` }]} />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Time Analysis */}
      {totalTimeTaken > 0 && (
        <View style={styles.timeAnalysisContainer}>
          <Text style={styles.analysisTitle}>{t.results.timeAnalysis}</Text>
          <View style={styles.timeCard}>
            <Text style={styles.timeLabel}>{t.results.avgTimePerQuestion}</Text>
            <Text style={styles.timeValue}>
              {totalQuestions > 0 ? Math.round(totalTimeTaken / totalQuestions) : 0}s
            </Text>
          </View>
          <View style={styles.timeCard}>
            <Text style={styles.timeLabel}>{t.results.totalTimeSpent}</Text>
            <Text style={styles.timeValue}>{formatTime(totalTimeTaken)}</Text>
          </View>
        </View>
      )}
    </>
  );
});

SubjectAnalysis.displayName = 'SubjectAnalysis';
