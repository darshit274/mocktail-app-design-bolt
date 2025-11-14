import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CircleCheck as CheckCircle, Circle as XCircle, RotateCcw } from 'lucide-react-native';
import { ThemeColors } from '@/types';
import { createSolutionsStyles } from '@/styles/solutionsStyles';

interface ReattemptStatusProps {
  reattemptMode: boolean;
  hasReattempted: boolean;
  isOriginallyCorrect: boolean;
  reattemptStatus: 'not_attempted' | 'correct' | 'incorrect';
  onReset: () => void;
  Colors: ThemeColors;
}

export const ReattemptStatus = memo<ReattemptStatusProps>(({
  reattemptMode,
  hasReattempted,
  isOriginallyCorrect,
  reattemptStatus,
  onReset,
  Colors
}) => {
  const styles = createSolutionsStyles(Colors);

  // Show reattempt result if user has reattempted
  if (reattemptMode && hasReattempted) {
    return (
      <View style={styles.reattemptStatusCard}>
        <Text style={styles.reattemptStatusTitle}>Reattempt Result:</Text>
        <View style={styles.reattemptStatusRow}>
          {reattemptStatus === 'correct' ? (
            <>
              <CheckCircle size={20} color={Colors.success} />
              <Text style={[styles.reattemptStatusText, { color: Colors.success }]}>
                Correct! Well done.
              </Text>
            </>
          ) : (
            <>
              <XCircle size={20} color={Colors.danger} />
              <Text style={[styles.reattemptStatusText, { color: Colors.danger }]}>
                Incorrect. The correct answer is shown above.
              </Text>
            </>
          )}
        </View>
        <TouchableOpacity style={styles.resetButton} onPress={onReset}>
          <RotateCcw size={16} color={Colors.primary} />
          <Text style={styles.resetButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ✅ REMOVED: "Already Correct" restriction - now users can reattempt even if originally correct

  // Show instructions for reattempt mode (for ALL questions that haven't been reattempted yet)
  if (reattemptMode && !hasReattempted) {
    return (
      <View style={styles.instructionCard}>
        <Text style={styles.instructionTitle}>Reattempt Mode</Text>
        <Text style={styles.instructionText}>
          Select an answer above to see if you got it right. The explanation will be shown after you make your choice.
        </Text>
      </View>
    );
  }

  return null;
});

ReattemptStatus.displayName = 'ReattemptStatus';
