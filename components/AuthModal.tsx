
import React, { useState } from 'react';
import { User } from '../types';
import Button from './Button';
import { auth, db, googleProvider, facebookProvider } from '../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile, AuthError } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Helper to save user data to Firestore
  const saveUserToFirestore = async (user: any, userName: string) => {
    const userRef = doc(db, "users", user.uid);
    const userData = {
        name: userName || user.displayName || "Névtelen Felhasználó",
        email: user.email,
        avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
    };
    // Use setDoc with merge to avoid overwriting existing data fields if any
    await setDoc(userRef, userData, { merge: true });
    return { id: user.uid, ...userData };
  };

  const getErrorMessage = (err: any) => {
    console.error("Auth Error:", err); // Log full error for debugging
    if (err.code === 'auth/email-already-in-use') return "Ez az email cím már regisztrálva van.";
    if (err.code === 'auth/invalid-email') return "Érvénytelen email cím.";
    if (err.code === 'auth/weak-password') return "A jelszó túl gyenge (min. 6 karakter).";
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        return "Hibás email vagy jelszó.";
    }
    if (err.code === 'auth/popup-closed-by-user') return "A bejelentkezési ablak be lett zárva.";
    if (err.code === 'auth/cancelled-popup-request') return "Túl sok popup kérés egyszerre.";
    if (err.code === 'auth/account-exists-with-different-credential') return "Ez az email cím már létezik egy másik fiókkal (pl. Facebook helyett Google).";
    if (err.code === 'auth/operation-not-allowed') return "Ez a bejelentkezési mód nincs engedélyezve a Firebase konzolon.";
    if (err.code === 'auth/unauthorized-domain') return "Ez a domain (pl. localhost) nincs engedélyezve a Firebase konzolon.";
    
    return "Hiba történt a művelet során. Részletek a konzolon.";
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let userCredential;
      if (isRegister) {
        // Register
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        const appUser = await saveUserToFirestore(userCredential.user, name);
        onLogin(appUser);
      } else {
        // Login
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Fetch extra data from Firestore if needed, or just construct from Auth
        const userRef = doc(db, "users", userCredential.user.uid);
        const userSnap = await getDoc(userRef);
        
        let appUser;
        if (userSnap.exists()) {
             appUser = { id: userSnap.id, ...userSnap.data() } as User;
        } else {
             // Fallback if firestore doc missing
             appUser = await saveUserToFirestore(userCredential.user, userCredential.user.displayName || name);
        }
        onLogin(appUser);
      }
      onClose();
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleProviderLogin = async (provider: any) => {
    setLoading(true);
    setError(null);
    try {
        const result = await signInWithPopup(auth, provider);
        const appUser = await saveUserToFirestore(result.user, result.user.displayName || "");
        onLogin(appUser);
        onClose();
    } catch (err: any) {
        setError(getErrorMessage(err));
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isRegister ? 'Lépj be a Trustiqo-ba' : 'Üdvözöllek!'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isRegister ? 'Hozd létre a digitális garázsodat még ma.' : 'Jelentkezz be a folytatáshoz.'}
          </p>
        </div>

        {error && (
            <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center animate-pulse">
                {error}
            </div>
        )}

        <div className="space-y-3 mb-6">
          <button 
            onClick={() => handleProviderLogin(googleProvider)}
            className="w-full flex items-center justify-center space-x-2 bg-white border border-gray-200 p-3 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700 hover:border-brand-200 hover:shadow-sm"
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            <span>Google Fiók</span>
          </button>
          <button 
            onClick={() => handleProviderLogin(facebookProvider)}
            className="w-full flex items-center justify-center space-x-2 bg-[#1877F2] text-white p-3 rounded-xl hover:bg-[#166fe5] transition-colors font-medium shadow-sm"
            disabled={loading}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            <span>Facebook Fiók</span>
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">vagy email címmel</span></div>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && (
            <input
              type="text"
              placeholder="Teljes név"
              required={isRegister}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          )}
          <input
            type="email"
            placeholder="Email cím"
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Jelszó"
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          
          <Button type="submit" fullWidth isLoading={loading}>
            {isRegister ? 'Regisztráció' : 'Belépés'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {isRegister ? 'Már van fiókod?' : 'Nincs még fiókod?'}
          <button 
            onClick={() => { setIsRegister(!isRegister); setError(null); }} 
            className="ml-2 font-bold text-brand-600 hover:text-brand-800"
            disabled={loading}
          >
            {isRegister ? 'Jelentkezz be' : 'Regisztrálj itt'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
