
import React from 'react';
import { QuoteAnalysisResult, DiagnosticResult, AdAnalysisResult, PredictionResult } from '../types';

// --- Helper Functions for Styles ---

const getUrgencyColor = (level: string) => {
  switch (level) {
    case 'Critical': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '🚨', badge: 'bg-red-100 text-red-800' };
    case 'High': return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: '⚠️', badge: 'bg-orange-100 text-orange-800' };
    case 'Medium': return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: '🔧', badge: 'bg-yellow-100 text-yellow-800' };
    case 'Low': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'ℹ️', badge: 'bg-blue-100 text-blue-800' };
    default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', icon: '🔧', badge: 'bg-gray-100 text-gray-800' };
  }
};

const getVerdictColor = (verdict: string) => {
  switch (verdict) {
    case 'Fair': return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: '✅' };
    case 'Overpriced': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '💸' };
    case 'Suspiciously Low': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '🤔' };
    default: return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: '❓' };
  }
};

const getTrustColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-600';
};

// --- Components ---

export const DiagnosticResultCard = ({ data }: { data: DiagnosticResult }) => {
  const styles = getUrgencyColor(data.urgencyLevel);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Badge */}
      <div className={`rounded-2xl p-6 border ${styles.bg} ${styles.border} shadow-sm`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
             <span className="text-3xl">{styles.icon}</span>
             <h3 className={`text-xl font-extrabold ${styles.text}`}>Diagnózis</h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${styles.badge}`}>
            {data.urgencyLevel === 'Critical' ? 'Kritikus' : 
             data.urgencyLevel === 'High' ? 'Súlyos' : 
             data.urgencyLevel === 'Medium' ? 'Mérsékelt' : 'Alacsony'} Sürgősség
          </span>
        </div>
        <div className="mt-4 p-4 bg-white/60 rounded-xl backdrop-blur-sm border border-white/50">
           <p className="text-sm font-bold text-gray-500 uppercase mb-1">Becsült Javítási Költség</p>
           <p className="text-2xl font-black text-gray-900">{data.estimatedCostRange || "Nem meghatározható"}</p>
        </div>
      </div>

      {/* Causes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6">
         <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
           <svg className="w-5 h-5 mr-2 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
           Lehetséges Okok
         </h4>
         <div className="space-y-4">
            {data.possibleCauses.map((item, idx) => (
              <div key={idx} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                <div className="flex justify-between items-start mb-1">
                   <span className="font-bold text-gray-800">{item.cause}</span>
                   <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-600">{item.probability}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
         </div>
      </div>

      {/* Next Steps */}
      <div className="bg-brand-50/50 rounded-2xl border border-brand-100 p-6">
         <h4 className="text-lg font-bold text-brand-900 mb-4">Teendők</h4>
         <ul className="space-y-3">
           {data.nextSteps.map((step, idx) => (
             <li key={idx} className="flex items-start text-brand-800 text-sm">
               <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-200 text-brand-700 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">{idx + 1}</span>
               {step}
             </li>
           ))}
         </ul>
      </div>
    </div>
  );
};

export const QuoteResultCard = ({ data }: { data: QuoteAnalysisResult }) => {
  const styles = getVerdictColor(data.verdict);

  return (
    <div className="space-y-6 animate-fade-in-up">
       <div className={`rounded-2xl p-6 border ${styles.bg} ${styles.border} shadow-sm text-center relative overflow-hidden`}>
          <div className="relative z-10">
            <div className="text-4xl mb-2">{styles.icon}</div>
            <h3 className={`text-2xl font-extrabold ${styles.text} mb-1`}>
              {data.verdict === 'Fair' ? 'Reális Ár' : 
               data.verdict === 'Overpriced' ? 'Túlárazott' : 
               data.verdict === 'Suspiciously Low' ? 'Gyanúsan Olcsó' : 'Nem Egyértelmű'}
            </h3>
            <p className="text-gray-600 text-sm max-w-sm mx-auto">{data.summary}</p>
          </div>
       </div>

       <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
             <span className="text-sm font-bold text-gray-500 uppercase">Piaci Ársáv</span>
             <span className="text-lg font-black text-brand-600">{data.marketPriceRange}</span>
          </div>
          
          <div className="space-y-4">
             {data.redFlags.length > 0 && (
               <div>
                 <h5 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Figyelmeztetések</h5>
                 <ul className="space-y-2">
                   {data.redFlags.map((flag, i) => (
                     <li key={i} className="flex items-start text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                        <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        {flag}
                     </li>
                   ))}
                 </ul>
               </div>
             )}
             
             <div>
                <h5 className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-2">Tanácsok</h5>
                <ul className="space-y-2">
                   {data.advice.map((adv, i) => (
                     <li key={i} className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 mt-0.5 text-brand-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {adv}
                     </li>
                   ))}
                </ul>
             </div>
          </div>
       </div>
    </div>
  );
};

export const AdResultCard = ({ data }: { data: AdAnalysisResult }) => {
  const trustColor = getTrustColor(data.trustScore);

  return (
    <div className="space-y-6 animate-fade-in-up">
       <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-1">Bizalmi Index</h3>
            <div className={`text-4xl font-black ${trustColor}`}>{data.trustScore}/100</div>
          </div>
          <div className="text-right max-w-[60%]">
             <h4 className="font-bold text-gray-900 leading-tight">{data.verdictShort}</h4>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
             <h5 className="text-green-800 font-bold text-sm mb-3 flex items-center">
               <span className="mr-2">👍</span> Pozitívumok
             </h5>
             <ul className="space-y-2">
               {data.greenFlags.map((flag, i) => (
                 <li key={i} className="text-xs text-green-700 font-medium flex items-start">
                   <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                   {flag}
                 </li>
               ))}
             </ul>
          </div>

          <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
             <h5 className="text-red-800 font-bold text-sm mb-3 flex items-center">
               <span className="mr-2">🚩</span> Gyanús jelek
             </h5>
             <ul className="space-y-2">
               {data.redFlags.map((flag, i) => (
                 <li key={i} className="text-xs text-red-700 font-medium flex items-start">
                   <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                   {flag}
                 </li>
               ))}
             </ul>
          </div>
       </div>

       <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-lg">
          <h4 className="font-bold mb-4 flex items-center text-brand-300">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            Ezeket kérdezd meg az eladótól:
          </h4>
          <ul className="space-y-3">
             {data.questionsToAsk.map((q, i) => (
               <li key={i} className="text-sm text-gray-300 flex items-start">
                 <span className="text-brand-500 mr-2">➜</span>
                 {q}
               </li>
             ))}
          </ul>
       </div>
    </div>
  );
};

export const PredictionResultCard = ({ data }: { data: PredictionResult }) => {
  return (
    <div className="space-y-6 animate-fade-in-up">
       <div className="bg-gradient-to-br from-brand-800 to-brand-900 rounded-2xl p-6 text-white shadow-lg">
          <h3 className="text-lg font-bold mb-2">Jármű Összesítő</h3>
          <p className="text-brand-100 text-sm leading-relaxed mb-4">{data.carSummary}</p>
          <div className="inline-flex items-center bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
             <span className="text-xs text-brand-200 uppercase tracking-wider mr-3">Éves várható költség</span>
             <span className="font-bold text-lg">{data.annualCostEstimate}</span>
          </div>
       </div>

       <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Várható Karbantartások
          </h4>
          <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
             {data.upcomingMaintenance.map((item, i) => (
               <div key={i} className="relative">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 bg-brand-500 rounded-full border-2 border-white shadow-sm"></div>
                  <h5 className="font-bold text-gray-800">{item.item}</h5>
                  <div className="flex justify-between text-sm mt-1">
                     <span className="text-gray-500">Esedékesség: {item.dueInKm}</span>
                     <span className="font-semibold text-brand-600">{item.estimatedCost}</span>
                  </div>
               </div>
             ))}
          </div>
       </div>

       <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6">
          <h4 className="font-bold text-gray-900 mb-4">Típushibák & Kockázatok</h4>
          <div className="space-y-3">
             {data.commonFaults.map((fault, i) => (
               <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                  <span className="text-sm font-medium text-gray-700">{fault.fault}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg uppercase
                    ${fault.riskLevel === 'High' ? 'bg-red-100 text-red-700' : 
                      fault.riskLevel === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`
                  }>
                    {fault.riskLevel === 'High' ? 'Magas' : fault.riskLevel === 'Medium' ? 'Közepes' : 'Alacsony'}
                  </span>
               </div>
             ))}
          </div>
       </div>
    </div>
  );
};
