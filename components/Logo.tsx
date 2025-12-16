import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10" }) => {
  return (
    <div className={`relative ${className} group`}>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563eb" /> {/* brand-600 */}
            <stop offset="100%" stopColor="#60a5fa" /> {/* brand-400 */}
          </linearGradient>
        </defs>
        
        {/* Car-Shield Hybrid Body */}
        <path 
          d="M10 12 L13 7.5 H27 L30 12 H35 C36.65 12 38 13.35 38 15 V20 C38 29 20 37 20 37 C20 37 2 29 2 20 V15 C2 13.35 3.35 12 5 12 H10Z" 
          fill="url(#logoGradient)" 
        />
        
        {/* Windshield Area */}
        <path 
          d="M11.5 12 L14 8.5 H26 L28.5 12 H11.5Z" 
          fill="white" 
          fillOpacity="0.35" 
        />

        {/* LED Headlights */}
        <rect x="4" y="16" width="5" height="2" rx="1" fill="white" fillOpacity="0.9" />
        <rect x="31" y="16" width="5" height="2" rx="1" fill="white" fillOpacity="0.9" />

        {/* The Trust Checkmark */}
        <path 
          d="M15 23 L19 27 L26 19" 
          stroke="white" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="drop-shadow-sm"
        />
        
        {/* Grill Lines */}
        <path d="M18 31 L22 31" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
      </svg>
      
      <div className="absolute inset-0 bg-brand-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 -z-10"></div>
    </div>
  );
};

export default Logo;