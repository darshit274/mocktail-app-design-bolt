import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { X, AlertTriangle } from 'lucide-react-native';
import { ThemeColors } from '@/types';

export type ReportType = 'wrong_question' | 'wrong_solution' | 'other';

interface ReportQuestionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reportType: ReportType, reportText?: string) => Promise<void>;
  Colors: ThemeColors;
}

export const ReportQuestionModal: React.FC<ReportQuestionModalProps> = ({
  visible,
  onClose,
  onSubmit,
  Colors,
}) => {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [reportText, setReportText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedType(null);
      setReportText('');
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!selectedType) return;

    setIsSubmitting(true);
    try {
      await onSubmit(selectedType, reportText || undefined);
      handleClose();
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reportOptions = [
    {
      type: 'wrong_question' as ReportType,
      label: 'Wrong Question',
      description: 'The question itself is incorrect or unclear',
    },
    {
      type: 'wrong_solution' as ReportType,
      label: 'Wrong Solution',
      description: 'The answer or explanation is incorrect',
    },
    {
      type: 'other' as ReportType,
      label: 'Other Issue',
      description: 'Report any other problem with this question',
    },
  ];

  const styles = createStyles(Colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContainer}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <View style={styles.iconContainer}>
                    <AlertTriangle size={24} color={Colors.warning} />
                  </View>
                  <Text style={styles.title}>Report Question</Text>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  disabled={isSubmitting}
                >
                  <X size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Description */}
              <Text style={styles.description}>
                Help us improve by reporting any issues you find with this question.
              </Text>

              {/* Report Type Options */}
              <View style={styles.optionsContainer}>
                {reportOptions.map((option) => (
                  <TouchableOpacity
                    key={option.type}
                    style={[
                      styles.optionCard,
                      selectedType === option.type && styles.optionCardSelected,
                    ]}
                    onPress={() => setSelectedType(option.type)}
                    disabled={isSubmitting}
                  >
                    <View
                      style={[
                        styles.radioButton,
                        selectedType === option.type && styles.radioButtonSelected,
                      ]}
                    >
                      {selectedType === option.type && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionLabel}>{option.label}</Text>
                      <Text style={styles.optionDescription}>
                        {option.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Additional Comments (Optional) */}
              {selectedType && (
                <View style={styles.textInputContainer}>
                  <Text style={styles.textInputLabel}>
                    Additional Details {selectedType !== 'other' && '(Optional)'}
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Provide more details about the issue..."
                    placeholderTextColor={Colors.textSecondary}
                    value={reportText}
                    onChangeText={setReportText}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    editable={!isSubmitting}
                  />
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleClose}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.submitButton,
                    (!selectedType || isSubmitting) && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!selectedType || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Report</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: Colors.background,
      borderRadius: 16,
      width: '90%',
      maxWidth: 500,
      maxHeight: '85%',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    scrollContent: {
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    headerContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.warningBackground || '#FFF3CD',
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors.textPrimary,
      flex: 1,
    },
    closeButton: {
      padding: 4,
    },
    description: {
      fontSize: 14,
      color: Colors.textSecondary,
      marginBottom: 20,
      lineHeight: 20,
    },
    optionsContainer: {
      gap: 12,
      marginBottom: 20,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      gap: 12,
    },
    optionCardSelected: {
      borderColor: Colors.primary,
      backgroundColor: Colors.primaryLight || Colors.primary + '10',
    },
    radioButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: Colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 2,
    },
    radioButtonSelected: {
      borderColor: Colors.primary,
    },
    radioButtonInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: Colors.primary,
    },
    optionContent: {
      flex: 1,
    },
    optionLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.textPrimary,
      marginBottom: 4,
    },
    optionDescription: {
      fontSize: 13,
      color: Colors.textSecondary,
      lineHeight: 18,
    },
    textInputContainer: {
      marginBottom: 20,
    },
    textInputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.textPrimary,
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 12,
      padding: 12,
      fontSize: 14,
      color: Colors.textPrimary,
      backgroundColor: Colors.surface,
      minHeight: 100,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.textPrimary,
    },
    submitButton: {
      backgroundColor: Colors.primary,
    },
    submitButtonDisabled: {
      backgroundColor: Colors.textSecondary,
      opacity: 0.5,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
