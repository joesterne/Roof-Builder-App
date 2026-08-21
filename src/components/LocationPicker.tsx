import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { MapPin, CloudSun, Loader2, Info } from 'lucide-react';

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLocation?: { lat: number, lng: number };
}

interface Suggestion {
  category: string;
  material: string;
  reason: string;
}

export default function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
  const [markerPosition, setMarkerPosition] = useState(initialLocation || { lat: 39.8283, lng: -98.5795 });
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const handleMapClick = async (lat: number, lng: number) => {
    setMarkerPosition({ lat, lng });
    onLocationSelect(lat, lng);
    setLoading(true);
    
    try {
      // 1. Fetch Weather
      const weatherRes = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      });
      if (!weatherRes.ok) throw new Error('Weather fetch failed');
      const weather = await weatherRes.json();
      
      const current = weather.currentConditions || {};
      const temperatureC = current.temperature?.value ?? 0;
      const conditions = current.conditions?.description ?? 'Unknown conditions';
      
      setWeatherData({ temperatureC, conditions });

      // 2. Fetch Material Suggestions
      const suggestionsRes = await fetch('/api/suggest-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conditions, temperatureC }),
      });
      if (!suggestionsRes.ok) throw new Error('Suggestions fetch failed');
      const suggestionsData = await suggestionsRes.json();
      
      setSuggestions(suggestionsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!apiKey) {
    return (
      <div className="bg-gray-100 p-6 flex flex-col items-center justify-center text-center rounded-md border border-gray-300 h-64">
        <MapPin className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-sm font-medium text-gray-700">Google Maps API Key Missing</p>
        <p className="text-xs text-gray-500 mt-2 max-w-[250px]">
          Please add <code className="bg-gray-200 px-1 py-0.5 rounded">VITE_GOOGLE_MAPS_API_KEY</code> to your environment variables to use the location picker.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="h-64 w-full rounded-md overflow-hidden relative border border-gray-300">
        <APIProvider apiKey={apiKey}>
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={markerPosition}
            defaultZoom={4}
            gestureHandling="greedy"
            disableDefaultUI
            onClick={(e) => {
              if (e.detail.latLng) {
                const { lat, lng } = e.detail.latLng;
                handleMapClick(lat, lng);
              }
            }}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          >
            <AdvancedMarker position={markerPosition} />
          </Map>
        </APIProvider>
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur text-xs font-semibold px-2 py-1 rounded shadow-sm text-gray-700 pointer-events-none">
          Click map to pin project location
        </div>
        
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <Loader2 className="w-8 h-8 text-soprema-blue animate-spin mb-2" />
            <p className="text-sm font-medium text-gray-800">Analyzing climate...</p>
          </div>
        )}
      </div>

      {weatherData && !loading && (
        <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
          <div className="flex items-center gap-2 mb-3 text-soprema-blue font-semibold text-sm">
            <CloudSun className="w-4 h-4" />
            <span>Local Climate: {weatherData.temperatureC}°C, {weatherData.conditions}</span>
          </div>
          
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Suggested Materials:
            </p>
            {suggestions.map((sug, i) => (
              <div key={i} className="bg-white p-3 rounded border border-blue-50 text-sm">
                <div className="font-semibold text-soprema-black mb-1">{sug.material} <span className="text-xs text-gray-500 font-normal">({sug.category})</span></div>
                <p className="text-xs text-gray-600 leading-relaxed">{sug.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
