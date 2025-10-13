import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import RenderHTML from 'react-native-render-html';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  CircleCheck as CheckCircle,
  Circle as XCircle,
  CircleAlert as AlertCircle,
  BookOpen,
  Clock,
  Grid3X3,
  RotateCcw,
} from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReviewAnswersQuery } from '@/store/api/quizApi';
import { useGetDynamicSolutionsQuery } from '@/store/api/dynamicHierarchyApi';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer?: number;
  explanation: string;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeSpent: number;
  reattemptAnswer?: number; // New answer given during reattempt mode
}

export default function SolutionsScreen() {
  console.log('📚 Solutions screen mounted');
  const params = useLocalSearchParams();
  console.log('📚 Received params:', params);
  const { sessionId, resultId, testTitle, categoryUuid, categoryName } = params;

  // Determine if this is a category-based quiz
  // If categoryUuid exists, it's a category quiz (matches web behavior)
  const isCategoryQuiz = !!categoryUuid;
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const { theme } = useTheme();
  const Colors = getTheme(theme);
  const styles = getStyles(Colors);
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  
  const [showAnswers, setShowAnswers] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [reattemptMode, setReattemptMode] = useState(false);
  const [reattemptAnswers, setReattemptAnswers] = useState<{ [key: number]: number }>({});
  const [hasReattempted, setHasReattempted] = useState<{ [key: number]: boolean }>({});

  // Use real API data
  const useMockData = false;
  
  // Fetch review data from API for session-based quizzes
  const { 
    data: reviewData, 
    isLoading: loadingReview,
    error: reviewError 
  } = useReviewAnswersQuery({
    session_id: sessionId as string,
  }, {
    skip: !sessionId || useMockData || isCategoryQuiz,
  });

  // Fetch solutions for category-based quizzes
  const { 
    data: categoryData, 
    isLoading: loadingCategory,
    error: categoryError 
  } = useGetDynamicSolutionsQuery({
    categoryUuid: categoryUuid as string,
    language: 'english',
  }, {
    skip: !isCategoryQuiz || useMockData,
  });

  // Combine loading and error states
  const isLoading = isCategoryQuiz ? loadingCategory : loadingReview;
  const error = isCategoryQuiz ? categoryError : reviewError;
  
  console.log('📚 API Status:', {
    isCategoryQuiz,
    isLoading,
    hasError: !!error,
    hasReviewData: !!reviewData,
    hasCategoryData: !!categoryData,
  });

  // Mock data for testing
  const mockQuestions: Question[] = [
    {
      id: 1,
      question: 'What is the capital of India?',
      options: ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'],
      correctAnswer: 1,
      userAnswer: 1,
      explanation:
        'New Delhi is the capital of India and serves as the seat of the Government of India. It was officially declared as the capital in 1911, replacing Calcutta (now Kolkata).',
      subject: 'General Knowledge',
      difficulty: 'Easy',
      timeSpent: 45,
    },
    {
      id: 2,
      question:
        'Which of the following is the largest planet in our solar system?',
      options: ['Earth', 'Mars', 'Jupiter', 'Saturn'],
      correctAnswer: 2,
      userAnswer: 3,
      explanation:
        "Jupiter is the largest planet in our solar system, with a mass greater than all other planets combined. It's a gas giant with a diameter of about 142,984 km.",
      subject: 'Science',
      difficulty: 'Medium',
      timeSpent: 67,
    },
  ];

  // Transform API data to match our interface
  const transformQuestions = (apiQuestions: any[]): Question[] => {
    if (!apiQuestions) return [];

    return apiQuestions.map((q, index) => {
      // Use language from context with FALLBACK (like web version)
      const useGujarati = t.language === 'gujarati';

      // Get question text with fallback
      const questionText = useGujarati
        ? (q.question_text_gujarati || q.question_text || 'No question available')
        : (q.question_text || q.question_text_gujarati || 'No question available');

      // Get options with fallback
      const getOption = (optionKey: string) => {
        const gujaratiKey = `option_${optionKey.toLowerCase()}_gujarati`;
        const englishKey = `option_${optionKey.toLowerCase()}`;

        if (useGujarati) {
          return q[gujaratiKey] || q.options?.[optionKey] || q[englishKey] || `Option ${optionKey}`;
        } else {
          return q[englishKey] || q.options?.[optionKey] || q[gujaratiKey] || `Option ${optionKey}`;
        }
      };

      // Get explanation with fallback
      const explanation = useGujarati
        ? (q.explanation_gujarati || q.explanation || 'No explanation available.')
        : (q.explanation || q.explanation_gujarati || 'No explanation available.');

      return {
        id: q.id || index + 1,
        question: questionText,
        options: [getOption('A'), getOption('B'), getOption('C'), getOption('D')],
        correctAnswer: q.correct_option ? ['A', 'B', 'C', 'D'].indexOf(q.correct_option) : 0,
        userAnswer: q.selected_option ? ['A', 'B', 'C', 'D'].indexOf(q.selected_option) : undefined,
        explanation: explanation,
        subject: q.subject || 'General',
        difficulty: q.difficulty_level === 'easy' ? 'Easy' : q.difficulty_level === 'medium' ? 'Medium' : 'Hard',
        timeSpent: q.time_spent || 0,
      };
    });
  };

  // Transform category solutions to the same format
  const transformCategorySolutions = (solutions: any[]) => {
    return solutions.map((solution, index) => {
      // Use language from context with FALLBACK
      const useGujarati = t.language === 'gujarati';

      // Get question text with fallback
      const questionText = useGujarati
        ? (solution.question_text_gujarati || solution.question_text || 'No question available')
        : (solution.question_text || solution.question_text_gujarati || 'No question available');

      // Get options with fallback
      const getOption = (optionKey: string) => {
        const gujaratiKey = `option_${optionKey.toLowerCase()}_gujarati`;
        const englishKey = `option_${optionKey.toLowerCase()}`;

        if (useGujarati) {
          return solution[gujaratiKey] || solution.options?.[optionKey] || solution[englishKey] || `Option ${optionKey}`;
        } else {
          return solution[englishKey] || solution.options?.[optionKey] || solution[gujaratiKey] || `Option ${optionKey}`;
        }
      };

      // Get explanation with fallback
      const explanation = useGujarati
        ? (solution.explanation_gujarati || solution.explanation || 'No explanation available.')
        : (solution.explanation || solution.explanation_gujarati || 'No explanation available.');

      return {
        id: solution.id || index + 1,
        question: questionText,
        options: [getOption('A'), getOption('B'), getOption('C'), getOption('D')],
        correctAnswer: solution.correct_answer ? ['A', 'B', 'C', 'D'].indexOf(solution.correct_answer) : 0,
        userAnswer: undefined, // No user answer for category-based quizzes
        explanation: explanation,
        subject: 'General',
        difficulty: 'Medium', // Default difficulty for category solutions
        timeSpent: 0, // No time tracking for category-based quizzes
      };
    });
  };

  // Use appropriate data source based on quiz type
  const questions = useMockData 
    ? mockQuestions 
    : isCategoryQuiz 
      ? transformCategorySolutions(categoryData?.data?.solutions || [])
      : transformQuestions(reviewData?.data?.questions || []);
  
  console.log('📚 Questions loaded:', questions.length, 'questions');

  const toggleShowAnswer = (questionIndex: number) => {
    setShowAnswers((prev) => ({
      ...prev,
      [questionIndex]: !prev[questionIndex],
    }));
  };

  const toggleAllAnswers = () => {
    const newShowAllState = !showAllAnswers;
    setShowAllAnswers(newShowAllState);
    
    // Update individual question states
    const newShowAnswers: { [key: number]: boolean } = {};
    questions.forEach((_, index) => {
      newShowAnswers[index] = newShowAllState;
    });
    setShowAnswers(newShowAnswers);
  };

  const handleReattemptAnswer = (questionIndex: number, answerIndex: number) => {
    setReattemptAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex,
    }));
    setHasReattempted((prev) => ({
      ...prev,
      [questionIndex]: true,
    }));
  };

  const resetReattempt = (questionIndex: number) => {
    setReattemptAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[questionIndex];
      return newAnswers;
    });
    setHasReattempted((prev) => ({
      ...prev,
      [questionIndex]: false,
    }));
    setShowAnswers((prev) => ({
      ...prev,
      [questionIndex]: false,
    }));
  };

  const getAnswerStatus = (question: Question, questionIndex: number) => {
    // In reattempt mode, if user hasn't reattempted yet, don't show status
    if (reattemptMode && !hasReattempted[questionIndex]) {
      return 'hidden';
    }
    
    if (question.userAnswer === undefined) return 'unanswered';
    if (question.userAnswer === question.correctAnswer) return 'correct';
    return 'incorrect';
  };

  const getReattemptStatus = (questionIndex: number) => {
    const reattemptAnswer = reattemptAnswers[questionIndex];
    if (reattemptAnswer === undefined) return 'not_attempted';
    
    const correctAnswer = questions[questionIndex].correctAnswer;
    return reattemptAnswer === correctAnswer ? 'correct' : 'incorrect';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'correct':
        return <CheckCircle size={20} color={Colors.success} />;
      case 'incorrect':
        return <XCircle size={20} color={Colors.danger} />;
      case 'unanswered':
        return <AlertCircle size={20} color={Colors.warning} />;
      case 'hidden':
        return null;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'correct':
        return Colors.success;
      case 'incorrect':
        return Colors.danger;
      case 'unanswered':
        return Colors.warning;
      case 'hidden':
        return Colors.textSubtle;
      default:
        return Colors.textSubtle;
    }
  };

  const getStatusText = (status: string) => {
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
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const renderQuestionGrid = () => (
    <View style={styles.gridContainer}>
      <View style={styles.gridHeader}>
        <Text style={styles.gridTitle}>Question Navigator</Text>
        <TouchableOpacity onPress={() => setShowGrid(false)}>
          <Text style={styles.gridClose}>Close</Text>
        </TouchableOpacity>
      </View>

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

      <View style={styles.grid}>
        {questions.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.gridItem,
              {
                backgroundColor: questions[index] 
                  ? getStatusColor(getAnswerStatus(questions[index], index))
                  : Colors.muted,
              },
            ]}
            onPress={() => {
              setCurrentQuestion(index);
              setShowGrid(false);
            }}
          >
            <Text
              style={[
                styles.gridItemText,
                questions[index] && getAnswerStatus(questions[index], index) === 'unanswered' && {
                  color: Colors.textSubtle,
                },
              ]}
            >
              {index + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (showGrid) {
    return (
      <SafeAreaView style={styles.container}>
        {renderQuestionGrid()}
      </SafeAreaView>
    );
  }

  // Show loading state
  if (!useMockData && isLoading) {
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

  // Show error state
  if (!useMockData && error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <AlertCircle size={48} color={Colors.danger} />
          <Text style={[styles.errorText, { color: Colors.textPrimary }]}>
            Failed to load solutions
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
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

  const currentQuestionData = questions[currentQuestion] || mockQuestions[0];
  const answerStatus = currentQuestionData ? getAnswerStatus(currentQuestionData, currentQuestion) : 'unanswered';

  // Check if user originally answered correctly
  const isOriginallyCorrect = currentQuestionData &&
    currentQuestionData.userAnswer !== undefined &&
    currentQuestionData.userAnswer === currentQuestionData.correctAnswer;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Solutions</Text>
          <Text style={styles.questionCounter}>
            Question {currentQuestion + 1} of {questions.length}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowGrid(true)}
          >
            <Grid3X3 size={20} color={Colors.textSubtle} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Reattempt Toggle */}
        <View style={styles.reattemptContainer}>
          <Text style={styles.reattemptLabel}>Practice Mode</Text>
          <View style={styles.reattemptToggle}>
            <RotateCcw size={16} color={Colors.textSubtle} />
            <Switch
              value={reattemptMode}
              onValueChange={setReattemptMode}
              trackColor={{ false: Colors.muted, true: Colors.primaryLight }}
              thumbColor={reattemptMode ? Colors.primary : Colors.textSubtle}
              style={{ marginLeft: 8 }}
            />
          </View>
        </View>

        {/* Question Card */}
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={styles.questionMeta}>
              <View style={styles.subjectBadge}>
                <BookOpen size={12} color={Colors.primary} />
                <Text style={styles.subjectText}>
                  {currentQuestionData.subject}
                </Text>
              </View>
              <View
                style={[
                  styles.difficultyBadge,
                  {
                    backgroundColor:
                      currentQuestionData.difficulty === 'Easy'
                        ? Colors.badgeSuccessBg
                        : currentQuestionData.difficulty === 'Medium'
                        ? Colors.premiumBadge
                        : Colors.badgeDangerBg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    {
                      color:
                        currentQuestionData.difficulty === 'Easy'
                          ? Colors.success
                          : currentQuestionData.difficulty === 'Medium'
                          ? Colors.premiumText
                          : Colors.danger,
                    },
                  ]}
                >
                  {currentQuestionData.difficulty}
                </Text>
              </View>
            </View>

            <View style={styles.statusContainer}>
              {getStatusIcon(answerStatus)}
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(answerStatus) },
                ]}
              >
                {getStatusText(answerStatus)}
              </Text>
            </View>
          </View>

          <Text style={styles.questionText}>
            {currentQuestionData.question}
          </Text>

          <View style={styles.timeContainer}>
            <Clock size={14} color={Colors.textSubtle} />
            <Text style={styles.timeText}>
              Time spent:{' '}
              {currentQuestionData.timeSpent > 0
                ? formatTime(currentQuestionData.timeSpent)
                : 'Not attempted'}
            </Text>
          </View>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestionData.options.map((option, index) => {
            const isCorrect = index === currentQuestionData.correctAnswer;
            const isUserAnswer = index === currentQuestionData.userAnswer;
            const isReattemptAnswer = index === reattemptAnswers[currentQuestion];
            const showOriginalAnswers = !reattemptMode || hasReattempted[currentQuestion] || isOriginallyCorrect;

            // In reattempt mode, show reattempt answer styling if user has reattempted
            const showCorrectStyling = showOriginalAnswers && isCorrect;
            const showIncorrectStyling = showOriginalAnswers && isUserAnswer && !isCorrect;
            const showReattemptCorrect = reattemptMode && hasReattempted[currentQuestion] && isReattemptAnswer && isCorrect;
            const showReattemptIncorrect = reattemptMode && hasReattempted[currentQuestion] && isReattemptAnswer && !isCorrect;

            const optionComponent = reattemptMode && !hasReattempted[currentQuestion] && !isOriginallyCorrect ? (
              // Clickable option for reattempt
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionCard,
                  isReattemptAnswer && styles.selectedOption,
                ]}
                onPress={() => handleReattemptAnswer(currentQuestion, index)}
              >
                <View
                  style={[
                    styles.optionIndicator,
                    isReattemptAnswer && styles.selectedIndicator,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLetter,
                      isReattemptAnswer && styles.optionLetterActive,
                    ]}
                  >
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.optionText,
                    isReattemptAnswer && styles.selectedOptionText,
                  ]}
                >
                  {option}
                </Text>

                {isReattemptAnswer && <CheckCircle size={20} color={Colors.primary} />}
              </TouchableOpacity>
            ) : (
              // Regular display mode or after reattempt
              <View
                key={index}
                style={[
                  styles.optionCard,
                  showCorrectStyling && styles.correctOption,
                  showIncorrectStyling && styles.incorrectOption,
                  showReattemptCorrect && styles.reattemptCorrectOption,
                  showReattemptIncorrect && styles.reattemptIncorrectOption,
                ]}
              >
                <View
                  style={[
                    styles.optionIndicator,
                    showCorrectStyling && styles.correctIndicator,
                    showIncorrectStyling && styles.incorrectIndicator,
                    showReattemptCorrect && styles.correctIndicator,
                    showReattemptIncorrect && styles.incorrectIndicator,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLetter,
                      (showCorrectStyling || showIncorrectStyling || showReattemptCorrect || showReattemptIncorrect) &&
                        styles.optionLetterActive,
                    ]}
                  >
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.optionText,
                    showCorrectStyling && styles.correctOptionText,
                    showIncorrectStyling && styles.incorrectOptionText,
                    showReattemptCorrect && styles.correctOptionText,
                    showReattemptIncorrect && styles.incorrectOptionText,
                  ]}
                >
                  {option}
                </Text>

                {showCorrectStyling && <CheckCircle size={20} color={Colors.success} />}
                {showIncorrectStyling && <XCircle size={20} color={Colors.danger} />}
                {showReattemptCorrect && <CheckCircle size={20} color={Colors.success} />}
                {showReattemptIncorrect && <XCircle size={20} color={Colors.danger} />}
              </View>
            );

            return optionComponent;
          })}
        </View>

        {/* Reattempt Status */}
        {reattemptMode && hasReattempted[currentQuestion] && (
          <View style={styles.reattemptStatusCard}>
            <Text style={styles.reattemptStatusTitle}>Reattempt Result:</Text>
            <View style={styles.reattemptStatusRow}>
              {getReattemptStatus(currentQuestion) === 'correct' ? (
                <>
                  <CheckCircle size={20} color={Colors.success} />
                  <Text style={[styles.reattemptStatusText, { color: Colors.success }]}>
                    Correct! Well done.
                  </Text>
                </>
              ) : (
                <>
                  <XCircle size={20} color={Colors.danger} />
                  <Text style={[styles.reattemptStatusText, { color: Colors.danger }]}>
                    Incorrect. The correct answer is shown above.
                  </Text>
                </>
              )}
            </View>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => resetReattempt(currentQuestion)}
            >
              <RotateCcw size={16} color={Colors.primary} />
              <Text style={styles.resetButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Already Correct Card */}
        {reattemptMode && isOriginallyCorrect && !hasReattempted[currentQuestion] && (
          <View style={styles.alreadyCorrectCard}>
            <View style={styles.alreadyCorrectHeader}>
              <CheckCircle size={24} color={Colors.success} />
              <Text style={styles.alreadyCorrectTitle}>Already Correct!</Text>
            </View>
            <Text style={styles.alreadyCorrectText}>
              You answered this question correctly. No need to reattempt. View the explanation below.
            </Text>
          </View>
        )}

        {/* Show Answer Button */}
        {/* Only show explanation button if not in reattempt mode, or if user has reattempted, or if originally correct */}
        {(!reattemptMode || hasReattempted[currentQuestion] || isOriginallyCorrect) && (
          <TouchableOpacity
            style={styles.showAnswerButton}
            onPress={() => toggleShowAnswer(currentQuestion)}
          >
            {showAnswers[currentQuestion] ? (
              <EyeOff size={20} color={Colors.primary} />
            ) : (
              <Eye size={20} color={Colors.primary} />
            )}
            <Text style={styles.showAnswerText}>
              {showAnswers[currentQuestion]
                ? 'Hide Explanation'
                : 'Show Explanation'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Reattempt Instructions */}
        {reattemptMode && !hasReattempted[currentQuestion] && !isOriginallyCorrect && (
          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>Reattempt Mode</Text>
            <Text style={styles.instructionText}>
              Select an answer above to see if you got it right. The explanation will be shown after you make your choice.
            </Text>
          </View>
        )}

        {/* Explanation */}
        {showAnswers[currentQuestion] && (!reattemptMode || hasReattempted[currentQuestion] || isOriginallyCorrect) && (
          <View style={styles.explanationCard}>
            <Text style={styles.explanationTitle}>Explanation</Text>
            <RenderHTML
              contentWidth={width - 80}
              source={{ html: currentQuestionData.explanation || '<p>No explanation available.</p>' }}
              tagsStyles={{
                body: {
                  color: Colors.textPrimary,
                  fontSize: 16,
                  lineHeight: 24,
                },
                p: {
                  marginBottom: 8,
                  color: Colors.textPrimary,
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
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationFooter}>
        <TouchableOpacity
          style={[
            styles.navFooterButton,
            currentQuestion === 0 && styles.navFooterButtonDisabled,
          ]}
          onPress={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
        >
          <ChevronLeft
            size={20}
            color={currentQuestion === 0 ? Colors.gray400 : Colors.textPrimary}
          />
          <Text
            style={[
              styles.navFooterButtonText,
              currentQuestion === 0 && styles.navFooterButtonTextDisabled,
            ]}
          >
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navFooterButton,
            currentQuestion === questions.length - 1 &&
              styles.navFooterButtonDisabled,
          ]}
          onPress={() =>
            setCurrentQuestion((prev) =>
              Math.min(questions.length - 1, prev + 1)
            )
          }
          disabled={currentQuestion === questions.length - 1}
        >
          <Text
            style={[
              styles.navFooterButtonText,
              currentQuestion === questions.length - 1 &&
                styles.navFooterButtonTextDisabled,
            ]}
          >
            Next
          </Text>
          <ChevronRight
            size={20}
            color={
              currentQuestion === questions.length - 1 ? Colors.gray400 : Colors.textPrimary
            }
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    color: Colors.textSubtle,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    color: Colors.textSubtle,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.muted,
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.light,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  questionCounter: {
    fontSize: 12,
    color: Colors.textSubtle,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  reattemptToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reattemptContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
    marginBottom: 16,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  reattemptLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  navigationContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.muted,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: Colors.cardBackground,
  },
  activeNavButton: {
    backgroundColor: Colors.primary,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeNavButtonText: {
    color: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
    color: Colors.textPrimary,
  },
  gridClose: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSubtle,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSubtle,
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
    backgroundColor: Colors.cardBackground,
    margin: 4,
  },
  gridItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  questionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.chip,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  subjectText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.textPrimary,
    lineHeight: 26,
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: Colors.textSubtle,
    marginLeft: 4,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.muted,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  correctOption: {
    borderColor: Colors.success,
    backgroundColor: Colors.badgeSuccessBg,
  },
  incorrectOption: {
    borderColor: Colors.danger,
    backgroundColor: Colors.badgeDangerBg,
  },
  optionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  correctIndicator: {
    backgroundColor: Colors.success,
  },
  incorrectIndicator: {
    backgroundColor: Colors.danger,
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSubtle,
  },
  optionLetterActive: {
    color: Colors.white,
  },
  optionText: {
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 22,
  },
  correctOptionText: {
    color: Colors.success,
    fontWeight: '500',
  },
  incorrectOptionText: {
    color: Colors.danger,
  },
  selectedOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.chip,
  },
  selectedIndicator: {
    backgroundColor: Colors.primary,
  },
  selectedOptionText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  reattemptCorrectOption: {
    borderColor: Colors.success,
    backgroundColor: Colors.badgeSuccessBg,
  },
  reattemptIncorrectOption: {
    borderColor: Colors.danger,
    backgroundColor: Colors.badgeDangerBg,
  },
  showAnswerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  showAnswerText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 8,
  },
  explanationCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 12,
  },
  explanationText: {
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  reattemptStatusCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reattemptStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  reattemptStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reattemptStatusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 6,
  },
  instructionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.warning,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  navigationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.muted,
  },
  navFooterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.light,
  },
  navFooterButtonDisabled: {
    opacity: 0.5,
  },
  navFooterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  navFooterButtonTextDisabled: {
    color: Colors.gray400,
  },
  // Already Correct Card Styles
  alreadyCorrectCard: {
    backgroundColor: Colors.badgeSuccessBg || '#d1fae5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alreadyCorrectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alreadyCorrectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
    marginLeft: 8,
  },
  alreadyCorrectText: {
    fontSize: 14,
    color: Colors.success,
    lineHeight: 20,
  },
});
