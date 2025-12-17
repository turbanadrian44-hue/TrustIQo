
import React, { useState, useEffect } from 'react';

const LOADING_STEPS = [
  "Adatok feldolgozása...",
  "Kapcsolódás a szerviz-adatbázishoz...",
  "Vélemények valós idejű elemzése...",
  "Bizalmi index számítása...",
  "Rangsor véglegesítése..."
];

const LoadingScreen = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center pt-12 md:pt-24 animate-fade-in-up text-center px-4 md:px-6 min-h-[400px]">
      <div className="relative w-24 h-24 md:w-32 md:h-32 mb-8 md:mb-10">
        <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-brand-600 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl md:text-4xl animate-pulse">⚙️</span>
        </div>
      </div>
      
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 transition-all duration-300 min-h-[3.5rem] flex items-center justify-center max-w-md">
        {LOADING_STEPS[currentStep]}
      </h2>
      
      <p className="text-gray-500 max-w-sm mt-2 text-sm md:text-base leading-relaxed">
        Az AI éppen átfésüli az internetet, hogy megtalálja a legmegbízhatóbb szakembert a közeledben.
      </p>
    </div>
  );
};

export default LoadingScreen;
