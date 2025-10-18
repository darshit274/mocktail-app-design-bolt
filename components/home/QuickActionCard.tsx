/**
 * Quick Action Card Component
 * Created: 2025-01-13
 * Purpose: Memoized card component for quick action buttons on home screen
 * Optimized: React.memo for preventing unnecessary re-renders
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { ThemeColors } from '@/types';

/**
 * Props for QuickActionCard component
 * @interface QuickActionCardProps
 */
interface QuickActionCardProps {
  /** Text displayed below the icon */
  title: string;
  /** Lucide icon component to display */
  icon: LucideIcon;
  /** Hex color code for the icon background (e.g., "#3B82F6") */
  color: string;
  /** Callback function when the card is pressed */
  onPress: () => void;
  /** Theme colors object for consistent styling */
  Colors: ThemeColors;
}

/**
 * QuickActionCard Component
 *
 * A memoized card component for displaying quick action buttons on the home screen.
 * Features a circular icon with colored background and a title below it.
 *
 * **Performance**: Wrapped with React.memo to prevent unnecessary re-renders when props haven't changed.
 *
 * @component
 * @example
 * ```tsx
 * <QuickActionCard
 *   title="Free Tests"
 *   icon={Play}
 *   color="#10B981"
 *   onPress={() => router.push('/free-tests')}
 *   Colors={Colors}
 * />
 * ```
 *
 * @param {QuickActionCardProps} props - Component props
 * @returns {React.ReactElement} Rendered quick action card
 */
export const QuickActionCard = memo<QuickActionCardProps>(({
  title,
  icon: Icon,
  color,
  onPress,
  Colors
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.quickActionCard,
        {
          backgroundColor: Colors.cardBackground,
          shadowColor: Colors.shadow,
        }
      ]}
      onPress={onPress}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}20` }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={[styles.quickActionText, { color: Colors.textPrimary }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
});

QuickActionCard.displayName = 'QuickActionCard';

const styles = StyleSheet.create({
  quickActionCard: {
    width: '47%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
