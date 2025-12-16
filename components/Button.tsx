
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'accent' | 'ghost';
  fullWidth?: boolean;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  isLoading = false,
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-6 py-3.5 text-sm font-bold rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed transform active:scale-[0.98] tracking-wide relative overflow-hidden";
  
  const variants = {
    // Gradient Primary with subtle inner shadow
    primary: "text-white bg-gradient-to-br from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-lg shadow-brand-600/30 border border-transparent focus:ring-brand-500/20",
    
    // Accent for High Priority actions
    accent: "text-white bg-gradient-to-br from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 shadow-lg shadow-accent-500/30 border border-transparent focus:ring-accent-500/20",
    
    // Clean secondary
    secondary: "text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm focus:ring-gray-100",
    
    outline: "text-gray-600 bg-transparent border-2 border-gray-200 hover:border-brand-500 hover:text-brand-600 focus:ring-brand-500/10",
    
    ghost: "text-gray-500 hover:text-brand-600 hover:bg-brand-50/50 border-transparent shadow-none"
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="opacity-90">Feldolgozás...</span>
        </>
      ) : children}
    </button>
  );
};

export default Button;
