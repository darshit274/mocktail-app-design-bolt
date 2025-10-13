/**
 * Modal Styles
 * Created: 2025-01-11
 * Purpose: Shared modal styles for all quiz modals
 */

import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/types';

export const createModalStyles = (Colors: ThemeColors) => StyleSheet.create({
  // Modal Container
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },

  // Modal Header
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },

  // Modal Buttons
  modalButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  modalPrimaryButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalPrimaryButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.white,
  },

  // Content Containers
  modalRulesContainer: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  modalRule: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modalRuleBullet: {
    fontSize: 16,
    color: Colors.text,
    marginRight: 8,
    fontWeight: 'bold',
  },
  modalRuleText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  modalRuleHighlight: {
    fontWeight: 'bold',
    color: Colors.success,
  },

  // Tips Section
  modalTipsContainer: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  modalTipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  modalTipsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },

  // Language Selection
  languageButtonsContainer: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 24,
    marginTop: 16,
  },
  languageButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageButtonSelected: {
    borderColor: Colors.primary,
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Submit Confirmation Stats
  submitStatsContainer: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  submitStatItem: {
    alignItems: 'center',
  },
  submitStatsGrid: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  submitStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  submitStatIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitStatLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  submitStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
});
