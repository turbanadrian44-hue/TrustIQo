import React from 'react';
import { GroundingChunk } from '../types';

interface ResultCardProps {
  chunk: GroundingChunk;
  index: number;
}

const ResultCard: React.FC<ResultCardProps> = ({ chunk, index }) => {
  // Extract data safely. Google Maps grounding usually puts data in 'maps' or 'web'.
  const data = chunk.maps || chunk.web;
  
  if (!data) return null;

  const isMaps = !!chunk.maps;
  
  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full animate-fade-in-up"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-brand-100 text-brand-700 mb-3">
              #{index + 1} Ajánlás
            </span>
            <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2">{data.title}</h3>
            {isMaps && (
              <p className="text-xs text-gray-500 flex items-center mb-4">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Google Maps által hitelesítve
              </p>
            )}
          </div>
        </div>

        {/* Display review snippet if available */}
        {chunk.maps?.placeAnswerSources?.reviewSnippets && chunk.maps.placeAnswerSources.reviewSnippets.length > 0 && (
          <div className="mt-2 p-4 bg-yellow-50 rounded-lg border border-yellow-100 relative">
             <div className="absolute top-2 left-2 text-yellow-300 text-4xl leading-none opacity-50">"</div>
             <p className="text-sm text-gray-700 italic relative z-10 pl-2">
               {chunk.maps.placeAnswerSources.reviewSnippets[0].content}
             </p>
          </div>
        )}
      </div>

      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center group">
        <a 
          href={data.uri} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm font-semibold text-brand-600 group-hover:text-brand-700 flex items-center transition-colors"
        >
          Megnyitás Google Térképen
          <svg className="ml-1 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default ResultCard;