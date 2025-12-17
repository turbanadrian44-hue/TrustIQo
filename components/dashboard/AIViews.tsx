
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Car, DashboardView, Coordinates, LoadingState } from '../../types';
import Button from '../Button';
import { InputField, FileUpload, ImageFile } from '../DashboardUI';
import LocationRequest from '../LocationRequest';
import LoadingScreen from '../LoadingScreen';
import { analyzeQuote, diagnoseCar, analyzeAd, predictCosts, findTrustworthyMechanics } from '../../services/geminiService';
import { QuoteResultCard, DiagnosticResultCard, AdResultCard, PredictionResultCard } from '../AIResultCards';
import ReactMarkdown, { Components } from 'react-markdown';
import { ContactPanel, ExpandableListItem } from '../MarkdownRenderers';

// --- Shared Layout ---

interface SplitViewLayoutProps {
    title: string;
    icon: string;
    onBack: () => void;
    children?: React.ReactNode; // Inputs
    resultNode: React.ReactNode; // Result Display
    loading: boolean;
    outputRef: React.RefObject<HTMLDivElement>;
}

const SplitViewLayout = ({ title, icon, onBack, children, resultNode, loading, outputRef }: SplitViewLayoutProps) => (
    <div className="animate-fade-in-up flex flex-col h-auto lg:h-[calc(100vh-140px)] lg:min-h-[600px] pb-10 lg:pb-0">
      <div className="flex items-center justify-between mb-6 sticky top-20 z-20 bg-white/80 backdrop-blur-md lg:static lg:bg-transparent py-2 lg:py-0">
        <button 
          onClick={onBack} 
          className="group flex items-center text-gray-500 hover:text-brand-600 font-bold transition-colors px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 text-sm"
        >
          <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Vissza
        </button>
        <div className="flex items-center gap-3">
           <span className="text-2xl filter drop-shadow-sm">{icon}</span>
           <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
        </div>
      </div>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-full lg:overflow-hidden">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-soft border border-gray-100 lg:overflow-y-auto custom-scrollbar flex flex-col order-1">
           <div className="flex-grow space-y-6">
              {children}
           </div>
           <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
             <svg className="w-4 h-4 text-brand-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
           </div>
        </div>

        <div ref={outputRef} className="bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-200 lg:overflow-y-auto custom-scrollbar relative min-h-[400px] order-2 shadow-inner">
           {loading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10 rounded-3xl transition-opacity duration-300">
                <div className="relative w-20 h-20">
                   <div className="absolute inset-0 bg-brand-100 rounded-full animate-ping opacity-20"></div>
                   <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-brand-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="mt-6 font-bold text-gray-900 text-lg">Elemzés folyamatban...</p>
                <p className="text-sm text-gray-500 mt-2">Összevetés több ezer adatponttal</p>
             </div>
           )}
           
           {!loading && !resultNode && (
               <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center px-6 opacity-60 min-h-[300px]">
                 <div className="w-24 h-24 bg-white border-2 border-dashed border-gray-200 rounded-full mb-6 flex items-center justify-center">
                   <span className="text-4xl grayscale opacity-50">{icon}</span>
                 </div>
                 <h3 className="text-lg font-bold text-gray-600 mb-2">Itt jelenik meg az eredmény</h3>
                 <p className="max-w-xs text-sm">
                   Töltsd ki a bal oldali űrlapot, és az AI azonnal elkészíti a szakértői elemzést.
                 </p>
               </div>
           )}

           {resultNode}
        </div>
      </div>
    </div>
);

// --- Individual Feature Views ---

export const MechanicSearchView = ({ onBack, showToast }: { onBack: () => void, showToast: any }) => {
    const [problem, setProblem] = useState('');
    const [radius, setRadius] = useState(5);
    const [coords, setCoords] = useState<Coordinates | null>(null);
    const [result, setResult] = useState<any | null>(null);
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
    
    // We scroll to this ref when results appear
    const resultsRef = useRef<HTMLDivElement>(null);

    const handleLocationFound = (c: Coordinates) => {
        setCoords(c);
        showToast("Helyzet sikeresen meghatározva!", 'success');
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!coords || !problem) return;
        setLoadingState(LoadingState.ANALYZING);
        try {
            const res = await findTrustworthyMechanics(problem, coords, radius);
            setResult(res);
            setLoadingState(LoadingState.SUCCESS);
        } catch (e: any) { 
            showToast(e.message, 'error'); 
            setLoadingState(LoadingState.ERROR);
        }
    };

    const resetSearch = () => {
        setResult(null);
        setLoadingState(LoadingState.IDLE);
    };

    const markdownComponents: Components = useMemo(() => ({
        ul: ({node, children, ...props}) => <ul className="list-none p-0 space-y-3" {...props}>{React.Children.map(children, (child, index) => React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<any>, { isBest: index === 0 }) : child)}</ul>,
        li: ExpandableListItem,
        strong: ({node, ...props}) => <span className="block text-lg font-bold text-gray-900 mt-2" {...props} />,
        blockquote: ContactPanel,
        p: ({node, ...props}) => <span className="inline leading-relaxed text-gray-700" {...props} />,
    }), []);

    useEffect(() => { 
        if (result && resultsRef.current) {
            // Slight delay to ensure render
            setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }
    }, [result]);

    return (
        <div className="animate-fade-in-up pb-12 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button 
                  onClick={onBack} 
                  className="group flex items-center text-gray-500 hover:text-brand-600 font-bold transition-colors px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 text-sm"
                >
                  <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Vissza a vezérlőpultra
                </button>
                <div className="flex items-center gap-2">
                   <span className="text-2xl">📍</span>
                   <h2 className="text-xl font-bold text-gray-900">Szerelő Kereső</h2>
                </div>
            </div>

            {/* Stage 1: Location Request */}
            {!coords && (
                <div className="flex flex-col items-center justify-center py-10">
                    <div className="w-full max-w-lg">
                      <LocationRequest 
                        onLocationFound={handleLocationFound} 
                        onError={(msg) => showToast(msg, 'error')} 
                      />
                    </div>
                </div>
            )}

            {/* Stage 2: Form */}
            {coords && !result && loadingState !== LoadingState.ANALYZING && (
              <div className="max-w-2xl mx-auto animate-fade-in-up">
                <div className="text-center mb-8">
                   <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Miben segíthetünk?</h2>
                   <p className="text-gray-500 mt-2">Az AI elemezni fogja a környékbeli szerelők értékeléseit és visszajelzéseit.</p>
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
                      Elemzés Indítása
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {/* Stage 3: Loading */}
            {loadingState === LoadingState.ANALYZING && (
              <LoadingScreen />
            )}

            {/* Stage 4: Results */}
            {result && (
              <div ref={resultsRef} className="max-w-3xl mx-auto animate-fade-in-up pb-10">
                <div className="mb-8 flex items-end justify-between border-b border-gray-100 pb-4">
                   <div>
                     <h3 className="text-2xl font-bold text-gray-900">
                        Találatok
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
                   <p className="text-gray-600 mb-4">Új keresést szeretnél indítani?</p>
                   <button onClick={resetSearch} className="text-brand-600 hover:text-brand-800 font-bold text-lg hover:underline decoration-2 underline-offset-4 transition-colors">
                     Paraméterek módosítása
                   </button>
                </div>
              </div>
            )}
        </div>
    );
};

export const QuoteAnalyzerView = ({ cars, onBack, showToast }: { cars: Car[], onBack: () => void, showToast: any }) => {
    const [desc, setDesc] = useState('');
    const [price, setPrice] = useState('');
    const [mileage, setMileage] = useState('');
    const [carId, setCarId] = useState(cars.length > 0 ? cars[0].id : '');
    const [image, setImage] = useState<ImageFile | undefined>(undefined);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const outputRef = useRef<HTMLDivElement>(null);

    const handleRun = async () => {
        setLoading(true);
        try {
            const car = cars.find(c => c.id === carId);
            const carDetails = car ? `${car.make} ${car.model} (${car.year})` : undefined;
            const res = await analyzeQuote(desc, price, image, carDetails, mileage);
            setResult(res);
        } catch (e) { showToast("Hiba történt", 'error'); } finally { setLoading(false); }
    };
    
    useEffect(() => { if (result && outputRef.current && window.innerWidth < 1024) outputRef.current.scrollIntoView({ behavior: 'smooth' }); }, [result]);

    const handleImage = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImage({ mimeType: "image/jpeg", data: (reader.result as string).split(',')[1] });
            reader.readAsDataURL(file);
        }
    };

    return (
        <SplitViewLayout title="Árajánlat Kontroll" icon="💰" onBack={onBack} loading={loading} outputRef={outputRef} resultNode={result && <QuoteResultCard data={result} />}>
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-4 flex gap-3"><div className="text-2xl">🛡️</div><div><h4 className="font-bold text-blue-900 text-sm">Ne fizess rá!</h4><p className="text-xs text-blue-700">Töltsd fel a számlát, mi ellenőrizzük.</p></div></div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Melyik autó?</label>
              <select value={carId} onChange={(e) => setCarId(e.target.value)} className="w-full rounded-xl border-gray-200 bg-gray-50/50 p-4 text-gray-900 focus:ring-2 focus:border-brand-500">
                <option value="">Egyéb</option>{cars.map(c => <option key={c.id} value={c.id}>{c.make} {c.model}</option>)}
              </select>
            </div>
            <InputField label="Jelenlegi Km" type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} />
            <InputField label="Munka részletezése" rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} />
            <InputField label="Ár (HUF)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            <FileUpload label="Számla fotója" onUpload={handleImage} currentFile={image} />
            <Button variant="accent" fullWidth onClick={handleRun} disabled={!desc || !price} isLoading={loading}>Indítás</Button>
        </SplitViewLayout>
    );
};

export const DiagnosticsView = ({ cars, onBack, showToast }: { cars: Car[], onBack: () => void, showToast: any }) => {
    const [desc, setDesc] = useState('');
    const [carId, setCarId] = useState(cars.length > 0 ? cars[0].id : '');
    const [image, setImage] = useState<ImageFile | undefined>(undefined);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const outputRef = useRef<HTMLDivElement>(null);

    const handleRun = async () => {
        setLoading(true);
        try {
            const car = cars.find(c => c.id === carId);
            const carDetails = car ? `${car.make} ${car.model} (${car.year})` : undefined;
            const res = await diagnoseCar(desc, image, carDetails);
            setResult(res);
        } catch (e) { showToast("Hiba történt", 'error'); } finally { setLoading(false); }
    };
    
    useEffect(() => { if (result && outputRef.current && window.innerWidth < 1024) outputRef.current.scrollIntoView({ behavior: 'smooth' }); }, [result]);

    const handleImage = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImage({ mimeType: "image/jpeg", data: (reader.result as string).split(',')[1] });
            reader.readAsDataURL(file);
        }
    };

    return (
        <SplitViewLayout title="AI Diagnosztika" icon="🔧" onBack={onBack} loading={loading} outputRef={outputRef} resultNode={result && <DiagnosticResultCard data={result} />}>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Érintett jármű</label>
              <select value={carId} onChange={(e) => setCarId(e.target.value)} className="w-full rounded-xl border-gray-200 bg-gray-50/50 p-4 text-gray-900 focus:ring-2 focus:border-brand-500">
                <option value="">Egyéb</option>{cars.map(c => <option key={c.id} value={c.id}>{c.make} {c.model}</option>)}
              </select>
            </div>
            <InputField label="Tünetek leírása" rows={6} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Milyen hangot ad? Mikor?" />
            <FileUpload label="Fotó a hibáról" onUpload={handleImage} currentFile={image} />
            <Button variant="accent" fullWidth onClick={handleRun} disabled={!desc} isLoading={loading}>Diagnózis</Button>
        </SplitViewLayout>
    );
};

export const AdAnalyzerView = ({ onBack, showToast }: { onBack: () => void, showToast: any }) => {
    const [text, setText] = useState('');
    const [images, setImages] = useState<ImageFile[]>([]);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const outputRef = useRef<HTMLDivElement>(null);

    const handleRun = async () => {
        setLoading(true);
        try { const res = await analyzeAd(text, images); setResult(res); } 
        catch (e) { showToast("Hiba történt", 'error'); } 
        finally { setLoading(false); }
    };

    useEffect(() => { if (result && outputRef.current && window.innerWidth < 1024) outputRef.current.scrollIntoView({ behavior: 'smooth' }); }, [result]);

    const handleImage = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImages(prev => [...prev, { mimeType: "image/jpeg", data: (reader.result as string).split(',')[1] }]);
            reader.readAsDataURL(file);
        }
    };

    return (
        <SplitViewLayout title="Hirdetés Radar" icon="🕵️" onBack={onBack} loading={loading} outputRef={outputRef} resultNode={result && <AdResultCard data={result} />}>
            <InputField label="Hirdetés szövege vagy Link" rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder="Illeszd be a linket vagy a szöveget..." />
            <FileUpload label="Képek hozzáadása" onUpload={handleImage} currentFile={undefined} />
            {images.length > 0 && <div className="mt-2 text-xs text-gray-500">{images.length} kép csatolva</div>}
            <div className="pt-4"><Button variant="accent" fullWidth onClick={handleRun} disabled={!text} isLoading={loading}>Ellenőrzés</Button></div>
        </SplitViewLayout>
    );
};

export const PredictionsView = ({ cars, onBack, showToast }: { cars: Car[], onBack: () => void, showToast: any }) => {
    const [mileage, setMileage] = useState('');
    const [carId, setCarId] = useState(cars.length > 0 ? cars[0].id : '');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const outputRef = useRef<HTMLDivElement>(null);

    const handleRun = async () => {
        setLoading(true);
        try {
            const car = cars.find(c => c.id === carId);
            if (!car) return;
            const model = `${car.make} ${car.model} (${car.year})`;
            const res = await predictCosts(model, mileage);
            setResult(res);
        } catch (e) { showToast("Hiba történt", 'error'); } finally { setLoading(false); }
    };

    useEffect(() => { if (result && outputRef.current && window.innerWidth < 1024) outputRef.current.scrollIntoView({ behavior: 'smooth' }); }, [result]);

    return (
        <SplitViewLayout title="Jövőbelátó" icon="🔮" onBack={onBack} loading={loading} outputRef={outputRef} resultNode={result && <PredictionResultCard data={result} />}>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Érintett jármű</label>
              <select value={carId} onChange={(e) => setCarId(e.target.value)} className="w-full rounded-xl border-gray-200 bg-gray-50/50 p-4 text-gray-900 focus:ring-2 focus:border-brand-500">
                {cars.map(c => <option key={c.id} value={c.id}>{c.make} {c.model}</option>)}
              </select>
            </div>
            <InputField label="Jelenlegi Futás (KM)" type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} />
            <div className="pt-4"><Button variant="accent" fullWidth onClick={handleRun} disabled={!carId || !mileage} isLoading={loading}>Számítás</Button></div>
        </SplitViewLayout>
    );
};
