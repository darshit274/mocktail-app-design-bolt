import { getTheme } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs } from 'expo-router';
import { Chrome as Home, BookOpen, User, FileText, Play, Bell } from 'lucide-react-native';

export default function TabLayout() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const Colors = getTheme(theme);
  
  return (
    <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSubtle,
          tabBarStyle: {
            backgroundColor: Colors.cardBackground,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: t.navigation.home,
            tabBarIcon: ({ size, color }) => (
              <Home size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="test-series"
          options={{
            title: t.navigation.testSeries,
            tabBarIcon: ({ size, color }) => (
              <BookOpen size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="pdfs"
          options={{
            title: t.navigation.pdfs,
            tabBarIcon: ({ size, color }) => (
              <FileText size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t.navigation.profile,
            tabBarIcon: ({ size, color }) => (
              <User size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="free-tests"
          options={{
            href: null, // Hide from tab bar but keep accessible via direct navigation
          }}
        />
        <Tabs.Screen
          name="free-in-paid-tests"
          options={{
            href: null, // Hide from tab bar but keep accessible via direct navigation
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            href: null, // Hide from tab bar but keep accessible via direct navigation
          }}
        />
      </Tabs>
  );
}