/**
 * Subscription Required Modal
 * Created: 2025-01-17
 * Purpose: Stylish modal for locked content requiring subscription
 */

import React, { memo } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Lock, Crown, ArrowRight, X } from 'lucide-react-native';
import { ThemeColors } from '@/types';

interface SubscriptionRequiredModalProps {
  visible: boolean;
  testName?: string;
  seriesName?: string;
  onViewPlans: () => void;
  onCancel: () => void;
  Colors: ThemeColors;
}

export const SubscriptionRequiredModal = memo<SubscriptionRequiredModalProps>(({
  visible,
  testName,
  seriesName,
  onViewPlans,
  onCancel,
  Colors
}) => {
  const styles = createStyles(Colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onCancel}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Premium Icon with Gradient Effect */}
          <View style={styles.iconContainer}>
            <View style={styles.iconOuterCircle}>
              <View style={styles.iconInnerCircle}>
                <Crown size={40} color={Colors.warning} />
              </View>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.modalTitle}>Premium Content</Text>

          {/* Description */}
          <Text style={styles.modalDescription}>
            Subscribe to unlock unlimited access to all tests and features in this series.
          </Text>

          {/* Locked Content Badge */}
          {testName && (
            <View style={styles.lockedContentBadge}>
              <Lock size={14} color={Colors.textSecondary} />
              <Text style={styles.lockedContentText} numberOfLines={1}>
                {testName}
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText} numberOfLines={1}>Later</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onViewPlans}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText} numberOfLines={1}>View Plans</Text>
              <ArrowRight size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

SubscriptionRequiredModal.displayName = 'SubscriptionRequiredModal';

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  iconOuterCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  iconInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.warning,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  lockedContentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lockedContentText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    fontWeight: '500',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  primaryButton: {
    flex: 1.5,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
});
