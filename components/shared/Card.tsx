import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { ThemeColors } from '@/theme';
import { UI } from '@/utils/appConstants';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'flat';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  Colors: ThemeColors;
  style?: ViewStyle;
  padding?: number;
  borderRadius?: number;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  onPress,
  Colors,
  style,
  padding = UI.SPACING_LG,
  borderRadius = UI.BORDER_RADIUS_LG,
  disabled = false,
}) => {
  const getCardStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      backgroundColor: Colors.cardBackground,
      padding,
      borderRadius,
    };

    const variantStyles: Record<CardVariant, ViewStyle> = {
      default: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      elevated: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
      },
      outlined: {
        borderWidth: 1,
        borderColor: Colors.muted,
        shadowOpacity: 0,
        elevation: 0,
      },
      flat: {
        shadowOpacity: 0,
        elevation: 0,
      },
    };

    return {
      ...baseStyles,
      ...variantStyles[variant],
    };
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[getCardStyles(), style]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[getCardStyles(), style]}>{children}</View>;
};
