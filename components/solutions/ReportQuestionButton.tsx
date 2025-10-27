import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Flag } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors } from '@/types';
import { API_CONFIG, AUTH_CONFIG } from '@/config/constants';
import { ReportQuestionModal, ReportType } from './ReportQuestionModal';

interface ReportQuestionButtonProps {
  questionId: number;
  Colors: ThemeColors;
}

export const ReportQuestionButton: React.FC<ReportQuestionButtonProps> = ({
  questionId,
  Colors,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleReportSubmit = async (
    reportType: ReportType,
    reportText?: string
  ) => {
    try {
      // Get auth token
      const token = await AsyncStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Authentication Required',
          text2: 'Please log in to report a question',
        });
        return;
      }

      // Submit report to backend
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/questions/${questionId}/report`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reportType,
            reportText: reportText || null,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        Toast.show({
          type: 'success',
          text1: 'Report Submitted',
          text2: 'Thank you for helping us improve!',
        });
        setModalVisible(false);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Report Failed',
          text2: data.message || 'Unable to submit your report',
        });
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Please check your connection and try again',
      });
    }
  };

  const styles = createStyles(Colors);

  return (
    <>
      <TouchableOpacity
        style={styles.reportButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Flag size={16} color={Colors.textSecondary} />
        <Text style={styles.reportButtonText}>Report Issue</Text>
      </TouchableOpacity>

      <ReportQuestionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleReportSubmit}
        Colors={Colors}
      />
    </>
  );
};

const createStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    reportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
    },
    reportButtonText: {
      fontSize: 13,
      color: Colors.textSecondary,
      fontWeight: '500',
    },
  });
