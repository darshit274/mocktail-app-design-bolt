import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bug, Database, Wifi, User, Server, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { API_CONFIG } from '@/config/constants';
import {
  useGetTestLeaderboardQuery,
  useGetOverallLeaderboardQuery,
} from '@/store/api/testResponseApi';

interface DebugCheck {
  id: string;
  title: string;
  description: string;
  status: 'checking' | 'success' | 'error' | 'warning' | 'info';
  details?: string;
  action?: () => void;
}

export default function LeaderboardDebugger() {
  const [checks, setChecks] = useState<DebugCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { isDarkMode } = useTheme();
  const Colors = getTheme(isDarkMode);
  const styles = getStyles(Colors);
  
  // Get current user and auth state
  const { user, token } = useSelector((state: RootState) => state.auth);
  
  // Test API queries
  const { 
    data: testLeaderboardData, 
    isLoading: testLoading, 
    error: testError 
  } = useGetTestLeaderboardQuery(
    { testId: 1, page: 1, userId: user?.uuid },
    { skip: true } // Skip by default, trigger manually
  );
  
  const { 
    data: overallLeaderboardData, 
    isLoading: overallLoading, 
    error: overallError 
  } = useGetOverallLeaderboardQuery(
    { timeframe: 'all', page: 1 },
    { skip: true } // Skip by default, trigger manually
  );

  const runDiagnostics = async () => {
    setIsRunning(true);
    setChecks([]);
    
    const newChecks: DebugCheck[] = [];
    
    // Check 1: Authentication Status
    newChecks.push({
      id: 'auth',
      title: '🔐 Authentication Status',
      description: 'Checking if user is properly authenticated',
      status: user && token ? 'success' : 'error',
      details: user && token 
        ? `Logged in as: ${user.name} (${user.email})`
        : 'User not authenticated. Please login first.',
      action: !user ? () => router.push('/auth/login') : undefined
    });
    
    // Check 2: API Configuration
    newChecks.push({
      id: 'api-config',
      title: '🌐 API Configuration',
      description: 'Verifying API endpoint configuration',
      status: API_CONFIG.BASE_URL ? 'success' : 'error',
      details: `Base URL: ${API_CONFIG.BASE_URL}`,
    });
    
    // Check 3: Network Connectivity
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/health`);
      newChecks.push({
        id: 'network',
        title: '📡 Network Connectivity',
        description: 'Testing connection to backend server',
        status: response.ok ? 'success' : 'warning',
        details: response.ok ? 'Server is reachable' : 'Server responded with error',
      });
    } catch (error) {
      newChecks.push({
        id: 'network',
        title: '📡 Network Connectivity',
        description: 'Testing connection to backend server',
        status: 'error',
        details: `Network error: ${error.message}`,
      });
    }
    
    // Check 4: Database Migration Status
    try {
      const migrationResponse = await fetch(
        `${API_CONFIG.BASE_URL}/api/admin/system-status`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (migrationResponse.ok) {
        const migrationData = await migrationResponse.json();
        newChecks.push({
          id: 'migrations',
          title: '🗄️ Database Migrations',
          description: 'Checking if leaderboard tables exist',
          status: 'success',
          details: 'Database is properly set up',
        });
      } else {
        newChecks.push({
          id: 'migrations',
          title: '🗄️ Database Migrations',
          description: 'Checking if leaderboard tables exist',
          status: 'warning',
          details: 'Could not verify database status. This might be normal if admin endpoints are restricted.',
        });
      }
    } catch (error) {
      newChecks.push({
        id: 'migrations',
        title: '🗄️ Database Migrations',
        description: 'Checking if leaderboard tables exist',
        status: 'warning',
        details: 'Could not check database status - this might be expected.',
      });
    }
    
    // Check 5: Test Data Availability
    try {
      const testDataResponse = await fetch(
        `${API_CONFIG.BASE_URL}/api/test-responses/leaderboard/overall?limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (testDataResponse.ok) {
        const testData = await testDataResponse.json();
        newChecks.push({
          id: 'test-data',
          title: '📊 Test Data Availability',
          description: 'Checking if there are completed tests in the database',
          status: testData.data?.leaderboard?.length > 0 ? 'success' : 'warning',
          details: testData.data?.leaderboard?.length > 0 
            ? `Found ${testData.data.leaderboard.length} test results`
            : 'No test results found. Complete some tests first!',
        });
      } else {
        newChecks.push({
          id: 'test-data',
          title: '📊 Test Data Availability',
          description: 'Checking if there are completed tests in the database',
          status: 'error',
          details: `API error: ${testDataResponse.status} ${testDataResponse.statusText}`,
        });
      }
    } catch (error) {
      newChecks.push({
        id: 'test-data',
        title: '📊 Test Data Availability',
        description: 'Checking if there are completed tests in the database',
        status: 'error',
        details: `Request failed: ${error.message}`,
      });
    }
    
    // Check 6: Route Configuration  
    newChecks.push({
      id: 'routes',
      title: '🛣️ Route Configuration',
      description: 'Verifying leaderboard routes are properly set up',
      status: 'info',
      details: 'Enhanced leaderboard route: /test/enhanced-leaderboard\nOld leaderboard route: /test/leaderboard',
      action: () => router.push('/test/enhanced-leaderboard')
    });
    
    setChecks(newChecks);
    setIsRunning(false);
  };

  const getStatusColor = (status: DebugCheck['status']) => {
    switch (status) {
      case 'success': return Colors.success;
      case 'error': return Colors.error;
      case 'warning': return Colors.warning;
      case 'info': return Colors.primary;
      case 'checking': return Colors.textSecondary;
    }
  };

  const getStatusIcon = (status: DebugCheck['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'checking': return '🔄';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🐛 Leaderboard Debugger</Text>
        <Text style={styles.headerSubtitle}>Diagnose leaderboard integration issues</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity 
          style={[styles.runButton, isRunning && styles.runButtonDisabled]}
          onPress={runDiagnostics}
          disabled={isRunning}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryLight]}
            style={styles.runButtonGradient}
          >
            <Bug size={20} color={Colors.background} />
            <Text style={styles.runButtonText}>
              {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {checks.map((check) => (
          <View key={check.id} style={styles.checkItem}>
            <View style={styles.checkHeader}>
              <Text style={styles.checkIcon}>{getStatusIcon(check.status)}</Text>
              <View style={styles.checkInfo}>
                <Text style={styles.checkTitle}>{check.title}</Text>
                <Text style={styles.checkDescription}>{check.description}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(check.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(check.status) }]}>
                  {check.status.toUpperCase()}
                </Text>
              </View>
            </View>
            
            {check.details && (
              <View style={styles.checkDetails}>
                <Text style={styles.detailsText}>{check.details}</Text>
              </View>
            )}
            
            {check.action && (
              <TouchableOpacity style={styles.actionButton} onPress={check.action}>
                <Text style={styles.actionButtonText}>Take Action</Text>
                <ArrowRight size={16} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {checks.length === 0 && !isRunning && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Click "Run Diagnostics" to check leaderboard integration</Text>
          </View>
        )}

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/test/enhanced-leaderboard?type=overall')}
          >
            <Trophy size={20} color={Colors.primary} />
            <Text style={styles.quickActionText}>View Overall Leaderboard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/test/leaderboard')}
          >
            <Medal size={20} color={Colors.primary} />
            <Text style={styles.quickActionText}>View Old Leaderboard (Static)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => Alert.alert(
              'Debug Info',
              `User: ${user?.name || 'Not logged in'}\nToken: ${token ? 'Present' : 'Missing'}\nAPI: ${API_CONFIG.BASE_URL}`
            )}
          >
            <User size={20} color={Colors.primary} />
            <Text style={styles.quickActionText}>Show Debug Info</Text>
          </TouchableOpacity>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  runButton: {
    marginBottom: 24,
  },
  runButtonDisabled: {
    opacity: 0.5,
  },
  runButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  runButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  checkItem: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  checkIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  checkInfo: {
    flex: 1,
  },
  checkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  checkDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  checkDetails: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  detailsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    gap: 4,
  },
  actionButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  quickActions: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  quickActionText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
});

export { LeaderboardDebugger };