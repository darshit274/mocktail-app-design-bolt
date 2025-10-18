import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LucideIcon, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react-native';
import { ThemeColors } from '@/theme';
import { UI } from '@/utils/appConstants';
import { ValidationResult } from '@/utils/validationUtils';

export type InputVariant = 'default' | 'filled' | 'outlined';
export type InputSize = 'small' | 'medium' | 'large';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  variant?: InputVariant;
  size?: InputSize;
  disabled?: boolean;
  required?: boolean;
  Icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  Colors: ThemeColors;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  onValidate?: (value: string) => ValidationResult;
  showValidationIcon?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  success,
  hint,
  variant = 'default',
  size = 'medium',
  disabled = false,
  required = false,
  Icon,
  iconPosition = 'left',
  Colors,
  containerStyle,
  inputStyle,
  secureTextEntry,
  onValidate,
  showValidationIcon = false,
  value,
  onChangeText,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const isPassword = secureTextEntry;
  const hasError = !!error || (validationResult && !validationResult.isValid);
  const hasSuccess = !!success || (validationResult && validationResult.isValid);

  const handleChangeText = (text: string) => {
    if (onChangeText) {
      onChangeText(text);
    }

    // Run validation if validator is provided
    if (onValidate && text.length > 0) {
      const result = onValidate(text);
      setValidationResult(result);
    } else {
      setValidationResult(null);
    }
  };

  const getContainerStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      borderRadius: UI.BORDER_RADIUS_MD,
    };

    // Size styles
    const sizeStyles: Record<InputSize, ViewStyle> = {
      small: {
        paddingHorizontal: UI.SPACING_SM,
        paddingVertical: UI.SPACING_XS,
        minHeight: 36,
      },
      medium: {
        paddingHorizontal: UI.SPACING_MD,
        paddingVertical: UI.SPACING_SM,
        minHeight: 44,
      },
      large: {
        paddingHorizontal: UI.SPACING_LG,
        paddingVertical: UI.SPACING_MD,
        minHeight: 52,
      },
    };

    // Variant styles
    const variantStyles: Record<InputVariant, ViewStyle> = {
      default: {
        backgroundColor: Colors.cardBackground,
        borderWidth: 1,
        borderColor: isFocused ? Colors.primary : Colors.muted,
      },
      filled: {
        backgroundColor: Colors.muted,
        borderWidth: 0,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: isFocused ? Colors.primary : Colors.muted,
      },
    };

    // Error/Success styles
    let statusStyles: ViewStyle = {};
    if (hasError) {
      statusStyles = {
        borderColor: Colors.danger,
        borderWidth: variant === 'filled' ? 1 : variantStyles[variant].borderWidth,
      };
    } else if (hasSuccess && isFocused) {
      statusStyles = {
        borderColor: Colors.success,
      };
    }

    // Disabled styles
    const disabledStyles: ViewStyle = disabled
      ? {
          opacity: 0.5,
          backgroundColor: Colors.muted,
        }
      : {};

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...statusStyles,
      ...disabledStyles,
    };
  };

  const getTextStyles = (): TextStyle => {
    const sizeStyles: Record<InputSize, TextStyle> = {
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

    return {
      flex: 1,
      color: Colors.textPrimary,
      ...sizeStyles[size],
    };
  };

  const getIconSize = (): number => {
    const iconSizes: Record<InputSize, number> = {
      small: UI.ICON_SIZE_SM,
      medium: UI.ICON_SIZE_MD,
      large: UI.ICON_SIZE_LG,
    };
    return iconSizes[size];
  };

  const renderIcon = () => {
    if (!Icon) return null;

    return (
      <Icon
        size={getIconSize()}
        color={hasError ? Colors.danger : Colors.textSubtle}
        style={iconPosition === 'left' ? styles.leftIcon : styles.rightIcon}
      />
    );
  };

  const renderValidationIcon = () => {
    if (!showValidationIcon || !value || value.length === 0) return null;

    if (hasError) {
      return (
        <AlertCircle
          size={getIconSize()}
          color={Colors.danger}
          style={styles.rightIcon}
        />
      );
    }

    if (hasSuccess) {
      return (
        <CheckCircle
          size={getIconSize()}
          color={Colors.success}
          style={styles.rightIcon}
        />
      );
    }

    return null;
  };

  const renderPasswordToggle = () => {
    if (!isPassword) return null;

    return (
      <TouchableOpacity
        onPress={() => setShowPassword(!showPassword)}
        style={styles.passwordToggle}
        activeOpacity={0.7}
      >
        {showPassword ? (
          <EyeOff size={getIconSize()} color={Colors.textSubtle} />
        ) : (
          <Eye size={getIconSize()} color={Colors.textSubtle} />
        )}
      </TouchableOpacity>
    );
  };

  const errorMessage = error || (validationResult && !validationResult.isValid ? validationResult.error : '');

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: Colors.textPrimary }]}>
            {label}
            {required && <Text style={[styles.required, { color: Colors.danger }]}> *</Text>}
          </Text>
        </View>
      )}

      <View style={[styles.inputContainer, getContainerStyles()]}>
        {Icon && iconPosition === 'left' && renderIcon()}

        <TextInput
          {...textInputProps}
          value={value}
          onChangeText={handleChangeText}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
          style={[getTextStyles(), inputStyle]}
          placeholderTextColor={Colors.textSubtle}
          editable={!disabled}
          secureTextEntry={isPassword && !showPassword}
        />

        {showValidationIcon && renderValidationIcon()}
        {Icon && iconPosition === 'right' && !showValidationIcon && renderIcon()}
        {renderPasswordToggle()}
      </View>

      {(errorMessage || success || hint) && (
        <View style={styles.messageContainer}>
          {errorMessage && (
            <Text style={[styles.errorText, { color: Colors.danger }]}>
              {errorMessage}
            </Text>
          )}
          {!errorMessage && success && (
            <Text style={[styles.successText, { color: Colors.success }]}>
              {success}
            </Text>
          )}
          {!errorMessage && !success && hint && (
            <Text style={[styles.hintText, { color: Colors.textSubtle }]}>
              {hint}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: UI.SPACING_MD,
  },
  labelContainer: {
    marginBottom: UI.SPACING_XS,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  required: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftIcon: {
    marginRight: UI.SPACING_SM,
  },
  rightIcon: {
    marginLeft: UI.SPACING_SM,
  },
  passwordToggle: {
    padding: UI.SPACING_XS,
  },
  messageContainer: {
    marginTop: UI.SPACING_XS,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 16,
  },
  successText: {
    fontSize: 12,
    lineHeight: 16,
  },
  hintText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
