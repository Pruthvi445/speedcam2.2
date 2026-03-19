import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, set, push, onValue, update, remove, get } from "firebase/database";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

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

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
};

// Helper functions for database operations
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