import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeOptions, getTheme, ThemeType, ThemeColors } from '../theme';

interface ThemeDemoProps {
  onThemeSelect?: (themeType: ThemeType) => void;
  currentTheme?: ThemeType;
}

export const ThemeDemo: React.FC<ThemeDemoProps> = ({ 
  onThemeSelect,
  currentTheme = 'light' 
}) => {
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>(currentTheme);
  const theme = getTheme(selectedTheme);

  const handleThemeChange = (themeType: ThemeType) => {
    setSelectedTheme(themeType);
    onThemeSelect?.(themeType);
  };

  const showThemeInfo = (themeName: string, description: string) => {
    Alert.alert(themeName, description);
  };

  const renderPreviewCard = (colors: ThemeColors) => (
    <View style={[styles.previewCard, { backgroundColor: colors.cardBackground }]}>
      <View style={[styles.previewHeader, { backgroundColor: colors.primary }]}>
        <Ionicons name="school" size={24} color={colors.white} />
        <Text style={[styles.previewHeaderText, { color: colors.white }]}>
          Mocktail Academy
        </Text>
      </View>
      
      <View style={styles.previewContent}>
        <Text style={[styles.previewTitle, { color: colors.textPrimary }]}>
          Dashboard Preview
        </Text>
        <Text style={[styles.previewSubtitle, { color: colors.textSubtle }]}>
          See how your app looks
        </Text>
        
        <View style={styles.previewStats}>
          <View style={[styles.statItem, { backgroundColor: colors.background }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>85%</Text>
            <Text style={[styles.statLabel, { color: colors.textSubtle }]}>Score</Text>
          </View>
          
          <View style={[styles.statItem, { backgroundColor: colors.background }]}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>24</Text>
            <Text style={[styles.statLabel, { color: colors.textSubtle }]}>Tests</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.previewButton, { backgroundColor: colors.accent }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.previewButtonText, { color: colors.white }]}>
            Start Test
          </Text>
          <Ionicons name="arrow-forward" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          🎨 Choose Your Theme
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSubtle }]}>
          Select a color scheme for your app
        </Text>
      </View>

      {ThemeOptions.map((option) => {
        const isSelected = selectedTheme === option.id;
        const optionTheme = getTheme(option.id);
        
        return (
          <View key={option.id} style={styles.themeOption}>
            <TouchableOpacity
              onPress={() => handleThemeChange(option.id)}
              style={[
                styles.themeCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: isSelected ? theme.primary : theme.border,
                  borderWidth: isSelected ? 2 : 1,
                }
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.themeHeader}>
                <View style={styles.themeInfo}>
                  <Text style={[styles.themeName, { color: theme.textPrimary }]}>
                    {option.name}
                  </Text>
                  <Text style={[styles.themeDescription, { color: theme.textSubtle }]}>
                    {option.description}
                  </Text>
                </View>
                
                <View style={styles.colorPreview}>
                  <View 
                    style={[styles.colorDot, { backgroundColor: option.preview.primary }]} 
                  />
                  <View 
                    style={[styles.colorDot, { backgroundColor: option.preview.accent }]} 
                  />
                  <View 
                    style={[styles.colorDot, { backgroundColor: option.preview.background }]} 
                  />
                </View>
              </View>
              
              {renderPreviewCard(optionTheme)}
              
              {isSelected && (
                <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
                  <Ionicons name="checkmark" size={16} color={theme.white} />
                  <Text style={[styles.selectedText, { color: theme.white }]}>
                    Selected
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        );
      })}

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.textSubtle }]}>
          Tap any theme to preview it instantly
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  themeOption: {
    marginBottom: 16,
  },
  themeCard: {
    borderRadius: 12,
    padding: 16,
    position: 'relative',
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
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 14,
  },
  colorPreview: {
    flexDirection: 'row',
    gap: 6,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
  },
  previewCard: {
    borderRadius: 8,
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
    fontSize: 16,
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
    borderRadius: 6,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
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
    borderRadius: 6,
    gap: 6,
  },
  previewButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  selectedText: {
    fontSize: 10,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default ThemeDemo;