import React, { memo } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { BookOpen, Clock, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import { ThemeColors } from '@/types';
import { createSolutionsStyles } from '@/styles/solutionsStyles';
import { SolutionQuestion } from '@/hooks/solutions/useSolutionsData';

interface QuestionCardProps {
  question: SolutionQuestion;
  answerStatus: string;
  getStatusIcon: (status: string) => JSX.Element | null;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  formatTime: (seconds: number) => string;
  Colors: ThemeColors;
}

export const QuestionCard = memo<QuestionCardProps>(({
  question,
  answerStatus,
  getStatusIcon,
  getStatusColor,
  getStatusText,
  formatTime,
  Colors
}) => {
  const styles = createSolutionsStyles(Colors);
  const { width } = useWindowDimensions();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return Colors.badgeSuccessBg;
      case 'Medium':
        return Colors.premiumBadge;
      case 'Hard':
        return Colors.badgeDangerBg;
      default:
        return Colors.badgeSuccessBg;
    }
  };

  const getDifficultyTextColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return Colors.success;
      case 'Medium':
        return Colors.premiumText;
      case 'Hard':
        return Colors.danger;
      default:
        return Colors.success;
    }
  };

  return (
    <View style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <View style={styles.questionMeta}>
          <View style={styles.subjectBadge}>
            <BookOpen size={12} color={Colors.primary} />
            <Text style={styles.subjectText}>{question.subject}</Text>
          </View>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(question.difficulty) }
            ]}
          >
            <Text
              style={[
                styles.difficultyText,
                { color: getDifficultyTextColor(question.difficulty) }
              ]}
            >
              {question.difficulty}
            </Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          {getStatusIcon(answerStatus)}
          <Text style={[styles.statusText, { color: getStatusColor(answerStatus) }]}>
            {getStatusText(answerStatus)}
          </Text>
        </View>
      </View>

      <RenderHTML
        contentWidth={width - 80}
        source={{ html: question.question || '<p>No question available</p>' }}
        tagsStyles={{
          body: {
            color: Colors.textPrimary,
            fontSize: 18,
            lineHeight: 26,
            margin: 0,
            padding: 0,
          },
          p: {
            marginBottom: 8,
            color: Colors.textPrimary,
          },
          img: {
            maxWidth: '100%',
            height: 'auto',
          },
          strong: {
            fontWeight: 'bold',
          },
          em: {
            fontStyle: 'italic',
          },
        }}
      />

      <View style={styles.timeContainer}>
        <Clock size={14} color={Colors.textSubtle} />
        <Text style={styles.timeText}>
          Time spent:{' '}
          {question.timeSpent > 0 ? formatTime(question.timeSpent) : 'Not attempted'}
        </Text>
      </View>
    </View>
  );
});

QuestionCard.displayName = 'QuestionCard';
