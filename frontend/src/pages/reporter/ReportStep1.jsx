import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { 
  ArrowLeft, MapPin, Navigation2, Flame, 
  Stethoscope, ShieldAlert, LifeBuoy, AlertTriangle, Crosshair
} from 'lucide-react';

export default function ReportStep1() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locError, setLocError] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const emergencyTypes = [
    { id: 'FIRE', name: 'Fire', icon: <Flame size={24} />, color: 'bg-orange-50 text-orange-600 border-orange-200' },
    { id: 'MEDICAL', name: 'Medical', icon: <Stethoscope size={24} />, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { id: 'POLICE', name: 'Police', icon: <ShieldAlert size={24} />, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    { id: 'RESCUE', name: 'Rescue', icon: <LifeBuoy size={24} />, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  ];

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => setLocError('Unable to get your exact location. Please ensure location services are enabled.')
      );
    } else {
      setLocError('Geolocation is not supported by your browser.');
    }
  }, []);

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
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Step 1 of 2</p>
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
          <MapPin size={16} className="text-blue-500" /> Current Location
        </h3>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          {/* Subtle map pattern background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              {location ? (
                <>
                  <p className="text-sm font-semibold text-slate-900 mb-0.5 flex items-center gap-1.5">
                    <Crosshair size={14} className="text-emerald-500" /> Location Acquired
                  </p>
                  <p className="text-xs text-slate-500">
                    Lat: {location.lat.toFixed(5)}<br /> 
                    Lng: {location.lng.toFixed(5)}
                  </p>
                </>
              ) : locError ? (
                <div className="text-rose-500 text-sm font-medium">
                  <p>{locError}</p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin"></div>
                  <p className="text-sm font-medium text-slate-600 tracking-wide">Acquiring GPS...</p>
                </div>
              )}
            </div>

            <button className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 hover:bg-blue-100 transition-colors">
              <Navigation2 size={18} />
            </button>
          </div>
        </div>

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
