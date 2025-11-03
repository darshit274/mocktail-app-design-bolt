/**
 * Quiz Component Styles
 * Created: 2025-01-11
 * Purpose: Shared styles for quiz UI components
 */

import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/types';

export const createQuizStyles = (Colors: ThemeColors) => StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Timer
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 4,
  },
  timerWarning: {
    color: Colors.error,
  },

  // Progress
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundSecondary,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Question
  questionContainer: {
    paddingVertical: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  questionText: {
    fontSize: 18,
    lineHeight: 26,
    color: Colors.text,
  },

  // Options
  optionsContainer: {
    paddingBottom: 20,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight || Colors.backgroundSecondary,
  },
  optionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionCircleSelected: {
    backgroundColor: Colors.primary,
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  optionLetterSelected: {
    color: Colors.white,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    lineHeight: 22,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '500',
  },

  // Navigation
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  navButtonTextDisabled: {
    color: Colors.textSecondary,
  },

  // Submit Button
  submitButton: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.primary,
    minWidth: 120,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonContent: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Grid Button
  gridButton: {
    padding: 8,
  },

  // Grid Container
  gridContainer: {
    flex: 1,
    padding: 20,
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gridTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  gridClose: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Language Selector
  languageSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.light,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: Colors.primary,
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSubtle,
  },
  languageButtonTextActive: {
    color: Colors.white,
  },

  // Grid Legend
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },

  // Grid Submit Button
  gridSubmitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  gridSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },

  // Grid Scroll View
  gridScrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginHorizontal: -4,
  },
  gridItem: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  gridItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  gridItemTextCurrent: {
    color: Colors.white,
    fontWeight: 'bold',
  },

  // Loading & Error States
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
