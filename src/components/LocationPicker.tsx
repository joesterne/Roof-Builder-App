import React, { useEffect, useRef, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { CloudSun, ExternalLink, Loader2, MapPin } from 'lucide-react';
import { ClimateSummary, ClimateSuggestion, Coordinates, validCoordinates } from '../lib/requirements';

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  coordinates?: Coordinates;
  initialLocation?: Coordinates;
  unitSystem?: 'imperial' | 'metric';
}
interface ClimateResponse { climate: ClimateSummary; suggestions: ClimateSuggestion[] }
const MAP_CENTER = { lat: 39.8283, lng: -98.5795 };

function FollowPin({ coordinates }: { coordinates?: Coordinates }) {
  const map = useMap();
  useEffect(() => { if (map && coordinates) map.panTo(coordinates); }, [map, coordinates?.lat, coordinates?.lng]);
  return null;
}

export default function LocationPicker(props: LocationPickerProps) {
  const { onLocationSelect, coordinates, initialLocation, unitSystem = 'imperial' } = props;
  const controlled = Object.prototype.hasOwnProperty.call(props, 'coordinates');
  const [localPosition, setLocalPosition] = useState<Coordinates | undefined>(initialLocation);
  const selected = controlled ? coordinates : localPosition;
  const [latitude, setLatitude] = useState(selected ? String(selected.lat) : '');
  const [longitude, setLongitude] = useState(selected ? String(selected.lng) : '');
  const [inputError, setInputError] = useState('');
  const [mapError, setMapError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ClimateResponse | null>(null);
  const [refresh, setRefresh] = useState(0);
  const requestId = useRef(0);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || '';
  const hasMap = Boolean(apiKey && mapId && !mapError);
  const selectedKey = selected ? `${selected.lat},${selected.lng}` : '';
  const [resultKey, setResultKey] = useState('');
  const currentResult = resultKey === selectedKey ? result : null;

  useEffect(() => {
    setLatitude(selected ? String(selected.lat) : '');
    setLongitude(selected ? String(selected.lng) : '');
    setInputError('');
  }, [selected?.lat, selected?.lng]);

  useEffect(() => {
    const id = ++requestId.current;
    const controller = new AbortController();
    setResult(null);
    setError('');
    if (!validCoordinates(selected)) { setLoading(false); return () => controller.abort(); }
    setLoading(true);
    let timeout: ReturnType<typeof setTimeout>;
    const debounce = setTimeout(async () => {
      timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch('/api/climate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(selected), signal: controller.signal,
        });
        if (!response.ok) throw new Error('Historical climate service is unavailable. Retry when the connection is restored.');
        const data = await response.json() as ClimateResponse;
        if (id === requestId.current) { setResult(data); setResultKey(selectedKey); }
      } catch (err) {
        if (id === requestId.current) setError(controller.signal.aborted
          ? 'Historical climate request timed out. Retry to load the location history.'
          : err instanceof Error ? err.message : 'Historical climate data could not be loaded.');
      } finally {
        clearTimeout(timeout);
        if (id === requestId.current) setLoading(false);
      }
    }, 400);
    return () => { requestId.current += 1; clearTimeout(debounce); clearTimeout(timeout); controller.abort(); };
  }, [selectedKey, refresh]);

  const select = (point: Coordinates) => {
    if (!validCoordinates(point)) { setInputError('Latitude must be −90 to 90 and longitude −180 to 180.'); return; }
    setInputError('');
    setLocalPosition(point);
    onLocationSelect(point.lat, point.lng);
    if (selected?.lat === point.lat && selected?.lng === point.lng) setRefresh(value => value + 1);
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!latitude.trim() || !longitude.trim()) { setInputError('Enter both latitude and longitude.'); return; }
    select({ lat: Number(latitude), lng: Number(longitude) });
  };
  const temperature = (value: number | null) => value === null ? 'Unknown' : `${(unitSystem === 'metric' ? value : value * 9 / 5 + 32).toFixed(1)} ${unitSystem === 'metric' ? '°C' : '°F'}`;
  const threshold = unitSystem === 'metric' ? ['0 °C', '30 °C'] : ['32 °F', '86 °F'];

  return <div className="space-y-3">
    {hasMap ? <div className="h-52 overflow-hidden rounded-lg border border-border-main" aria-label="Project location map">
      <APIProvider apiKey={apiKey} onError={() => setMapError(true)}>
        <Map mapId={mapId} defaultCenter={selected || MAP_CENTER} defaultZoom={selected ? 12 : 4}
          gestureHandling="cooperative" disableDefaultUI={false} mapTypeControl={false} streetViewControl={false}
          onClick={event => { if (event.detail.latLng) select(event.detail.latLng); }}>
          {selected && <AdvancedMarker position={selected} draggable title="Project location: drag to move"
            onClick={() => setRefresh(value => value + 1)}
            onDragEnd={event => { if (event.latLng) select({ lat: event.latLng.lat(), lng: event.latLng.lng() }); }} />}
          <FollowPin coordinates={selected} />
        </Map>
      </APIProvider>
    </div> : <div className="rounded-lg border border-border-main bg-bg-page p-3 text-xs text-text-muted flex gap-2">
      <MapPin className="h-4 w-4 shrink-0 text-soprema-blue" />
      <p>{mapError ? 'Interactive map could not load. Set the project pin with coordinates below.' : 'Set the project pin with coordinates below. An interactive Google map is available when configured.'}</p>
    </div>}
    {hasMap && <p className="text-xs text-text-muted">Click the map or drag the pin to select a location.</p>}
    <form onSubmit={submit} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-medium text-text-secondary">Latitude
          <input aria-label="Project latitude" type="number" min="-90" max="90" step="any" value={latitude}
            onChange={event => setLatitude(event.target.value)} placeholder="41.3126" className="mt-1 w-full rounded-md border border-border-main bg-bg-panel px-2 py-2 text-sm" />
        </label>
        <label className="text-xs font-medium text-text-secondary">Longitude
          <input aria-label="Project longitude" type="number" min="-180" max="180" step="any" value={longitude}
            onChange={event => setLongitude(event.target.value)} placeholder="−81.4401" className="mt-1 w-full rounded-md border border-border-main bg-bg-panel px-2 py-2 text-sm" />
        </label>
      </div>
      {inputError && <p role="alert" className="text-xs text-red-700">{inputError}</p>}
      <button type="submit" className="w-full rounded-md border border-soprema-blue px-3 py-2 text-xs font-semibold text-soprema-blue hover:bg-blue-50">Use coordinates</button>
    </form>
    {selected && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedKey)}`} target="_blank" rel="noopener noreferrer" className="inline-flex gap-1 items-center text-xs text-soprema-blue underline">Open pinned location in Google Maps <ExternalLink className="h-3 w-3" /></a>}
    <div aria-live="polite">
      {loading && <p className="flex items-center gap-2 text-xs text-text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Loading five complete years of climate history…</p>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><p>{error}</p><p className="mt-1">Climate suitability remains unknown.</p><button type="button" onClick={() => setRefresh(value => value + 1)} className="mt-2 font-semibold underline">Retry climate lookup</button></div>}
      {currentResult && !loading && <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-xs">
        <h4 className="mb-2 flex gap-2 items-center text-sm font-bold text-soprema-blue"><CloudSun className="h-4 w-4" /> Historical climate screening</h4>
        <p className="text-text-secondary">{currentResult.climate.startDate} – {currentResult.climate.endDate} · ERA5</p>
        <p className="mt-1 text-text-muted">{currentResult.climate.validDays.toLocaleString()} / {currentResult.climate.expectedDays.toLocaleString()} valid daily records</p>
        {currentResult.climate.status === 'ready' ? <dl className="my-3 grid grid-cols-2 gap-2 text-text-secondary">
          <div><dt>Days/year below {threshold[0]}</dt><dd className="font-semibold">{currentResult.climate.freezeDaysPerYear?.toFixed(0)}</dd></div>
          <div><dt>Days/year ≥ {threshold[1]}</dt><dd className="font-semibold">{currentResult.climate.hotDaysPerYear?.toFixed(0)}</dd></div>
          <div><dt>Period daily minimum</dt><dd className="font-semibold">{temperature(currentResult.climate.lowestDailyMinimumC)}</dd></div>
          <div><dt>Period daily maximum</dt><dd className="font-semibold">{temperature(currentResult.climate.highestDailyMaximumC)}</dd></div>
          <div className="col-span-2"><dt>Mean annual precipitation</dt><dd className="font-semibold">{((currentResult.climate.annualPrecipitationMm || 0) / (unitSystem === 'metric' ? 1 : 25.4)).toFixed(1)} {unitSystem === 'metric' ? 'mm' : 'in'}</dd></div>
        </dl> : <p className="my-2 font-semibold text-amber-800">Needs data — no material suggestion can be evaluated.</p>}
        <p className="leading-relaxed text-text-muted">{currentResult.climate.message}</p>
        <a href={currentResult.climate.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-soprema-blue underline">Open-Meteo / ERA5 source and method</a>
        {currentResult.suggestions.map(suggestion => <article key={suggestion.material} className="mt-3 rounded-md border border-blue-100 bg-bg-panel p-3">
          <h5 className="font-semibold text-soprema-blue"><a href={suggestion.productUrl} target="_blank" rel="noopener noreferrer" className="underline">{suggestion.material}</a></h5>
          <p className="mt-1 leading-relaxed text-text-secondary">{unitSystem === 'imperial' ? suggestion.reason.replaceAll('30 °C', '86 °F').replaceAll('0 °C', '32 °F') : suggestion.reason}</p>
        </article>)}
        {currentResult.climate.status === 'ready' && currentResult.suggestions.length === 0 && <p className="mt-3 text-text-secondary">No catalog candidate matched the screening thresholds. Continue with the manufacturer’s system selection and project design requirements.</p>}
      </div>}
    </div>
  </div>;
}
