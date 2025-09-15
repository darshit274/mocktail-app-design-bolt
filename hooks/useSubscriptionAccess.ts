import { useState, useEffect } from 'react';
import { API_CONFIG } from '@/config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SubscriptionAccessData {
  hasAccess: boolean;
  accessType: 'free' | 'subscription' | 'none';
  canPurchase: boolean;
  showEnrollButton: boolean;
  hasPendingPayment?: boolean;
  subscription?: {
    id: string;
    purchaseDate: string;
    expiryDate: string | null;
    amountPaid: number;
  };
  pendingPayment?: {
    transactionId: string;
    createdAt: string;
  };
  testSeries: {
    id: number;
    uuid: string;
    name: string;
    price: number;
    pricing_type: 'free' | 'paid';
  };
}

export interface SubscriptionAccessResponse {
  success: boolean;
  data: SubscriptionAccessData;
}

export const useSubscriptionAccess = (seriesId?: string | number) => {
  const [accessData, setAccessData] = useState<SubscriptionAccessData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAccess = async (testSeriesId?: string | number) => {
    if (!testSeriesId) return;

    setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/subscription-access/test-series/${testSeriesId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result: SubscriptionAccessResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to check access');
      }

      if (result.success) {
        setAccessData(result.data);
      } else {
        setError(result.message || 'Access check failed');
      }

    } catch (err: any) {
      console.error('Subscription access check error:', err);
      setError(err.message || 'Failed to check subscription access');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (seriesId) {
      checkAccess(seriesId);
    }
  }, [seriesId]);

  return {
    accessData,
    loading,
    error,
    refetch: () => checkAccess(seriesId),
    checkAccess,
  };
};

export const useMultipleSubscriptionAccess = (seriesIds: (string | number)[]) => {
  const [accessDataMap, setAccessDataMap] = useState<Record<string, SubscriptionAccessData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkMultipleAccess = async (testSeriesIds: (string | number)[]) => {
    if (!testSeriesIds.length) return;

    setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Check access for each series
      const results = await Promise.allSettled(
        testSeriesIds.map(async (seriesId) => {
          const response = await fetch(
            `${API_CONFIG.BASE_URL}/api/subscription-access/test-series/${seriesId}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const result: SubscriptionAccessResponse = await response.json();
          return { seriesId: String(seriesId), result };
        })
      );

      const newAccessDataMap: Record<string, SubscriptionAccessData> = {};

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.result.success) {
          newAccessDataMap[result.value.seriesId] = result.value.result.data;
        }
      });

      setAccessDataMap(newAccessDataMap);

    } catch (err: any) {
      console.error('Multiple subscription access check error:', err);
      setError(err.message || 'Failed to check subscription access');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (seriesIds.length > 0) {
      checkMultipleAccess(seriesIds);
    }
  }, [JSON.stringify(seriesIds)]);

  return {
    accessDataMap,
    loading,
    error,
    refetch: () => checkMultipleAccess(seriesIds),
    checkMultipleAccess,
  };
};

// Helper function to get button state for a test series
export const getSeriesButtonState = (accessData?: SubscriptionAccessData | null) => {
  if (!accessData) {
    return {
      showEnrollButton: true,
      buttonText: 'Enroll Now',
      buttonType: 'purchase' as const,
      isDisabled: false,
    };
  }

  if (accessData.hasAccess) {
    if (accessData.accessType === 'free') {
      return {
        showEnrollButton: false,
        buttonText: 'Start Free',
        buttonType: 'start' as const,
        isDisabled: false,
      };
    } else {
      return {
        showEnrollButton: false,
        buttonText: 'Continue',
        buttonType: 'continue' as const,
        isDisabled: false,
      };
    }
  }

  if (accessData.hasPendingPayment) {
    return {
      showEnrollButton: false,
      buttonText: 'Payment Pending',
      buttonType: 'pending' as const,
      isDisabled: true,
    };
  }

  if (accessData.testSeries.pricing_type === 'free') {
    return {
      showEnrollButton: false,
      buttonText: 'Start Free',
      buttonType: 'start' as const,
      isDisabled: false,
    };
  }

  return {
    showEnrollButton: accessData.canPurchase,
    buttonText: 'Enroll Now',
    buttonType: 'purchase' as const,
    isDisabled: !accessData.canPurchase,
  };
};