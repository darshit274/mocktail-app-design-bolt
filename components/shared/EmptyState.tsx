import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { ThemeColors } from '@/theme';
import { UI } from '@/utils/appConstants';

interface EmptyStateProps {
  title: string;
  message: string;
  Icon: LucideIcon;
  actionText?: string;
  onAction?: () => void;
  Colors: ThemeColors;
  fullScreen?: boolean;
  iconSize?: number;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  Icon,
  actionText,
  onAction,
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
      <Icon size={iconSize} color={Colors.textSubtle} />

      <Text style={[styles.title, { color: Colors.textPrimary }]}>
        {title}
      </Text>

      <Text style={[styles.message, { color: Colors.textSubtle }]}>
        {message}
      </Text>

      {actionText && onAction && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: Colors.primary }]}
          onPress={onAction}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionButtonText, { color: Colors.white }]}>
            {actionText}
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
    paddingVertical: UI.SPACING_XL * 2,
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
  actionButton: {
    paddingHorizontal: UI.SPACING_XXL,
    paddingVertical: UI.SPACING_MD,
    borderRadius: UI.BORDER_RADIUS_MD,
    marginTop: UI.SPACING_SM,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
