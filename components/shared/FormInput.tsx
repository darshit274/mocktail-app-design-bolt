import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { getTheme, ThemeColors } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  style,
  ...inputProps
}) => {
  const { theme } = useTheme();
  const Colors = getTheme(theme);
  const styles = getStyles(Colors);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={Colors.textSubtle}
        {...inputProps}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const getStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 6,
    marginTop: 8,
    fontWeight: '500',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    color: Colors.textPrimary,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
  },
});