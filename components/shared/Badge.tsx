import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { ThemeColors } from '@/theme';
import { UI } from '@/utils/appConstants';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
export type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  Icon?: LucideIcon;
  Colors: ThemeColors;
  style?: ViewStyle;
  textStyle?: TextStyle;
  outlined?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'medium',
  Icon,
  Colors,
  style,
  textStyle,
  outlined = false,
}) => {
  const getBadgeStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      borderRadius: UI.BORDER_RADIUS_FULL,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    };

    // Size styles
    const sizeStyles: Record<BadgeSize, ViewStyle> = {
      small: {
        paddingHorizontal: UI.SPACING_SM,
        paddingVertical: 2,
        minHeight: 20,
      },
      medium: {
        paddingHorizontal: UI.SPACING_MD,
        paddingVertical: 4,
        minHeight: 24,
      },
      large: {
        paddingHorizontal: UI.SPACING_LG,
        paddingVertical: UI.SPACING_SM,
        minHeight: 32,
      },
    };

    // Variant background colors
    const variantBackgroundColors: Record<BadgeVariant, string> = {
      primary: outlined ? 'transparent' : `${Colors.primary}20`,
      secondary: outlined ? 'transparent' : `${Colors.primaryLight}20`,
      success: outlined ? 'transparent' : Colors.successLight,
      danger: outlined ? 'transparent' : Colors.dangerLight,
      warning: outlined ? 'transparent' : Colors.warningLight,
      info: outlined ? 'transparent' : `${Colors.textLink}20`,
      neutral: outlined ? 'transparent' : Colors.muted,
    };

    // Variant border colors (for outlined)
    const variantBorderColors: Record<BadgeVariant, string> = {
      primary: Colors.primary,
      secondary: Colors.primaryLight,
      success: Colors.success,
      danger: Colors.danger,
      warning: Colors.warning,
      info: Colors.textLink,
      neutral: Colors.textSubtle,
    };

    const outlineStyles: ViewStyle = outlined
      ? {
          borderWidth: 1,
          borderColor: variantBorderColors[variant],
        }
      : {};

    return {
      ...baseStyles,
      ...sizeStyles[size],
      backgroundColor: variantBackgroundColors[variant],
      ...outlineStyles,
    };
  };

  const getTextStyles = (): TextStyle => {
    // Size styles
    const sizeStyles: Record<BadgeSize, TextStyle> = {
      small: {
        fontSize: 10,
      },
      medium: {
        fontSize: 12,
      },
      large: {
        fontSize: 14,
      },
    };

    // Variant text colors
    const variantTextColors: Record<BadgeVariant, string> = {
      primary: Colors.primary,
      secondary: Colors.primaryLight,
      success: Colors.success,
      danger: Colors.danger,
      warning: Colors.warning,
      info: Colors.textLink,
      neutral: Colors.textSubtle,
    };

    return {
      fontWeight: '600',
      color: variantTextColors[variant],
      ...sizeStyles[size],
    };
  };

  const getIconSize = (): number => {
    const iconSizes: Record<BadgeSize, number> = {
      small: 10,
      medium: 12,
      large: 14,
    };
    return iconSizes[size];
  };

  const getIconColor = (): string => {
    const variantIconColors: Record<BadgeVariant, string> = {
      primary: Colors.primary,
      secondary: Colors.primaryLight,
      success: Colors.success,
      danger: Colors.danger,
      warning: Colors.warning,
      info: Colors.textLink,
      neutral: Colors.textSubtle,
    };
    return variantIconColors[variant];
  };

  return (
    <View style={[getBadgeStyles(), style]}>
      {Icon && (
        <Icon
          size={getIconSize()}
          color={getIconColor()}
          style={{ marginRight: UI.SPACING_XS }}
        />
      )}
      <Text style={[getTextStyles(), textStyle]}>{label}</Text>
    </View>
  );
};
