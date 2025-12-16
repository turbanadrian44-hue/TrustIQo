
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// FONTOS: 
// 1. A Firebase Console-ban (Authentication menü) engedélyezd az "Email/Password" és "Google" belépési módokat!
// 2. Ha a lenti adatok nem a sajátjaid, cseréld le őket a saját projekted adataira (Project Settings -> General -> Your apps)!

const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[key];
  }
  return undefined;
};

const firebaseConfig = {
  apiKey: "AIzaSyCtQiSV26wuynLLm0cWeWW9XO4TaAgrq2E",
  authDomain: "trustiqo-58d49.firebaseapp.com",
  projectId: "trustiqo-58d49",
  storageBucket: "trustiqo-58d49.firebasestorage.app",
  messagingSenderId: "1042856892794",
  appId: "1:1042856892794:web:1e4bc9762c88cd6bf25ec3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
