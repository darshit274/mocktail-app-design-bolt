import React, { memo, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { Eye, EyeOff } from 'lucide-react-native';
import { ThemeColors } from '@/types';
import { createSolutionsStyles } from '@/styles/solutionsStyles';

interface ExplanationCardProps {
  explanation: string;
  showAllExplanation: boolean;
  showExplanation: boolean;
  onToggle: () => void;
  shouldShow: boolean; // Determines if button should be shown based on reattempt mode
  Colors: ThemeColors;
}

export const ExplanationCard = memo<ExplanationCardProps>(({
  explanation,
  showAllExplanation,
  showExplanation,
  onToggle,
  shouldShow,
  Colors
}) => {
  const styles = createSolutionsStyles(Colors);
  const { width } = useWindowDimensions();
  const [showCurrentExplanation, setCurrentShowExplanation] = useState(showAllExplanation || showExplanation)
  useEffect(() => {
    setCurrentShowExplanation(showAllExplanation || showExplanation)
  }, [showAllExplanation, showExplanation])
  if (!shouldShow) {
    return null;
  }
  const toggleExplanation = () => {
    if (showAllExplanation) {
      setCurrentShowExplanation(p => !p)
    } else {
      onToggle()
    }
  }
  // Preprocess explanation to ensure line breaks are properly formatted
  const formatExplanation = (text: string): string => {
    if (!text) return '<p>No explanation available.</p>';

    // If text already contains HTML tags, return as is
    if (/<[^>]+>/g.test(text)) {
      // Replace plain newlines with <br> tags if HTML exists
      return text.replace(/\n/g, '<br>');
    }

    // For plain text, convert newlines to proper HTML paragraphs
    const paragraphs = text.split(/\n\s*\n/); // Split on double newlines (blank lines)
    const formatted = paragraphs
      .map(para => {
        // Convert single newlines within paragraphs to <br>
        const withBreaks = para.replace(/\n/g, '<br>');
        return `<p>${withBreaks}</p>`;
      })
      .join('');

    return formatted || '<p>No explanation available.</p>';
  };

  return (
    <>
      {/* Show/Hide Explanation Button */}
      <TouchableOpacity style={styles.showAnswerButton} onPress={toggleExplanation}>
        {showCurrentExplanation ? (
          <EyeOff size={20} color={Colors.primary} />
        ) : (
          <Eye size={20} color={Colors.primary} />
        )}
        <Text style={styles.showAnswerText}>
          {showCurrentExplanation ? 'Hide Explanation' : 'Show Explanation'}
        </Text>
      </TouchableOpacity>

      {/* Explanation Content */}
      {showCurrentExplanation && (
        <View style={styles.explanationCard}>
          <Text style={styles.explanationTitle}>Explanation</Text>
          <RenderHTML
            contentWidth={width - 80}
            source={{ html: formatExplanation(explanation) }}
            tagsStyles={{
              body: {
                color: Colors.textPrimary,
                fontSize: 16,
                lineHeight: 24,
              },
              p: {
                marginBottom: 12,
                color: Colors.textPrimary,
              },
              br: {
                height: 8,
              },
              strong: {
                fontWeight: 'bold',
                color: Colors.text,
              },
              em: {
                fontStyle: 'italic',
              },
              ul: {
                marginLeft: 16,
              },
              ol: {
                marginLeft: 16,
              },
              li: {
                marginBottom: 4,
              },
              img: {
                maxWidth: '100%',
                height: 'auto',
              },
            }}
          />
        </View>
      )}
    </>
  );
});

ExplanationCard.displayName = 'ExplanationCard';
