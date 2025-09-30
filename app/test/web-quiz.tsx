import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Flag, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useSubmitQuizWebMutation,
  useGetDynamicQuestionsWebQuery,
} from '@/store/api/webCompatibleApi';

export default function WebQuizScreen() {
  console.log('🌐 Web Quiz Screen Component Mounted');
  const params = useLocalSearchParams();
  console.log('🌐 Raw params from router:', params);

  const { categoryUuid, categoryName, seriesUuid, language } = params;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: 'A' | 'B' | 'C' | 'D' }>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(3600); // 60 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { theme } = useTheme();
  const Colors = getTheme(theme);
  const { t } = useLanguage();
  const styles = getStyles(Colors);

  // Get auth state
  const { user } = useSelector((state: RootState) => state.auth);

  // Web API hooks
  const [submitQuizWeb, { isLoading: submittingWebQuiz }] = useSubmitQuizWebMutation();

  // Fetch questions using web API
  const {
    data: questionsData,
    isLoading: loadingQuestions,
    error: questionsError,
  } = useGetDynamicQuestionsWebQuery(
    {
      categoryUuid: categoryUuid as string,
      language: 'english',
      shuffle: true
    },
    { skip: !categoryUuid }
  );

  // Debug questionsData structure
  if (questionsData) {
    console.log('🌐 Questions data structure:', {
      success: questionsData.success,
      questionsCount: questionsData.data?.questions?.length || 0,
      category: questionsData.data?.category,
      firstQuestion: questionsData.data?.questions?.[0],
      allFields: Object.keys(questions[0] || {})
    });
  }

  // Load questions when data arrives
  useEffect(() => {
    if (questionsData?.success && questionsData.data.questions) {
      console.log('🌐 Loading questions from WEB API');
      const questionsList = questionsData.data.questions;
      setQuestions(questionsList);
      console.log('✅ Web Quiz initialized with', questionsList.length, 'questions');
    }
  }, [questionsData]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0 && questions.length > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitQuiz(); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, questions.length]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionId: string, option: 'A' | 'B' | 'C' | 'D') => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleFlagQuestion = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSubmitQuiz = async () => {
    console.log('🌐 Submit Quiz clicked');

    if (!user?.uuid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!seriesUuid) {
      Alert.alert('Error', 'Series UUID not found');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('🌐 Submitting quiz using WEB API');

      // Prepare answers in web API format
      const webApiAnswers = questions.map((question) => {
        const selectedAnswer = selectedAnswers[question.id];
        const correctAnswer = question.correct_answer;
        const isMarkedForReview = flaggedQuestions.has(question.id.toString());

        return {
          questionId: question.id,
          selectedOption: selectedAnswer || null,
          isCorrect: selectedAnswer === correctAnswer,
          timeSpent: 30,
          isMarkedForReview: isMarkedForReview
        };
      });

      const markedForReviewCount = flaggedQuestions.size;

      console.log('🌐 Submitting with params:', {
        userId: user.uuid,
        testSeriesId: seriesUuid,
        answersCount: webApiAnswers.length,
        totalTimeSpent: 3600 - timeRemaining,
        markedForReviewCount: markedForReviewCount
      });

      // Submit using WEB API
      const result = await submitQuizWeb({
        userId: user.uuid,
        testSeriesId: seriesUuid as string,
        answers: webApiAnswers,
        totalTimeSpent: 3600 - timeRemaining,
        markedForReviewCount: markedForReviewCount
      }).unwrap();

      console.log('✅ Web Quiz submission successful:', result.data);

      // Navigate to results
      const percentage = result.data.percentage || 0;
      const passed = percentage >= 50;

      router.replace({
        pathname: '/test/results',
        params: {
          sessionId: result.data.leaderboardEntryId?.toString() || 'web-quiz',
          score: result.data.score.toString(),
          percentage: result.data.percentage.toString(),
          passed: passed.toString(),
          correctAnswers: result.data.correctAnswers.toString(),
          wrongAnswers: (result.data.totalQuestions - result.data.correctAnswers).toString(),
          unanswered: '0',
          testTitle: categoryName || 'Quiz',
          categoryUuid: categoryUuid,
          categoryName: categoryName,
          seriesUuid: seriesUuid,
        }
      });
    } catch (error) {
      console.error('❌ Web Quiz submission failed:', error);
      Alert.alert('Error', 'Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loadingQuestions) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (questionsError || !questionsData?.success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load questions</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // No questions available
  if (!questions.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No questions available</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestionData = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName || 'Quiz'}</Text>
        <View style={styles.timerContainer}>
          <Clock size={16} color={timeRemaining < 300 ? Colors.error : Colors.primary} />
          <Text style={[styles.timerText, timeRemaining < 300 && styles.timerWarning]}>
            {formatTime(timeRemaining)}
          </Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentQuestion + 1) / questions.length) * 100}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentQuestion + 1} of {questions.length}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Question */}
        <View style={styles.questionContainer}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionNumber}>Q{currentQuestion + 1}.</Text>
            <TouchableOpacity onPress={() => handleFlagQuestion(currentQuestionData.id.toString())}>
              <Flag
                size={20}
                color={flaggedQuestions.has(currentQuestionData.id.toString()) ? Colors.warning : Colors.textSecondary}
                fill={flaggedQuestions.has(currentQuestionData.id.toString()) ? Colors.warning : 'none'}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.questionText}>
            {currentQuestionData.question_text}
          </Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {['A', 'B', 'C', 'D'].map((option) => {
            const isSelected = selectedAnswers[currentQuestionData.id] === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.optionContainer, isSelected && styles.optionSelected]}
                onPress={() => handleAnswerSelect(currentQuestionData.id.toString(), option as 'A' | 'B' | 'C' | 'D')}
              >
                <View style={[styles.optionCircle, isSelected && styles.optionCircleSelected]}>
                  <Text style={[styles.optionLetter, isSelected && styles.optionLetterSelected]}>
                    {option}
                  </Text>
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {currentQuestionData.options?.[option] || `Option ${option}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, currentQuestion === 0 && styles.navButtonDisabled]}
          onPress={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
        >
          <ChevronLeft size={16} color={currentQuestion === 0 ? Colors.textSecondary : Colors.text} />
          <Text style={[styles.navButtonText, currentQuestion === 0 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>

        {isLastQuestion ? (
          <TouchableOpacity
            style={[styles.submitButton, (isSubmitting || submittingWebQuiz) && styles.submitButtonDisabled]}
            onPress={handleSubmitQuiz}
            disabled={isSubmitting || submittingWebQuiz}
          >
            <View style={styles.submitButtonContent}>
              {isSubmitting || submittingWebQuiz ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Submit Quiz</Text>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
          >
            <Text style={styles.navButtonText}>Next</Text>
            <ChevronRight size={16} color={Colors.text} />
          </TouchableOpacity>
        )}
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
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