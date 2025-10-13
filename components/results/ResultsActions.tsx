import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Trophy, ChevronRight } from 'lucide-react-native';
import { ThemeColors } from '@/types';
import { createResultsStyles } from '@/styles/resultsStyles';

interface ResultsActionsProps {
  onViewSolutions: () => void;
  onViewLeaderboard: () => void;
  onRetakeTest: () => void;
  t: any; // Translation object
  Colors: ThemeColors;
}

export const ResultsActions = memo<ResultsActionsProps>(({
  onViewSolutions,
  onViewLeaderboard,
  onRetakeTest,
  t,
  Colors
}) => {
  const styles = createResultsStyles(Colors);

  return (
    <View style={styles.actionContainer}>
      <TouchableOpacity style={styles.actionButton} onPress={onViewSolutions}>
        <BookOpen size={20} color={Colors.primary} />
        <Text style={styles.actionButtonText}>{t.results.viewSolutions}</Text>
        <ChevronRight size={16} color={Colors.primary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={onViewLeaderboard}>
        <Trophy size={20} color={Colors.primary} />
        <Text style={styles.actionButtonText}>{t.results.viewLeaderboard}</Text>
        <ChevronRight size={16} color={Colors.primary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.retakeButton} onPress={onRetakeTest}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryLight]}
          style={styles.retakeGradient}
        >
          <Text style={styles.retakeButtonText}>{t.results.retakeTest}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
});

ResultsActions.displayName = 'ResultsActions';
