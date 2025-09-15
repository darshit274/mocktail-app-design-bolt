import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Trophy, Award, Target, Clock, CheckCircle, XCircle, AlertCircle, 
  TrendingUp, Users, ChevronRight, ChevronLeft, Star, Share
} from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetTestResultsQuery } from '@/store/api/testResponseApi';

export default function EnhancedResults() {
  const params = useLocalSearchParams();
  const { sessionId, testName } = params;
  
  const [showDetailedAnswers, setShowDetailedAnswers] = useState(false);
  
  const { theme } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(theme);
  const styles = getStyles(Colors);
  
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Get detailed test results
  const { data, isLoading, error } = useGetTestResultsQuery(sessionId as string, {
    skip: !sessionId
  });
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return Colors.success;
    if (percentage >= 60) return Colors.warning;
    return Colors.error;
  };
  
  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { label: 'Excellent', color: Colors.success };
    if (percentage >= 80) return { label: 'Very Good', color: Colors.success };
    if (percentage >= 70) return { label: 'Good', color: Colors.warning };
    if (percentage >= 60) return { label: 'Average', color: Colors.warning };
    if (percentage >= 40) return { label: 'Below Average', color: Colors.error };
    return { label: 'Needs Improvement', color: Colors.error };
  };
  
  const handleViewLeaderboard = () => {
    if (data?.data.session.test_id) {
      router.push({
        pathname: '/test/leaderboard',
        params: {
          type: 'test',
          id: data.data.session.test_id,
          title: `${testName} Leaderboard`
        }
      });
    }
  };
  
  const handleViewSolutions = () => {
    router.push({
      pathname: '/test/solutions',
      params: {
        sessionId,
        testName
      }
    });
  };
  
  const handleRetakeTest = () => {
    Alert.alert(
      'Retake Test',
      'Are you sure you want to retake this test? This will start a new session.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Retake', 
          style: 'default', 
          onPress: () => {
            // Navigate back to test with retake flag
            router.replace({
              pathname: '/test/enhanced-quiz',
              params: {
                testId: data?.data.session.test_id,
                retake: 'true'
              }
            });
          }
        }
      ]
    );
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading results...</Text>
      </SafeAreaView>
    );
  }
  
  if (error || !data?.success) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <AlertCircle size={48} color={Colors.error} />
        <Text style={styles.errorText}>Unable to load test results</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  const session = data.data.session;
  const leaderboardEntry = data.data.leaderboard_entry;
  const answers = data.data.answers;
  
  const percentage = leaderboardEntry?.percentage || 0;
  const performance = getPerformanceLevel(percentage);
  const scoreColor = getScoreColor(percentage);
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.testTitle}>{testName || 'Test Results'}</Text>
            <Text style={styles.completedAt}>
              Completed on {new Date(session.completed_at || '').toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        {/* Score Card */}
        <View style={styles.scoreCard}>
          <LinearGradient
            colors={[scoreColor, `${scoreColor}90`]}
            style={styles.scoreGradient}
          >
            <View style={styles.scoreContent}>
              <View style={styles.scoreMain}>
                <Trophy size={32} color={Colors.background} />
                <Text style={styles.scoreValue}>{percentage.toFixed(1)}%</Text>
                <Text style={styles.scoreLabel}>Your Score</Text>
              </View>
              
              <View style={styles.scoreDetails}>
                <View style={styles.scoreDetail}>
                  <Text style={styles.scoreDetailValue}>{leaderboardEntry?.score || 0}</Text>
                  <Text style={styles.scoreDetailLabel}>Points</Text>
                </View>
                <View style={styles.scoreDetail}>
                  <Text style={styles.scoreDetailValue}>#{leaderboardEntry?.rank || '-'}</Text>
                  <Text style={styles.scoreDetailLabel}>Rank</Text>
                </View>
                <View style={styles.scoreDetail}>
                  <Text style={styles.scoreDetailValue}>{leaderboardEntry?.percentile || 0}th</Text>
                  <Text style={styles.scoreDetailLabel}>Percentile</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
        
        {/* Performance Badge */}
        <View style={styles.performanceCard}>
          <View style={[styles.performanceBadge, { backgroundColor: `${performance.color}20` }]}>
            <Star size={20} color={performance.color} />
            <Text style={[styles.performanceText, { color: performance.color }]}>
              {performance.label}
            </Text>
          </View>
        </View>
        
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <CheckCircle size={24} color={Colors.success} />
              <Text style={styles.statValue}>{leaderboardEntry?.correct_answers || 0}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            
            <View style={styles.statCard}>
              <XCircle size={24} color={Colors.error} />
              <Text style={styles.statValue}>{leaderboardEntry?.wrong_answers || 0}</Text>
              <Text style={styles.statLabel}>Wrong</Text>
            </View>
            
            <View style={styles.statCard}>
              <AlertCircle size={24} color={Colors.textSecondary} />
              <Text style={styles.statValue}>{leaderboardEntry?.unanswered || 0}</Text>
              <Text style={styles.statLabel}>Skipped</Text>
            </View>
            
            <View style={styles.statCard}>
              <Clock size={24} color={Colors.primary} />
              <Text style={styles.statValue}>
                {formatTime(leaderboardEntry?.time_taken_seconds || 0)}
              </Text>
              <Text style={styles.statLabel}>Time Taken</Text>
            </View>
          </View>
        </View>
        
        {/* Progress Breakdown */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Answer Breakdown</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressSegment, 
                { 
                  width: `${((leaderboardEntry?.correct_answers || 0) / (leaderboardEntry?.total_questions || 1)) * 100}%`,
                  backgroundColor: Colors.success 
                }
              ]} 
            />
            <View 
              style={[
                styles.progressSegment, 
                { 
                  width: `${((leaderboardEntry?.wrong_answers || 0) / (leaderboardEntry?.total_questions || 1)) * 100}%`,
                  backgroundColor: Colors.error 
                }
              ]} 
            />
            <View 
              style={[
                styles.progressSegment, 
                { 
                  width: `${((leaderboardEntry?.unanswered || 0) / (leaderboardEntry?.total_questions || 1)) * 100}%`,
                  backgroundColor: Colors.textSecondary 
                }
              ]} 
            />
          </View>
          <View style={styles.progressLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: Colors.success }]} />
              <Text style={styles.legendText}>
                Correct ({leaderboardEntry?.correct_answers || 0})
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: Colors.error }]} />
              <Text style={styles.legendText}>
                Wrong ({leaderboardEntry?.wrong_answers || 0})
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: Colors.textSecondary }]} />
              <Text style={styles.legendText}>
                Skipped ({leaderboardEntry?.unanswered || 0})
              </Text>
            </View>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.primaryAction} onPress={handleViewLeaderboard}>
            <TrendingUp size={20} color={Colors.background} />
            <Text style={styles.primaryActionText}>View Leaderboard</Text>
            <ChevronRight size={20} color={Colors.background} />
          </TouchableOpacity>
          
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryAction} onPress={handleViewSolutions}>
              <Target size={20} color={Colors.primary} />
              <Text style={styles.secondaryActionText}>View Solutions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryAction} onPress={handleRetakeTest}>
              <Award size={20} color={Colors.primary} />
              <Text style={styles.secondaryActionText}>Retake Test</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Detailed Performance Analysis */}
        <View style={styles.analysisCard}>
          <Text style={styles.analysisTitle}>Performance Analysis</Text>
          
          <View style={styles.analysisItem}>
            <View style={styles.analysisIcon}>
              <Target size={16} color={Colors.primary} />
            </View>
            <View style={styles.analysisContent}>
              <Text style={styles.analysisLabel}>Accuracy Rate</Text>
              <Text style={styles.analysisValue}>
                {leaderboardEntry?.total_questions ? 
                  (((leaderboardEntry.correct_answers || 0) / leaderboardEntry.total_questions) * 100).toFixed(1) : 0}%
              </Text>
            </View>
          </View>
          
          <View style={styles.analysisItem}>
            <View style={styles.analysisIcon}>
              <Clock size={16} color={Colors.warning} />
            </View>
            <View style={styles.analysisContent}>
              <Text style={styles.analysisLabel}>Average Time per Question</Text>
              <Text style={styles.analysisValue}>
                {leaderboardEntry?.total_questions ? 
                  Math.round((leaderboardEntry.time_taken_seconds || 0) / leaderboardEntry.total_questions) : 0}s
              </Text>
            </View>
          </View>
          
          <View style={styles.analysisItem}>
            <View style={styles.analysisIcon}>
              <Users size={16} color={Colors.success} />
            </View>
            <View style={styles.analysisContent}>
              <Text style={styles.analysisLabel}>Better Than</Text>
              <Text style={styles.analysisValue}>
                {leaderboardEntry?.percentile || 0}% of test takers
              </Text>
            </View>
          </View>
        </View>
        
        {/* Motivational Message */}
        <View style={styles.motivationCard}>
          {percentage >= 80 ? (
            <>
              <Trophy size={24} color={Colors.success} />
              <Text style={styles.motivationTitle}>Excellent Performance! 🎉</Text>
              <Text style={styles.motivationText}>
                You've demonstrated strong understanding of the subject matter. Keep up the great work!
              </Text>
            </>
          ) : percentage >= 60 ? (
            <>
              <Award size={24} color={Colors.warning} />
              <Text style={styles.motivationTitle}>Good Effort! 👍</Text>
              <Text style={styles.motivationText}>
                You're on the right track. Review the solutions to strengthen your weak areas.
              </Text>
            </>
          ) : (
            <>
              <Target size={24} color={Colors.error} />
              <Text style={styles.motivationTitle}>Keep Practicing! 💪</Text>
              <Text style={styles.motivationText}>
                Don't be discouraged. Every attempt is a learning opportunity. Study the solutions and try again!
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  content: {
    flex: 1,
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
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  testTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  completedAt: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scoreCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  scoreGradient: {
    padding: 24,
  },
  scoreContent: {
    alignItems: 'center',
  },
  scoreMain: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.background,
    marginTop: 8,
  },
  scoreLabel: {
    fontSize: 16,
    color: Colors.background,
    opacity: 0.9,
    marginTop: 4,
  },
  scoreDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  scoreDetail: {
    alignItems: 'center',
  },
  scoreDetailValue: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.background,
  },
  scoreDetailLabel: {
    fontSize: 12,
    color: Colors.background,
    opacity: 0.8,
    marginTop: 4,
  },
  performanceCard: {
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  performanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  performanceText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    margin: 16,
    padding: 20,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  progressBar: {
    flexDirection: 'row',
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginBottom: 12,
  },
  progressSegment: {
    height: '100%',
    borderRadius: 4,
  },
  progressLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actionsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
    flex: 1,
    textAlign: 'center',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  analysisCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    margin: 16,
    padding: 20,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  analysisItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  analysisIcon: {
    width: 32,
    height: 32,
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  analysisContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analysisLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  motivationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    margin: 16,
    padding: 20,
    alignItems: 'center',
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  motivationText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export { EnhancedResults };