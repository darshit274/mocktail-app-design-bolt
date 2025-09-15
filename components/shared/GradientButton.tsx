import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getTheme, ThemeColors } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  gradientColors?: string[];
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  gradientColors,
}) => {
  const { theme } = useTheme();
  const Colors = getTheme(theme);
  const styles = getStyles(Colors);

  const defaultGradientColors = [Colors.primary, Colors.primaryLight];
  const colors = gradientColors || defaultGradientColors;

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <LinearGradient
        colors={colors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Loading...' : title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const getStyles = (Colors: ThemeColors) => StyleSheet.create({
  button: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  gradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});