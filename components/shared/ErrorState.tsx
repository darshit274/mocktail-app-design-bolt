import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { ThemeColors } from '@/theme';
import { UI } from '@/utils/appConstants';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  Colors: ThemeColors;
  fullScreen?: boolean;
  iconSize?: number;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Error',
  message,
  onRetry,
  retryText = 'Try Again',
  Colors,
  fullScreen = false,
  iconSize = UI.ICON_SIZE_XXL,
}) => {
  return (
    <View style={[
      styles.container,
      fullScreen && styles.fullScreen,
      { backgroundColor: fullScreen ? Colors.background : 'transparent' }
    ]}>
      <AlertCircle size={iconSize} color={Colors.danger} />

      <Text style={[styles.title, { color: Colors.textPrimary }]}>
        {title}
      </Text>

      <Text style={[styles.message, { color: Colors.textSubtle }]}>
        {message}
      </Text>

      {onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: Colors.primary }]}
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <Text style={[styles.retryButtonText, { color: Colors.white }]}>
            {retryText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: UI.SPACING_XXL,
    paddingVertical: UI.SPACING_XL,
  },
  fullScreen: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: UI.SPACING_LG,
    marginBottom: UI.SPACING_SM,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: UI.SPACING_XL,
  },
  retryButton: {
    paddingHorizontal: UI.SPACING_XXL,
    paddingVertical: UI.SPACING_MD,
    borderRadius: UI.BORDER_RADIUS_MD,
    marginTop: UI.SPACING_SM,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
