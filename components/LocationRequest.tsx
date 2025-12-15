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
    <div className="text-center p-8 md:p-12 glass-card rounded-3xl max-w-lg mx-auto animate-fade-in-up border-t border-white/60">
      <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
        <div className="absolute inset-0 bg-brand-400/20 rounded-full animate-pulse-slow"></div>
        <div className="absolute inset-2 bg-white rounded-full shadow-md flex items-center justify-center z-10">
          <span className="text-4xl">📍</span>
        </div>
      </div>
      
      <h3 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Közeli Szerelők</h3>
      <p className="text-gray-600 mb-10 leading-relaxed text-lg">
        Engedélyezd a helymeghatározást, hogy a Trustiqo megtalálja a legmegbízhatóbb, értékelt szerelőket a környékeden.
      </p>
      <Button onClick={handleGetLocation} fullWidth isLoading={loading} className="text-lg shadow-xl shadow-brand-500/20">
        Helyzetem Megosztása
      </Button>
      <div className="mt-6 flex items-center justify-center space-x-2 text-gray-400 text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        <span>Az adataid biztonságban vannak.</span>
      </div>
    </div>
  );
};

export default LocationRequest;