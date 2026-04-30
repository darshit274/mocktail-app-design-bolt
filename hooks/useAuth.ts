import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { initializeAuth, logout } from '../store/slices/authSlice';
import { jwtDecode } from 'jwt-decode';
import { AUTH_CONFIG, API_CONFIG } from '@/config/constants';

interface JWTPayload {
  uuid: string;   // matches backend JWT payload field name
  email: string;
  sessionId?: string;
  exp: number;
}

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);

  const initializeAuthState = useCallback(async () => {
    try {
      console.log('🔄 Starting auth initialization...');
      const token = await AsyncStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      console.log('🔑 Token from storage:', token ? 'Found' : 'Not found');
      
      if (token) {
        // Verify token is not expired
        try {
          const decoded = jwtDecode<JWTPayload>(token);
          const currentTime = Date.now() / 1000;
          const expiryTime = decoded.exp;
          const timeUntilExpiry = expiryTime - currentTime;
          
          console.log('⏰ Token expiry check:', {
            currentTime,
            expiryTime,
            timeUntilExpiry: Math.round(timeUntilExpiry),
            buffer: AUTH_CONFIG.TOKEN_EXPIRY_BUFFER,
            isValid: timeUntilExpiry > AUTH_CONFIG.TOKEN_EXPIRY_BUFFER
          });
          
          if (timeUntilExpiry > AUTH_CONFIG.TOKEN_EXPIRY_BUFFER) {
            console.log('✅ Token is valid, initializing auth state');
            
            // First initialize with token data to set up Redux state
            dispatch(initializeAuth({
              token,
              user: {
                uuid: decoded.uuid,
                email: decoded.email,
                username: '', // Will be updated when profile loads
                isEmailVerified: undefined // Will be updated when profile loads
              }
            }));
            
            console.log('📞 Fetching user profile...');
            // Then try to fetch complete user profile
            try {
              const response = await fetch(`${API_CONFIG.BASE_URL}/api/users/profile`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
              
              console.log('📱 Profile response status:', response.status);
              
              if (response.ok) {
                const profileData = await response.json();
                console.log('📊 Profile data received:', {
                  success: profileData.success,
                  hasData: !!profileData.data,
                  isEmailVerified: profileData.data?.isEmailVerified
                });
                
                if (profileData.success) {
                  // Update with complete user data
                  dispatch(initializeAuth({ 
                    token,
                    user: profileData.data
                  }));
                  console.log('✅ Auth state updated with profile data');
                }
              } else {
                console.warn('❌ Profile fetch failed with status:', response.status);
              }
            } catch (profileError) {
              console.warn('❌ Failed to fetch profile:', profileError);
            }
          } else {
            // Token expired
            console.log('❌ Token expired, logging out');
            await AsyncStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
            dispatch(logout());
          }
        } catch (error) {
          // Invalid token
          console.log('❌ Invalid token, logging out:', error);
          await AsyncStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
          dispatch(logout());
        }
      } else {
        console.log('❌ No token found in storage');
      }
    } catch (error) {
      console.error('❌ Error initializing auth state:', error);
    }
  }, [dispatch]);

  const logoutUser = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      dispatch(logout());
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return {
    ...auth,
    initializeAuthState,
    logoutUser,
    isLoggedIn: auth.isAuthenticated && !!auth.token,
  };
};