import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/toastConfig';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { notificationService } from '@/services/NotificationService';
import TestNotificationIntegration from '@/services/TestNotificationIntegration';
import { APP_CONFIG } from '@/config/constants';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import logger from '@/utils/logger';
import * as ScreenCapture from 'expo-screen-capture';

const appLogger = logger.createLogger('App');

function AppContent() {
  useFrameworkReady();
  const { isDarkMode } = useTheme();

  // Prevent screenshots and screen recording on all screens
  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync();
    return () => {
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      // Initialize notification service only if enabled
      if (APP_CONFIG.ENABLE_NOTIFICATIONS) {
        try {
          appLogger.info('Starting notification service initialization');
          const initialized = await notificationService.initialize();
          if (initialized) {
            appLogger.info('Notification service initialized successfully');

            // Initialize test notification integration
            try {
              appLogger.info('Initializing test notification integration');
              const testNotificationsReady = await TestNotificationIntegration.initialize();
              if (testNotificationsReady) {
                appLogger.info('Test notification integration initialized successfully');
              } else {
                appLogger.warn('Test notification integration initialization failed');
              }
            } catch (testNotificationError) {
              appLogger.error('Error initializing test notifications', testNotificationError);
            }
          } else {
            appLogger.warn('Notification service initialization failed');
          }
        } catch (error: any) {
          appLogger.error('Error initializing notification service', error);
        }
      } else {
        appLogger.info('Notification service disabled in configuration');
      }
    };

    initializeApp();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="test" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <Toast config={toastConfig} position="top" />
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <Provider store={store}>
        <ThemeProvider>
          <LanguageProvider>
            <AppContent />
          </LanguageProvider>
        </ThemeProvider>
      </Provider>
    </AppErrorBoundary>
  );
}
