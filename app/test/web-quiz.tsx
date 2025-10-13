/**
 * Web Quiz Screen - REFACTORED
 * Created: 2025-01-11
 * Original: 1,307 lines → Refactored: ~200 lines
 * Purpose: Main quiz screen with question navigation and submission
 */

import React, { useEffect } from 'react';
import { View, ScrollView, Alert, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useSelector } from 'react-redux';
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

export default function WebQuizScreen() {
  console.log('🌐 Web Quiz Screen Component Mounted');

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
      console.log('🌐 Loading questions from WEB API');
      const questionsList = transformQuestions(questionsData.data.questions);
      const category = questionsData.data.category;

      quizState.setQuestions(questionsList);
      console.log('✅ Web Quiz initialized with', questionsList.length, 'questions');

      // Show language selection first
      quizState.setShowLanguageSelection(true);

      // Check for negative marking
      if (category?.negative_marking_enabled) {
        console.log('⚠️ Negative marking enabled:', category.negative_marks_per_wrong || 0.25);
        quizState.setNegativeMarkingEnabled(true);
        quizState.setNegativeMarksPerWrong(category.negative_marks_per_wrong || 0.25);
      }
    }
  }, [questionsData]);

  // Timer hook with auto-submit
  const timer = useQuizTimer({
    initialTime: 3600, // 60 minutes
    onTimeUp: handleSubmitQuiz,
    enabled: quizState.quizStarted && quizState.questions.length > 0,
  });

  // Submit quiz handler
  async function handleSubmitQuiz() {
    console.log('🌐 Submit Quiz clicked');

    // Get user UUID
    let userUuid = user?.uuid;
    if (!userUuid && typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          userUuid = parsedUser.uuid || parsedUser.id;
        } catch (e) {
          console.error('Failed to parse stored user:', e);
        }
      }
    }

    if (!userUuid) {
      Alert.alert('Error', 'User not authenticated. Please login again.');
      return;
    }

    if (!seriesUuid) {
      Alert.alert('Error', 'Series UUID not found');
      return;
    }

    try {
      quizState.setIsSubmitting(true);
      console.log('🌐 Submitting quiz using WEB API');

      // Prepare answers - ONLY include answered questions
      const webApiAnswers = quizState.questions
        .filter((question: Question) => quizState.selectedAnswers[question.id]) // Only answered questions
        .map((question: Question) => {
          const selectedAnswer = quizState.selectedAnswers[question.id];
          const correctAnswer = question.correct_answer;
          const isMarkedForReview = quizState.flaggedQuestions.has(question.id.toString());

          return {
            questionId: question.id,
            selectedOption: selectedAnswer,
            isCorrect: selectedAnswer === correctAnswer,
            timeSpent: 30,
            isMarkedForReview: isMarkedForReview,
          };
        });

      const markedForReviewCount = quizState.flaggedQuestions.size;

      // Submit using WEB API
      const result = await submitQuizWeb({
        userId: userUuid,
        testSeriesId: seriesUuid as string,
        answers: webApiAnswers,
        totalQuestions: quizState.questions.length, // Send actual total questions count
        totalTimeSpent: 3600 - timer.timeRemaining,
        markedForReviewCount: markedForReviewCount,
      }).unwrap();

      console.log('✅ Web Quiz submission successful:', result.data);

      // Use backend-calculated values (DO NOT recalculate)
      const correctAnswers = result.data.correctAnswers;
      const wrongAnswers = result.data.wrongAnswers; // Backend calculates this correctly
      const unansweredQuestions = result.data.unansweredQuestions || 0;
      const negativeMarks = result.data.negativeMarksDeducted || 0;
      const finalScore = result.data.finalScore || result.data.score;
      const percentage = result.data.percentage || 0;
      const passed = percentage >= 50;

      console.log('📊 Quiz Results:', {
        correctAnswers,
        wrongAnswers,
        unansweredQuestions,
        negativeMarks,
        finalScore,
        percentage
      });

      // Navigate to results
      router.replace({
        pathname: '/test/results',
        params: {
          sessionId: result.data.leaderboardEntryId?.toString() || 'web-quiz',
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
        },
      });
    } catch (error) {
      console.error('❌ Web Quiz submission failed:', error);
      Alert.alert('Error', 'Failed to submit quiz. Please try again.');
    } finally {
      quizState.setIsSubmitting(false);
    }
  }

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
    quizState.setShowSubmitConfirmation(false);
    handleSubmitQuiz();
  };

  const confirmAndSubmitQuiz = () => {
    if (quizState.showGrid) {
      quizState.setShowGrid(false);
    }
    quizState.setShowSubmitConfirmation(true);
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
        </View>
      </SafeAreaView>
    );
  }

  // No questions
  if (!quizState.questions.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No questions available</Text>
        </View>
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

      {/* Header */}
      <QuizHeader
        title={categoryName as string || 'Quiz'}
        timeRemaining={timer.timeRemaining}
        formatTime={timer.formatTime}
        isTimeLow={timer.isTimeLow}
        onBack={() => router.back()}
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
