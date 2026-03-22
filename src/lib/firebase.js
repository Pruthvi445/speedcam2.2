import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, set, push, onValue, update, remove, get } from "firebase/database";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile as firebaseUpdateProfile,
  sendEmailVerification as firebaseSendEmailVerification
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);

// Re-export Firebase auth functions
export { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  firebaseUpdateProfile as updateProfile
};

// Custom functions for anonymous sign-in and convenience
export const signInUser = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result;
  } catch (error) {
    console.error('❌ Auth error:', error);
    return { user: { uid: 'guest-' + Date.now() } };
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  } catch (error) {
    console.error("Email sign-in error:", error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign out error:", error);
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

// Database helpers
export const dbRef = (path) => ref(db, path);

export const dbPush = async (path, data) => {
  const newRef = push(ref(db, path));
  await set(newRef, { ...data, createdAt: Date.now() });
  return newRef.key;
};

export const dbSet = async (path, data) => {
  await set(ref(db, path), data);
};

export const dbGet = async (path) => {
  const snapshot = await get(ref(db, path));
  return snapshot.val();
};

export const dbUpdate = async (path, data) => {
  await update(ref(db, path), data);
};

export const dbRemove = async (path) => {
  await remove(ref(db, path));
};

export const dbOnValue = (path, callback, errorCallback) => {
  return onValue(ref(db, path), (snapshot) => {
    callback(snapshot.val());
  }, errorCallback);
};

// Email verification
export const sendEmailVerification = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  if (user.emailVerified) throw new Error('Email already verified');
  await firebaseSendEmailVerification(user);
  return true;
};