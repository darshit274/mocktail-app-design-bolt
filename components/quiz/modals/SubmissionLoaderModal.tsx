/**
 * Submission Loader Modal
 * Created: 2025-01-11
 * Purpose: Shows loading indicator while quiz is being submitted
 */

import React, { memo } from 'react';
import { View, Text, Modal, ActivityIndicator } from 'react-native';
import { ThemeColors } from '@/types';
import { createModalStyles } from '@/styles/modalStyles';

interface SubmissionLoaderModalProps {
  visible: boolean;
  Colors: ThemeColors;
}

export const SubmissionLoaderModal = memo<SubmissionLoaderModalProps>(({ visible, Colors }) => {
  const styles = createModalStyles(Colors);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.modalTitle}>Submitting Quiz...</Text>
          <Text style={styles.modalDescription}>
            Please wait while we process your answers
          </Text>
        </View>
      </View>
    </Modal>
  );
});

SubmissionLoaderModal.displayName = 'SubmissionLoaderModal';
