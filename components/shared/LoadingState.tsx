import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { ThemeColors } from '@/theme';
import { UI } from '@/utils/appConstants';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  Colors: ThemeColors;
  fullScreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'large',
  Colors,
  fullScreen = false,
}) => {
  return (
    <View style={[
      styles.container,
      fullScreen && styles.fullScreen,
      { backgroundColor: fullScreen ? Colors.background : 'transparent' }
    ]}>
      <ActivityIndicator size={size} color={Colors.primary} />
      {message && (
        <Text style={[styles.message, { color: Colors.textSubtle }]}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI.SPACING_XL,
  },
  fullScreen: {
    flex: 1,
  },
  message: {
    fontSize: 16,
    marginTop: UI.SPACING_LG,
    textAlign: 'center',
  },
});
