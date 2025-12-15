import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
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
  const baseStyles = "inline-flex items-center justify-center px-6 py-4 text-base font-bold rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-brand-500/20 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed transform active:scale-[0.98]";
  
  const variants = {
    primary: "border-transparent text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50",
    secondary: "border-transparent text-brand-700 bg-white border border-brand-100 hover:bg-brand-50 shadow-sm hover:shadow-md",
    outline: "border-2 border-gray-200 text-gray-600 bg-transparent hover:border-brand-300 hover:text-brand-600"
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
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Elemzés folyamatban...
        </>
      ) : children}
    </button>
  );
};

export default Button;