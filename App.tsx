
import React, { useState, useEffect } from 'react';
import { Coordinates, LoadingState, AnalysisResult, User } from './types';
import LocationRequest from './components/LocationRequest';
import Button from './components/Button';
import Logo from './components/Logo';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import { findTrustworthyMechanics } from './services/geminiService';
import ReactMarkdown, { Components } from 'react-markdown';
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// --- Helper Components ---

const ContactPanel = ({ children }: { children: React.ReactNode }) => {
  const getText = (node: React.ReactNode): string => {
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(getText).join('\n');
    if (React.isValidElement(node)) {
      const element = node as React.ReactElement<any>;
      if (element.props.children) {
        return getText(element.props.children);
      }
    }
    return '';
  };

  const rawContent = getText(children);
  const addressMatch = rawContent.match(/📍\s*(.*?)(?=\n|$|📞|🌐|🗺️)/);
  const phoneMatch = rawContent.match(/📞\s*(.*?)(?=\n|$|🌐|🗺️)/);
  const webMatch = rawContent.match(/🌐\s*(.*?)(?=\n|$)/);
  const mapMatch = rawContent.match(/🗺️\s*(.*?)(?=\n|$)/);

  const address = addressMatch ? addressMatch[1].trim() : null;
  const phone = phoneMatch ? phoneMatch[1].trim() : null;
  const webRaw = webMatch ? webMatch[1].trim() : null;
  const mapRaw = mapMatch ? mapMatch[1].trim() : null;
  const analysisText = rawContent.split(/📍|📞|🌐|🗺️/)[0].trim();

  const safeUrl = (url: string | null) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `https://${url}`;
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-100">
      {analysisText && (
        <div className="mb-6 bg-brand-50 p-5 rounded-2xl border border-brand-100 text-sm md:text-base text-brand-900 leading-relaxed font-medium shadow-sm">
          {analysisText}
        </div>
      )}

      {address && (
        <div className="mb-4 flex items-center text-gray-600 text-sm font-medium">
          <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span>{address}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {phone && (
          <a 
            href={`tel:${phone.replace(/\s/g, '')}`}
            className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md active:scale-95"
          >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            <span>Hívás</span>
          </a>
        )}

        {mapRaw && (
          <a 
            href={safeUrl(mapRaw)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-bold py-3 px-4 rounded-xl transition-all shadow-sm active:scale-95"
          >
             <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            <span>Térkép</span>
          </a>
        )}

        {webRaw && (
          <a 
            href={safeUrl(webRaw)}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-1 sm:col-span-2 flex items-center justify-center space-x-2 text-brand-600 hover:text-brand-800 font-semibold py-2 px-4 text-sm mt-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            <span>Weboldal megnyitása</span>
          </a>
        )}
      </div>
    </div>
  );
};

const ExpandableListItem = ({ children, isBest, ...props }: any) => {
  const [isOpen, setIsOpen] = useState(isBest); 
  const childrenArray = React.Children.toArray(children);
  const detailsIndex = childrenArray.findIndex(
    (child: any) => child.type === 'blockquote' || child.props?.node?.tagName === 'blockquote'
  );
  
  let summary = childrenArray;
  let details = null;

  if (detailsIndex !== -1) {
    summary = childrenArray.slice(0, detailsIndex);
    details = childrenArray[detailsIndex];
  }

  return (
    <li 
      className={`glass-panel rounded-2xl p-6 mb-4 transition-all duration-300 cursor-pointer overflow-hidden group border-l-4
        ${isBest ? 'border-l-amber-400 shadow-xl ring-1 ring-amber-400/20' : isOpen ? 'border-l-brand-500 shadow-lg' : 'border-l-transparent hover:border-l-brand-300 hover:shadow-md'}`}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('a') || target.closest('button')) return;
        setIsOpen(!isOpen);
      }}
      {...props}
    >
      <div className="flex items-start">
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-start">
             <div className="pr-4 w-full">
               <div className="text-xl font-bold text-gray-900 leading-tight mb-2 flex items-center gap-2">
                 {summary}
               </div>
               
               {isBest && (
                 <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold tracking-wide shadow-sm border border-amber-200">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      TOP VÁLASZTÁS
                    </span>
                    <span className="text-xs text-amber-600/80 font-medium">Legtöbb pozitív vélemény</span>
                 </div>
               )}

               {!isOpen && !isBest && (
                 <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="text-brand-600 font-medium text-xs">Kattints a részletekért</span>
                 </div>
               )}
             </div>
             
             <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 transform 
                ${isOpen ? 'rotate-180 bg-brand-100 text-brand-600' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}>
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
               </svg>
             </div>
          </div>
          
          <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
               {details}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

// --- DYNAMIC LOADING SCREEN ---
const LoadingScreen = ({ problem }: { problem: string }) => {
  const steps = [
    "Adatok feldolgozása...",
    "Kapcsolódás a szerviz-adatbázishoz...",
    "Vélemények valós idejű elemzése...",
    "Bizalmi index számítása...",
    "Rangsor véglegesítése..."
  ];

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="flex flex-col items-center justify-center pt-12 md:pt-24 animate-fade-in-up text-center px-4 md:px-6 min-h-[400px]">
      <div className="relative w-24 h-24 md:w-32 md:h-32 mb-8 md:mb-10">
        <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-brand-600 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl md:text-4xl animate-pulse">⚙️</span>
        </div>
      </div>
      
      {/* Dynamic Text - Resized and flexible height to prevent overlapping */}
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 transition-all duration-300 min-h-[3.5rem] flex items-center justify-center max-w-md">
        {steps[currentStep]}
      </h2>
      
      <p className="text-gray-500 max-w-sm mt-2 text-sm md:text-base leading-relaxed">
        Az AI éppen átfésüli az internetet, hogy megtalálja a legmegbízhatóbb szakembert a közeledben.
      </p>
    </div>
  );
};

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

  // Monitor Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userRef = doc(db, "users", firebaseUser.uid);
            try {
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUser({ id: firebaseUser.uid, ...userSnap.data() } as User);
                } else {
                    // Just in case firestore hasn't synced yet or simple provider login
                    setUser({
                        id: firebaseUser.uid,
                        name: firebaseUser.displayName || "Felhasználó",
                        email: firebaseUser.email || "",
                        avatar: firebaseUser.photoURL || undefined
                    });
                }
            } catch (e) {
                console.error("Error fetching user data:", e);
                // Fallback basic user info
                setUser({
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || "Felhasználó",
                    email: firebaseUser.email || "",
                    avatar: firebaseUser.photoURL || undefined
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

  const markdownComponents: Components = {
    ul: ({node, children, ...props}) => {
      return (
        <ul className="list-none p-0 space-y-3" {...props}>
          {React.Children.map(children, (child, index) => {
            if (React.isValidElement(child)) {
              // @ts-ignore
              return React.cloneElement(child, { isBest: index === 0 });
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
  };

  const renderHero = () => (
    <div className="text-center mb-12 animate-fade-in-up px-4 pt-8">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold tracking-wide uppercase mb-8 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
        Trustiqo AI Védelem
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
            <span className="text-xl font-bold text-slate-900 tracking-tight">Trustiqo</span>
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
              <LoadingScreen problem={problem} />
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
                     <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
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
