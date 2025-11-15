/**
 * Solutions Screen - REFACTORED
 * Created: 2025-01-11
 * Original: 1,378 lines → Refactored: ~250 lines
 * Purpose: Display quiz solutions with practice mode functionality
 */

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, BookOpen } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeColors } from '@/types';
import { createSolutionsStyles } from '@/styles/solutionsStyles';
import { useSolutionsData } from '@/hooks/solutions/useSolutionsData';
import { usePracticeMode } from '@/hooks/solutions/usePracticeMode';
import {
  SolutionHeader,
  PracticeModeToggle,
  QuestionCard,
  AnswerOptions,
  ReattemptStatus,
  ExplanationCard,
  SolutionNavigation,
  QuestionNavigatorGrid,
} from '@/components/solutions';

export default function SolutionsScreen() {
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const Colors = getTheme(theme) as ThemeColors;
  const styles = createSolutionsStyles(Colors);

  // State
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showAnswers, setShowAnswers] = useState<{ [key: number]: boolean }>({});
  const [showGrid, setShowGrid] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'gujarati'>(
    (params.selectedLanguage as 'english' | 'gujarati') || 'gujarati'
  );

  console.log('[SolutionsScreen] Params and language:', {
    allParams: params,
    selectedLanguageParam: params.selectedLanguage,
    selectedLanguageState: selectedLanguage
  });

  // Custom hooks
  const { questions, isLoading, error } = useSolutionsData(selectedLanguage);
  const practiceMode = usePracticeMode();

  // Handlers
  const toggleShowAnswer = useCallback((questionIndex: number) => {
    setShowAnswers(prev => ({
      ...prev,
      [questionIndex]: !prev[questionIndex],
    }));
  }, []);

  const handlePrevious = useCallback(() => {
    setCurrentQuestion(prev => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1));
  }, [questions.length]);

  // Helper functions
  const getAnswerStatus = useCallback((question: typeof questions[0], questionIndex: number) => {
    // if (practiceMode.reattemptMode && !practiceMode.hasReattempted[questionIndex]) {
    //   return 'hidden';
    // }

    const status = question.userAnswer === undefined
      ? 'unanswered'
      : question.userAnswer === question.correctAnswer
      ? 'correct'
      : 'incorrect';

    if (questionIndex === 0) {
      console.log('[getAnswerStatus] Question 0 status:', {
        userAnswer: question.userAnswer,
        correctAnswer: question.correctAnswer,
        status
      });
    }

    return status;
  }, [practiceMode.reattemptMode, practiceMode.hasReattempted]);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'correct':
        return <CheckCircle size={20} color={Colors.success} />;
      case 'incorrect':
        return <XCircle size={20} color={Colors.danger} />;
      case 'unanswered':
        return <AlertCircle size={20} color={Colors.warning} />;
      default:
        return null;
    }
  }, [Colors]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'correct':
        return Colors.success;
      case 'incorrect':
        return Colors.danger;
      case 'unanswered':
        return Colors.warning;
      default:
        return Colors.textSubtle;
    }
  }, [Colors]);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'correct':
        return 'Correct';
      case 'incorrect':
        return 'Incorrect';
      case 'unanswered':
        return 'Not Answered';
      case 'hidden':
        return 'Reattempt Mode';
      default:
        return '';
    }
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: Colors.textPrimary }]}>
            Loading Solutions...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <AlertCircle size={48} color={Colors.danger} />
          <Text style={[styles.errorText, { color: Colors.textPrimary }]}>
            Failed to load solutions
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // No questions
  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <BookOpen size={48} color={Colors.textSubtle} />
          <Text style={[styles.emptyText, { color: Colors.textPrimary }]}>
            No questions available
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Grid view
  if (showGrid) {
    return (
      <SafeAreaView style={styles.container}>
        <QuestionNavigatorGrid
          questions={questions}
          currentQuestion={currentQuestion}
          getAnswerStatus={getAnswerStatus}
          getStatusColor={getStatusColor}
          onQuestionSelect={setCurrentQuestion}
          onClose={() => setShowGrid(false)}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          Colors={Colors}
        />
      </SafeAreaView>
    );
  }

  const currentQuestionData = questions[currentQuestion];
  const answerStatus = getAnswerStatus(currentQuestionData, currentQuestion);
  const isOriginallyCorrect =
    currentQuestionData.userAnswer !== undefined &&
    currentQuestionData.userAnswer === currentQuestionData.correctAnswer;
  const reattemptStatus = practiceMode.getReattemptStatus(currentQuestion, currentQuestionData.correctAnswer);
  const shouldShowExplanation = !practiceMode.reattemptMode || practiceMode.hasReattempted[currentQuestion] || isOriginallyCorrect;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <SolutionHeader
        currentQuestion={currentQuestion}
        totalQuestions={questions.length}
        onBack={() => router.back()}
        onGridOpen={() => setShowGrid(true)}
        Colors={Colors}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Practice Mode Toggle */}
        <PracticeModeToggle
          reattemptMode={practiceMode.reattemptMode}
          onToggle={practiceMode.toggleReattemptMode}
          Colors={Colors}
        />

        {/* Question Card */}
        <QuestionCard
          question={currentQuestionData}
          answerStatus={answerStatus}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
          formatTime={formatTime}
          Colors={Colors}
        />

        {/* Answer Options */}
        <AnswerOptions
          question={currentQuestionData}
          currentQuestionIndex={currentQuestion}
          reattemptMode={practiceMode.reattemptMode}
          hasReattempted={practiceMode.hasReattempted[currentQuestion]}
          isOriginallyCorrect={isOriginallyCorrect}
          reattemptAnswer={practiceMode.reattemptAnswers[currentQuestion]}
          onReattemptAnswer={practiceMode.handleReattemptAnswer}
          Colors={Colors}
        />

        {/* Reattempt Status/Instructions */}
        <ReattemptStatus
          reattemptMode={practiceMode.reattemptMode}
          hasReattempted={practiceMode.hasReattempted[currentQuestion]}
          isOriginallyCorrect={isOriginallyCorrect}
          reattemptStatus={reattemptStatus}
          onReset={() => {
            practiceMode.resetReattempt(currentQuestion);
            setShowAnswers(prev => ({ ...prev, [currentQuestion]: false }));
          }}
          Colors={Colors}
        />

        {/* Explanation */}
        <ExplanationCard
          explanation={currentQuestionData.explanation}
          showExplanation={showAnswers[currentQuestion]}
          onToggle={() => toggleShowAnswer(currentQuestion)}
          shouldShow={shouldShowExplanation}
          Colors={Colors}
        />
      </ScrollView>

      {/* Navigation */}
      <SolutionNavigation
        currentQuestion={currentQuestion}
        totalQuestions={questions.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
        Colors={Colors}
      />
    </SafeAreaView>
  );
}
