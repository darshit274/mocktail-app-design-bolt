import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Flag, ChevronLeft, ChevronRight, Grid3x3 as Grid3X3, Pause, Play, Globe, BookOpen, AlertCircle, CheckCircle } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useStartTestSessionMutation,
  useSaveAnswerMutation,
  useSubmitTestMutation,
  TestSession as NewTestSession,
  StartTestSessionRequest,
  SaveAnswerRequest
} from '@/store/api/testResponseApi';
import { useTestNotifications } from '@/hooks/useTestNotifications';
import {
  useGetDynamicQuestionsQuery,
  DynamicQuestion
} from '@/store/api/dynamicHierarchyApi';

interface QuestionState {
  id: number;
  visited: boolean;
  answered: boolean;
  flagged: boolean;
  selectedOption?: 'A' | 'B' | 'C' | 'D';
  timeSpent: number;
}

export default function EnhancedQuizComponent() {
  console.log('🚀 Enhanced Quiz Component Mounted');
  
  const params = useLocalSearchParams();
  const { testId, categoryUuid, categoryName, seriesUuid, language } = params;
  
  // State management
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isPaused, setIsPaused] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [questions, setQuestions] = useState<DynamicQuestion[]>([]);
  const [session, setSession] = useState<NewTestSession | null>(null);
  const [questionStates, setQuestionStates] = useState<{ [key: number]: QuestionState }>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  
  // Theme and language
  const { isDarkMode } = useTheme();
  const Colors = getTheme(isDarkMode);
  const { t } = useLanguage();
  const styles = getStyles(Colors);
  
  // Redux state
  const { user, token } = useSelector((state: RootState) => state.auth);
  
  // API hooks
  const [startTestSession, { isLoading: startingTest }] = useStartTestSessionMutation();
  const [saveAnswer, { isLoading: savingAnswer }] = useSaveAnswerMutation();
  const [submitTest, { isLoading: submittingTest }] = useSubmitTestMutation();
  
  // Test notification integration
  const { processTestCompletion, sendMotivationalMessage } = useTestNotifications();
  
  // Get questions for dynamic hierarchy approach
  const { data: dynamicQuestionsData, isLoading: loadingDynamicQuestions } = useGetDynamicQuestionsQuery({
    categoryUuid: categoryUuid as string,
    language: (language as 'english' | 'gujarati') || 'english',
    shuffle: true
  }, {
    skip: !categoryUuid,
  });

  // =====================
  // INITIALIZATION EFFECTS
  // =====================
  
  useEffect(() => {
    if (dynamicQuestionsData?.success && dynamicQuestionsData.data.questions) {
      const questionsList = dynamicQuestionsData.data.questions;
      setQuestions(questionsList);
      
      // Initialize question states
      const initialStates: { [key: number]: QuestionState } = {};
      questionsList.forEach((q) => {
        initialStates[q.id] = {
          id: q.id,
          visited: false,
          answered: false,
          flagged: false,
          timeSpent: 0
        };
      });
      setQuestionStates(initialStates);
      
      // Start test session
      if (user?.uuid && testId) {
        startTestSessionFlow();
      }
    }
  }, [dynamicQuestionsData]);

  // Timer effect
  useEffect(() => {
    if (session && timeRemaining > 0 && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [session, timeRemaining, isPaused]);

  // Auto-save effect
  useEffect(() => {
    if (session && currentQuestion >= 0) {
      const currentQ = questions[currentQuestion];
      if (currentQ) {
        markQuestionAsVisited(currentQ.id);
        setQuestionStartTime(Date.now());
      }
    }
  }, [currentQuestion, session]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, []);

  // =====================
  // SESSION MANAGEMENT
  // =====================

  const startTestSessionFlow = async () => {
    try {
      if (!user?.uuid || !testId) {
        Alert.alert('Error', 'Missing user information or test ID');
        return;
      }

      const request: StartTestSessionRequest = {
        test_id: parseInt(testId as string),
        user_id: user.uuid
      };

      console.log('🚀 Starting test session:', request);
      
      const response = await startTestSession(request).unwrap();
      console.log('✅ Test session started:', response);
      
      if (response.success) {
        setSession(response.data.session);
        setTimeRemaining(response.data.session.remaining_time_seconds || response.data.test.duration_minutes * 60);
      }
    } catch (error) {
      console.error('❌ Failed to start test session:', error);
      Alert.alert('Error', 'Failed to start test session. Please try again.');
    }
  };

  // =====================
  // ANSWER MANAGEMENT
  // =====================

  const handleAnswerSelect = async (option: 'A' | 'B' | 'C' | 'D') => {
    if (!session || currentQuestion < 0 || currentQuestion >= questions.length) return;

    const question = questions[currentQuestion];
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    // Update local state immediately
    setQuestionStates(prev => ({
      ...prev,
      [question.id]: {
        ...prev[question.id],
        selectedOption: option,
        answered: true,
        timeSpent: timeSpent
      }
    }));

    // Auto-save answer
    await saveAnswerToServer(question.id, option, timeSpent);
  };

  const saveAnswerToServer = async (questionId: number, selectedOption: 'A' | 'B' | 'C' | 'D', timeSpent: number) => {
    if (!session) return;

    try {
      const request: SaveAnswerRequest = {
        test_session_id: session.id,
        question_id: questionId,
        selected_option: selectedOption,
        time_spent: timeSpent,
        is_flagged: questionStates[questionId]?.flagged || false
      };

      await saveAnswer(request).unwrap();
      console.log('✅ Answer saved for question:', questionId);
    } catch (error) {
      console.error('❌ Failed to save answer:', error);
      // Don't show error to user for auto-save failures
    }
  };

  const markQuestionAsVisited = (questionId: number) => {
    setQuestionStates(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        visited: true
      }
    }));
  };

  const toggleFlag = async (questionId: number) => {
    const currentState = questionStates[questionId];
    const newFlagState = !currentState?.flagged;

    setQuestionStates(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        flagged: newFlagState
      }
    }));

    // Save flag state to server
    if (session && currentState?.selectedOption) {
      await saveAnswerToServer(questionId, currentState.selectedOption, currentState.timeSpent);
    }
  };

  // =====================
  // NAVIGATION
  // =====================

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestion(index);
      setShowGrid(false);
    }
  };

  const goToPrevious = () => {
    if (currentQuestion > 0) {
      goToQuestion(currentQuestion - 1);
    }
  };

  const goToNext = () => {
    if (currentQuestion < questions.length - 1) {
      goToQuestion(currentQuestion + 1);
    }
  };

  // =====================
  // TEST SUBMISSION
  // =====================

  const handleSubmitTest = () => {
    const answeredCount = Object.values(questionStates).filter(q => q.answered).length;
    const totalQuestions = questions.length;
    const unansweredCount = totalQuestions - answeredCount;

    if (unansweredCount > 0) {
      Alert.alert(
        'Incomplete Test',
        `You have ${unansweredCount} unanswered questions. Do you want to submit anyway?`,
        [
          { text: 'Review', style: 'cancel' },
          { text: 'Submit', style: 'destructive', onPress: submitTestConfirmed }
        ]
      );
    } else {
      Alert.alert(
        'Submit Test',
        'Are you sure you want to submit your test? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', style: 'default', onPress: submitTestConfirmed }
        ]
      );
    }
  };

  const submitTestConfirmed = async () => {
    if (!session) return;

    setIsSubmitting(true);
    try {
      const response = await submitTest({ test_session_id: session.id }).unwrap();
      console.log('✅ Test submitted successfully:', response);

      if (response.success) {
        // Process test completion notifications
        try {
          const testResult = response.data.results;
          const leaderboardEntry = response.data.leaderboardEntry;
          
          await processTestCompletion({
            score: testResult.finalScore,
            percentage: testResult.percentage,
            rank: leaderboardEntry?.current_rank || 0,
            previousBestRank: leaderboardEntry?.previous_best_rank,
            testName: categoryName as string || 'Test',
            category: categoryName as string,
            isPersonalBest: leaderboardEntry?.is_personal_best || false,
            consecutiveTests: leaderboardEntry?.consecutive_tests_above_threshold || 0,
            testId: testId as string,
            seriesId: seriesUuid as string,
            sessionId: session.id.toString(),
          });
          
          console.log('✅ Test completion notifications processed');
        } catch (notificationError) {
          console.error('❌ Failed to process notifications:', notificationError);
          // Don't block navigation if notifications fail
        }

        // Navigate to results page
        router.replace({
          pathname: '/test/results',
          params: {
            sessionId: session.id,
            score: response.data.results.finalScore,
            percentage: response.data.results.percentage,
            testName: categoryName || 'Test'
          }
        });
      }
    } catch (error) {
      console.error('❌ Failed to submit test:', error);
      Alert.alert('Error', 'Failed to submit test. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    Alert.alert(
      'Time Up!',
      'Your test time has ended. The test will be submitted automatically.',
      [{ text: 'OK', onPress: submitTestConfirmed }]
    );
  };

  // =====================
  // UTILITY FUNCTIONS
  // =====================

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (questionId: number) => {
    const state = questionStates[questionId];
    if (!state) return 'unvisited';
    
    if (state.flagged && state.answered) return 'flagged-answered';
    if (state.flagged) return 'flagged';
    if (state.answered) return 'answered';
    if (state.visited) return 'visited';
    return 'unvisited';
  };

  const getProgressStats = () => {
    const states = Object.values(questionStates);
    const answered = states.filter(q => q.answered).length;
    const flagged = states.filter(q => q.flagged).length;
    const visited = states.filter(q => q.visited).length;
    const total = questions.length;

    return { answered, flagged, visited, total, remaining: total - answered };
  };

  // =====================
  // LOADING AND ERROR STATES
  // =====================

  if (loadingDynamicQuestions || startingTest) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading test...</Text>
      </SafeAreaView>
    );
  }

  if (!questions.length || !session) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <AlertCircle size={48} color={Colors.error} />
        <Text style={styles.errorText}>Unable to load test questions</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentQ = questions[currentQuestion];
  const currentState = questionStates[currentQ?.id];
  const stats = getProgressStats();

  // =====================
  // RENDER
  // =====================

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.testTitle} numberOfLines={1}>
            {categoryName || 'Test'}
          </Text>
          <Text style={styles.questionCounter}>
            {currentQuestion + 1} of {questions.length}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.timerButton}>
            <Clock size={16} color={timeRemaining < 300 ? Colors.error : Colors.text} />
            <Text style={[styles.timerText, timeRemaining < 300 && styles.timerWarning]}>
              {formatTime(timeRemaining)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[styles.progressFill, { width: `${(currentQuestion + 1) / questions.length * 100}%` }]} 
          />
        </View>
        <View style={styles.progressStats}>
          <Text style={styles.progressText}>Answered: {stats.answered}</Text>
          <Text style={styles.progressText}>Flagged: {stats.flagged}</Text>
          <Text style={styles.progressText}>Remaining: {stats.remaining}</Text>
        </View>
      </View>

      {/* Question Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentQ && (
          <>
            <View style={styles.questionHeader}>
              <View style={styles.questionMeta}>
                <Text style={styles.questionNumber}>Question {currentQuestion + 1}</Text>
                <View style={styles.questionTags}>
                  <Text style={styles.marksTag}>+{currentQ.marks} marks</Text>
                  <Text style={[styles.difficultyTag, styles[`${currentQ.difficulty_level}Tag`]]}>
                    {currentQ.difficulty_level}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.flagButton, currentState?.flagged && styles.flaggedButton]}
                onPress={() => toggleFlag(currentQ.id)}
              >
                <Flag 
                  size={20} 
                  color={currentState?.flagged ? Colors.warning : Colors.textSecondary} 
                  fill={currentState?.flagged ? Colors.warning : 'transparent'}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>
                {selectedLanguage === 'Gujarati' && currentQ.question_text_gujarati 
                  ? currentQ.question_text_gujarati 
                  : currentQ.question_text}
              </Text>
            </View>

            <View style={styles.optionsContainer}>
              {['A', 'B', 'C', 'D'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    currentState?.selectedOption === option && styles.selectedOption
                  ]}
                  onPress={() => handleAnswerSelect(option as 'A' | 'B' | 'C' | 'D')}
                >
                  <View style={styles.optionContent}>
                    <View style={[
                      styles.optionCircle,
                      currentState?.selectedOption === option && styles.selectedOptionCircle
                    ]}>
                      <Text style={[
                        styles.optionLetter,
                        currentState?.selectedOption === option && styles.selectedOptionLetter
                      ]}>
                        {option}
                      </Text>
                    </View>
                    <Text style={[
                      styles.optionText,
                      currentState?.selectedOption === option && styles.selectedOptionText
                    ]}>
                      {selectedLanguage === 'Gujarati' && currentQ.options_gujarati 
                        ? currentQ.options_gujarati[option as keyof typeof currentQ.options_gujarati]
                        : currentQ.options[option as keyof typeof currentQ.options]}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <View style={styles.navButtons}>
          <TouchableOpacity
            style={[styles.navButton, currentQuestion === 0 && styles.navButtonDisabled]}
            onPress={goToPrevious}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft size={20} color={currentQuestion === 0 ? Colors.textSecondary : Colors.text} />
            <Text style={[styles.navButtonText, currentQuestion === 0 && styles.navButtonTextDisabled]}>
              Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridButton}
            onPress={() => setShowGrid(true)}
          >
            <Grid3X3 size={20} color={Colors.primary} />
            <Text style={styles.gridButtonText}>Grid</Text>
          </TouchableOpacity>

          {currentQuestion === questions.length - 1 ? (
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmitTest}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.background} />
              ) : (
                <>
                  <CheckCircle size={20} color={Colors.background} />
                  <Text style={styles.submitButtonText}>Submit</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.navButton}
              onPress={goToNext}
            >
              <Text style={styles.navButtonText}>Next</Text>
              <ChevronRight size={20} color={Colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Question Grid Modal */}
      {showGrid && (
        <View style={styles.modalOverlay}>
          <View style={styles.gridModal}>
            <View style={styles.gridHeader}>
              <Text style={styles.gridTitle}>Question Navigation</Text>
              <TouchableOpacity onPress={() => setShowGrid(false)}>
                <Text style={styles.gridCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.gridContent}>
              <View style={styles.grid}>
                {questions.map((q, index) => {
                  const status = getQuestionStatus(q.id);
                  return (
                    <TouchableOpacity
                      key={q.id}
                      style={[
                        styles.gridItem,
                        styles[`${status}GridItem`],
                        index === currentQuestion && styles.currentGridItem
                      ]}
                      onPress={() => goToQuestion(index)}
                    >
                      <Text style={[
                        styles.gridItemText,
                        styles[`${status}GridItemText`],
                        index === currentQuestion && styles.currentGridItemText
                      ]}>
                        {index + 1}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.gridLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendIcon, styles.answeredGridItem]} />
                <Text style={styles.legendText}>Answered</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIcon, styles.flaggedGridItem]} />
                <Text style={styles.legendText}>Flagged</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIcon, styles.visitedGridItem]} />
                <Text style={styles.legendText}>Visited</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIcon, styles.unvisitedGridItem]} />
                <Text style={styles.legendText}>Not Visited</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// =====================
// STYLES
// =====================

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  testTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  questionCounter: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderRadius: 20,
  },
  timerText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  timerWarning: {
    color: Colors.error,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 16,
  },
  questionMeta: {
    flex: 1,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  questionTags: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 8,
  },
  marksTag: {
    fontSize: 12,
    color: Colors.success,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  difficultyTag: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  easyTag: {
    color: Colors.success,
    backgroundColor: Colors.successLight,
  },
  mediumTag: {
    color: Colors.warning,
    backgroundColor: Colors.warningLight,
  },
  hardTag: {
    color: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  flagButton: {
    padding: 8,
    borderRadius: 8,
  },
  flaggedButton: {
    backgroundColor: Colors.warningLight,
  },
  questionContainer: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectedOptionCircle: {
    backgroundColor: Colors.primary,
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  selectedOptionLetter: {
    color: Colors.background,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text,
  },
  selectedOptionText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  bottomNavigation: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    gap: 6,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  navButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  gridButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    gap: 6,
  },
  gridButtonText: {
    fontSize: 16,
    color: Colors.primary,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.success,
    borderRadius: 8,
    gap: 6,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    color: Colors.background,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridModal: {
    backgroundColor: Colors.background,
    margin: 20,
    borderRadius: 16,
    maxHeight: '80%',
    width: '90%',
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  gridTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  gridCloseButton: {
    fontSize: 24,
    color: Colors.textSecondary,
  },
  gridContent: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gridItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
  unvisitedGridItem: {
    backgroundColor: Colors.border,
  },
  unvisitedGridItemText: {
    color: Colors.textSecondary,
  },
  visitedGridItem: {
    backgroundColor: Colors.surface,
    borderColor: Colors.textSecondary,
  },
  visitedGridItemText: {
    color: Colors.textSecondary,
  },
  answeredGridItem: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  answeredGridItemText: {
    color: Colors.success,
  },
  flaggedGridItem: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning,
  },
  flaggedGridItemText: {
    color: Colors.warning,
  },
  'flagged-answeredGridItem': {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  'flagged-answeredGridItemText': {
    color: Colors.primary,
  },
  currentGridItem: {
    borderColor: Colors.primary,
    borderWidth: 3,
  },
  currentGridItemText: {
    fontWeight: '700',
  },
  gridLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

export { EnhancedQuizComponent };