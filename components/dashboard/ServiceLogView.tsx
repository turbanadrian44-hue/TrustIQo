
import React from 'react';
import { Car, DashboardView } from '../../types';
import Button from '../Button';

interface ServiceLogViewProps {
    cars: Car[];
    selectedCarId: string | null;
    setSelectedCarId: (id: string | null) => void;
    onBack: () => void;
    onAddCar: () => void;
    onAddService: () => void;
    onDeleteCar: (e: React.MouseEvent, id: string) => void;
    onDeleteRecord: (carId: string, recordId: string) => void;
}

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

const ServiceLogView: React.FC<ServiceLogViewProps> = ({ 
    cars, selectedCarId, setSelectedCarId, onBack, onAddCar, onAddService, onDeleteCar, onDeleteRecord 
}) => {
    
    const getSelectedCar = () => cars.find(c => c.id === selectedCarId);
    const selectedCar = getSelectedCar();

    return (
        <div className="animate-fade-in-up max-w-6xl mx-auto pb-12">
          <div className="flex items-center mb-8">
            <button onClick={onBack} className="flex items-center text-gray-500 hover:text-brand-600 font-bold px-4 py-2 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-all mr-4">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Vissza
            </button>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Digitális Garázs</h2>
          </div>
          
          <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-soft border border-gray-100 min-h-[700px] relative">
            
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-500 uppercase tracking-wider">Járműveim</h3>
                <button onClick={onAddCar} className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center shadow-lg transition-all active:scale-95">
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
                    <button 
                       onClick={(e) => onDeleteCar(e, car.id)}
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
                   <Button onClick={onAddCar}>Első Autó Felvétele</Button>
                </div>
            )}

            {selectedCar && (
               <div className="mt-4 animate-fade-in-up">
                  <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
                     <div>
                        <h2 className="text-2xl font-bold text-gray-900">Szerviztörténet</h2>
                        <p className="text-sm text-gray-500">Itt láthatod az autó élettörténetét.</p>
                     </div>
                     <button onClick={onAddService} className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 rounded-xl font-bold flex items-center shadow-lg shadow-brand-500/20 transition-all active:scale-95">
                       <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                       Bejegyzés
                     </button>
                  </div>

                  {selectedCar.records?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                       <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-4xl grayscale opacity-30">📘</div>
                       <p className="text-gray-500 font-medium">Nincs még bejegyzés. Rögzítsd az elsőt most!</p>
                    </div>
                  ) : (
                    <div className="relative pl-4 md:pl-0 space-y-8">
                       <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-0.5 bg-gray-200 -translate-x-1/2 rounded-full"></div>
                       
                       {selectedCar.records?.map((record, index) => (
                         <div key={record.id} className={`relative flex flex-col md:flex-row items-start md:items-center w-full ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                           <div className="hidden md:block w-1/2"></div>
                           
                           <div className="absolute left-0 top-0 md:left-1/2 md:top-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border-4 border-brand-100 shadow-md z-10 md:-translate-x-1/2 md:-translate-y-1/2 flex items-center justify-center text-lg md:text-xl transform transition-transform hover:scale-110">
                             {getServiceIcon(record.serviceName)}
                           </div>
                           
                           <div className="w-full md:w-1/2 pl-12 md:pl-0 md:px-10">
                              <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-brand-200 transition-all duration-300 group relative`}>
                                 
                                 <button 
                                   onClick={() => onDeleteRecord(selectedCar.id, record.id)}
                                   className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors z-20"
                                   title="Bejegyzés törlése"
                                 >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                 </button>

                                 <div className="flex justify-between items-start mb-3 pr-6">
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

                  {selectedCar.records && selectedCar.records.length > 0 && (
                    <div className="mt-12 flex justify-end">
                       <div className="bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4">
                          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Összesített Költség</span>
                          <span className="text-2xl font-bold">{selectedCar.records.reduce((sum, r) => sum + r.cost, 0).toLocaleString()} Ft</span>
                       </div>
                    </div>
                  )}
               </div>
            )}
          </div>
        </div>
    );
};

export default ServiceLogView;
