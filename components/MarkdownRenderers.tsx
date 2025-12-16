
import React, { useState } from 'react';

export const extractText = (node: React.ReactNode): string => {
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(extractText).join('\n');
    if (React.isValidElement(node)) {
      const element = node as React.ReactElement<any>;
      if (element.props.children) {
        return extractText(element.props.children);
      }
    }
    return '';
};

export const safeUrl = (url: string | null, type: 'web' | 'map' = 'web') => {
    if (!url) return undefined;
    const cleanUrl = url.trim();
    if (cleanUrl.length === 0) return undefined;
    
    // Ha térkép és nem linknek néz ki, generáljunk kereső linket
    if (type === 'map' && !cleanUrl.startsWith('http') && !cleanUrl.startsWith('www')) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanUrl)}`;
    }

    if (!cleanUrl.startsWith('http')) {
        return `https://${cleanUrl}`;
    }
    return cleanUrl;
};

export const ContactPanel = ({ children }: { children: React.ReactNode }) => {
  const rawContent = extractText(children);
  
  const lines = rawContent.split('\n');
  const analysisTextParts: string[] = [];
  let address: string | null = null;
  let phone: string | null = null;
  let webRaw: string | null = null;
  let mapRaw: string | null = null;

  lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      if (trimmed.includes('📍')) address = trimmed.replace(/.*📍/, '').trim();
      else if (trimmed.includes('📞')) phone = trimmed.replace(/.*📞/, '').trim();
      else if (trimmed.includes('🌐')) webRaw = trimmed.replace(/.*🌐/, '').trim();
      else if (trimmed.includes('🗺️')) mapRaw = trimmed.replace(/.*🗺️/, '').trim();
      else analysisTextParts.push(trimmed);
  });

  const analysisText = analysisTextParts.join('\n').trim();

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
            href={safeUrl(mapRaw, 'map')}
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

interface ExpandableListItemProps extends React.HTMLAttributes<HTMLLIElement> {
    isBest?: boolean;
    children?: React.ReactNode;
}

export const ExpandableListItem = ({ children, isBest, ...props }: ExpandableListItemProps) => {
  const [isOpen, setIsOpen] = useState(!!isBest); 
  const childrenArray = React.Children.toArray(children);
  
  // Find blockquote safely
  const detailsIndex = childrenArray.findIndex(
    (child: any) => 
      (React.isValidElement(child) && child.type === 'blockquote') || 
      (child && child.props && child.props.node && child.props.node.tagName === 'blockquote')
  );
  
  let summary = childrenArray;
  let details = null;

  if (detailsIndex !== -1) {
    summary = childrenArray.slice(0, detailsIndex);
    details = childrenArray[detailsIndex];
  }

  // Ha nincs részlet (blockquote), ne legyen kattintható és ne mutasson nyilat
  const hasDetails = !!details;

  return (
    <li 
      className={`glass-panel rounded-2xl p-6 mb-4 transition-all duration-300 overflow-hidden group border-l-4
        ${isBest ? 'border-l-amber-400 shadow-xl ring-1 ring-amber-400/20' : isOpen ? 'border-l-brand-500 shadow-lg' : 'border-l-transparent hover:border-l-brand-300 hover:shadow-md'}
        ${hasDetails ? 'cursor-pointer' : ''}`}
      onClick={(e) => {
        if (!hasDetails) return;
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

               {!isOpen && !isBest && hasDetails && (
                 <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="text-brand-600 font-medium text-xs">Kattints a részletekért</span>
                 </div>
               )}
             </div>
             
             {hasDetails && (
               <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 transform 
                  ${isOpen ? 'rotate-180 bg-brand-100 text-brand-600' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}>
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                 </svg>
               </div>
             )}
          </div>
          
          <div className={`grid transition-all duration-500 ease-in-out ${isOpen && hasDetails ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
               {details}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
