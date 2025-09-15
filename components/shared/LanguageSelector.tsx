import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Globe, Check } from 'lucide-react-native';
import { getTheme, ThemeColors } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { availableLanguages, Language } from '@/i18n';

interface LanguageSelectorProps {
  showIcon?: boolean;
  showText?: boolean;
  style?: any;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  showIcon = true,
  showText = true,
  style,
}) => {
  const { theme } = useTheme();
  const Colors = getTheme(theme);
  const { language, setLanguage, t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);

  // Safety check to prevent crashes
  if (!Colors || typeof Colors !== 'object') {
    return null;
  }

  const styles = getStyles(Colors);

  const currentLanguage = availableLanguages.find(lang => lang.code === language);

  const handleLanguageSelect = (langCode: Language) => {
    setLanguage(langCode);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.selectorButton, style]}
        onPress={() => setModalVisible(true)}
      >
        {showIcon && <Globe size={20} color={Colors.textSubtle} />}
        {showText && (
          <Text style={[styles.selectorText, showIcon && { marginLeft: 8 }]}>
            {currentLanguage?.nativeName || 'English'}
          </Text>
        )}
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.profile.language}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>{t.common.close}</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableLanguages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    language === item.code && styles.selectedLanguageItem,
                  ]}
                  onPress={() => handleLanguageSelect(item.code as Language)}
                >
                  <View style={styles.languageInfo}>
                    <Text style={[
                      styles.languageName,
                      language === item.code && styles.selectedLanguageText,
                    ]}>
                      {item.nativeName}
                    </Text>
                    <Text style={styles.languageCode}>{item.name}</Text>
                  </View>
                  {language === item.code && (
                    <Check size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const getStyles = (Colors: ThemeColors) => {
  // Provide fallback colors to prevent crashes
  const safeColors = {
    light: Colors?.light || '#f5f5f5',
    textPrimary: Colors?.textPrimary || '#000000',
    textSubtle: Colors?.textSubtle || '#666666',
    cardBackground: Colors?.cardBackground || '#ffffff',
    primary: Colors?.primary || '#007AFF',
    muted: Colors?.muted || '#e0e0e0',
    chip: Colors?.chip || '#f0f0f0',
    ...Colors
  };

  return StyleSheet.create({
    selectorButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: safeColors.light,
      borderRadius: 8,
    },
    selectorText: {
      fontSize: 14,
      color: safeColors.textPrimary,
      fontWeight: '500',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: safeColors.cardBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 20,
      paddingBottom: 34,
      maxHeight: '50%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: safeColors.textPrimary,
    },
    closeButton: {
      fontSize: 16,
      color: safeColors.primary,
      fontWeight: '500',
    },
    languageItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
    },
    selectedLanguageItem: {
      backgroundColor: safeColors.chip || safeColors.light,
    },
    languageInfo: {
      flex: 1,
    },
    languageName: {
      fontSize: 16,
      fontWeight: '500',
      color: safeColors.textPrimary,
      marginBottom: 2,
    },
    selectedLanguageText: {
      color: safeColors.primary,
    },
    languageCode: {
      fontSize: 14,
      color: safeColors.textSubtle || safeColors.textPrimary,
    },
    separator: {
      height: 1,
      backgroundColor: safeColors.muted,
      marginHorizontal: 20,
    },
  });
};