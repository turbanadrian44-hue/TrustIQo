
import React, { useState, useEffect, useMemo } from 'react';
import { Coordinates, LoadingState, AnalysisResult, User } from './types';
import LocationRequest from './components/LocationRequest';
import Button from './components/Button';
import Logo from './components/Logo';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import LoadingScreen from './components/LoadingScreen';
import { findTrustworthyMechanics } from './services/geminiService';
import ReactMarkdown, { Components } from 'react-markdown';
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ContactPanel, ExpandableListItem } from './components/MarkdownRenderers';

// --- Main App Component ---

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [problem, setProblem] = useState('');
  const [radius, setRadius] = useState(5);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Monitor Firebase Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Fetch extended user profile from Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
             const userData = userSnap.data();
             setUser({
               id: currentUser.uid,
               email: currentUser.email || '',
               name: userData.full_name || currentUser.displayName || currentUser.email || 'Felhasználó',
               avatar: userData.avatar_url || currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`
             });
          } else {
             // Create profile if not exists (e.g. Google Login first time)
             const newProfile = {
                email: currentUser.email,
                full_name: currentUser.displayName || currentUser.email?.split('@')[0],
                avatar_url: currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`,
                created_at: new Date().toISOString()
             };
             await setDoc(userRef, newProfile);
             
             setUser({
               id: currentUser.uid,
               email: currentUser.email || '',
               name: newProfile.full_name || '',
               avatar: newProfile.avatar_url
             });
          }
        } catch (e) {
          console.error("Error fetching user profile:", e);
          // Fallback
          setUser({
             id: currentUser.uid,
             email: currentUser.email || '',
             name: currentUser.displayName || '',
             avatar: currentUser.photoURL || ''
          });
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
      try {
          await signOut(auth);
          setUser(null);
      } catch (error) {
          console.error("Logout failed", error);
      }
  };

  const handleLocationFound = (coords: Coordinates) => {
    setCoordinates(coords);
    setLoadingState(LoadingState.IDLE);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordinates) return;
    if (!problem.trim()) {
      setError("Kérlek írd le röviden az autó problémáját.");
      return;
    }
    setLoadingState(LoadingState.ANALYZING);
    setError(null);
    setResult(null);
    try {
      const data = await findTrustworthyMechanics(problem, coordinates, radius);
      setResult(data);
      setLoadingState(LoadingState.SUCCESS);
    } catch (err: any) {
      setError(err.message || "Hiba történt a műhelyek elemzése közben.");
      setLoadingState(LoadingState.ERROR);
    }
  };

  const resetSearch = () => {
    setResult(null);
    setLoadingState(LoadingState.IDLE);
  };

  // Memoized Markdown Components to prevent re-renders
  const markdownComponents: Components = useMemo(() => ({
    ul: ({node, children, ...props}) => {
      return (
        <ul className="list-none p-0 space-y-3" {...props}>
          {React.Children.map(children, (child, index) => {
            if (React.isValidElement(child)) {
              // Proper type checking before cloning
              return React.cloneElement(child as React.ReactElement<any>, { isBest: index === 0 });
            }
            return child;
          })}
        </ul>
      );
    },
    li: ExpandableListItem,
    strong: ({node, ...props}) => <span className="block text-lg font-bold text-gray-900 mt-2" {...props} />,
    blockquote: ContactPanel,
    p: ({node, ...props}) => <span className="inline leading-relaxed text-gray-700" {...props} />,
  }), []);

  const renderHero = () => (
    <div className="text-center mb-12 animate-fade-in-up px-4 pt-8">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold tracking-wide uppercase mb-8 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
        TrustIQo AI Védelem
      </div>
      <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
        Ne bízd a véletlenre <br/>
        <span className="text-brand-600 relative inline-block">az autódat
        <svg className="absolute w-full h-3 -bottom-1 left-0 text-brand-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" /></svg>
        </span>.
      </h1>
      <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
        Objektív, adatalapú döntés a megérzések helyett. AI technológiánk elemzi a piacot, hogy elkerüld a túlárazást és a kontár munkát.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-brand-100 selection:text-brand-900 overflow-x-hidden">
      
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-white/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => !user ? window.location.reload() : null}>
            <Logo className="w-9 h-9 md:w-10 md:h-10 text-brand-600" />
            <span className="text-xl font-bold text-slate-900 tracking-tight">TrustIQo</span>
          </div>

          <div className="flex items-center space-x-4">
             {result && !user && (
               <button onClick={resetSearch} className="text-sm font-semibold text-gray-500 hover:text-brand-600 transition-colors hidden md:block">
                 Új keresés
               </button>
             )}
             
             {user ? (
               <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-sm font-bold text-gray-900">{user.name}</span>
                  </div>
                  <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full border border-gray-200 bg-gray-50" />
                  <button onClick={handleLogout} className="text-sm font-medium text-gray-400 hover:text-gray-600 ml-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  </button>
               </div>
             ) : (
               <button 
                 onClick={() => setAuthModalOpen(true)}
                 className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition shadow-lg shadow-slate-900/10 active:scale-95"
               >
                 Belépés / Regisztráció
               </button>
             )}
          </div>
        </div>
      </header>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        onLogin={(u) => { setUser(u); setAuthModalOpen(false); }} 
      />

      {/* Main Content Area */}
      {user ? (
         <main className="flex-grow container mx-auto">
            <Dashboard user={user} onLogout={handleLogout} />
         </main>
      ) : (
         <>
           <div className="h-28"></div>
           <main className="flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-4xl">
            {!coordinates && (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                {renderHero()}
                <div className="w-full max-w-lg">
                  <LocationRequest 
                    onLocationFound={handleLocationFound} 
                    onError={(msg) => setError(msg)} 
                  />
                </div>
                {error && <div className="mt-8 bg-red-50 text-red-600 px-6 py-4 rounded-xl border border-red-100 font-medium text-center shadow-sm max-w-md mx-auto">{error}</div>}
              </div>
            )}

            {coordinates && !result && loadingState !== LoadingState.ANALYZING && (
              <div className="max-w-2xl mx-auto animate-fade-in-up">
                <div className="text-center mb-10">
                   <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Azonnali Segítség</h2>
                   <p className="text-gray-500 mt-2">Írd le a tüneteket, az AI pedig azonnal szűri a megbízható szakembereket.</p>
                </div>
                
                <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-gray-100">
                  <form onSubmit={handleSearch} className="space-y-8">
                    <div>
                      <label htmlFor="problem" className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider pl-1">
                        Mi a probléma? (Tünetek, Hibaüzenet)
                      </label>
                      <div className="relative">
                        <textarea
                          id="problem"
                          rows={3}
                          className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-5 text-lg text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:bg-white transition-all resize-none shadow-inner"
                          placeholder="pl. Furcsa kopogás a jobb elejéről, Check Engine lámpa világít..."
                          value={problem}
                          onChange={(e) => setProblem(e.target.value)}
                          required
                        />
                        <div className="absolute bottom-3 right-3 text-brand-300 pointer-events-none">
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-4 px-1">
                         <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Keresési Sugár
                        </label>
                        <span className="text-lg font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-lg border border-brand-100 min-w-[80px] text-center">
                          {radius} km
                        </span>
                      </div>
                      
                      {/* IMPROVED SLIDER CONTAINER */}
                      <div className="relative py-2 px-1">
                         <input
                          type="range"
                          min="1"
                          max="50"
                          value={radius}
                          onChange={(e) => setRadius(Number(e.target.value))}
                          className="w-full z-20 focus:outline-none cursor-pointer"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-2 px-1 font-medium">
                        <span>Közelben</span>
                        <span>Távolabb</span>
                      </div>
                    </div>

                    <Button type="submit" fullWidth className="text-lg py-4 shadow-xl shadow-brand-600/20">
                      Megbízható Szerelő Keresése
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {loadingState === LoadingState.ANALYZING && (
              <LoadingScreen />
            )}

            {result && (
              <div className="max-w-3xl mx-auto animate-fade-in-up pb-20">
                <div className="mb-8 flex items-end justify-between border-b border-gray-100 pb-4">
                   <div>
                     <h3 className="text-2xl font-bold text-gray-900">
                        Piacelemzés Eredménye
                     </h3>
                     <p className="text-sm text-gray-500 mt-1">A bizalmi index alapján rangsorolva</p>
                   </div>
                   <span className="text-sm font-medium text-brand-600 bg-brand-50 px-3 py-1 rounded-full shadow-sm border border-brand-100 flex items-center">
                     <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                     Ellenőrizve
                   </span>
                </div>

                <div className="space-y-6">
                   <ReactMarkdown components={markdownComponents}>
                     {result.text}
                   </ReactMarkdown>
                </div>
                
                <div className="mt-12 text-center bg-gray-50 p-6 rounded-2xl border border-gray-100">
                   <p className="text-gray-600 mb-4">Nem találod a megfelelőt?</p>
                   <button onClick={resetSearch} className="text-brand-600 hover:text-brand-800 font-bold text-lg hover:underline decoration-2 underline-offset-4 transition-colors">
                     Keresési paraméterek módosítása
                   </button>
                </div>
              </div>
            )}
           </main>
         </>
      )}
    </div>
  );
};

export default App;
