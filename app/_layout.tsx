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

function AppContent() {
  useFrameworkReady();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const initializeApp = async () => {
      // Initialize notification service only if enabled
      if (APP_CONFIG.ENABLE_NOTIFICATIONS) {
        try {
          console.log('🔔 Starting notification service initialization...');
          const initialized = await notificationService.initialize();
          if (initialized) {
            console.log('✅ Notification service initialized successfully');
            
            // Initialize test notification integration
            try {
              console.log('🧪 Initializing test notification integration...');
              const testNotificationsReady = await TestNotificationIntegration.initialize();
              if (testNotificationsReady) {
                console.log('✅ Test notification integration initialized successfully');
              } else {
                console.warn('⚠️ Test notification integration initialization failed');
              }
            } catch (testNotificationError) {
              console.error('❌ Error initializing test notifications:', testNotificationError);
            }
          } else {
            console.warn('⚠️ Notification service initialization failed');
          }
        } catch (error: any) {
          console.error('❌ Error initializing notification service:', error);
          // Log specific error details for debugging
          if (error.message) {
            console.error('Error message:', error.message);
          }
          if (error.stack) {
            console.error('Error stack:', error.stack);
          }
        }
      } else {
        console.log('📵 Notification service disabled in configuration');
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
