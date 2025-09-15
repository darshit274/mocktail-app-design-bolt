import React, { useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';

export default function QuizRedirect() {
  const params = useLocalSearchParams();

  useEffect(() => {
    // Redirect to web-compatible quiz component
    router.replace({
      pathname: '/test/web-quiz',
      params: params
    });
  }, []);

  return null; // This component just redirects
}