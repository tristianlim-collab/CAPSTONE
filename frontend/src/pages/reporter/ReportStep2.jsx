import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentAPI } from '../../api';
import api from '../../api';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Camera, Image as ImageIcon, Send, FileText, CheckCircle2, 
  MapPin, ShieldAlert, X, Clock, AlertTriangle
} from 'lucide-react';

export default function ReportStep2() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]); // support multiple photos
  const [severity, setSeverity] = useState('LOW'); // default severity
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [locationAddress, setLocationAddress] = useState('');
  const [addressLoading, setAddressLoading] = useState(true);

  // Retrieve data from step 1
  const location = JSON.parse(sessionStorage.getItem('incidentLocation') || 'null');
  const incidentTypeKey = sessionStorage.getItem('incidentType') || '';

  // Fetch incident types from DB on mount
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await api.get('/incident-types');
        setIncidentTypes(res.data);
      } catch (err) {
        console.error('Failed to fetch incident types:', err);
      }
    };
    fetchTypes();
  }, []);

  // Reverse geocode the location to get address
  useEffect(() => {
    if (location && location.lat && location.lng) {
      setAddressLoading(true);
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=18&addressdetails=1`)
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name) {
            // Build a shorter, readable address
            const addr = data.address || {};
            const parts = [
              addr.road || addr.hamlet || addr.neighbourhood,
              addr.suburb || addr.village || addr.town,
              addr.city || addr.municipality,
              addr.state || addr.province
            ].filter(Boolean);
            setLocationAddress(parts.length > 0 ? parts.join(', ') : data.display_name);
          } else {
            setLocationAddress('Unknown location');
          }
          setAddressLoading(false);
        })
        .catch(() => {
          setLocationAddress('Could not resolve address');
          setAddressLoading(false);
        });
    } else {
      setAddressLoading(false);
    }
  }, []);

  // Find matching incident type ID from DB types
  const getIncidentTypeId = () => {
    if (incidentTypes.length === 0) return null;
    // Try to match by name (case-insensitive partial match)
    const match = incidentTypes.find(t => 
      t.name.toUpperCase().includes(incidentTypeKey.toUpperCase()) || 
      incidentTypeKey.toUpperCase().includes(t.name.toUpperCase())
    );
    return match ? match.type_id : incidentTypes[0]?.type_id;
  };

  const handleSubmit = async () => {
    const typeId = getIncidentTypeId();
    if (!typeId) {
      toast.error('Incident types not loaded yet. Please wait.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create the incident
      const incRes = await incidentAPI.create({
        incident_type_id: typeId,
        description: generatedDescription,
        latitude: location?.lat || 0,
        longitude: location?.lng || 0,
        map_pin_address: locationAddress || undefined,
        severity: severity
      });

      // 3. If we have photos, upload them as evidence linked to the incident
      const incidentId = incRes.data?.incident_id;
      if (incidentId && photos.length > 0) {
        for (const photo of photos) {
          try {
            const formData = new FormData();
            formData.append('file', photo);
            formData.append('incident_id', incidentId);
            await api.post('/evidence', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          } catch (evErr) {
            console.error('Evidence upload failed:', evErr);
            toast.error('Warning: Failed to upload some photos. Check Supabase Storage settings.');
          }
        }
      }

      toast.success('Incident reported successfully!');
      navigate('/reporter/report/success');
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit emergency report');
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    if (e.target.files) {
      const newPhotos = [...photos, ...Array.from(e.target.files)].slice(0, 5); // max 5
      setPhotos(newPhotos);
    }
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Emergency type display name
  const typeNames = {
    'FIRE': 'Fire',
    'MEDICAL': 'Medical Emergency', 
    'ACCIDENT': 'Accident',
    'CRIME': 'Crime-Related',
    'OTHER': 'Other'
  };

  const defaultSeverityDescriptions = {
    LOW: 'Localized issue with limited impact.',
    HIGH: 'Serious incident requiring urgent coordinated response.',
    CRITICAL: 'Extreme emergency with immediate widespread risk.'
  };

  const getSeverityDescription = () => {
    const selectedTypeName = typeNames[incidentTypeKey] || incidentTypeKey;
    const selectedTypeData = incidentTypes.find((type) => type.name === selectedTypeName);
    if (selectedTypeData?.description) {
      try {
        const parsed = JSON.parse(selectedTypeData.description);
        const configured = parsed?.severityDescriptions?.[severity];
        if (configured) return configured;
      } catch {
        // Ignore parse errors and use fallback copy.
      }
    }
    return defaultSeverityDescriptions[severity];
  };

  const generatedDescription = `${typeNames[incidentTypeKey] || incidentTypeKey || 'Emergency'} - ${severity}: ${getSeverityDescription()}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 pt-safe">
        <div className="flex items-center h-16 px-4 max-w-[430px] mx-auto">
          <button 
            onClick={() => navigate(-1)}
            disabled={loading}
            className="w-10 h-10 flex flex-col items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex-1 flex flex-col items-center justify-center -ml-10 pointer-events-none">
            <h1 className="text-lg font-bold text-slate-900">Incident Details</h1>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Step 2 of 2</p>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[430px] mx-auto w-full p-5 flex flex-col">
        
        {/* Step Title */}
        <div className="mb-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Provide more details</h2>
            <p className="text-sm text-slate-500">Photos and descriptions help responders assist you faster.</p>
          </div>
        </div>

        {/* Summary Cards: Type + Location */}
        <div className="space-y-3 mb-6">
          {/* Emergency Type */}
          <div className="bg-white rounded-2xl px-4 py-3 border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Emergency Type</p>
              <p className="text-sm font-bold text-slate-800">{typeNames[incidentTypeKey] || incidentTypeKey}</p>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl px-4 py-3 border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
              <MapPin size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</p>
              {addressLoading ? (
                <p className="text-sm text-slate-400">Resolving address...</p>
              ) : (
                <>
                  <p className="text-sm font-bold text-slate-800 truncate">{locationAddress}</p>
                  {location && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="bg-white rounded-2xl px-4 py-3 border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date & Time</p>
              <p className="text-sm font-bold text-slate-800">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Severity Selector */}
        <div className="mb-6">
          <h3 className="text-[13px] font-bold text-slate-800 tracking-wide uppercase flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-orange-500" /> Incident Severity
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {['LOW', 'HIGH', 'CRITICAL'].map((level) => (
              <button
                key={level}
                onClick={() => setSeverity(level)}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                  severity === level
                    ? level === 'CRITICAL' ? 'bg-red-500 text-white border-red-500 shadow-[0_4px_12px_rgba(239,68,68,0.3)]'
                      : level === 'HIGH' ? 'bg-orange-500 text-white border-orange-500 shadow-[0_4px_12px_rgba(249,115,22,0.3)]'
                      : 'bg-emerald-500 text-white border-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.3)]'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            {getSeverityDescription()}
          </p>
          <p className="mt-2 text-xs text-slate-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <span className="font-semibold">Auto description:</span> {generatedDescription}
          </p>
        </div>

        {/* Photo Evidence */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-bold text-slate-800 tracking-wide uppercase flex items-center gap-2">
              <Camera size={16} className="text-blue-500" /> Photo Evidence
            </h3>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-bold uppercase">Optional</span>
          </div>
          
          {/* Photo Grid */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {photos.map((photo, index) => (
              <div key={index} className="relative aspect-square bg-slate-900 rounded-xl overflow-hidden border border-slate-200">
                <img 
                  src={URL.createObjectURL(photo)} 
                  alt={`Evidence ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button 
                  onClick={() => removePhoto(index)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 backdrop-blur rounded-full text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {/* Add Photo Button */}
            {photos.length < 5 && (
              <div className="relative aspect-square border-2 border-dashed border-blue-200 bg-blue-50 hover:bg-blue-100/50 transition-colors rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                <Camera size={20} className="text-blue-400 mb-1" />
                <span className="text-[10px] font-bold text-blue-400">Add Photo</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  onChange={handlePhotoChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
              </div>
            )}
          </div>
          {photos.length > 0 && (
            <p className="text-[11px] text-slate-400">{photos.length}/5 photos attached</p>
          )}
        </div>

      </div>

      {/* Sticky Bottom Actions */}
      <div className="p-5 bg-white border-t border-slate-200 mt-auto pb-8 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-[430px] mx-auto">
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-[15px] tracking-wide uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
              !loading
                ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/30'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Sending Report...
              </>
            ) : (
              <>
                <Send size={18} className="-ml-1" />
                Submit Emergency Report
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-slate-400 font-medium mt-4 flex items-center justify-center gap-1.5">
            <ShieldAlert size={12} /> False reporting is punishable by law
          </p>
        </div>
      </div>
    </div>
  );
}
