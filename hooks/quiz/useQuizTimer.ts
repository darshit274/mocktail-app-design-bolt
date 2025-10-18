/**
 * Quiz Timer Hook
 * Created: 2025-01-11
 * Purpose: Manages quiz countdown timer with auto-submit
 */

import { useState, useEffect, useCallback } from 'react';

export interface UseQuizTimerReturn {
  timeRemaining: number;
  setTimeRemaining: (time: number) => void;
  formatTime: (seconds: number) => string;
  isTimeLow: boolean;
}

export interface UseQuizTimerProps {
  initialTime?: number;
  onTimeUp: () => void;
  enabled: boolean;
}

export const useQuizTimer = ({
  initialTime,
  onTimeUp,
  enabled
}: UseQuizTimerProps): UseQuizTimerReturn => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime || 0);

  // Update timer when initialTime changes (e.g., from API)
  useEffect(() => {
    if (initialTime !== null && initialTime !== undefined) {
      setTimeRemaining(initialTime);
    }
  }, [initialTime]);

  // Timer countdown effect
  useEffect(() => {
    if (!enabled || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, enabled, onTimeUp]);

  // Format time as HH:MM:SS or MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Check if time is running low (less than 5 minutes)
  const isTimeLow = timeRemaining < 300;

  return {
    timeRemaining,
    setTimeRemaining,
    formatTime,
    isTimeLow,
  };
};
