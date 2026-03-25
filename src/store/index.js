'use client';

import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import cameraReducer from './slices/cameraSlice';
import alertReducer from './slices/alertSlice';
import authReducer from './slices/authSlice';
import { auth, onAuthStateChanged, dbGet } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { setUser, logout } from './slices/authSlice';

// Admin configuration from environment variables
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim());

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
    console.log('🔐 INITIALIZING AUTH PROTOCOLS...');
    let isFirstMount = true;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        console.log(`👤 AUTH_SYNC: Local identity established: ${fbUser.uid}`);
        // Fetch profile from Realtime Database
        const profile = await dbGet(`users/${fbUser.uid}/profile`);
        const isAdmin = ADMIN_EMAILS.includes(fbUser.email);
        
        dispatch(setUser({
          uid: fbUser.uid,
          email: fbUser.email || '',
          emailVerified: fbUser.emailVerified || false,
          username: fbUser.displayName || profile?.username || (fbUser.isAnonymous ? 'Guest Agent' : 'User'),
          isAdmin,
        }));
      } else {
        // If NO user is logged in, automatically sign in anonymously
        console.log('🛰️ AUTH_INIT: Initiating guest credentials...');
        try {
          // Re-using the signInAnonymously from firebase.js import if possible or just call it
          await signInAnonymously(auth);
          // onAuthStateChanged will trigger again once it finishes
        } catch (e) {
          console.error('❌ AUTH_CRITICAL: Failed to establish guest identity:', e);
          dispatch(logout()); // Fallback to null state
        }
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