import React, { useState } from 'react';
import Button from './Button';

interface LocationRequestProps {
  onLocationFound: (coords: { latitude: number; longitude: number }) => void;
  onError: (msg: string) => void;
}

const LocationRequest: React.FC<LocationRequestProps> = ({ onLocationFound, onError }) => {
  const [loading, setLoading] = useState(false);

  const handleGetLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      onError("A böngésződ nem támogatja a helymeghatározást.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationFound({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLoading(false);
      },
      (error) => {
        let errorMsg = "Nem sikerült meghatározni a helyzeted.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "A helymeghatározás elutasítva. Kérlek engedélyezd, hogy megtaláljuk a közeli műhelyeket.";
        }
        onError(errorMsg);
        setLoading(false);
      }
    );
  };

  return (
    <div className="text-center p-8 glass-panel rounded-2xl max-w-md mx-auto animate-fade-in-up">
      <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
        <div className="absolute inset-0 bg-brand-200 rounded-full animate-pulse-slow opacity-50"></div>
        <div className="relative bg-brand-100 w-16 h-16 rounded-full flex items-center justify-center z-10">
          <svg className="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-3">Közeli Szerelők Keresése</h3>
      <p className="text-gray-600 mb-8 leading-relaxed">
        A Trustiqo-nak szüksége van a pozíciódra, hogy elemezhesse a közeledben lévő műhelyek megbízhatóságát.
      </p>
      <Button onClick={handleGetLocation} fullWidth isLoading={loading} className="text-lg py-4">
        Helyzetem Megosztása
      </Button>
      <p className="text-xs text-gray-400 mt-5">A helyadatokat nem tároljuk.</p>
    </div>
  );
};

export default LocationRequest;