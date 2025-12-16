
import React from 'react';

export interface ImageFile {
  data: string;
  mimeType: string;
}

export const FileUpload = ({ label, onUpload, currentFile }: { label: string, onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void, currentFile?: ImageFile }) => (
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

export interface DashboardCardProps {
    title: string;
    icon: string;
    desc: string;
    onClick: () => void;
    color?: string;
}

export const DashboardCard = ({ title, icon, desc, onClick, color = "brand" }: DashboardCardProps) => (
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

interface InputFieldProps {
    label: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    placeholder?: string;
    type?: string;
    rows?: number;
}

export const InputField = ({ label, value, onChange, placeholder, type = "text", rows }: InputFieldProps) => (
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
