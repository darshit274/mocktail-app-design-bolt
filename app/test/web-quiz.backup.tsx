import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Flag, ChevronLeft, ChevronRight, AlertTriangle, Grid3X3 } from 'lucide-react-native';
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
  const [showGrid, setShowGrid] = useState(false);

  // Negative marking states
  const [showNegativeMarkingWarning, setShowNegativeMarkingWarning] = useState(false);
  const [negativeMarkingEnabled, setNegativeMarkingEnabled] = useState(false);
  const [negativeMarksPerWrong, setNegativeMarksPerWrong] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);

  // Language selection states
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);
  const [selectedQuizLanguage, setSelectedQuizLanguage] = useState<'english' | 'gujarati'>('gujarati'); // Default to Gujarati

  // Submit confirmation state
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);

  const { theme } = useTheme();
  const Colors = getTheme(theme);
  const { t } = useLanguage();
  const styles = getStyles(Colors);

  // Determine language preference for fallback logic
  const useGujarati = selectedQuizLanguage === 'gujarati';

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
      shuffle: false
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
      const category = questionsData.data.category;

      setQuestions(questionsList);
      console.log('✅ Web Quiz initialized with', questionsList.length, 'questions');

      // Show language selection first
      setShowLanguageSelection(true);

      // Check for negative marking
      if (category?.negative_marking_enabled) {
        console.log('⚠️ Negative marking enabled:', category.negative_marks_per_wrong || 0.25);
        setNegativeMarkingEnabled(true);
        setNegativeMarksPerWrong(category.negative_marks_per_wrong || 0.25);
      }
    }
  }, [questionsData]);

  // Timer countdown - only runs when quiz has started
  useEffect(() => {
    if (timeRemaining > 0 && questions.length > 0 && quizStarted) {
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
  }, [timeRemaining, questions.length, quizStarted]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper function to preserve line breaks
  const preserveLineBreaks = (text: string): string => {
    if (!text) return '';
    // Handle both actual newlines and escaped newlines from Excel
    return text.replace(/\\n/g, '\n');
  };

  // Helper function to get question text with language fallback
  const getQuestionText = (question: any) => {
    let text = '';
    if (useGujarati) {
      text = question.question_text_gujarati || question.question_text || 'No question available';
    } else {
      text = question.question_text || question.question_text_gujarati || 'No question available';
    }
    return preserveLineBreaks(text);
  };

  // Helper function to get option text with language fallback
  const getOptionText = (question: any, optionKey: string) => {
    const gujaratiKey = `option_${optionKey.toLowerCase()}_gujarati`;
    const englishKey = `option_${optionKey.toLowerCase()}`;

    let text = '';
    if (useGujarati) {
      text = question[gujaratiKey] || question.options?.[optionKey] || question[englishKey] || `Option ${optionKey}`;
    } else {
      text = question[englishKey] || question.options?.[optionKey] || question[gujaratiKey] || `Option ${optionKey}`;
    }
    return preserveLineBreaks(text);
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

  const confirmAndSubmitQuiz = () => {
    // Close grid if open, then show confirmation
    if (showGrid) {
      setShowGrid(false);
    }
    setShowSubmitConfirmation(true);
  };

  const handleSubmitQuiz = async () => {
    console.log('🌐 Submit Quiz clicked');
    console.log('🌐 User from Redux:', user?.uuid);
    console.log('🌐 SeriesUuid:', seriesUuid);

    // Try to get user UUID from localStorage (web fallback)
    let userUuid = user?.uuid;

    if (!userUuid && typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          userUuid = parsedUser.uuid || parsedUser.id;
          console.log('🌐 User from localStorage:', userUuid);
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
        userId: userUuid,
        testSeriesId: seriesUuid,
        answersCount: webApiAnswers.length,
        totalTimeSpent: 3600 - timeRemaining,
        markedForReviewCount: markedForReviewCount
      });

      // Submit using WEB API
      const result = await submitQuizWeb({
        userId: userUuid,
        testSeriesId: seriesUuid as string,
        answers: webApiAnswers,
        totalTimeSpent: 3600 - timeRemaining,
        markedForReviewCount: markedForReviewCount
      }).unwrap();

      console.log('✅ Web Quiz submission successful:', result.data);

      // Calculate negative marks if enabled
      const correctAnswers = result.data.correctAnswers;
      const wrongAnswers = result.data.totalQuestions - correctAnswers;
      const negativeMarks = negativeMarkingEnabled ? wrongAnswers * negativeMarksPerWrong : 0;
      const finalScore = negativeMarkingEnabled ? correctAnswers - negativeMarks : correctAnswers;

      console.log('📊 Score calculation:', {
        correctAnswers,
        wrongAnswers,
        negativeMarkingEnabled,
        negativeMarksPerWrong,
        negativeMarks,
        finalScore
      });

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
          wrongAnswers: wrongAnswers.toString(),
          unanswered: '0',
          testTitle: categoryName || 'Quiz',
          categoryUuid: categoryUuid,
          categoryName: categoryName,
          seriesUuid: seriesUuid,
          // Negative marking data
          negativeMarkingEnabled: negativeMarkingEnabled.toString(),
          negativeMarks: negativeMarks.toString(),
          finalScore: finalScore.toString(),
        }
      });
    } catch (error) {
      console.error('❌ Web Quiz submission failed:', error);
      Alert.alert('Error', 'Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get question status color for grid
  const getQuestionStatusColor = (index: number) => {
    const question = questions[index];
    if (!question) return Colors.muted;

    // Current question - highlight with primary color
    if (index === currentQuestion) {
      return Colors.primary;
    }

    // Flagged questions - show warning color
    if (flaggedQuestions.has(question.id.toString())) {
      return Colors.warning;
    }

    // Answered questions - show success color
    if (selectedAnswers[question.id]) {
      return Colors.success;
    }

    // Unanswered questions - show muted color
    return Colors.muted;
  };

  // Render question grid navigator
  const renderQuestionGrid = () => (
    <View style={styles.gridContainer}>
      <View style={styles.gridHeader}>
        <Text style={styles.gridTitle}>Question Navigator</Text>
        <TouchableOpacity onPress={() => setShowGrid(false)}>
          <Text style={styles.gridClose}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Answered</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
          <Text style={styles.legendText}>Flagged</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>Current</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.muted }]} />
          <Text style={styles.legendText}>Unanswered</Text>
        </View>
      </View>

      {/* Submit button in grid view */}
      <TouchableOpacity
        style={styles.gridSubmitButton}
        onPress={confirmAndSubmitQuiz}
      >
        <Text style={styles.gridSubmitButtonText}>Submit Quiz</Text>
      </TouchableOpacity>

      {/* Question grid */}
      <ScrollView style={styles.gridScrollView}>
        <View style={styles.grid}>
          {questions.map((question, index) => (
            <TouchableOpacity
              key={question.id}
              style={[
                styles.gridItem,
                { backgroundColor: getQuestionStatusColor(index) },
              ]}
              onPress={() => {
                setCurrentQuestion(index);
                setShowGrid(false);
              }}
            >
              <Text
                style={[
                  styles.gridItemText,
                  index === currentQuestion && styles.gridItemTextCurrent,
                ]}
              >
                {index + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  // ALL MODALS MUST be defined before any early returns that use them
  // Submission Loader Modal - Shows while quiz is being submitted
  const SubmissionLoaderModal = useMemo(() => (
    <Modal
      visible={isSubmitting}
      transparent
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.modalTitle}>Submitting Quiz...</Text>
          <Text style={styles.modalDescription}>
            Please wait while we process your answers
          </Text>
        </View>
      </View>
    </Modal>
  ), [isSubmitting, Colors]);

  // Language Selection Modal
  const LanguageSelectionModal = useMemo(() => (
    <Modal
      visible={showLanguageSelection}
      transparent
      animationType="fade"
      onRequestClose={() => setShowLanguageSelection(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Title */}
          <Text style={styles.modalTitle}>Choose Language / ભાષા પસંદ કરો</Text>

          {/* Description */}
          <Text style={styles.modalDescription}>
            Select your preferred language for the quiz
          </Text>

          {/* Language Buttons */}
          <View style={styles.languageButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                selectedQuizLanguage === 'gujarati' && styles.languageButtonSelected,
                { backgroundColor: selectedQuizLanguage === 'gujarati' ? Colors.primary : Colors.backgroundSecondary }
              ]}
              onPress={() => setSelectedQuizLanguage('gujarati')}
            >
              <Text style={[
                styles.languageButtonText,
                { color: selectedQuizLanguage === 'gujarati' ? Colors.white : Colors.textPrimary }
              ]}>
                ગુજરાતી (Gujarati)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.languageButton,
                selectedQuizLanguage === 'english' && styles.languageButtonSelected,
                { backgroundColor: selectedQuizLanguage === 'english' ? Colors.primary : Colors.backgroundSecondary }
              ]}
              onPress={() => setSelectedQuizLanguage('english')}
            >
              <Text style={[
                styles.languageButtonText,
                { color: selectedQuizLanguage === 'english' ? Colors.white : Colors.textPrimary }
              ]}>
                English
              </Text>
            </TouchableOpacity>
          </View>

          {/* Buttons */}
          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowLanguageSelection(false);
                router.back();
              }}
            >
              <Text style={styles.modalCancelButtonText}>Go Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalStartButton}
              onPress={() => {
                setShowLanguageSelection(false);
                // Show negative marking warning if enabled, otherwise start quiz
                if (negativeMarkingEnabled) {
                  setShowNegativeMarkingWarning(true);
                } else {
                  setQuizStarted(true);
                }
              }}
            >
              <Text style={styles.modalStartButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  ), [showLanguageSelection, selectedQuizLanguage, negativeMarkingEnabled, Colors]);

  // Negative Marking Warning Modal
  const NegativeMarkingWarningModal = useMemo(() => (
    <Modal
      visible={showNegativeMarkingWarning}
      transparent
      animationType="fade"
      onRequestClose={() => setShowNegativeMarkingWarning(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Warning Icon */}
          <View style={styles.modalIconContainer}>
            <AlertTriangle size={48} color={Colors.warning} />
          </View>

          {/* Title */}
          <Text style={styles.modalTitle}>Negative Marking Enabled!</Text>

          {/* Description */}
          <Text style={styles.modalDescription}>
            This quiz has negative marking. Please read the rules carefully:
          </Text>

          {/* Rules */}
          <View style={styles.modalRulesContainer}>
            <View style={styles.modalRule}>
              <Text style={styles.modalRuleBullet}>•</Text>
              <Text style={styles.modalRuleText}>
                Correct answer: <Text style={styles.modalRuleHighlight}>+1 mark</Text>
              </Text>
            </View>
            <View style={styles.modalRule}>
              <Text style={styles.modalRuleBullet}>•</Text>
              <Text style={styles.modalRuleText}>
                Wrong answer: <Text style={[styles.modalRuleHighlight, { color: Colors.error }]}>
                  -{negativeMarksPerWrong} marks
                </Text>
              </Text>
            </View>
            <View style={styles.modalRule}>
              <Text style={styles.modalRuleBullet}>•</Text>
              <Text style={styles.modalRuleText}>
                Unanswered: <Text style={styles.modalRuleHighlight}>No penalty</Text>
              </Text>
            </View>
          </View>

          {/* Tips */}
          <View style={styles.modalTipsContainer}>
            <Text style={styles.modalTipsTitle}>💡 Tips:</Text>
            <Text style={styles.modalTipsText}>
              • Only answer questions you are confident about
            </Text>
            <Text style={styles.modalTipsText}>
              • Skip questions if you're not sure
            </Text>
            <Text style={styles.modalTipsText}>
              • Review your answers before submitting
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowNegativeMarkingWarning(false);
                router.back();
              }}
            >
              <Text style={styles.modalCancelButtonText}>Go Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalStartButton}
              onPress={() => {
                setShowNegativeMarkingWarning(false);
                setQuizStarted(true);
              }}
            >
              <Text style={styles.modalStartButtonText}>I Understand, Start Quiz</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  ), [showNegativeMarkingWarning, negativeMarksPerWrong, Colors]);

  // Submit Confirmation Modal
  const SubmitConfirmationModal = useMemo(() => (
    <Modal
      visible={showSubmitConfirmation}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSubmitConfirmation(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Warning Icon */}
          <View style={styles.modalIconContainer}>
            <AlertTriangle size={48} color={Colors.warning} />
          </View>

          {/* Title */}
          <Text style={styles.modalTitle}>Submit Test?</Text>

          {/* Description */}
          <Text style={styles.modalDescription}>
            Are you sure you want to submit the test? You cannot change your answers after submission.
          </Text>

          {/* Stats */}
          <View style={styles.submitStatsContainer}>
            <View style={styles.submitStatItem}>
              <Text style={styles.submitStatLabel}>Answered:</Text>
              <Text style={styles.submitStatValue}>{Object.keys(selectedAnswers).length}/{questions.length}</Text>
            </View>
            <View style={styles.submitStatItem}>
              <Text style={styles.submitStatLabel}>Flagged:</Text>
              <Text style={styles.submitStatValue}>{flaggedQuestions.size}</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowSubmitConfirmation(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalStartButton, { backgroundColor: Colors.error }]}
              onPress={() => {
                setShowSubmitConfirmation(false);
                handleSubmitQuiz();
              }}
            >
              <Text style={styles.modalStartButtonText}>Yes, Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  ), [showSubmitConfirmation, selectedAnswers, questions.length, flaggedQuestions.size, Colors]);

  // Show grid view if user opened it
  if (showGrid) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Submission Loader Modal - Also needed in grid view */}
        {SubmissionLoaderModal}

        {/* Submit Confirmation Modal - Also needed in grid view */}
        {SubmitConfirmationModal}

        {renderQuestionGrid()}
      </SafeAreaView>
    );
  }

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

  // Note: All modals are defined above before early returns

  return (
    <SafeAreaView style={styles.container}>
      {/* Submission Loader Modal */}
      {SubmissionLoaderModal}

      {/* Language Selection Modal */}
      {LanguageSelectionModal}

      {/* Negative Marking Warning Modal */}
      {NegativeMarkingWarningModal}

      {/* Submit Confirmation Modal */}
      {SubmitConfirmationModal}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName || 'Quiz'}</Text>
        <View style={styles.headerRight}>
          <View style={styles.timerContainer}>
            <Clock size={16} color={timeRemaining < 300 ? Colors.error : Colors.primary} />
            <Text style={[styles.timerText, timeRemaining < 300 && styles.timerWarning]}>
              {formatTime(timeRemaining)}
            </Text>
          </View>
          <TouchableOpacity style={styles.gridButton} onPress={() => setShowGrid(true)}>
            <Grid3X3 size={20} color={Colors.text} />
          </TouchableOpacity>
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
            {getQuestionText(currentQuestionData)}
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
                  {getOptionText(currentQuestionData, option)}
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
            onPress={confirmAndSubmitQuiz}
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
  // Modal styles
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
  modalStartButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalStartButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.white,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gridButton: {
    padding: 8,
  },
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
  submitStatLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  submitStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
});