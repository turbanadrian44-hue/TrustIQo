
import React from 'react';
import Button from '../Button';
import { InputField } from '../DashboardUI';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  data: { serviceName: string, date: string, cost: string, description: string };
  setData: (data: any) => void;
}

export const AddServiceModal = ({ isOpen, onClose, onSave, data, setData }: AddServiceModalProps) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-fade-in-up">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Bejegyzés Rögzítése</h3>
                <div className="space-y-4">
                  <InputField label="Elvégzett munka" placeholder="pl. Olajcsere" value={data.serviceName} onChange={(e) => setData({...data, serviceName: e.target.value})} />
                  <InputField label="Dátum" type="date" value={data.date} onChange={(e) => setData({...data, date: e.target.value})} />
                  <InputField label="Költség (Ft)" type="number" value={data.cost} onChange={(e) => setData({...data, cost: e.target.value})} />
                  <InputField label="Részletek" rows={3} value={data.description} onChange={(e) => setData({...data, description: e.target.value})} />
                  <div className="flex gap-3 pt-4">
                    <Button variant="secondary" fullWidth onClick={onClose}>Mégse</Button>
                    <Button fullWidth onClick={onSave}>Mentés</Button>
                  </div>
                </div>
            </div>
        </div>
    );
};

interface AddCarModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    data: { make: string, model: string, year: string, plate: string };
    setData: (data: any) => void;
}

export const AddCarModal = ({ isOpen, onClose, onSave, data, setData }: AddCarModalProps) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-fade-in-up">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Új Autó</h3>
                <div className="space-y-4">
                  <InputField label="Márka" placeholder="pl. Ford" value={data.make} onChange={(e) => setData({...data, make: e.target.value})} />
                  <InputField label="Típus" placeholder="pl. Focus" value={data.model} onChange={(e) => setData({...data, model: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                      <InputField label="Évjárat" type="number" value={data.year} onChange={(e) => setData({...data, year: e.target.value})} />
                      <InputField label="Rendszám" value={data.plate} onChange={(e) => setData({...data, plate: e.target.value})} />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button variant="secondary" fullWidth onClick={onClose}>Mégse</Button>
                    <Button fullWidth onClick={onSave}>Hozzáadás</Button>
                  </div>
                </div>
            </div>
        </div>
    );
};

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
}

export const DeleteModal = ({ isOpen, onClose, onConfirm, title, description }: DeleteModalProps) => {
    if (!isOpen) return null;
    return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-fade-in-up text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">{title}</h3>
              <p className="text-gray-500 mb-6 text-sm">{description}</p>
              <div className="flex gap-3">
                  <Button variant="secondary" fullWidth onClick={onClose}>Mégse</Button>
                  <button 
                    onClick={onConfirm}
                    className="w-full inline-flex items-center justify-center px-6 py-3.5 text-sm font-bold rounded-xl text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all duration-200"
                  >
                    Törlés
                  </button>
              </div>
            </div>
          </div>
    );
};
