import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { 
  ArrowLeft, MapPin, Navigation2, Flame, 
  Stethoscope, ShieldAlert, LifeBuoy, AlertTriangle, Crosshair, Car, FileText
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Default center: Negros Island Region, Philippines
const DEFAULT_CENTER = { lat: 10.0000, lng: 122.9000 };

function LocationMarker({ location, setLocation }) {
  useMapEvents({
    click(e) {
      setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return location ? <Marker position={[location.lat, location.lng]} /> : null;
}

// Component to recenter map when location changes
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 16, { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

export default function ReportStep1() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [locError, setLocError] = useState('');
  const [geoLoading, setGeoLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');

  const emergencyTypes = [
    { id: 'FIRE', name: 'FIRE INCIDENT', icon: <Flame size={24} />, color: 'bg-orange-50 text-orange-600 border-orange-200' },
    { id: 'FLOOD', name: 'FLOOD / TYPHOON', icon: <AlertTriangle size={24} />, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { id: 'LANDSLIDE', name: 'LANDSLIDE', icon: <AlertTriangle size={24} />, color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { id: 'MEDICAL', name: 'MEDICAL EMERGENCY', icon: <Stethoscope size={24} />, color: 'bg-rose-50 text-rose-600 border-rose-200' },
    { id: 'ACCIDENT', name: 'VEHICULAR ACCIDENT', icon: <Car size={24} />, color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { id: 'INFRASTRUCTURE', name: 'INFRASTRUCTURE DAMAGE', icon: <FileText size={24} />, color: 'bg-slate-50 text-slate-600 border-slate-200' },
  ];

  useEffect(() => {
    // Check if we're on a secure context (HTTPS or localhost) - GPS only works there
    const isSecureContext = window.isSecureContext;
    
    if (isSecureContext && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(coords);
          setMapCenter(coords);
          setGeoLoading(false);
          setLocError('');
        },
        (err) => {
          console.warn('Geolocation failed:', err.message);
          setLocError('');
          setGeoLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    } else {
      // Not a secure context (HTTP on non-localhost) — GPS won't work, skip silently
      setGeoLoading(false);
    }
  }, []);

  const handleFindMe = () => {
    if (!('geolocation' in navigator)) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(coords);
        setMapCenter(coords);
        setLocError('');
        setGeoLoading(false);
      },
      (err) => {
        console.warn('Geolocation failed:', err.message);
        setLocError('Could not detect GPS. Tap the map to pin the incident location.');
        setGeoLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleNext = () => {
    if (!selectedType) return;
    sessionStorage.setItem('incidentLocation', JSON.stringify(location));
    sessionStorage.setItem('incidentType', selectedType);
    navigate('/reporter/report/step2');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 pt-safe">
        <div className="flex items-center h-16 px-4 max-w-[430px] mx-auto">
          <button 
            onClick={() => navigate('/reporter/home')}
            className="w-10 h-10 flex flex-col items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex-1 flex flex-col items-center justify-center -ml-10 pointer-events-none">
            <h1 className="text-lg font-bold text-slate-900">Emergency Report</h1>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Step 1/5</p>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[430px] mx-auto w-full p-5 flex flex-col">
        
        {/* Step Title */}
        <div className="mb-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">What's the emergency?</h2>
            <p className="text-sm text-slate-500">Select the type of emergency and verify your location below.</p>
          </div>
        </div>

        {/* Emergency Type Selection */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {emergencyTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-200 border-2 ${
                selectedType === type.id 
                  ? `${type.color.split(' ')[1]} ring-4 ring-opacity-20 ring-offset-2 ${type.color.replace('border-', 'ring-').split(' ')[2]} border-transparent scale-[0.98] shadow-sm` 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className={`p-3 rounded-full ${selectedType === type.id ? type.color : 'bg-slate-50'}`}>
                {type.icon}
              </div>
              <span className={`text-[13px] font-bold ${selectedType === type.id ? '' : 'text-slate-700'}`}>
                {type.name}
              </span>
            </button>
          ))}
        </div>

        {/* Location Box */}
        <h3 className="text-[13px] font-bold text-slate-800 tracking-wide uppercase mb-3 flex items-center gap-2">
          <MapPin size={16} className="text-blue-500" /> Where did it happen?
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          {location ? 'Tap the map to adjust the pin.' : 'Tap the map to pin the exact location.'}
        </p>

        {/* Location warning banner */}
        {locError && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 font-medium">{locError}</p>
          </div>
        )}

        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group mb-4">
          <div className="h-[240px] w-full rounded-xl overflow-hidden bg-slate-100 z-0 relative">
            {geoLoading && !location ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin mb-2"></div>
                <p className="text-sm font-medium text-slate-600 tracking-wide">Acquiring GPS...</p>
              </div>
            ) : (
              <MapContainer 
                center={[mapCenter.lat, mapCenter.lng]} 
                zoom={location ? 16 : 13} 
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker location={location} setLocation={(loc) => {
                  setLocation(loc);
                  setLocError('');
                }} />
                {location && <RecenterMap lat={location.lat} lng={location.lng} />}
              </MapContainer>
            )}
            
            {/* Find Me Button overlaid on map */}
            <button 
              onClick={handleFindMe}
              title="Use my current location"
              className="absolute bottom-4 right-4 z-[400] w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
            >
              <Navigation2 size={18} />
            </button>
          </div>
        </div>

        {/* Coordinate Text Boxes like in the screenshot */}
        {location && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Latitude</span>
              <span className="text-sm font-semibold text-slate-800">{location.lat.toFixed(6)}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Longitude</span>
              <span className="text-sm font-semibold text-slate-800">{location.lng.toFixed(6)}</span>
            </div>
          </div>
        )}

      </div>

      {/* Sticky Bottom Actions */}
      <div className="p-5 bg-white border-t border-slate-200 mt-auto pb-8 z-50">
        <div className="max-w-[430px] mx-auto">
          <button 
            onClick={handleNext} 
            disabled={!location || !selectedType}
            className={`w-full py-4 rounded-2xl font-bold text-[15px] tracking-wide uppercase transition-all duration-300 flex items-center justify-center shadow-lg ${
              location && selectedType
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            Continue to Details
          </button>
        </div>
      </div>
    </div>
  );
}
