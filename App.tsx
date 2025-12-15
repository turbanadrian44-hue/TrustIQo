import React, { useState } from 'react';
import { Coordinates, LoadingState, AnalysisResult } from './types';
import LocationRequest from './components/LocationRequest';
import Button from './components/Button';
import { findTrustworthyMechanics } from './services/geminiService';
import ReactMarkdown, { Components } from 'react-markdown';

// --- Helper Components ---

// Parses the text content from the blockquote and renders a structured Action UI
const ContactPanel = ({ children }: { children: React.ReactNode }) => {
  // Helper function to extract raw text from React children tree
  const getText = (node: React.ReactNode): string => {
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(getText).join('\n');
    
    if (React.isValidElement(node)) {
      // Cast to any to access props safely as isValidElement might infer unknown props in strict mode
      const element = node as React.ReactElement<any>;
      if (element.props.children) {
        return getText(element.props.children);
      }
    }
    return '';
  };

  const rawContent = getText(children);

  // Regex extractors based on the emojis defined in the Prompt
  const addressMatch = rawContent.match(/📍\s*(.*?)(?=\n|$|📞|🌐|🗺️)/);
  const phoneMatch = rawContent.match(/📞\s*(.*?)(?=\n|$|🌐|🗺️)/);
  const webMatch = rawContent.match(/🌐\s*(.*?)(?=\n|$|🗺️)/);
  const mapMatch = rawContent.match(/🗺️\s*(.*?)(?=\n|$)/);

  // Clean inputs
  const address = addressMatch ? addressMatch[1].trim() : null;
  const phone = phoneMatch ? phoneMatch[1].trim() : null;
  const webRaw = webMatch ? webMatch[1].trim() : null;
  const mapRaw = mapMatch ? mapMatch[1].trim() : null;

  // Analysis text (everything before the first emoji)
  const analysisText = rawContent.split(/📍|📞|🌐|🗺️/)[0].trim();

  // Helper to fix URLs if they don't have protocol
  const safeUrl = (url: string | null) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `https://${url}`;
  };

  return (
    <div className="space-y-6">
      {/* Description Text */}
      {analysisText && (
        <div className="text-gray-600 italic border-l-4 border-brand-200 pl-4 py-1 leading-relaxed">
          {analysisText}
        </div>
      )}

      {/* Action Dashboard */}
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
        
        {/* Address Row */}
        {address && (
          <div className="mb-5 flex items-start text-gray-700">
            <svg className="w-5 h-5 text-brand-500 mt-1 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">{address}</span>
          </div>
        )}

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {phone && (
            <a 
              href={`tel:${phone.replace(/\s/g, '')}`}
              className="flex items-center justify-center space-x-2 bg-white border border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 font-semibold py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              <span>Hívás</span>
            </a>
          )}

          {webRaw && (
            <a 
              href={safeUrl(webRaw)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 font-semibold py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
              <span>Weboldal</span>
            </a>
          )}

          {mapRaw && (
            <a 
              href={safeUrl(mapRaw)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 bg-brand-600 text-white hover:bg-brand-700 font-semibold py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              <span>Útvonal</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// Custom Component for Expandable List Item
const ExpandableListItem = ({ children, ...props }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  // Separate the summary (main text) from the details (blockquote)
  const childrenArray = React.Children.toArray(children);
  
  // Find the blockquote element which contains the contact info
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
      className={`bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden group mb-6 ${isOpen ? 'ring-2 ring-brand-500 transform scale-[1.01]' : ''}`}
      onClick={(e) => {
        // Prevent closing if clicking on a button/link inside
        const target = e.target as HTMLElement;
        if (target.closest('a') || target.closest('button')) return;
        setIsOpen(!isOpen);
      }}
      {...props}
    >
      {/* Arrow Icon */}
      <div className="absolute top-6 right-6 text-brand-300 pointer-events-none">
         <svg className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
         </svg>
      </div>
      
      <div className="flex items-start pr-10">
        <span className="text-3xl mr-5 mt-0 flex-shrink-0 bg-brand-50 p-2 rounded-xl">🛠️</span>
        <div className="text-gray-700 leading-relaxed w-full">
          {/* Main Content (Title) */}
          <div className="text-lg flex items-center min-h-[2rem] font-medium">{summary}</div>
          
          {/* Collapsible Details Section */}
          <div 
             className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'}`}
          >
            <div className="overflow-hidden">
               {details}
            </div>
          </div>
          
          {/* Call to Action hint if closed */}
          {!isOpen && (
            <div className="mt-2 text-xs font-bold text-brand-600 uppercase tracking-widest flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              Adatok megtekintése
            </div>
          )}
        </div>
      </div>
    </li>
  );
};

const App: React.FC = () => {
  // State
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [problem, setProblem] = useState('');
  const [radius, setRadius] = useState(5);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handlers
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

  // Markdown Custom Components to create "Rubrics"
  const markdownComponents: Components = {
    // Style the list container
    ul: ({node, ...props}) => <ul className="list-none p-0 space-y-4" {...props} />,
    
    // Custom Expandable List Item
    li: ExpandableListItem,

    // Style the Shop Name header
    strong: ({node, ...props}) => <span className="block text-xl font-bold text-gray-900" {...props} />,
    
    // Use the new ContactPanel instead of a simple blockquote
    blockquote: ContactPanel,

    // Remove default link styling inside list items as we use custom buttons now,
    // but keep standard link behavior for text references if any.
    a: ({node, ...props}) => (
      <a 
        className="text-brand-600 hover:text-brand-800 font-semibold underline decoration-brand-200 hover:decoration-brand-500 transition-all"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    )
  };

  // Render Helpers
  const renderHero = () => (
    <div className="text-center mb-12 animate-fade-in-up">
      <div className="inline-block p-2 px-4 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-bold tracking-wide uppercase mb-4">
        AI-Alapú Megbízhatóság Ellenőrzés
      </div>
      <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
        Ne hagyd, hogy <br className="hidden md:block"/>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">átverjenek</span> a szervizben.
      </h1>
      <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
        A Trustiqo elemzi a véleményeket, értékeléseket és a webes hírnevet, hogy megtalálja neked a legbecsületesebb szerelőt a közeledben.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-slate-50 selection:bg-brand-100 selection:text-brand-900">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-2 rounded-xl shadow-lg shadow-brand-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Trustiqo</span>
          </div>
          {result && (
            <button onClick={resetSearch} className="text-sm text-gray-600 hover:text-brand-600 font-medium transition-colors">
              Új keresés
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* State: No Location Yet */}
        {!coordinates && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            {renderHero()}
            <LocationRequest 
              onLocationFound={handleLocationFound} 
              onError={(msg) => setError(msg)} 
            />
            {error && <p className="mt-6 text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl animate-bounce">{error}</p>}
          </div>
        )}

        {/* State: Location Found, Input Form */}
        {coordinates && !result && loadingState !== LoadingState.ANALYZING && (
          <div className="max-w-3xl mx-auto animate-fade-in-up">
            <div className="text-center mb-8">
               <h2 className="text-3xl font-bold text-gray-900">Miben segíthetünk?</h2>
               <p className="text-gray-500 mt-2">Írd le a problémát, mi pedig keressük a szakértőket.</p>
            </div>
            
            <div className="glass-panel rounded-2xl p-8">
              <form onSubmit={handleSearch} className="space-y-8">
                <div>
                  <label htmlFor="problem" className="block text-sm font-semibold text-gray-700 mb-3">
                    Mi a probléma az autóval?
                  </label>
                  <textarea
                    id="problem"
                    rows={4}
                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-4 border bg-gray-50/50 text-lg placeholder-gray-400 transition-shadow focus:shadow-lg"
                    placeholder="pl. 'Furcsa csikorgó hang fékezéskor' vagy 'Villog a check engine lámpa'"
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                     <label htmlFor="radius" className="block text-sm font-semibold text-gray-700">
                      Keresési sugár
                    </label>
                    <span className="text-sm font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">{radius} km</span>
                  </div>
                  
                  <input
                    type="range"
                    id="radius"
                    min="1"
                    max="50"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600 hover:accent-brand-500 transition-all"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
                    <span>1 km</span>
                    <span>50 km</span>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}

                <Button type="submit" fullWidth className="text-lg py-4 shadow-xl shadow-brand-500/20 hover:shadow-brand-500/40">
                  Műhelyek Elemzése
                </Button>
              </form>
            </div>
            
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              {[
                { label: "Átverés Szűrés", icon: "🛡️" },
                { label: "Valós Vélemények", icon: "⭐" },
                { label: "Távolság Optimalizálás", icon: "📍" }
              ].map((feature, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-3xl mb-2">{feature.icon}</div>
                  <div className="font-semibold text-gray-700 text-sm">{feature.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* State: Analyzing */}
        {loadingState === LoadingState.ANALYZING && (
          <div className="flex flex-col items-center justify-center pt-24 animate-fade-in-up">
             <div className="relative w-32 h-32 mb-10">
               <div className="absolute inset-0 bg-brand-100 rounded-full animate-ping opacity-75"></div>
               <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-brand-50">
                  <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
               </div>
               <div className="absolute -bottom-2 right-0 bg-white p-2 rounded-full shadow-lg text-2xl animate-bounce">
                 🔧
               </div>
             </div>
             <h2 className="text-3xl font-bold text-gray-900 mb-3">Műhelyek Elemzése...</h2>
             <p className="text-gray-500 text-lg">A vélemények átvizsgálása: "{problem}"</p>
          </div>
        )}

        {/* State: Results - Unified Single List */}
        {result && (
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="mb-8 flex items-center justify-center md:justify-start">
               <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <span className="bg-brand-100 text-brand-700 p-2 rounded-lg mr-3 shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                  </span>
                  Találatok
                </h3>
            </div>

            <div className="prose prose-brand max-w-none">
               <ReactMarkdown components={markdownComponents}>
                 {result.text}
               </ReactMarkdown>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-10 px-4 text-center">
          <p className="text-gray-900 font-semibold mb-2">Trustiqo</p>
          <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Minden jog fenntartva. Powered by Google Gemini.</p>
          <p className="mt-4 text-xs text-gray-400 max-w-md mx-auto leading-normal">
            Jogi nyilatkozat: Az AI javaslatok nyilvános adatokon alapulnak. Mindig használd a saját ítélőképességedet a végleges döntés előtt.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;