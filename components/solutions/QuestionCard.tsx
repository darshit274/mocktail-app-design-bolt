import React, { memo } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { BookOpen, Clock, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, Flag } from 'lucide-react-native';
import { ThemeColors } from '@/types';
import { createSolutionsStyles } from '@/styles/solutionsStyles';
import { SolutionQuestion } from '@/hooks/solutions/useSolutionsData';
import { ReportQuestionButton } from './ReportQuestionButton';

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
        {/* Status Badges Container - Can show multiple badges */}
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', flex: 1, gap: 8 }}>
          {/* Main Answer Status Badge */}
          {answerStatus !== 'hidden' && (
            <View style={[
              styles.answerStatusBadge,
              {
                backgroundColor: answerStatus === 'correct'
                  ? Colors.success
                  : answerStatus === 'incorrect'
                  ? Colors.danger
                  : Colors.warning,  // ✅ FIXED: Show warning color for unanswered
              }
            ]}>
              <View style={styles.answerStatusContent}>
                {getStatusIcon(answerStatus)}
                <Text style={styles.answerStatusText}>
                  {getStatusText(answerStatus)}
                </Text>
              </View>
            </View>
          )}

          {/* Marked for Review Badge */}
          {question.isMarkedForReview && (
            <View style={[
              styles.answerStatusBadge,
              {
                backgroundColor: Colors.info || '#3B82F6',  // Blue color for marked
              }
            ]}>
              <View style={styles.answerStatusContent}>
                <Flag size={16} color="#FFFFFF" />
                <Text style={styles.answerStatusText}>
                  Marked for Review
                </Text>
              </View>
            </View>
          )}
        </View>
        <ReportQuestionButton questionId={question.id} Colors={Colors} />
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
    </View>
  );
});

QuestionCard.displayName = 'QuestionCard';
