
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import Button from './Button';
import { auth, db } from '../firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

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

  // UX: Reset fields whenever the modal is opened
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setName('');
      setError(null);
      setLoading(false);
      // Optional: Reset to login mode every time it opens? 
      // setIsRegister(false); // Uncomment if you always want to start on Login screen
    }
  }, [isOpen]);

  const toggleAuthMode = () => {
    setIsRegister(!isRegister);
    // UX: Clear inputs when switching modes so user starts fresh
    setEmail('');
    setPassword('');
    setName('');
    setError(null);
  };

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Trim email to prevent accidental whitespace errors
    const cleanEmail = email.trim();
    if (!cleanEmail) {
        setError("Kérlek add meg az email címedet.");
        setLoading(false);
        return;
    }

    try {
      if (isRegister) {
        // 1. Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;

        // 2. Update Display Name
        await updateProfile(user, { displayName: name });

        // 3. Create User Document in Firestore
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`;
        await setDoc(doc(db, 'users', user.uid), {
           email: user.email,
           full_name: name,
           avatar_url: avatarUrl,
           created_at: new Date().toISOString()
        });

        // 4. Update Local State
        const appUser: User = {
           id: user.uid,
           email: user.email || '',
           name: name,
           avatar: avatarUrl
        };
        onLogin(appUser);

      } else {
        // Login
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        // User profile fetching is handled in App.tsx via onAuthStateChanged
      }
      onClose();
    } catch (err: any) {
      console.error("Firebase Auth Error:", err);
      
      let msg = "Ismeretlen hiba történt.";
      
      // Részletesebb hibakezelés
      if (err.code === 'auth/email-already-in-use') {
          msg = "Ez az email cím már regisztrálva van.";
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          msg = "Hibás email cím vagy jelszó.";
      } else if (err.code === 'auth/weak-password') {
          msg = "A jelszó túl gyenge (min. 6 karakter).";
      } else if (err.code === 'auth/invalid-email') {
          msg = "Érvénytelen email formátum.";
      } else if (err.code === 'auth/operation-not-allowed') {
          msg = "A belépés nincs engedélyezve a Firebase konzolon (Authentication > Sign-in method).";
      } else if (err.code === 'auth/network-request-failed') {
          msg = "Hálózati hiba. Ellenőrizd az internetkapcsolatot.";
      } else if (err.code === 'auth/too-many-requests') {
          msg = "Túl sok sikertelen próbálkozás. Kérlek várj egy kicsit!";
      } else if (err.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
          msg = "Hibás Firebase API kulcs a konfigurációban.";
      } else if (err.message) {
          msg = `Hiba: ${err.message}`; 
      }
      
      setError(msg);
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
            {isRegister ? 'Lépj be a TrustIQo-ba' : 'Üdvözöllek!'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isRegister ? 'Autófenntartás stressz és meglepetések nélkül.' : 'Jelentkezz be a folytatáshoz.'}
          </p>
        </div>

        {error && (
            <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center animate-pulse break-words font-medium">
                {error}
            </div>
        )}

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
            onClick={toggleAuthMode} 
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
