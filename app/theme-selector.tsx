import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ArrowLeft, Check } from 'lucide-react-native';
import { ThemeOptions, getTheme, ThemeType } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeSelectorScreen() {
  const { theme: currentThemeType, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>(currentThemeType || 'light');
  const Colors = getTheme(selectedTheme);

  const handleThemeSelect = (themeType: ThemeType) => {
    setSelectedTheme(themeType);
    setTheme(themeType);
    Alert.alert(
      'Theme Changed',
      'Your app theme has been updated successfully!',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const renderColorPreview = (colors: { primary: string; accent: string; background: string }) => (
    <View style={styles.colorPreview}>
      <View style={[styles.colorDot, { backgroundColor: colors.primary }]} />
      <View style={[styles.colorDot, { backgroundColor: colors.accent }]} />
      <View style={[styles.colorDot, { backgroundColor: colors.background, borderWidth: 1, borderColor: '#E5E7EB' }]} />
    </View>
  );

  const renderPreviewCard = (themeColors: any) => (
    <View style={[styles.previewCard, { backgroundColor: themeColors.cardBackground }]}>
      <View style={[styles.previewHeader, { backgroundColor: themeColors.primary }]}>
        <Ionicons name="school" size={20} color={themeColors.white} />
        <Text style={[styles.previewHeaderText, { color: themeColors.white }]}>
          Mocktail Academy
        </Text>
      </View>
      
      <View style={[styles.previewContent, { backgroundColor: themeColors.cardBackground }]}>
        <Text style={[styles.previewTitle, { color: themeColors.textPrimary }]}>
          Dashboard Preview
        </Text>
        <Text style={[styles.previewSubtitle, { color: themeColors.textSubtle }]}>
          See how your app looks
        </Text>
        
        <View style={styles.previewStats}>
          <View style={[styles.statItem, { backgroundColor: themeColors.background }]}>
            <Text style={[styles.statNumber, { color: themeColors.primary }]}>85%</Text>
            <Text style={[styles.statLabel, { color: themeColors.textSubtle }]}>Score</Text>
          </View>
          
          <View style={[styles.statItem, { backgroundColor: themeColors.background }]}>
            <Text style={[styles.statNumber, { color: themeColors.accent }]}>24</Text>
            <Text style={[styles.statLabel, { color: themeColors.textSubtle }]}>Tests</Text>
          </View>
        </View>
        
        <View style={[styles.previewButton, { backgroundColor: themeColors.accent }]}>
          <Text style={[styles.previewButtonText, { color: themeColors.white }]}>
            Start Test
          </Text>
          <Ionicons name="arrow-forward" size={14} color={themeColors.white} />
        </View>
      </View>
    </View>
  );

  const styles = getStyles(Colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Theme</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.subtitle}>
            🎨 Select a color scheme that suits your style
          </Text>

          {ThemeOptions.map((option) => {
            const isSelected = selectedTheme === option.id;
            const optionTheme = getTheme(option.id);
            
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => handleThemeSelect(option.id)}
                style={[
                  styles.themeCard,
                  {
                    borderColor: isSelected ? Colors.primary : Colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  }
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.themeHeader}>
                  <View style={styles.themeInfo}>
                    <Text style={styles.themeName}>
                      {option.name}
                    </Text>
                    <Text style={styles.themeDescription}>
                      {option.description}
                    </Text>
                  </View>
                  
                  <View style={styles.themeRight}>
                    {renderColorPreview(option.preview)}
                    {isSelected && (
                      <View style={[styles.selectedBadge, { backgroundColor: Colors.primary }]}>
                        <Check size={12} color={Colors.white} />
                      </View>
                    )}
                  </View>
                </View>
                
                {/* Live Preview */}
                <View style={styles.previewContainer}>
                  {renderPreviewCard(optionTheme)}
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Your selected theme will be applied immediately and saved for future use.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.cardBackground,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSubtle,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  themeCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 14,
    color: Colors.textSubtle,
  },
  themeRight: {
    alignItems: 'center',
    position: 'relative',
  },
  colorPreview: {
    flexDirection: 'row',
    gap: 8,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContainer: {
    marginTop: 8,
  },
  previewCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  previewHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewContent: {
    padding: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  previewStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  previewButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSubtle,
    textAlign: 'center',
    lineHeight: 18,
  },
});