import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { ThemeColors } from '@/theme';
import { UI } from '@/utils/appConstants';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'outline';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  Icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  Colors: ThemeColors;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  Icon,
  iconPosition = 'left',
  Colors,
  style,
  textStyle,
}) => {
  const getButtonStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      borderRadius: UI.BORDER_RADIUS_MD,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, ViewStyle> = {
      small: {
        paddingHorizontal: UI.SPACING_MD,
        paddingVertical: UI.SPACING_SM,
        minHeight: 36,
      },
      medium: {
        paddingHorizontal: UI.SPACING_LG,
        paddingVertical: UI.SPACING_MD,
        minHeight: 44,
      },
      large: {
        paddingHorizontal: UI.SPACING_XL,
        paddingVertical: UI.SPACING_LG,
        minHeight: 52,
      },
    };

    // Variant styles
    const variantStyles: Record<ButtonVariant, ViewStyle> = {
      primary: {
        backgroundColor: Colors.primary,
      },
      secondary: {
        backgroundColor: Colors.primaryLight,
      },
      danger: {
        backgroundColor: Colors.danger,
      },
      success: {
        backgroundColor: Colors.success,
      },
      warning: {
        backgroundColor: Colors.warning,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: Colors.primary,
      },
    };

    const disabledStyles: ViewStyle = disabled
      ? {
          opacity: 0.5,
        }
      : {};

    const widthStyles: ViewStyle = fullWidth ? { width: '100%' } : {};

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...disabledStyles,
      ...widthStyles,
    };
  };

  const getTextStyles = (): TextStyle => {
    // Size styles
    const sizeStyles: Record<ButtonSize, TextStyle> = {
      small: {
        fontSize: 14,
      },
      medium: {
        fontSize: 16,
      },
      large: {
        fontSize: 18,
      },
    };

    // Variant styles
    const variantStyles: Record<ButtonVariant, TextStyle> = {
      primary: {
        color: Colors.white,
      },
      secondary: {
        color: Colors.white,
      },
      danger: {
        color: Colors.white,
      },
      success: {
        color: Colors.white,
      },
      warning: {
        color: Colors.white,
      },
      ghost: {
        color: Colors.primary,
      },
      outline: {
        color: Colors.primary,
      },
    };

    return {
      fontWeight: '600',
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getIconSize = (): number => {
    const iconSizes: Record<ButtonSize, number> = {
      small: UI.ICON_SIZE_SM,
      medium: UI.ICON_SIZE_MD,
      large: UI.ICON_SIZE_LG,
    };
    return iconSizes[size];
  };

  const getIconColor = (): string => {
    if (variant === 'ghost' || variant === 'outline') {
      return Colors.primary;
    }
    return Colors.white;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyles(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' || variant === 'outline' ? Colors.primary : Colors.white}
        />
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon
              size={getIconSize()}
              color={getIconColor()}
              style={{ marginRight: UI.SPACING_SM }}
            />
          )}
          <Text style={[getTextStyles(), textStyle]}>{title}</Text>
          {Icon && iconPosition === 'right' && (
            <Icon
              size={getIconSize()}
              color={getIconColor()}
              style={{ marginLeft: UI.SPACING_SM }}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};
