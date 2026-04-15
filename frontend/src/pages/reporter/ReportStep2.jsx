import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { incidentAPI, uploadAPI } from '../../api';
import toast from 'react-hot-toast';
import { ArrowLeft, Camera, Image as ImageIcon, Send, FileText, CheckCircle2 } from 'lucide-react';

export default function ReportStep2() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const loc = JSON.parse(sessionStorage.getItem('incidentLocation') || '{}');
      const incType = sessionStorage.getItem('incidentType') || 'UNKNOWN';
      
      // 1. Create incident (Using mocked '1' for type, refine on backend if needed)
      const incRes = await incidentAPI.create({
        incident_type_id: '1', 
        description: `${incType}: ${description}`,
        latitude: loc.lat || 0,
        longitude: loc.lng || 0,
        severity: 'HIGH'
      });

      // 2. Upload photo if exists
      if (photo) {
        await uploadAPI.uploadPhoto(photo, incRes.data.incident_id);
      }

      toast.success("Incident Reported successfully");
      navigate('/reporter/report/success');
    } catch (err) {
      toast.error('Failed to submit emergency report');
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

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

        {/* Media Upload */}
        <div className="mb-6">
          <h3 className="text-[13px] font-bold text-slate-800 tracking-wide uppercase mb-3 flex items-center gap-2">
            <Camera size={16} className="text-blue-500" /> Evidence Photo
          </h3>
          
          <div className="relative group">
            {photo ? (
              <div className="relative w-full h-48 bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm">
                <img 
                  src={URL.createObjectURL(photo)} 
                  alt="Incident Evidence" 
                  className="w-full h-full object-cover opacity-90 transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-4">
                  <div className="flex items-center gap-2 text-white">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span className="text-sm font-medium">Photo attached</span>
                  </div>
                </div>
                <button 
                  onClick={() => setPhoto(null)}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-red-500/80 transition-colors"
                >
                  <ArrowLeft size={16} className="rotate-45" /> {/* Used as a creative 'X' fallback */}
                </button>
              </div>
            ) : (
              <div className="w-full h-40 border-2 border-dashed border-blue-200 bg-blue-50 hover:bg-blue-100/50 transition-colors rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer shadow-sm relative overflow-hidden">
                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-blue-500">
                  <ImageIcon size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">Tap to upload photo</p>
                  <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG (Max 5MB)</p>
                </div>
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
        </div>

        {/* Description Field */}
        <div className="mb-6 flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-bold text-slate-800 tracking-wide uppercase flex items-center gap-2">
              <FileText size={16} className="text-blue-500" /> Description
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">Optional</span>
          </div>
          
          <textarea 
            rows="5"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened, injuries, hazards, or specific landmarks..."
            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm resize-none transition-all"
          ></textarea>
        </div>

      </div>

      {/* Sticky Bottom Actions */}
      <div className="p-5 bg-white border-t border-slate-200 mt-auto pb-8 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-[430px] mx-auto">
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-[15px] tracking-wide uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-lg bg-red-600 text-white hover:bg-red-700 shadow-red-600/30 disabled:opacity-70 disabled:cursor-not-allowed"
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
