import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react-native';
import { router } from 'expo-router';
import logger from '@/utils/logger';
import { UI } from '@/utils/appConstants';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const errorLogger = logger.createLogger('ErrorBoundary');

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the console and any error reporting service
    errorLogger.error('Component error caught', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
    });

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  goHome = (): void => {
    this.resetError();
    router.replace('/(tabs)');
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default fallback UI
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <AlertTriangle size={64} color="#EF4444" />

            <Text style={styles.title}>Oops! Something went wrong</Text>

            <Text style={styles.message}>
              We're sorry for the inconvenience. The app encountered an unexpected error.
            </Text>

            {this.props.showDetails && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details:</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>

                {this.state.errorInfo && (
                  <>
                    <Text style={styles.errorTitle}>Component Stack:</Text>
                    <Text style={styles.errorText}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  </>
                )}
              </ScrollView>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={this.resetError}
                activeOpacity={0.7}
              >
                <RefreshCw size={20} color="#FFF" />
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={this.goHome}
                activeOpacity={0.7}
              >
                <Home size={20} color="#6B7280" />
                <Text style={styles.secondaryButtonText}>Go Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI.SPACING_XL,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: UI.SPACING_LG,
    marginBottom: UI.SPACING_SM,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: UI.SPACING_XL,
  },
  errorDetails: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#FEF2F2',
    borderRadius: UI.BORDER_RADIUS_MD,
    padding: UI.SPACING_MD,
    marginBottom: UI.SPACING_LG,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: UI.SPACING_XS,
    marginTop: UI.SPACING_SM,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  actions: {
    width: '100%',
    gap: UI.SPACING_MD,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: UI.BORDER_RADIUS_MD,
    paddingVertical: UI.SPACING_MD,
    paddingHorizontal: UI.SPACING_LG,
    gap: UI.SPACING_SM,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: UI.BORDER_RADIUS_MD,
    paddingVertical: UI.SPACING_MD,
    paddingHorizontal: UI.SPACING_LG,
    gap: UI.SPACING_SM,
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
});
