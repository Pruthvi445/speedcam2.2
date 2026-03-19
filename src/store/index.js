'use client';

import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import cameraReducer from './slices/cameraSlice';
import alertReducer from './slices/alertSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    camera: cameraReducer,
    alert: alertReducer,
    auth: authReducer,
  },
});

export function Providers({ children }) {
  return <Provider store={store}>{children}</Provider>;
}