import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authSlice from './slices/authSlice';
import { authApi } from './api/authApi';
import { pdfApi } from './api/pdfApi';
import { freeTestsApi } from './api/freeTestsApi';
import { testSeriesApi } from './api/testSeriesApi';
import { testManagementApi } from './api/testManagementApi';
import { quizApi } from './api/quizApi';
import { notificationsApi } from './api/notificationsApi';
import { userApi } from './api/userApi';
import { dynamicHierarchyApi } from './api/dynamicHierarchyApi';
import { testResponseApi } from './api/testResponseApi';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    [authApi.reducerPath]: authApi.reducer,
    [pdfApi.reducerPath]: pdfApi.reducer,
    [freeTestsApi.reducerPath]: freeTestsApi.reducer,
    [testSeriesApi.reducerPath]: testSeriesApi.reducer,
    [testManagementApi.reducerPath]: testManagementApi.reducer,
    [quizApi.reducerPath]: quizApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [dynamicHierarchyApi.reducerPath]: dynamicHierarchyApi.reducer,
    [testResponseApi.reducerPath]: testResponseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(
      authApi.middleware, 
      pdfApi.middleware,
      freeTestsApi.middleware,
      testSeriesApi.middleware,
      testManagementApi.middleware,
      quizApi.middleware,
      notificationsApi.middleware,
      userApi.middleware,
      dynamicHierarchyApi.middleware,
      testResponseApi.middleware
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;