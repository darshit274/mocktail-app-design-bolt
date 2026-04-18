import React, { memo } from 'react';
import { View, Text, Switch } from 'react-native';
import { RotateCcw } from 'lucide-react-native';
import { ThemeColors } from '@/types';
import { createSolutionsStyles } from '@/styles/solutionsStyles';

interface ShowAllExplanationsToggleProps {
  value: boolean;
  onToggle: () => void;
  Colors: ThemeColors;
}

export const ShowAllExplanationsToggle = memo<ShowAllExplanationsToggleProps>(({
  value,
  onToggle,
  Colors
}) => {
  const styles = createSolutionsStyles(Colors);

  return (
    <View style={styles.reattemptContainer}>
      <Text style={styles.reattemptLabel}>Show All Explanations</Text>
      <View style={styles.reattemptToggle}>
        {/* <RotateCcw size={16} color={Colors.textSubtle} onPress={()=>onToggle(false)} /> */}
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: Colors.muted, true: Colors.primaryLight }}
          thumbColor={value ? Colors.primary : Colors.textSubtle}
          style={{ marginLeft: 8 }}
        />
      </View>
    </View>
  );
});

ShowAllExplanationsToggle.displayName = 'ShowAllExplanationsToggle';
