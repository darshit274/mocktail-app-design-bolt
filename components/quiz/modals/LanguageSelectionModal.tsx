/**
 * Language Selection Modal
 * Created: 2025-01-11
 * Purpose: Allows user to select quiz language before starting
 */

import React, { memo } from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { ThemeColors, QuizLanguage } from '@/types';
import { createModalStyles } from '@/styles/modalStyles';

interface LanguageSelectionModalProps {
  visible: boolean;
  selectedLanguage: QuizLanguage;
  onSelectLanguage: (language: QuizLanguage) => void;
  onCancel: () => void;
  onContinue: () => void;
  Colors: ThemeColors;
}

export const LanguageSelectionModal = memo<LanguageSelectionModalProps>(({
  visible,
  selectedLanguage,
  onSelectLanguage,
  onCancel,
  onContinue,
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
          {/* Title */}
          <Text style={styles.modalTitle}>Choose Language / ભાષા પસંદ કરો</Text>

          {/* Description */}
          <Text style={styles.modalDescription}>
            Select your preferred language for the quiz
          </Text>

          {/* Language Buttons */}
          <View style={styles.languageButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                selectedLanguage === 'gujarati' && styles.languageButtonSelected,
                {
                  backgroundColor:
                    selectedLanguage === 'gujarati'
                      ? Colors.primary
                      : Colors.backgroundSecondary,
                },
              ]}
              onPress={() => onSelectLanguage('gujarati')}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  {
                    color:
                      selectedLanguage === 'gujarati'
                        ? Colors.white
                        : Colors.textPrimary,
                  },
                ]}
              >
                ગુજરાતી (Gujarati)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.languageButton,
                selectedLanguage === 'english' && styles.languageButtonSelected,
                {
                  backgroundColor:
                    selectedLanguage === 'english'
                      ? Colors.primary
                      : Colors.backgroundSecondary,
                },
              ]}
              onPress={() => onSelectLanguage('english')}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  {
                    color:
                      selectedLanguage === 'english'
                        ? Colors.white
                        : Colors.textPrimary,
                  },
                ]}
              >
                English
              </Text>
            </TouchableOpacity>
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
              onPress={onContinue}
            >
              <Text style={styles.modalPrimaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

LanguageSelectionModal.displayName = 'LanguageSelectionModal';
