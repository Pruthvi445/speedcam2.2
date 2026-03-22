'use client';

import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import cameraReducer from './slices/cameraSlice';
import alertReducer from './slices/alertSlice';
import authReducer from './slices/authSlice';
import { auth, onAuthStateChanged, dbGet } from '@/lib/firebase';
import { setUser, logout } from './slices/authSlice';

// Your admin email
const ADMIN_EMAILS = ['pruthviraj24@gmail.com']; // <-- Updated

export const store = configureStore({
  reducer: {
    camera: cameraReducer,
    alert: alertReducer,
    auth: authReducer,
  },
});

// Auth Listener component
function AuthListener({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch profile from Realtime Database
        const profile = await dbGet(`users/${user.uid}/profile`);
        const isAdmin = ADMIN_EMAILS.includes(user.email);
        dispatch(setUser({
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          username: profile?.username || 'User',
          isAdmin,
        }));
      } else {
        dispatch(logout());
      }
    });
    return unsubscribe;
  }, [dispatch]);

  return children;
}

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <AuthListener>{children}</AuthListener>
    </Provider>
  );
}