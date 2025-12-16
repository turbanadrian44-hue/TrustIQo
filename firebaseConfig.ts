
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCtQiSV26wuynLLm0cWeWW9XO4TaAgrq2E",
  authDomain: "trustiqo-58d49.firebaseapp.com",
  projectId: "trustiqo-58d49",
  storageBucket: "trustiqo-58d49.firebasestorage.app",
  messagingSenderId: "1042856892794",
  appId: "1:1042856892794:web:1e4bc9762c88cd6bf25ec3"
};

// Singleton pattern: Check if app already exists. 
// This prevents "Firebase App named '[DEFAULT]' already exists" and related auth registration errors.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize services with the specific app instance
const auth = getAuth(app);
const db = getFirestore(app);

// Providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

export { auth, db, googleProvider, facebookProvider };
