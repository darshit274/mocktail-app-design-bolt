/**
 * Submit Confirmation Modal
 * Created: 2025-01-11
 * Purpose: Confirms quiz submission with stats summary
 */

import React, { memo } from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Clock, CheckCircle, Circle, Flag } from 'lucide-react-native';
import { ThemeColors } from '@/types';
import { createModalStyles } from '@/styles/modalStyles';

interface SubmitConfirmationModalProps {
  visible: boolean;
  answeredCount: number;
  totalQuestions: number;
  flaggedCount: number;
  timeLeft: string;
  onCancel: () => void;
  onConfirm: () => void;
  Colors: ThemeColors;
}

export const SubmitConfirmationModal = memo<SubmitConfirmationModalProps>(({
  visible,
  answeredCount,
  totalQuestions,
  flaggedCount,
  timeLeft,
  onCancel,
  onConfirm,
  Colors
}) => {
  const styles = createModalStyles(Colors);
  const unattemptedCount = totalQuestions - answeredCount;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Stats Grid */}
          <View style={styles.submitStatsGrid}>
            {/* Time Left */}
            <View style={styles.submitStatRow}>
              <View style={styles.submitStatIconLabel}>
                <Clock size={20} color={Colors.primary} />
                <Text style={styles.submitStatLabel}>Time Left</Text>
              </View>
              <Text style={styles.submitStatValue}>{timeLeft}</Text>
            </View>

            {/* Attempted */}
            <View style={styles.submitStatRow}>
              <View style={styles.submitStatIconLabel}>
                <CheckCircle size={20} color={Colors.success} />
                <Text style={styles.submitStatLabel}>Attempted</Text>
              </View>
              <Text style={styles.submitStatValue}>{answeredCount}</Text>
            </View>

            {/* Unattempted */}
            <View style={styles.submitStatRow}>
              <View style={styles.submitStatIconLabel}>
                <Circle size={20} color={Colors.textSecondary} />
                <Text style={styles.submitStatLabel}>Unattempted</Text>
              </View>
              <Text style={styles.submitStatValue}>{unattemptedCount}</Text>
            </View>

            {/* Marked */}
            <View style={[styles.submitStatRow, { borderBottomWidth: 0 }]}>
              <View style={styles.submitStatIconLabel}>
                <Flag size={20} color={Colors.warning} />
                <Text style={styles.submitStatLabel}>Marked</Text>
              </View>
              <Text style={styles.submitStatValue}>{flaggedCount}</Text>
            </View>
          </View>

          {/* Confirmation Text */}
          <Text style={styles.modalDescription}>
            Are you sure you want to submit the test?
          </Text>

          {/* Buttons */}
          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={onCancel}
            >
              <Text style={styles.modalCancelButtonText}>No</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={onConfirm}
            >
              <Text style={styles.modalPrimaryButtonText}>Yes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

SubmitConfirmationModal.displayName = 'SubmitConfirmationModal';
