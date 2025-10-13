import React, { memo } from 'react';
import { View, Text, Switch } from 'react-native';
import { RotateCcw } from 'lucide-react-native';
import { ThemeColors } from '@/types';
import { createSolutionsStyles } from '@/styles/solutionsStyles';

interface PracticeModeToggleProps {
  reattemptMode: boolean;
  onToggle: () => void;
  Colors: ThemeColors;
}

export const PracticeModeToggle = memo<PracticeModeToggleProps>(({
  reattemptMode,
  onToggle,
  Colors
}) => {
  const styles = createSolutionsStyles(Colors);

  return (
    <View style={styles.reattemptContainer}>
      <Text style={styles.reattemptLabel}>Practice Mode</Text>
      <View style={styles.reattemptToggle}>
        <RotateCcw size={16} color={Colors.textSubtle} />
        <Switch
          value={reattemptMode}
          onValueChange={onToggle}
          trackColor={{ false: Colors.muted, true: Colors.primaryLight }}
          thumbColor={reattemptMode ? Colors.primary : Colors.textSubtle}
          style={{ marginLeft: 8 }}
        />
      </View>
    </View>
  );
});

PracticeModeToggle.displayName = 'PracticeModeToggle';
