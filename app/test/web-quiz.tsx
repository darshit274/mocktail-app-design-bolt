/**
 * Web Quiz Screen - REFACTORED
 * Created: 2025-01-11
 * Original: 1,307 lines → Refactored: ~200 lines
 * Purpose: Main quiz screen with question navigation and submission
 */

import React, { useEffect, useCallback } from 'react';
import { View, ScrollView, Alert, ActivityIndicator, Text, BackHandler, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '@/store/store';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubmitQuizWebMutation, useGetDynamicQuestionsWebQuery } from '@/store/api/webCompatibleApi';
import { ThemeColors, Question, AnswerOption } from '@/types';
import { transformQuestions } from '@/utils/questionTransformers';
import { useQuizState } from '@/hooks/quiz/useQuizState';
import { useQuizTimer } from '@/hooks/quiz/useQuizTimer';
import { createQuizStyles } from '@/styles/quizStyles';
import {
  QuizHeader,
  QuizProgressBar,
  QuestionDisplay,
  OptionsGrid,
  QuizNavigation,
  QuestionNavigatorGrid,
  SubmissionLoaderModal,
  LanguageSelectionModal,
  NegativeMarkingModal,
  SubmitConfirmationModal,
} from '@/components/quiz';
import { LoadingState, ErrorState } from '@/components/shared';
import logger from '@/utils/logger';

const quizLogger = logger.createLogger('WebQuiz');

export default function WebQuizScreen() {
  quizLogger.info('Web Quiz Screen Component Mounted');

  // Route params
  const params = useLocalSearchParams();
  const { categoryUuid, categoryName, seriesUuid } = params;

  // Theme & Language
  const { theme } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(theme) as ThemeColors;
  const styles = createQuizStyles(Colors);

  // Auth state
  const { user } = useSelector((state: RootState) => state.auth);

  // Quiz state (custom hook)
  const quizState = useQuizState();

  // State for test duration (null until loaded from API)
  const [testDurationSeconds, setTestDurationSeconds] = React.useState<number | null>(null);

  // State for exit confirmation
  const [showExitConfirmation, setShowExitConfirmation] = React.useState(false);

  // API hooks
  const [submitQuizWeb, { isLoading: submittingWebQuiz }] = useSubmitQuizWebMutation();
  const {
    data: questionsData,
    isLoading: loadingQuestions,
    error: questionsError,
  } = useGetDynamicQuestionsWebQuery(
    {
      categoryUuid: categoryUuid as string,
      language: 'english',
      shuffle: false,
    },
    { skip: !categoryUuid }
  );

  // Load questions when data arrives
  useEffect(() => {
    if (questionsData?.success && questionsData.data.questions) {
      quizLogger.info('Loading questions from WEB API');
      const questionsList = transformQuestions(questionsData.data.questions);
      const category = questionsData.data.category;

      quizState.setQuestions(questionsList);
      quizLogger.info('Web Quiz initialized', { questionCount: questionsList.length });

      // Set test duration from API (convert minutes to seconds)
      const durationMinutes = category?.test_duration_minutes || 60;
      const durationSeconds = durationMinutes * 60;
      setTestDurationSeconds(durationSeconds);
      quizLogger.info('Test duration set', { minutes: durationMinutes, seconds: durationSeconds });

      // Show language selection first
      quizState.setShowLanguageSelection(true);

      // Check for negative marking
      if (category?.negative_marking_enabled) {
        quizLogger.warn('Negative marking enabled', {
          negativeMarksPerWrong: category.negative_marks_per_wrong || 0.25
        });
        quizState.setNegativeMarkingEnabled(true);
        quizState.setNegativeMarksPerWrong(category.negative_marks_per_wrong || 0.25);
      }
    }
  }, [questionsData]);

  // Timer hook (uses dynamic test duration from API)
  const timer = useQuizTimer({
    initialTime: testDurationSeconds,
    onTimeUp: () => {
      // This will call handleSubmitQuiz when defined
      handleSubmitQuiz();
    },
    enabled: quizState.quizStarted && quizState.questions.length > 0 && testDurationSeconds !== null,
  });

  // Submit quiz handler
  const handleSubmitQuiz = React.useCallback(async () => {
    quizLogger.info('Submit Quiz clicked');
    quizLogger.debug('Initial state check', {
      hasUser: !!user,
      userUuid: user?.uuid,
      seriesUuid,
      categoryUuid
    });

    // Get user UUID - try Redux first, then AsyncStorage
    let userUuid = user?.uuid;
    if (!userUuid) {
      quizLogger.info('User not in Redux, attempting to get from AsyncStorage');
      try {
        const storedUserData = await AsyncStorage.getItem('user');
        if (storedUserData) {
          const parsedUser = JSON.parse(storedUserData);
          userUuid = parsedUser.uuid || parsedUser.id;
          quizLogger.info('User retrieved from AsyncStorage', { userUuid });
        } else {
          quizLogger.warn('No user found in AsyncStorage');
        }
      } catch (e) {
        quizLogger.error('Failed to retrieve user from AsyncStorage', e);
      }
    } else {
      quizLogger.info('User found in Redux', { userUuid });
    }

    if (!userUuid) {
      quizLogger.error('User authentication failed - no userUuid found in Redux or AsyncStorage');
      Alert.alert('Authentication Required', 'Please login again to submit the quiz.');
      return;
    }

    if (!seriesUuid) {
      quizLogger.error('Series UUID not found');
      Alert.alert('Error', 'Series UUID not found');
      return;
    }

    if (!categoryUuid) {
      quizLogger.error('Category UUID not found');
      Alert.alert('Error', 'Category UUID not found');
      return;
    }

    try {
      quizState.setIsSubmitting(true);
      quizLogger.info('Submitting quiz using WEB API');

      // Prepare answers - ONLY include answered questions
      const webApiAnswers = quizState.questions
        .map((question: Question) => {
          const selectedAnswer = quizState.selectedAnswers[question.id];
          const correctAnswer = question.correct_answer;
          const isMarkedForReview = quizState.flaggedQuestions.has(question.id.toString());

          return {
            questionId: question.id,
            selectedOption: selectedAnswer,
            isCorrect: selectedAnswer === correctAnswer,
            timeSpent: 30,
            markedForReview: isMarkedForReview, // ✅ FIXED: Match web app field name
          };
        });

      const markedForReviewCount = quizState.flaggedQuestions.size;

      // Submit using WEB API
      const result = await submitQuizWeb({
        userId: userUuid,
        testSeriesId: seriesUuid as string,
        categoryUuid: categoryUuid as string, // ← ADDED: For test identification
        answers: webApiAnswers,
        totalQuestions: quizState.questions.length, // Send actual total questions count
        totalTimeSpent: testDurationSeconds - timer.timeRemaining, // Use actual test duration
        markedForReviewCount: markedForReviewCount,
      }).unwrap();

      quizLogger.info('Web Quiz submission successful', { resultId: result.data.leaderboardEntryId });

      // Use backend-calculated values (DO NOT recalculate)
      const correctAnswers = result.data.correctAnswers;
      const wrongAnswers = result.data.wrongAnswers; // Backend calculates this correctly
      const unansweredQuestions = result.data.unansweredQuestions || 0;
      const negativeMarks = result.data.negativeMarksDeducted || 0;
      const finalScore = result.data.finalScore || result.data.score;
      const percentage = result.data.percentage || 0;
      const passed = percentage >= 50;

      quizLogger.info('Quiz Results', {
        correctAnswers,
        wrongAnswers,
        unansweredQuestions,
        negativeMarks,
        finalScore,
        percentage
      });

      // Calculate time taken in seconds
      const timeTakenSeconds = testDurationSeconds - timer.timeRemaining;

      // Navigate to results
      router.replace({
        pathname: '/test/results',
        params: {
          sessionId: result.data.sessionId || result.data.leaderboardEntryId?.toString() || 'web-quiz',  // ✅ FIXED: Use TestSession UUID
          leaderboardEntryId: result.data.leaderboardEntryId?.toString(),  // ✅ ADD: Keep for leaderboard
          score: result.data.score.toString(),
          percentage: percentage.toString(),
          passed: passed.toString(),
          correctAnswers: correctAnswers.toString(),
          wrongAnswers: wrongAnswers.toString(),
          unanswered: unansweredQuestions.toString(),
          testTitle: categoryName || 'Quiz',
          categoryUuid: categoryUuid,
          categoryName: categoryName,
          seriesUuid: seriesUuid,
          negativeMarkingEnabled: (negativeMarks > 0).toString(),
          negativeMarks: negativeMarks.toString(),
          finalScore: finalScore.toString(),
          selectedLanguage: quizState.selectedQuizLanguage, // Pass selected language
          totalTimeTaken: timeTakenSeconds.toString(), // Pass time taken
        },
      });
    } catch (error: any) {
      quizLogger.error('Web Quiz submission failed', {
        error: error?.message || error,
        errorData: error?.data,
        errorStatus: error?.status
      });
      console.error('Full submission error:', error);

      const errorMessage = error?.data?.message || error?.message || 'Failed to submit quiz. Please try again.';
      Alert.alert('Submission Error', errorMessage);
    } finally {
      quizState.setIsSubmitting(false);
      quizLogger.info('Submission process complete, isSubmitting set to false');
    }
  }, [user, seriesUuid, categoryUuid, categoryName, quizState, submitQuizWeb, timer.timeRemaining, testDurationSeconds]);

  // Handlers
  const handleSelectQuestion = (index: number) => {
    quizState.setCurrentQuestion(index);
    quizState.setShowGrid(false);
  };

  const handleLanguageContinue = () => {
    quizState.setShowLanguageSelection(false);
    if (quizState.negativeMarkingEnabled) {
      quizState.setShowNegativeMarkingWarning(true);
    } else {
      quizState.setQuizStarted(true);
    }
  };

  const handleNegativeMarkingStart = () => {
    quizState.setShowNegativeMarkingWarning(false);
    quizState.setQuizStarted(true);
  };

  const handleSubmitConfirm = () => {
    quizLogger.info('Submit confirmation - YES button clicked');
    quizState.setShowSubmitConfirmation(false);
    quizLogger.info('Confirmation modal closed, calling handleSubmitQuiz');
    handleSubmitQuiz();
  };

  const confirmAndSubmitQuiz = () => {
    if (quizState.showGrid) {
      quizState.setShowGrid(false);
    }
    quizState.setShowSubmitConfirmation(true);
  };

  // Handle back button press (show confirmation if quiz started)
  const handleBackPress = useCallback(() => {
    if (quizState.quizStarted && !quizState.isSubmitting && !submittingWebQuiz) {
      setShowExitConfirmation(true);
      return true; // Prevent default back action
    }
    return false; // Allow default back action
  }, [quizState.quizStarted, quizState.isSubmitting, submittingWebQuiz]);

  // Handle exit confirmation
  const handleConfirmExit = useCallback(() => {
    setShowExitConfirmation(false);
    router.back();
  }, []);

  const handleCancelExit = useCallback(() => {
    setShowExitConfirmation(false);
  }, []);

  // Hardware back button listener (Android)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => backHandler.remove();
  }, [handleBackPress]);

  // Loading state
  if (loadingQuestions) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState message="Loading questions..." Colors={Colors} fullScreen />
      </SafeAreaView>
    );
  }

  // Error state
  if (questionsError || !questionsData?.success) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title="Failed to load questions"
          message="Unable to fetch quiz questions. Please try again."
          onRetry={() => router.back()}
          retryText="Go Back"
          Colors={Colors}
          fullScreen
        />
      </SafeAreaView>
    );
  }

  // No questions
  if (!quizState.questions.length) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title="No questions available"
          message="This quiz doesn't have any questions yet."
          onRetry={() => router.back()}
          retryText="Go Back"
          Colors={Colors}
          fullScreen
        />
      </SafeAreaView>
    );
  }

  const currentQuestionData = quizState.questions[quizState.currentQuestion];
  const isLastQuestion = quizState.currentQuestion === quizState.questions.length - 1;
  const useGujarati = quizState.selectedQuizLanguage === 'gujarati';

  // Grid view
  if (quizState.showGrid) {
    return (
      <SafeAreaView style={styles.container}>
        <SubmissionLoaderModal visible={quizState.isSubmitting || submittingWebQuiz} Colors={Colors} />
        <SubmitConfirmationModal
          visible={quizState.showSubmitConfirmation}
          answeredCount={Object.keys(quizState.selectedAnswers).length}
          totalQuestions={quizState.questions.length}
          flaggedCount={quizState.flaggedQuestions.size}
          timeLeft={timer.formatTime(timer.timeRemaining)}
          onCancel={() => quizState.setShowSubmitConfirmation(false)}
          onConfirm={handleSubmitConfirm}
          Colors={Colors}
        />
        <QuestionNavigatorGrid
          questions={quizState.questions}
          currentQuestion={quizState.currentQuestion}
          selectedAnswers={quizState.selectedAnswers}
          flaggedQuestions={quizState.flaggedQuestions}
          onSelectQuestion={handleSelectQuestion}
          onClose={() => quizState.setShowGrid(false)}
          onSubmit={confirmAndSubmitQuiz}
          selectedLanguage={quizState.selectedQuizLanguage}
          onLanguageChange={quizState.setSelectedQuizLanguage}
          Colors={Colors}
        />
      </SafeAreaView>
    );
  }

  // Main quiz view
  return (
    <SafeAreaView style={styles.container}>
      {/* Modals */}
      <SubmissionLoaderModal visible={quizState.isSubmitting || submittingWebQuiz} Colors={Colors} />
      <LanguageSelectionModal
        visible={quizState.showLanguageSelection}
        selectedLanguage={quizState.selectedQuizLanguage}
        onSelectLanguage={quizState.setSelectedQuizLanguage}
        onCancel={() => {
          quizState.setShowLanguageSelection(false);
          router.back();
        }}
        onContinue={handleLanguageContinue}
        Colors={Colors}
      />
      <NegativeMarkingModal
        visible={quizState.showNegativeMarkingWarning}
        negativeMarksPerWrong={quizState.negativeMarksPerWrong}
        onCancel={() => {
          quizState.setShowNegativeMarkingWarning(false);
          router.back();
        }}
        onStart={handleNegativeMarkingStart}
        Colors={Colors}
      />
      <SubmitConfirmationModal
        visible={quizState.showSubmitConfirmation}
        answeredCount={Object.keys(quizState.selectedAnswers).length}
        totalQuestions={quizState.questions.length}
        flaggedCount={quizState.flaggedQuestions.size}
        timeLeft={timer.formatTime(timer.timeRemaining)}
        onCancel={() => quizState.setShowSubmitConfirmation(false)}
        onConfirm={handleSubmitConfirm}
        Colors={Colors}
      />

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitConfirmation}
        transparent
        animationType="fade"
        onRequestClose={handleCancelExit}
      >
        <View style={exitModalStyles.overlay}>
          <View style={[exitModalStyles.modal, { backgroundColor: Colors.cardBackground }]}>
            <Text style={[exitModalStyles.title, { color: Colors.textPrimary }]}>
              Exit Test?
            </Text>
            <Text style={[exitModalStyles.message, { color: Colors.textSecondary }]}>
              Are you sure you want to close the test? Your progress will not be saved.
            </Text>
            <View style={exitModalStyles.buttonContainer}>
              <TouchableOpacity
                style={[exitModalStyles.button, exitModalStyles.cancelButton, { backgroundColor: Colors.cardBackground, borderColor: Colors.border }]}
                onPress={handleCancelExit}
              >
                <Text style={[exitModalStyles.cancelButtonText, { color: Colors.textPrimary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[exitModalStyles.button, exitModalStyles.confirmButton, { backgroundColor: Colors.danger }]}
                onPress={handleConfirmExit}
              >
                <Text style={exitModalStyles.confirmButtonText}>
                  Exit Test
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <QuizHeader
        title={categoryName as string || 'Quiz'}
        timeRemaining={timer.timeRemaining}
        formatTime={timer.formatTime}
        isTimeLow={timer.isTimeLow}
        onBack={handleBackPress}
        onGridOpen={() => quizState.setShowGrid(true)}
        Colors={Colors}
      />

      {/* Progress */}
      <QuizProgressBar
        currentQuestion={quizState.currentQuestion}
        totalQuestions={quizState.questions.length}
        Colors={Colors}
      />

      {/* Question & Options */}
      <ScrollView style={styles.content}>
        <QuestionDisplay
          question={currentQuestionData}
          questionNumber={quizState.currentQuestion + 1}
          isFlagged={quizState.flaggedQuestions.has(currentQuestionData.id.toString())}
          useGujarati={useGujarati}
          onFlag={quizState.handleFlagQuestion}
          Colors={Colors}
        />

        <OptionsGrid
          question={currentQuestionData}
          selectedOption={quizState.selectedAnswers[currentQuestionData.id] || null}
          useGujarati={useGujarati}
          onSelect={quizState.handleAnswerSelect}
          Colors={Colors}
        />
      </ScrollView>

      {/* Navigation */}
      <QuizNavigation
        currentQuestion={quizState.currentQuestion}
        totalQuestions={quizState.questions.length}
        isLastQuestion={isLastQuestion}
        isSubmitting={quizState.isSubmitting || submittingWebQuiz}
        onPrevious={() => quizState.setCurrentQuestion(prev => Math.max(0, prev - 1))}
        onNext={() => quizState.setCurrentQuestion(prev => Math.min(quizState.questions.length - 1, prev + 1))}
        onSubmit={confirmAndSubmitQuiz}
        Colors={Colors}
      />
    </SafeAreaView>
  );
}

// Exit Confirmation Modal Styles
const exitModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {},
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
