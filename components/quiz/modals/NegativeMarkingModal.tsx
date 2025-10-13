/**
 * Negative Marking Warning Modal
 * Created: 2025-01-11
 * Purpose: Warns user about negative marking before quiz starts
 */

import React, { memo } from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { ThemeColors } from '@/types';
import { createModalStyles } from '@/styles/modalStyles';

interface NegativeMarkingModalProps {
  visible: boolean;
  negativeMarksPerWrong: number;
  onCancel: () => void;
  onStart: () => void;
  Colors: ThemeColors;
}

export const NegativeMarkingModal = memo<NegativeMarkingModalProps>(({
  visible,
  negativeMarksPerWrong,
  onCancel,
  onStart,
  Colors
}) => {
  const styles = createModalStyles(Colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Warning Icon */}
          <View style={styles.modalIconContainer}>
            <AlertTriangle size={48} color={Colors.warning} />
          </View>

          {/* Title */}
          <Text style={styles.modalTitle}>Negative Marking Enabled!</Text>

          {/* Description */}
          <Text style={styles.modalDescription}>
            This quiz has negative marking. Please read the rules carefully:
          </Text>

          {/* Rules */}
          <View style={styles.modalRulesContainer}>
            <View style={styles.modalRule}>
              <Text style={styles.modalRuleBullet}>•</Text>
              <Text style={styles.modalRuleText}>
                Correct answer: <Text style={styles.modalRuleHighlight}>+1 mark</Text>
              </Text>
            </View>
            <View style={styles.modalRule}>
              <Text style={styles.modalRuleBullet}>•</Text>
              <Text style={styles.modalRuleText}>
                Wrong answer:{' '}
                <Text style={[styles.modalRuleHighlight, { color: Colors.error }]}>
                  -{negativeMarksPerWrong} marks
                </Text>
              </Text>
            </View>
            <View style={styles.modalRule}>
              <Text style={styles.modalRuleBullet}>•</Text>
              <Text style={styles.modalRuleText}>
                Unanswered: <Text style={styles.modalRuleHighlight}>No penalty</Text>
              </Text>
            </View>
          </View>

          {/* Tips */}
          <View style={styles.modalTipsContainer}>
            <Text style={styles.modalTipsTitle}>💡 Tips:</Text>
            <Text style={styles.modalTipsText}>
              • Only answer questions you are confident about
            </Text>
            <Text style={styles.modalTipsText}>
              • Skip questions if you're not sure
            </Text>
            <Text style={styles.modalTipsText}>
              • Review your answers before submitting
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={onCancel}
            >
              <Text style={styles.modalCancelButtonText}>Go Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={onStart}
            >
              <Text style={styles.modalPrimaryButtonText}>
                I Understand, Start Quiz
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

NegativeMarkingModal.displayName = 'NegativeMarkingModal';
