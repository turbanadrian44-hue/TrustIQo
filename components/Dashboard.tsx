
import React, { useState, useEffect } from 'react';
import { User, DashboardView, ServiceRecord, Car } from '../types';
import Notification, { NotificationType } from './Notification';
import { db } from '../firebaseConfig';
import { DashboardCard } from './DashboardUI';
import { AddCarModal, AddServiceModal, DeleteModal } from './dashboard/Modals';
import ServiceLogView from './dashboard/ServiceLogView';
import { MechanicSearchView, QuoteAnalyzerView, DiagnosticsView, AdAnalyzerView, PredictionsView } from './dashboard/AIViews';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState<DashboardView>(DashboardView.HOME);
  const [notification, setNotification] = useState<{msg: string, type: NotificationType} | null>(null);
  const showToast = (msg: string, type: NotificationType = 'success') => setNotification({ msg, type });

  // --- Global State (Cars) ---
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);

  // --- Modal States ---
  const [isAddCarOpen, setIsAddCarOpen] = useState(false);
  const [newCar, setNewCar] = useState({ make: '', model: '', year: '', plate: '' });
  
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [newService, setNewService] = useState({ serviceName: '', date: '', cost: '', description: '' });

  const [isDeleteCarModalOpen, setIsDeleteCarModalOpen] = useState(false);
  const [carToDeleteId, setCarToDeleteId] = useState<string | null>(null);

  const [isDeleteRecordModalOpen, setIsDeleteRecordModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<{ carId: string, recordId: string } | null>(null);

  // --- Data Fetching ---
  const fetchCars = async () => {
      try {
          const q = query(collection(db, 'cars'), where('userId', '==', user.id));
          const querySnapshot = await getDocs(q);
          const carsData: Car[] = [];
          querySnapshot.forEach((doc) => {
              const data = doc.data();
              carsData.push({ id: doc.id, make: data.make, model: data.model, year: data.year, plate: data.plate, records: data.records || [] });
          });
          setCars(carsData);
          if (carsData.length > 0) {
            if (!selectedCarId || !carsData.find(c => c.id === selectedCarId)) setSelectedCarId(carsData[0].id);
          } else setSelectedCarId(null);
      } catch (e) { console.error(e); showToast("Nem sikerült betölteni az adatokat.", 'error'); }
  };

  useEffect(() => { if (user?.id) fetchCars(); }, [user?.id]);

  // --- Actions ---

  const saveCar = async () => {
    if (!newCar.make || !newCar.model) { showToast("A márka és típus kötelező!", 'error'); return; }
    try {
        const docRef = await addDoc(collection(db, 'cars'), { userId: user.id, ...newCar, records: [], created_at: new Date().toISOString() });
        await fetchCars();
        setSelectedCarId(docRef.id);
        setNewCar({ make: '', model: '', year: '', plate: '' });
        setIsAddCarOpen(false);
        showToast("Jármű rögzítve!", 'success');
    } catch (e) { showToast("Hiba történt.", 'error'); }
  };

  const confirmDeleteCar = async () => {
    if (!carToDeleteId) return;
    try {
        await deleteDoc(doc(db, 'cars', carToDeleteId));
        if (selectedCarId === carToDeleteId) setSelectedCarId(null);
        await fetchCars();
        setIsDeleteCarModalOpen(false);
        setCarToDeleteId(null);
        showToast("Jármű törölve!", 'info');
    } catch (e) { showToast("Hiba történt.", 'error'); }
  };

  const saveServiceRecord = async () => {
    if (!selectedCarId) { showToast("Válassz autót!", 'error'); return; }
    const car = cars.find(c => c.id === selectedCarId);
    if (!car) return;
    try {
      const record: ServiceRecord = { id: Date.now().toString(), ...newService, cost: Number(newService.cost) };
      await updateDoc(doc(db, 'cars', selectedCarId), { records: [record, ...car.records] });
      await fetchCars();
      setNewService({ serviceName: '', date: '', cost: '', description: '' });
      setIsAddServiceOpen(false);
      showToast("Szerviztörténet frissítve!", 'success');
    } catch (e) { showToast("Hiba történt.", 'error'); }
  };

  const confirmDeleteRecord = async () => {
    if (!recordToDelete) return;
    const { carId, recordId } = recordToDelete;
    const car = cars.find(c => c.id === carId);
    if (!car) return;
    try {
        const updatedRecords = car.records.filter(r => r.id !== recordId);
        await updateDoc(doc(db, 'cars', carId), { records: updatedRecords });
        setCars(prev => prev.map(c => c.id === carId ? { ...c, records: updatedRecords } : c));
        setIsDeleteRecordModalOpen(false);
        setRecordToDelete(null);
        showToast("Bejegyzés törölve!", 'info');
    } catch (e) { showToast("Hiba történt.", 'error'); }
  };

  // --- Render Helpers ---

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
            <p className="text-brand-100 max-w-lg text-lg leading-relaxed">A TrustIQo készen áll, hogy megvédjen a túlárazástól és a rejtett hibáktól.</p>
          </div>
          <div className="flex gap-4">
             <div onClick={() => setCurrentView(DashboardView.SERVICE_LOG)} className="group bg-white/5 backdrop-blur-lg rounded-2xl p-5 border border-white/10 text-center flex-1 md:flex-none md:min-w-[160px] cursor-pointer hover:bg-white/15 transition-all duration-300 hover:-translate-y-1">
               <span className="block text-4xl font-black text-white mb-1 group-hover:scale-110 transition-transform duration-300">{cars.length}</span>
               <span className="text-xs uppercase tracking-widest text-brand-200 font-bold">Autó a garázsban</span>
             </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard title="Szerelő Kereső" icon="📍" desc="Találd meg a legjobb értékelésű szakembert a közelben." onClick={() => setCurrentView(DashboardView.FIND_MECHANIC)} />
        <DashboardCard title="Árajánlat Kontroll" icon="💰" desc="Ellenőrizd a kapott ajánlatot piaci adatok alapján." onClick={() => setCurrentView(DashboardView.QUOTE_ANALYZER)} color="accent" />
        <DashboardCard title="Digitális Garázs" icon="📘" desc="Minden szerviztörténet egy helyen, papír nélkül." onClick={() => setCurrentView(DashboardView.SERVICE_LOG)} />
        <DashboardCard title="AI Diagnosztika" icon="🔧" desc="Ismerd fel a hibát még a szerelő előtt." onClick={() => setCurrentView(DashboardView.DIAGNOSTICS)} />
        <DashboardCard title="Hirdetés Radar" icon="🕵️" desc="Rejtett hibák kiszűrése hirdetési szövegekből." onClick={() => setCurrentView(DashboardView.AD_ANALYZER)} />
        <DashboardCard title="Jövőbelátó" icon="🔮" desc="Tervezhető költségek és karbantartási előrejelzés." onClick={() => setCurrentView(DashboardView.PREDICTIONS)} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-8 px-4 md:px-8 max-w-[1600px] mx-auto relative">
      {notification && <Notification message={notification.msg} type={notification.type} onClose={() => setNotification(null)} />}

      {currentView === DashboardView.HOME && renderHome()}
      
      {currentView === DashboardView.FIND_MECHANIC && <MechanicSearchView onBack={() => setCurrentView(DashboardView.HOME)} showToast={showToast} />}
      {currentView === DashboardView.QUOTE_ANALYZER && <QuoteAnalyzerView cars={cars} onBack={() => setCurrentView(DashboardView.HOME)} showToast={showToast} />}
      {currentView === DashboardView.DIAGNOSTICS && <DiagnosticsView cars={cars} onBack={() => setCurrentView(DashboardView.HOME)} showToast={showToast} />}
      {currentView === DashboardView.AD_ANALYZER && <AdAnalyzerView onBack={() => setCurrentView(DashboardView.HOME)} showToast={showToast} />}
      {currentView === DashboardView.PREDICTIONS && <PredictionsView cars={cars} onBack={() => setCurrentView(DashboardView.HOME)} showToast={showToast} />}
      
      {currentView === DashboardView.SERVICE_LOG && (
        <ServiceLogView 
          cars={cars} selectedCarId={selectedCarId} setSelectedCarId={setSelectedCarId}
          onBack={() => setCurrentView(DashboardView.HOME)}
          onAddCar={() => setIsAddCarOpen(true)}
          onAddService={() => setIsAddServiceOpen(true)}
          onDeleteCar={(e, id) => { e.stopPropagation(); setCarToDeleteId(id); setIsDeleteCarModalOpen(true); }}
          onDeleteRecord={(cid, rid) => { setRecordToDelete({ carId: cid, recordId: rid }); setIsDeleteRecordModalOpen(true); }}
        />
      )}

      <AddCarModal isOpen={isAddCarOpen} onClose={() => setIsAddCarOpen(false)} onSave={saveCar} data={newCar} setData={setNewCar} />
      <AddServiceModal isOpen={isAddServiceOpen} onClose={() => setIsAddServiceOpen(false)} onSave={saveServiceRecord} data={newService} setData={setNewService} />
      <DeleteModal isOpen={isDeleteCarModalOpen} onClose={() => setIsDeleteCarModalOpen(false)} onConfirm={confirmDeleteCar} title="Biztosan törlöd?" description="A jármű és adatai végleg törlődnek." />
      <DeleteModal isOpen={isDeleteRecordModalOpen} onClose={() => setIsDeleteRecordModalOpen(false)} onConfirm={confirmDeleteRecord} title="Bejegyzés törlése?" description="A szervizbejegyzés végleg törlődik." />
    </div>
  );
};

export default Dashboard;
