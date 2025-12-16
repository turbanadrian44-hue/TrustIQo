
import React, { useState, useEffect, useRef } from 'react';
import { User, DashboardView, ServiceRecord, QuoteAnalysisResult, DiagnosticResult, AdAnalysisResult, PredictionResult, Car } from '../types';
import Button from './Button';
import ReactMarkdown from 'react-markdown'; 
import { analyzeQuote, diagnoseCar, analyzeAd, predictCosts } from '../services/geminiService';
import Notification, { NotificationType } from './Notification';
import { db } from '../firebaseConfig';
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, query } from 'firebase/firestore';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

interface ImageFile {
  data: string;
  mimeType: string;
}

// --- UX Helpers ---

const getServiceIcon = (serviceName: string) => {
  const lower = serviceName.toLowerCase();
  if (lower.includes('olaj') || lower.includes('szűrő')) return '🛢️';
  if (lower.includes('fék') || lower.includes('tárcsa') || lower.includes('betét')) return '🛑';
  if (lower.includes('kerék') || lower.includes('gumi') || lower.includes('abroncs')) return '🛞';
  if (lower.includes('motor') || lower.includes('vezérlés')) return '⚙️';
  if (lower.includes('akku') || lower.includes('elem')) return '🔋';
  if (lower.includes('klíma') || lower.includes('légkondi')) return '❄️';
  if (lower.includes('műszaki') || lower.includes('vizsga')) return '📝';
  return '🔧';
};

// --- Helper Components ---

const FileUpload = ({ label, onUpload, currentFile }: { label: string, onUpload: (e: any) => void, currentFile?: ImageFile }) => (
  <div className="group">
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
    <label className={`
      flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden
      ${currentFile ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-500/20' : 'border-gray-300 bg-gray-50/50 hover:bg-white hover:border-brand-300 hover:shadow-sm'}
    `}>
      <div className="flex flex-col items-center justify-center pt-5 pb-6 relative z-10 transition-transform duration-300 group-hover:scale-105">
        {currentFile ? (
           <>
             <div className="absolute inset-0 bg-brand-50/90 z-0"></div>
             <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center mb-2 z-10">
                <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
             </div>
             <p className="text-sm text-brand-700 font-bold relative z-10">Fájl Csatolva</p>
             <p className="text-xs text-brand-400 mt-1 relative z-10">Kattints a cseréhez</p>
           </>
        ) : (
           <>
             <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2 group-hover:bg-brand-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400 group-hover:text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
             </div>
             <p className="text-sm text-gray-500 group-hover:text-gray-700 font-medium">Kép feltöltése</p>
           </>
        )}
      </div>
      <input type="file" className="hidden" accept="image/*" onChange={onUpload} />
    </label>
  </div>
);

const DashboardCard = ({ title, icon, desc, onClick, color = "brand" }: any) => (
  <div 
    onClick={onClick} 
    className="bg-white p-6 rounded-2xl cursor-pointer shadow-soft border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
  >
    <div className={`absolute top-0 left-0 w-1 h-full bg-${color}-500 transform origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-300`}></div>
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl bg-${color}-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner-light`}>
        {icon}
      </div>
      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </div>
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

const InputField = ({ label, value, onChange, placeholder, type = "text", rows }: any) => (
  <div className="mb-4">
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">{label}</label>
    {rows ? (
      <textarea 
        rows={rows} 
        className="w-full rounded-xl border-gray-200 bg-gray-50/50 p-4 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all shadow-sm resize-none"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    ) : (
      <input 
        type={type}
        className="w-full rounded-xl border-gray-200 bg-gray-50/50 p-4 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all shadow-sm"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    )}
  </div>
);

// --- Result Render Components (Rich UI) ---

const QuoteResultRenderer = ({ data }: { data: QuoteAnalysisResult }) => {
  const verdictColors = {
    "Fair": "bg-green-50 text-green-800 border-green-200",
    "Overpriced": "bg-red-50 text-red-800 border-red-200",
    "Suspiciously Low": "bg-yellow-50 text-yellow-800 border-yellow-200",
    "Unclear": "bg-gray-50 text-gray-800 border-gray-200"
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className={`p-6 rounded-2xl border ${verdictColors[data.verdict] || verdictColors["Unclear"]} flex items-center gap-5 shadow-sm`}>
        <div className="text-4xl filter drop-shadow-sm">
          {data.verdict === 'Fair' ? '⚖️' : data.verdict === 'Overpriced' ? '💸' : '🤔'}
        </div>
        <div>
          <div className="text-xs font-bold opacity-70 uppercase tracking-wider mb-1">Eredmény</div>
          <div className="text-2xl font-bold tracking-tight">{data.verdict}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-soft">
        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-widest">Piaci Körkép</h4>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-4">
          <span className="text-gray-600 font-medium">Reális Ártartomány:</span>
          <span className="text-2xl font-bold text-brand-600">{data.marketPriceRange}</span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-4">{data.summary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100">
           <h4 className="flex items-center text-red-800 font-bold mb-3">
             <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mr-2 text-xs">!</span>
             Kockázatok
           </h4>
           {data.redFlags && data.redFlags.length > 0 ? (
             <ul className="space-y-2">
               {data.redFlags.map((flag, i) => (
                 <li key={i} className="text-sm text-red-700 flex items-start leading-snug">
                   <span className="mr-2 mt-1 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span> {flag}
                 </li>
               ))}
             </ul>
           ) : <p className="text-sm text-green-600">Minden rendben tűnik.</p>}
        </div>

        <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
           <h4 className="flex items-center text-blue-800 font-bold mb-3">
             <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 text-xs">💡</span>
             Tanácsok
           </h4>
           <ul className="space-y-2">
             {data.advice.map((item, i) => (
               <li key={i} className="text-sm text-blue-700 flex items-start leading-snug">
                 <span className="mr-2 mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span> {item}
               </li>
             ))}
           </ul>
        </div>
      </div>
    </div>
  );
};

const DiagnosticResultRenderer = ({ data }: { data: DiagnosticResult }) => {
  const urgencyColors = {
    "Low": "bg-green-500 shadow-green-200",
    "Medium": "bg-yellow-500 shadow-yellow-200",
    "High": "bg-orange-500 shadow-orange-200",
    "Critical": "bg-red-600 shadow-red-200"
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className={`h-2 w-full ${urgencyColors[data.urgencyLevel]?.split(' ')[0] || 'bg-gray-400'}`}></div>
        <div className="p-6 flex items-center justify-between">
           <div>
             <div className="text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Sürgősségi Index</div>
             <div className="text-xl font-bold text-gray-800">{data.urgencyLevel}</div>
           </div>
           <div className={`w-14 h-14 rounded-full ${urgencyColors[data.urgencyLevel]} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
             !
           </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <h3 className="font-bold text-gray-900">Lehetséges Okok</h3>
        {data.possibleCauses.map((cause, i) => (
           <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col gap-1">
              <div className="flex justify-between">
                 <span className="font-bold text-gray-800">{cause.cause}</span>
                 <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{cause.probability}</span>
              </div>
              <p className="text-sm text-gray-500">{cause.description}</p>
           </div>
        ))}
      </div>
      <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
         <span className="block text-xs font-bold text-gray-500 uppercase mb-2">Becsült Költség</span>
         <span className="text-2xl font-bold text-gray-900">{data.estimatedCostRange}</span>
      </div>
    </div>
  );
};

const AdResultRenderer = ({ data }: { data: AdAnalysisResult }) => (
  <div className="space-y-6 animate-fade-in-up">
     <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-soft text-center">
        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400 mb-2">{data.trustScore}</div>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bizalmi Pontszám</div>
        <h3 className="text-lg font-bold text-gray-900 mt-4">{data.verdictShort}</h3>
     </div>
     <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
        <h4 className="font-bold text-red-800 mb-3">🚩 Gyanús Jelek</h4>
        <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
           {data.redFlags.map((f, i) => <li key={i}>{f}</li>)}
        </ul>
     </div>
  </div>
);

const PredictionResultRenderer = ({ data }: { data: PredictionResult }) => (
    <div className="space-y-6 animate-fade-in-up">
       <div className="bg-brand-600 text-white p-6 rounded-2xl shadow-lg shadow-brand-500/20">
          <h3 className="font-bold text-brand-100 text-xs uppercase tracking-wider mb-1">Becsült Éves Költség</h3>
          <p className="text-3xl font-bold">{data.annualCostEstimate}</p>
       </div>
       <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft">
          <p className="text-gray-600 text-sm leading-relaxed">{data.carSummary}</p>
       </div>
       <div>
         <h4 className="font-bold text-gray-900 mb-3 ml-1">Karbantartási Terv</h4>
         {data.upcomingMaintenance.map((item, i) => (
            <div key={i} className="flex justify-between items-center bg-white p-4 mb-2 rounded-xl border border-gray-100">
               <div>
                  <div className="font-bold text-gray-800">{item.item}</div>
                  <div className="text-xs text-gray-500">{item.dueInKm} múlva</div>
               </div>
               <div className="font-bold text-brand-600 text-sm">{item.estimatedCost}</div>
            </div>
         ))}
       </div>
    </div>
);


// --- Main Dashboard Component ---

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState<DashboardView>(DashboardView.HOME);
  const [notification, setNotification] = useState<{msg: string, type: NotificationType} | null>(null);
  const showToast = (msg: string, type: NotificationType = 'success') => setNotification({ msg, type });

  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<any | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Inputs
  const [quoteDesc, setQuoteDesc] = useState('');
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteImage, setQuoteImage] = useState<ImageFile | undefined>(undefined);
  const [quoteCarId, setQuoteCarId] = useState<string>('');
  const [quoteMileage, setQuoteMileage] = useState('');

  const [diagDesc, setDiagDesc] = useState('');
  const [diagImage, setDiagImage] = useState<ImageFile | undefined>(undefined);
  const [diagCarId, setDiagCarId] = useState<string>('');

  const [adText, setAdText] = useState('');
  const [adImages, setAdImages] = useState<ImageFile[]>([]); // New State for Array of Images
  
  const [carModel, setCarModel] = useState('');
  const [mileage, setMileage] = useState('');
  const [predCarId, setPredCarId] = useState<string>('');

  // Garage
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [isAddCarOpen, setIsAddCarOpen] = useState(false);
  const [newCar, setNewCar] = useState({ make: '', model: '', year: '', plate: '' });
  const [newService, setNewService] = useState({ serviceName: '', date: '', cost: '', description: '' });
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);

  // Deletion State
  const [isDeleteCarModalOpen, setIsDeleteCarModalOpen] = useState(false);
  const [carToDeleteId, setCarToDeleteId] = useState<string | null>(null);

  // ---- FIREBASE DATA FETCHING ----
  useEffect(() => {
    if (!user?.id) return;

    // Real-time listener for user's cars
    const q = query(collection(db, 'users', user.id, 'cars'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const carsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Car));
      setCars(carsData);
      
      // Auto-select first car if none selected or if previously selected one is gone
      if (carsData.length > 0) {
          if (!selectedCarId || !carsData.find(c => c.id === selectedCarId)) {
             const defaultId = carsData[0].id;
             setSelectedCarId(defaultId);
             setQuoteCarId(defaultId);
             setDiagCarId(defaultId);
             setPredCarId(defaultId);
          }
      } else {
         setSelectedCarId(null);
      }
    }, (error) => {
      console.error("Error fetching cars:", error);
      showToast("Nem sikerült betölteni az adatokat.", 'error');
    });

    return () => unsubscribe();
  }, [user?.id]);

  const getSelectedCar = () => cars.find(c => c.id === selectedCarId);

  useEffect(() => {
    if (aiResponse && outputRef.current && window.innerWidth < 1024) {
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [aiResponse]);

  // UX Improvement: Reset inputs when leaving tools
  const resetToolStates = () => {
    setAiResponse(null);
    // Quote
    setQuoteDesc('');
    setQuotePrice('');
    setQuoteImage(undefined);
    setQuoteMileage('');
    setQuoteCarId(cars.length > 0 ? cars[0].id : '');
    
    // Diag
    setDiagDesc('');
    setDiagImage(undefined);
    setDiagCarId(cars.length > 0 ? cars[0].id : '');
    
    // Ad
    setAdText('');
    setAdImages([]); // Reset Array
    
    // Pred
    setCarModel('');
    setMileage('');
    setPredCarId(cars.length > 0 ? cars[0].id : '');
  };

  // ---- FIREBASE SAVE ACTIONS ----

  const saveCar = async () => {
    if (!newCar.make || !newCar.model) {
      showToast("A márka és típus megadása kötelező!", 'error');
      return;
    }
    setLoading(true);
    try {
        const carId = Date.now().toString(); // Simple ID generation
        const carToAdd: Car = {
            id: carId,
            make: newCar.make,
            model: newCar.model,
            year: newCar.year,
            plate: newCar.plate,
            records: []
        };
        
        await setDoc(doc(db, 'users', user.id, 'cars', carId), carToAdd);
        
        setSelectedCarId(carId);
        setNewCar({ make: '', model: '', year: '', plate: '' });
        setIsAddCarOpen(false);
        showToast("Jármű sikeresen rögzítve!", 'success');
    } catch (e) {
        console.error(e);
        showToast("Hiba történt a mentés során.", 'error');
    } finally {
        setLoading(false);
    }
  };

  const initiateDeleteCar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevents selecting the car when clicking delete
    setCarToDeleteId(id);
    setIsDeleteCarModalOpen(true);
  };

  const confirmDeleteCar = async () => {
    if (!carToDeleteId) return;
    try {
        await deleteDoc(doc(db, 'users', user.id, 'cars', carToDeleteId));
        
        if (selectedCarId === carToDeleteId) {
           setSelectedCarId(null);
        }
        
        // Update tool selections if necessary (handled by useEffect, but safe to reset)
        if (quoteCarId === carToDeleteId) setQuoteCarId('');
        if (diagCarId === carToDeleteId) setDiagCarId('');
        if (predCarId === carToDeleteId) setPredCarId('');

        setIsDeleteCarModalOpen(false);
        setCarToDeleteId(null);
        showToast("Jármű sikeresen törölve!", 'info');
    } catch (e) {
        console.error(e);
        showToast("Hiba történt a törlés során.", 'error');
    }
  };

  const saveServiceRecord = async () => {
    if (!selectedCarId) { showToast("Válassz ki egy autót!", 'error'); return; }
    
    const carToUpdate = cars.find(c => c.id === selectedCarId);
    if (!carToUpdate) return;

    try {
      const record: ServiceRecord = {
        id: Date.now().toString(),
        date: newService.date,
        serviceName: newService.serviceName,
        description: newService.description,
        cost: Number(newService.cost)
      };
      
      const updatedRecords = [record, ...carToUpdate.records];
      
      await updateDoc(doc(db, 'users', user.id, 'cars', selectedCarId), {
          records: updatedRecords
      });

      setNewService({ serviceName: '', date: '', cost: '', description: '' });
      setIsAddServiceOpen(false);
      showToast("Szerviztörténet frissítve!", 'success');
    } catch (e) { 
        console.error(e);
        showToast("Hiba történt a mentés során.", 'error'); 
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: ImageFile) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) { showToast("Kérlek képfájlt tölts fel.", 'error'); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const matches = base64String.match(/^data:(.+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          setter({ mimeType: matches[1], data: matches[2] });
          showToast("Kép csatolva!", 'info');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Specific handler for Ad Image array
  const handleAdImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) { showToast("Kérlek képfájlt tölts fel.", 'error'); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const matches = base64String.match(/^data:(.+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const newImage = { mimeType: matches[1], data: matches[2] };
          setAdImages(prev => [...prev, newImage]);
          showToast("Kép hozzáadva!", 'info');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAdImage = (index: number) => {
    setAdImages(prev => prev.filter((_, i) => i !== index));
  };

  const runAI = async (task: () => Promise<any>) => {
    setLoading(true);
    setAiResponse(null);
    try {
      const result = await task();
      setAiResponse(result);
    } catch (e: any) {
      setAiResponse(null); 
      showToast("Az elemzés sikertelen volt.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderHome = () => (
    <div className="animate-fade-in-up pb-10">
      <div className="bg-gradient-to-r from-brand-900 to-brand-700 rounded-3xl p-8 md:p-12 text-white shadow-2xl mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500 opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-semibold mb-4 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
              AI Rendszer Aktív
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">Szia, {user.name.split(' ')[0]}!</h2>
            <p className="text-brand-100 max-w-lg text-lg leading-relaxed">A Trustiqo készen áll, hogy megvédjen a túlárazástól és a rejtett hibáktól.</p>
          </div>
          <div className="flex gap-4">
             <div 
               onClick={() => setCurrentView(DashboardView.SERVICE_LOG)}
               className="group bg-white/5 backdrop-blur-lg rounded-2xl p-5 border border-white/10 text-center flex-1 md:flex-none md:min-w-[160px] cursor-pointer hover:bg-white/15 transition-all duration-300 hover:-translate-y-1"
             >
               <span className="block text-4xl font-black text-white mb-1 group-hover:scale-110 transition-transform duration-300">{cars.length}</span>
               <span className="text-xs uppercase tracking-widest text-brand-200 font-bold">Autó a garázsban</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard 
          title="Árajánlat Kontroll" icon="💰" desc="Ellenőrizd a kapott ajánlatot piaci adatok alapján."
          onClick={() => setCurrentView(DashboardView.QUOTE_ANALYZER)} color="accent"
        />
        <DashboardCard 
          title="Digitális Garázs" icon="📘" desc="Minden szerviztörténet egy helyen, papír nélkül."
          onClick={() => setCurrentView(DashboardView.SERVICE_LOG)}
        />
        <DashboardCard 
          title="AI Diagnosztika" icon="🔧" desc="Ismerd fel a hibát még a szerelő előtt."
          onClick={() => setCurrentView(DashboardView.DIAGNOSTICS)}
        />
        <DashboardCard 
          title="Hirdetés Radar" icon="🕵️" desc="Rejtett hibák kiszűrése hirdetési szövegekből."
          onClick={() => setCurrentView(DashboardView.AD_ANALYZER)}
        />
        <DashboardCard 
          title="Jövőbelátó" icon="🔮" desc="Tervezhető költségek és karbantartási előrejelzés."
          onClick={() => setCurrentView(DashboardView.PREDICTIONS)}
        />
      </div>
    </div>
  );

  const renderSplitView = (title: string, icon: string, inputs: React.ReactNode, resultType: 'quote' | 'diag' | 'ad' | 'pred') => (
    <div className="animate-fade-in-up flex flex-col h-auto lg:h-[calc(100vh-140px)] lg:min-h-[600px] pb-10 lg:pb-0">
      <div className="flex items-center justify-between mb-6 sticky top-20 z-20 bg-white/80 backdrop-blur-md lg:static lg:bg-transparent py-2 lg:py-0">
        <button 
          onClick={() => { 
            resetToolStates();
            setCurrentView(DashboardView.HOME); 
          }} 
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
              {inputs}
           </div>
           <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
             <svg className="w-4 h-4 text-brand-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
             Powered by Gemini 2.5 AI
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

           {aiResponse ? (
             <div className="w-full">
                {resultType === 'quote' && <QuoteResultRenderer data={aiResponse} />}
                {resultType === 'diag' && <DiagnosticResultRenderer data={aiResponse} />}
                {resultType === 'ad' && <AdResultRenderer data={aiResponse} />}
                {resultType === 'pred' && <PredictionResultRenderer data={aiResponse} />}
             </div>
           ) : (
             !loading && (
               <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center px-6 opacity-60 min-h-[300px]">
                 <div className="w-24 h-24 bg-white border-2 border-dashed border-gray-200 rounded-full mb-6 flex items-center justify-center">
                   <span className="text-4xl grayscale opacity-50">{icon}</span>
                 </div>
                 <h3 className="text-lg font-bold text-gray-600 mb-2">Itt jelenik meg az eredmény</h3>
                 <p className="max-w-xs text-sm">
                   Töltsd ki a <span className="md:hidden font-bold">fenti</span><span className="hidden md:inline font-bold">bal oldali</span> űrlapot, és az AI azonnal elkészíti a szakértői elemzést.
                 </p>
               </div>
             )
           )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-8 px-4 md:px-8 max-w-[1600px] mx-auto relative">
      {notification && <Notification message={notification.msg} type={notification.type} onClose={() => setNotification(null)} />}

      {currentView === DashboardView.HOME && renderHome()}

      {/* Simplified views calling renderSplitView - logic remains same but cleaner layout */}
      {currentView === DashboardView.QUOTE_ANALYZER && renderSplitView("Árajánlat Kontroll", "💰", (
        <>
           <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-4 flex gap-3">
             <div className="text-2xl">🛡️</div>
             <div>
                <h4 className="font-bold text-blue-900 text-sm">Ne fizess rá!</h4>
                <p className="text-xs text-blue-700 mt-1">Töltsd fel a számlát vagy írd be a tételeket. Mi megmondjuk, ha át akarnak verni.</p>
             </div>
           </div>
           
           {/* Car Selector for Quote Analyzer */}
           <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Melyik autóhoz érkezett?</label>
              
              {cars.length === 0 ? (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-center">
                   <div className="text-2xl mb-2">🚗</div>
                   <h4 className="font-bold text-amber-800 text-sm mb-1">Nincs még autód!</h4>
                   <p className="text-xs text-amber-700 mb-3">A pontos árazáshoz vidd fel az autód adatait a Garázsba.</p>
                   <button 
                     onClick={() => {
                        setCurrentView(DashboardView.SERVICE_LOG);
                        setIsAddCarOpen(true);
                     }}
                     className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-4 py-2 rounded-lg text-xs font-bold transition-colors w-full"
                   >
                     Autó hozzáadása
                   </button>
                </div>
              ) : (
                <div className="relative">
                  <select 
                    value={quoteCarId} 
                    onChange={(e) => setQuoteCarId(e.target.value)}
                    className="w-full rounded-xl border-gray-200 bg-gray-50/50 p-4 text-gray-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="">Egyéb / Nem listázott jármű</option>
                    {cars.map(car => (
                      <option key={car.id} value={car.id}>
                        {car.make} {car.model} ({car.year})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              )}
           </div>

           <InputField label="Jelenlegi Km óra állás" type="number" placeholder="pl. 145000" value={quoteMileage} onChange={(e: any) => setQuoteMileage(e.target.value)} />
           <InputField label="Munka részletezése" rows={4} placeholder="pl. Vezérlés csere, SKF szett, 4 óra munkadíj..." value={quoteDesc} onChange={(e: any) => setQuoteDesc(e.target.value)} />
           <InputField label="Kapott Ár (HUF)" type="number" placeholder="pl. 185000" value={quotePrice} onChange={(e: any) => setQuotePrice(e.target.value)} />
           <FileUpload label="Számla / Ajánlat fotója" onUpload={(e) => handleImageUpload(e, setQuoteImage)} currentFile={quoteImage} />
           <div className="pt-4">
             <Button 
               variant="accent" 
               fullWidth 
               onClick={() => {
                 const quoteCar = cars.find(c => c.id === quoteCarId);
                 const carDetails = quoteCar ? `${quoteCar.make} ${quoteCar.model} (${quoteCar.year})` : undefined;
                 runAI(() => analyzeQuote(quoteDesc, quotePrice, quoteImage, carDetails, quoteMileage));
               }} 
               disabled={!quoteDesc || !quotePrice} 
               isLoading={loading}
              >
               Indítás
             </Button>
           </div>
        </>
      ), 'quote')}

      {/* ... similar pattern for other views ... */}
      {currentView === DashboardView.DIAGNOSTICS && renderSplitView("AI Diagnosztika", "🔧", (
        <>
           <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Érintett jármű</label>
              
              {cars.length === 0 ? (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-center mb-4">
                   <div className="text-2xl mb-2">🚗</div>
                   <h4 className="font-bold text-amber-800 text-sm mb-1">Nincs még autód!</h4>
                   <p className="text-xs text-amber-700 mb-3">A pontos diagnosztikához vidd fel az autód adatait.</p>
                   <button 
                     onClick={() => {
                        setCurrentView(DashboardView.SERVICE_LOG);
                        setIsAddCarOpen(true);
                     }}
                     className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-4 py-2 rounded-lg text-xs font-bold transition-colors w-full"
                   >
                     Autó hozzáadása
                   </button>
                </div>
              ) : (
                <div className="relative">
                  <select 
                    value={diagCarId} 
                    onChange={(e) => setDiagCarId(e.target.value)}
                    className="w-full rounded-xl border-gray-200 bg-gray-50/50 p-4 text-gray-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="">Egyéb / Nem listázott jármű</option>
                    {cars.map(car => (
                      <option key={car.id} value={car.id}>
                        {car.make} {car.model} ({car.year})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              )}
           </div>

           <InputField label="Tünetek leírása" rows={6} placeholder="Milyen hangot ad? Mikor? Honnan jön? (pl. Kopogás bal elölről fekvőrendőrnél...)" value={diagDesc} onChange={(e: any) => setDiagDesc(e.target.value)} />
           <FileUpload label="Fotó a hibáról" onUpload={(e) => handleImageUpload(e, setDiagImage)} currentFile={diagImage} />
           <div className="pt-4">
             <Button 
               variant="accent" 
               fullWidth 
               onClick={() => {
                 const diagCar = cars.find(c => c.id === diagCarId);
                 const carDetails = diagCar ? `${diagCar.make} ${diagCar.model} (${diagCar.year})` : undefined;
                 runAI(() => diagnoseCar(diagDesc, diagImage, carDetails));
               }} 
               disabled={!diagDesc} 
               isLoading={loading}
             >
               Diagnózis
             </Button>
           </div>
        </>
      ), 'diag')}

      {currentView === DashboardView.AD_ANALYZER && renderSplitView("Hirdetés Radar", "🕵️", (
        <>
           <InputField label="Hirdetés szövege vagy Link" rows={12} placeholder="Másold be ide a TELJES hirdetési szöveget, vagy illeszd be a linket (ha támogatott az oldal)..." value={adText} onChange={(e: any) => setAdText(e.target.value)} />
           <FileUpload label="Hirdetés képei (többet is csatolhatsz)" onUpload={handleAdImageUpload} currentFile={undefined} />
           
           {adImages.length > 0 && (
             <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3 animate-fade-in-up">
                {adImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden shadow-sm border border-gray-200 group">
                     <img src={`data:${img.mimeType};base64,${img.data}`} className="w-full h-full object-cover" alt={`Feltöltött kép ${idx + 1}`} />
                     <button 
                       onClick={() => removeAdImage(idx)}
                       className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-1 transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100"
                     >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                  </div>
                ))}
             </div>
           )}

           <div className="pt-4"><Button variant="accent" fullWidth onClick={() => runAI(() => analyzeAd(adText, adImages))} disabled={!adText} isLoading={loading}>Ellenőrzés</Button></div>
        </>
      ), 'ad')}

      {currentView === DashboardView.PREDICTIONS && renderSplitView("Jövőbelátó", "🔮", (
        <>
           <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1">Érintett jármű</label>
              
              {cars.length === 0 ? (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-center mb-4">
                   <div className="text-2xl mb-2">🚗</div>
                   <h4 className="font-bold text-amber-800 text-sm mb-1">Nincs még autód!</h4>
                   <p className="text-xs text-amber-700 mb-3">A költségek becsléséhez vidd fel az autód adatait.</p>
                   <button 
                     onClick={() => {
                        setCurrentView(DashboardView.SERVICE_LOG);
                        setIsAddCarOpen(true);
                     }}
                     className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-4 py-2 rounded-lg text-xs font-bold transition-colors w-full"
                   >
                     Autó hozzáadása
                   </button>
                </div>
              ) : (
                <div className="relative">
                  <select 
                    value={predCarId} 
                    onChange={(e) => setPredCarId(e.target.value)}
                    className="w-full rounded-xl border-gray-200 bg-gray-50/50 p-4 text-gray-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    {/* REMOVED DEFAULT OPTION */}
                    {cars.map(car => (
                      <option key={car.id} value={car.id}>
                        {car.make} {car.model} ({car.year})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              )}
           </div>

           {/* REMOVED MANUAL INPUT FIELD */}
           
           <InputField label="Jelenlegi Futás (KM)" type="number" placeholder="210000" value={mileage} onChange={(e: any) => setMileage(e.target.value)} />
           
           <div className="pt-4">
             <Button 
               variant="accent" 
               fullWidth 
               onClick={() => {
                 const selectedCar = cars.find(c => c.id === predCarId);
                 // Fallback should theoretically not be hit if UI prevents it, but keeping safe access
                 if (!selectedCar) return; 
                 const modelToUse = `${selectedCar.make} ${selectedCar.model} (${selectedCar.year})`;
                 runAI(() => predictCosts(modelToUse, mileage));
               }} 
               disabled={!predCarId || !mileage} 
               isLoading={loading}
             >
               Számítás
             </Button>
           </div>
        </>
      ), 'pred')}

      {currentView === DashboardView.SERVICE_LOG && (
        <div className="animate-fade-in-up max-w-6xl mx-auto pb-12">
          <div className="flex items-center mb-8">
            <button onClick={() => setCurrentView(DashboardView.HOME)} className="flex items-center text-gray-500 hover:text-brand-600 font-bold px-4 py-2 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-all mr-4">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Vissza
            </button>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Digitális Garázs</h2>
          </div>
          
          <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-soft border border-gray-100 min-h-[700px] relative">
            
            {/* 1. CAR CAROUSEL UI (Replacing simple buttons) */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-500 uppercase tracking-wider">Járműveim</h3>
                <button onClick={() => setIsAddCarOpen(true)} className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center shadow-lg transition-all active:scale-95">
                   <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                   Új Hozzáadása
                </button>
            </div>

            {cars.length > 0 ? (
              <div className="flex overflow-x-auto pb-8 gap-4 no-scrollbar snap-x">
                {cars.map(car => (
                  <div
                    key={car.id}
                    onClick={() => setSelectedCarId(car.id)}
                    className={`
                      relative flex-shrink-0 w-72 p-5 rounded-2xl cursor-pointer transition-all duration-300 snap-center group
                      ${selectedCarId === car.id 
                        ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-xl shadow-brand-500/30 scale-[1.02] ring-2 ring-brand-500 ring-offset-2' 
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-brand-300 hover:shadow-lg'}
                    `}
                  >
                    {/* Delete Icon - Positioned Top Right */}
                    <button 
                       onClick={(e) => initiateDeleteCar(e, car.id)}
                       className={`absolute top-2 right-2 p-2 rounded-lg transition-colors z-10
                         ${selectedCarId === car.id 
                           ? 'text-brand-100 hover:bg-red-500/20 hover:text-white' 
                           : 'text-gray-400 hover:bg-red-50 hover:text-red-600'}
                       `}
                       title="Autó törlése"
                    >
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>

                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${selectedCarId === car.id ? 'bg-white/20' : 'bg-gray-100'}`}>
                        🚗
                      </div>
                      {selectedCarId === car.id && <div className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold mr-8">Aktív</div>}
                    </div>
                    <div className="font-bold text-xl mb-1 truncate pr-6">{car.make} {car.model}</div>
                    <div className={`text-sm ${selectedCarId === car.id ? 'text-brand-100' : 'text-gray-500'} mb-4`}>{car.year} • {car.plate || 'Nincs rendszám'}</div>
                    <div className={`text-xs font-medium border-t pt-3 ${selectedCarId === car.id ? 'border-white/20 text-brand-100' : 'border-gray-100 text-gray-400'}`}>
                       {car.records.length} szervizbejegyzés
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 mb-8">
                   <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">🚗</div>
                   <h3 className="text-xl font-bold text-gray-900 mb-2">Üres a garázs</h3>
                   <p className="text-gray-500 mb-6">Adj hozzá egy autót a kezdéshez.</p>
                   <Button onClick={() => setIsAddCarOpen(true)}>Első Autó Felvétele</Button>
                </div>
            )}

            {/* Content Area */}
            {getSelectedCar() && (
               <div className="mt-4 animate-fade-in-up">
                  <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
                     <div>
                        <h2 className="text-2xl font-bold text-gray-900">Szerviztörténet</h2>
                        <p className="text-sm text-gray-500">Itt láthatod az autó élettörténetét.</p>
                     </div>
                     <button onClick={() => setIsAddServiceOpen(true)} className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 rounded-xl font-bold flex items-center shadow-lg shadow-brand-500/20 transition-all active:scale-95">
                       <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                       Bejegyzés
                     </button>
                  </div>

                  {getSelectedCar()!.records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                       <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-4xl grayscale opacity-30">📘</div>
                       <p className="text-gray-500 font-medium">Nincs még bejegyzés. Rögzítsd az elsőt most!</p>
                    </div>
                  ) : (
                    // 2. TIMELINE UI IMPROVEMENT
                    <div className="relative pl-4 md:pl-0 space-y-8">
                       {/* Center line only on desktop */}
                       <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-0.5 bg-gray-200 -translate-x-1/2 rounded-full"></div>
                       
                       {getSelectedCar()!.records.map((record, index) => (
                         <div key={record.id} className={`relative flex flex-col md:flex-row items-start md:items-center w-full ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                           <div className="hidden md:block w-1/2"></div>
                           
                           {/* SMART ICON NODE */}
                           <div className="absolute left-0 top-0 md:left-1/2 md:top-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border-4 border-brand-100 shadow-md z-10 md:-translate-x-1/2 md:-translate-y-1/2 flex items-center justify-center text-lg md:text-xl transform transition-transform hover:scale-110">
                             {getServiceIcon(record.serviceName)}
                           </div>
                           
                           <div className="w-full md:w-1/2 pl-12 md:pl-0 md:px-10">
                              <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-brand-200 transition-all duration-300 group relative`}>
                                 <div className="flex justify-between items-start mb-3">
                                   <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{record.serviceName}</h3>
                                   <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 whitespace-nowrap">{record.date}</span>
                                 </div>
                                 <p className="text-gray-600 text-sm mb-4 leading-relaxed">{record.description}</p>
                                 <div className="inline-flex items-center text-brand-700 bg-brand-50 px-3 py-1 rounded-lg text-sm font-bold">
                                   {record.cost.toLocaleString()} Ft
                                 </div>
                              </div>
                           </div>
                         </div>
                       ))}
                    </div>
                  )}

                  {getSelectedCar()!.records.length > 0 && (
                    <div className="mt-12 flex justify-end">
                       <div className="bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4">
                          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Összesített Költség</span>
                          <span className="text-2xl font-bold">{getSelectedCar()!.records.reduce((sum, r) => sum + r.cost, 0).toLocaleString()} Ft</span>
                       </div>
                    </div>
                  )}
               </div>
            )}
          </div>
        </div>
      )}

      {/* MODALS MOVED TO ROOT LEVEL TO FIX Z-INDEX/TRANSFORM ISSUES */}

      {isAddServiceOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddServiceOpen(false)}></div>
            <div className="relative bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-fade-in-up">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Bejegyzés Rögzítése</h3>
                <div className="space-y-4">
                  <InputField label="Elvégzett munka" placeholder="pl. Olajcsere" value={newService.serviceName} onChange={(e: any) => setNewService({...newService, serviceName: e.target.value})} />
                  <InputField label="Dátum" type="date" value={newService.date} onChange={(e: any) => setNewService({...newService, date: e.target.value})} />
                  <InputField label="Költség (Ft)" type="number" value={newService.cost} onChange={(e: any) => setNewService({...newService, cost: e.target.value})} />
                  <InputField label="Részletek" rows={3} value={newService.description} onChange={(e: any) => setNewService({...newService, description: e.target.value})} />
                  <div className="flex gap-3 pt-4">
                    <Button variant="secondary" fullWidth onClick={() => setIsAddServiceOpen(false)}>Mégse</Button>
                    <Button fullWidth onClick={saveServiceRecord}>Mentés</Button>
                  </div>
                </div>
            </div>
        </div>
      )}

      {isAddCarOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddCarOpen(false)}></div>
            <div className="relative bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-fade-in-up">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Új Autó</h3>
                <div className="space-y-4">
                  <InputField label="Márka" placeholder="pl. Ford" value={newCar.make} onChange={(e: any) => setNewCar({...newCar, make: e.target.value})} />
                  <InputField label="Típus" placeholder="pl. Focus" value={newCar.model} onChange={(e: any) => setNewCar({...newCar, model: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                      <InputField label="Évjárat" type="number" value={newCar.year} onChange={(e: any) => setNewCar({...newCar, year: e.target.value})} />
                      <InputField label="Rendszám" value={newCar.plate} onChange={(e: any) => setNewCar({...newCar, plate: e.target.value})} />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button variant="secondary" fullWidth onClick={() => setIsAddCarOpen(false)}>Mégse</Button>
                    <Button fullWidth onClick={saveCar}>Hozzáadás</Button>
                  </div>
                </div>
            </div>
        </div>
      )}

      {/* DELETE CAR CONFIRMATION MODAL */}
      {isDeleteCarModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDeleteCarModalOpen(false)}></div>
            <div className="relative bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-fade-in-up text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Biztosan törlöd?</h3>
              <p className="text-gray-500 mb-6 text-sm">A jármű és a hozzá tartozó összes szervizbejegyzés véglegesen törlődik.</p>
              <div className="flex gap-3">
                  <Button variant="secondary" fullWidth onClick={() => setIsDeleteCarModalOpen(false)}>Mégse</Button>
                  <button 
                    onClick={confirmDeleteCar}
                    className="w-full inline-flex items-center justify-center px-6 py-3.5 text-sm font-bold rounded-xl text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all duration-200"
                  >
                    Igen, Törlés
                  </button>
              </div>
            </div>
          </div>
      )}

    </div>
  );
};

export default Dashboard;
