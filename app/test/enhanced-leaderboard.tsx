import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { EnhancedLeaderboard } from '@/components/test/EnhancedLeaderboard';

export default function EnhancedLeaderboardScreen() {
  const params = useLocalSearchParams();
  const { type, id, title, showTimeframe } = params;
  
  return (
    <EnhancedLeaderboard
      type={type as 'test' | 'series' | 'category' | 'overall' || 'test'}
      id={id ? parseInt(id as string) : undefined}
      title={title as string}
      showTimeframe={showTimeframe === 'true'}
    />
  );
}