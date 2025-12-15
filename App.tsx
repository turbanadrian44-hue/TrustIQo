import React, { useState, useEffect } from 'react';
import { Coordinates, LoadingState, AnalysisResult } from './types';
import LocationRequest from './components/LocationRequest';
import Button from './components/Button';
import { findTrustworthyMechanics } from './services/geminiService';
import ReactMarkdown, { Components } from 'react-markdown';

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
  // Improved regex to handle potential formatting variations
  const addressMatch = rawContent.match(/📍\s*(.*?)(?=\n|$|📞|🌐|🗺️)/);
  const phoneMatch = rawContent.match(/📞\s*(.*?)(?=\n|$|🌐|🗺️)/);
  const webMatch = rawContent.match(/🌐\s*(.*?)(?=\n|$|🗺️)/);
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
    <div className="mt-5 pt-5 border-t border-gray-200/50">
      {analysisText && (
        <div className="mb-6 text-gray-700 leading-relaxed bg-brand-50/60 p-5 rounded-2xl border border-brand-100/50 text-sm md:text-base font-medium">
          {analysisText}
        </div>
      )}

      {address && (
        <div className="mb-6 flex items-start text-gray-500 text-sm font-medium px-1">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 flex-shrink-0">
             <span className="text-base">📍</span>
          </div>
          <span className="mt-1.5">{address}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {phone && (
          <a 
            href={`tel:${phone.replace(/\s/g, '')}`}
            className="group flex items-center justify-center space-x-3 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-4 rounded-2xl transition-all shadow-lg shadow-green-500/20 active:scale-95 transform"
          >
             <svg className="w-5 h-5 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            <span>Hívás Indítása</span>
          </a>
        )}

        {mapRaw && (
          <a 
            href={safeUrl(mapRaw)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-bold py-4 px-4 rounded-2xl transition-all shadow-sm active:scale-95 transform"
          >
             <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            <span>Útvonalterv</span>
          </a>
        )}

        {webRaw && (
          <a 
            href={safeUrl(webRaw)}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-1 sm:col-span-2 flex items-center justify-center space-x-2 text-brand-600 hover:text-brand-800 font-semibold py-2 px-4 rounded-xl transition-all text-sm mt-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            <span>Weboldal megnyitása</span>
          </a>
        )}
      </div>
    </div>
  );
};

const ExpandableListItem = ({ children, ...props }: any) => {
  const [isOpen, setIsOpen] = useState(false);
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
      className={`glass-card rounded-3xl p-6 md:p-8 mb-6 transition-all duration-300 cursor-pointer overflow-hidden group
        ${isOpen ? 'ring-2 ring-brand-400 shadow-xl scale-[1.01]' : 'hover:shadow-lg hover:-translate-y-1'}`}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('a') || target.closest('button')) return;
        setIsOpen(!isOpen);
      }}
      {...props}
    >
      <div className="flex items-start">
        <div className={`
          hidden md:flex flex-shrink-0 w-14 h-14 rounded-2xl items-center justify-center text-3xl mr-6 transition-all duration-300
          ${isOpen ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30 rotate-3' : 'bg-brand-50 text-brand-500'}
        `}>
          🛠️
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-start">
             <div className="pr-4 md:pr-8 w-full">
               <div className="flex items-center mb-1">
                 <span className="md:hidden mr-3 text-2xl">🛠️</span>
                 <div className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{summary}</div>
               </div>
               
               {!isOpen && (
                 <div className="flex items-center mt-3 space-x-4 opacity-80">
                   <div className="flex items-center text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-md">
                     <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                     ELÉRHETŐ
                   </div>
                   <span className="text-sm text-gray-400 font-medium hidden sm:inline-block">Kattints a részletekért</span>
                 </div>
               )}
             </div>
             
             <div className={`w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-brand-400 transition-all duration-300 transform ${isOpen ? 'rotate-180 bg-brand-50 text-brand-600' : 'group-hover:bg-brand-50'}`}>
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

const LoadingScreen = ({ problem }: { problem: string }) => {
  const [stage, setStage] = useState(0);
  const stages = [
    "Műhelyek keresése a környéken...",
    "Értékelések és vélemények elemzése...",
    "Rejtett információk kiszűrése...",
    "Megbízhatósági pontszámok számítása...",
    "Jelentés összeállítása..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 2000); // Change text every 2 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center pt-12 md:pt-24 animate-fade-in-up text-center px-4">
      <div className="relative w-40 h-40 mb-12">
        {/* Animated Rings */}
        <div className="absolute inset-0 bg-brand-400 rounded-full animate-ping opacity-20"></div>
        <div className="absolute inset-4 bg-brand-400 rounded-full animate-ping opacity-30 animation-delay-200"></div>
        
        {/* Central Icon container */}
        <div className="relative w-full h-full bg-white/60 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border border-white z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-brand-50 to-transparent opacity-50"></div>
          <div className="text-6xl animate-bounce z-20">🔍</div>
        </div>
      </div>

      <div className="h-20 max-w-md">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 tracking-tight transition-all duration-500 ease-in-out transform">
          {stages[stage]}
        </h2>
      </div>

      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mt-4">
        <div 
          className="h-full bg-brand-600 transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${((stage + 1) / stages.length) * 100}%` }}
        ></div>
      </div>
      
      <p className="text-gray-500 text-sm mt-6 font-medium italic">
        "{problem.substring(0, 40)}{problem.length > 40 ? '...' : ''}"
      </p>
    </div>
  );
};

const App: React.FC = () => {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [problem, setProblem] = useState('');
  const [radius, setRadius] = useState(5);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    // Keep problem text for convenience refinement
  };

  const markdownComponents: Components = {
    ul: ({node, ...props}) => <ul className="list-none p-0 space-y-4" {...props} />,
    li: ExpandableListItem,
    strong: ({node, ...props}) => <span className="block text-xl font-bold text-gray-900 tracking-tight" {...props} />,
    blockquote: ContactPanel,
    p: ({node, ...props}) => <span className="inline" {...props} />,
  };

  const renderHero = () => (
    <div className="text-center mb-8 md:mb-12 animate-fade-in-up px-4">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-white/50 text-brand-700 text-xs font-bold tracking-wide uppercase mb-6 shadow-sm backdrop-blur-sm">
        <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
        AI-Alapú Védelem
      </div>
      <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tighter mb-6 leading-[0.95] drop-shadow-sm">
        Szerelő,<br/>aki <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">nem ver át</span>.
      </h1>
      <p className="text-lg md:text-xl text-gray-600 max-w-xl mx-auto leading-relaxed font-medium">
        A Trustiqo mesterséges intelligenciával elemzi a rejtett véleményeket, hogy megtalálja a legkorrektebb szakembert a közeledben.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-brand-200 selection:text-brand-900 overflow-x-hidden">
      
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 transition-all duration-300 bg-white/80 backdrop-blur-lg border-b border-white/40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer group" onClick={() => window.location.reload()}>
            <div className="bg-brand-600 p-2 rounded-xl shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Trustiqo</span>
          </div>
          {result && (
            <button onClick={resetSearch} className="text-sm font-semibold text-gray-500 hover:text-brand-600 transition-colors bg-white/50 px-4 py-2 rounded-lg border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-sm">
              Új keresés
            </button>
          )}
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-24 md:h-28"></div>

      <main className="flex-grow container mx-auto px-4 py-4 md:py-8 sm:px-6 lg:px-8 max-w-5xl">
        
        {!coordinates && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            {renderHero()}
            <LocationRequest 
              onLocationFound={handleLocationFound} 
              onError={(msg) => setError(msg)} 
            />
            {error && <p className="mt-8 text-red-600 bg-red-50/90 backdrop-blur border border-red-100 px-6 py-4 rounded-2xl animate-fade-in-up shadow-md font-medium text-center max-w-md mx-auto">{error}</p>}
          </div>
        )}

        {coordinates && !result && loadingState !== LoadingState.ANALYZING && (
          <div className="max-w-2xl mx-auto animate-fade-in-up">
            <div className="text-center mb-8 md:mb-10">
               <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Mi a gond az autóval?</h2>
               <p className="text-gray-500 mt-2 font-medium">Írd le saját szavaiddal, mi pedig keressük a szakértőt.</p>
            </div>
            
            <div className="glass-card rounded-3xl p-6 md:p-10 shadow-2xl shadow-brand-900/5 ring-1 ring-white/60">
              <form onSubmit={handleSearch} className="space-y-8 md:space-y-10">
                <div className="relative group">
                  <label htmlFor="problem" className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest pl-1">
                    Probléma leírása
                  </label>
                  <textarea
                    id="problem"
                    rows={4}
                    className="w-full rounded-2xl border-0 bg-gray-50/50 p-5 text-lg text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-brand-500/20 focus:bg-white transition-all shadow-inner resize-none"
                    placeholder="pl. Furcsa hang a motortérből hidegindításkor..."
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    required
                  />
                  <div className="absolute bottom-3 right-3 text-brand-300 pointer-events-none group-focus-within:text-brand-500 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-4 px-1">
                     <label htmlFor="radius" className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Keresési Távolság
                    </label>
                    <div className="text-xl md:text-2xl font-bold text-brand-600 bg-white/80 px-4 py-1.5 rounded-xl shadow-sm border border-brand-100 backdrop-blur-sm min-w-[5rem] text-center">
                      {radius} km
                    </div>
                  </div>
                  
                  <div className="relative h-12 flex items-center px-1">
                    {/* Visual Track behind slider */}
                    <div className="absolute w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                       <div className="h-full bg-brand-200" style={{ width: `${(radius / 50) * 100}%` }}></div>
                    </div>
                    <input
                      type="range"
                      id="radius"
                      min="1"
                      max="50"
                      value={radius}
                      onChange={(e) => setRadius(Number(e.target.value))}
                      className="w-full z-20 focus:outline-none opacity-0 hover:opacity-100"
                    />
                    {/* We rely on custom CSS for the visible thumb, but opacity 0 input covers touch area */}
                    <input 
                       type="range"
                       min="1" 
                       max="50" 
                       value={radius} 
                       readOnly 
                       className="absolute w-full z-10 pointer-events-none"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 font-medium px-1 mt-2">
                    <span>Szomszédos</span>
                    <span>Megyei (50km)</span>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center font-medium animate-pulse">
                    <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    {error}
                  </div>
                )}

                <Button type="submit" fullWidth className="text-lg py-5 shadow-2xl shadow-brand-600/30 hover:shadow-brand-600/50 mt-2">
                  Szerelő Keresése
                </Button>
              </form>
            </div>
            
            <div className="mt-12 flex justify-center space-x-6 md:space-x-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
               <div className="flex flex-col items-center gap-2 group">
                 <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform"><span className="text-xl">🛡️</span></div>
                 <span className="text-xs font-semibold text-gray-500">Megbízható</span>
               </div>
               <div className="flex flex-col items-center gap-2 group">
                 <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform"><span className="text-xl">⭐</span></div>
                 <span className="text-xs font-semibold text-gray-500">Ellenőrzött</span>
               </div>
               <div className="flex flex-col items-center gap-2 group">
                 <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform"><span className="text-xl">🚀</span></div>
                 <span className="text-xs font-semibold text-gray-500">Gyors</span>
               </div>
            </div>
          </div>
        )}

        {loadingState === LoadingState.ANALYZING && (
          <LoadingScreen problem={problem} />
        )}

        {result && (
          <div className="max-w-3xl mx-auto animate-fade-in-up pb-20">
            <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between">
               <div>
                 <span className="text-brand-600 font-bold uppercase tracking-widest text-xs mb-2 block">Eredmények</span>
                 <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                    A legjobb találatok
                 </h3>
               </div>
               <div className="mt-4 md:mt-0 text-sm text-gray-500 font-medium bg-white/50 px-3 py-1 rounded-lg border border-white">
                 {result.text.split('**').filter((_, i) => i % 2 !== 0).length} szerelő a közelben
               </div>
            </div>

            <div className="prose prose-brand max-w-none">
               <ReactMarkdown components={markdownComponents}>
                 {result.text}
               </ReactMarkdown>
            </div>
            
            <div className="mt-16 text-center bg-white/40 p-8 rounded-3xl border border-white/60 backdrop-blur-sm">
               <p className="text-gray-500 text-base mb-6 font-medium">Nem találtad meg amit kerestél?</p>
               <button onClick={resetSearch} className="inline-flex items-center text-brand-700 font-bold hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-6 py-3 rounded-xl transition-all">
                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                 Új keresés indítása
               </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;