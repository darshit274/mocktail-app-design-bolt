import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeType } from '@/theme';

type ThemeMode = 'light' | 'dark'; // Keep for backward compatibility

interface ThemeContextType {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  theme: ThemeType;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode | ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>('light');
  
  // Backward compatibility
  const themeMode: ThemeMode = theme === 'dark' ? 'dark' : 'light';
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        setThemeState(savedTheme as ThemeType);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const saveTheme = async (mode: ThemeType) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = theme === 'dark' ? 'light' : 'dark';
    setThemeState(newMode);
    saveTheme(newMode);
  };

  const setTheme = (mode: ThemeMode | ThemeType) => {
    setThemeState(mode as ThemeType);
    saveTheme(mode as ThemeType);
  };

  const value: ThemeContextType = {
    isDarkMode,
    themeMode,
    theme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return default values instead of throwing error to prevent crashes
    console.warn('useTheme must be used within a ThemeProvider. Using default values.');
    return {
      isDarkMode: false,
      themeMode: 'light',
      theme: 'light',
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
};