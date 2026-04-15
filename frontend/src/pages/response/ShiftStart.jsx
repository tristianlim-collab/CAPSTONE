import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, Power, MapPin, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShiftStart() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startShift = async () => {
    setLoading(true);
    // API Call to Update unit status to 'AVAILABLE'
    setTimeout(() => {
      toast.success("Shift Started - You are now active.");
      navigate('/response/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-200/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-200/30 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-[2rem] p-8 sm:p-10 flex flex-col items-center">
          
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-75" />
            <div className="w-20 h-20 bg-emerald-100/50 rounded-full flex items-center justify-center relative z-10 border-4 border-white shadow-sm">
              <ShieldCheck className="w-10 h-10 text-emerald-600" />
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight text-center">
            Unit Deploy
          </h1>
          <p className="text-slate-500 text-center mb-8 px-4 text-sm sm:text-base">
            Go online to begin receiving automated incident dispatches and share your live location.
          </p>

          <div className="w-full bg-slate-50/50 rounded-2xl p-4 mb-8 border border-slate-100">
            <div className="flex items-center justify-between mb-3 text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-500" />
                <span className="font-medium">System Time</span>
              </div>
              <span className="font-semibold text-slate-900 font-mono">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                <span className="font-medium">Status</span>
              </div>
              <span className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-full uppercase tracking-wider">
                Offline
              </span>
            </div>
          </div>

          <button
            onClick={startShift}
            disabled={loading}
            className={`group relative w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg text-white transition-all duration-300 shadow-lg shadow-emerald-500/30 overflow-hidden
              ${loading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 hover:shadow-emerald-500/50 hover:-translate-y-1'}
            `}
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Connecting...</span>
              </div>
            ) : (
              <>
                <Power className="w-6 h-6 transition-transform group-hover:scale-110" />
                <span>START SHIFT</span>
              </>
            )}
            
            {/* Glossy overlay */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-b-full blur-[2px] pointer-events-none transform -translate-y-1" />
          </button>
          
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-xs text-center">
            <MapPin className="w-3.5 h-3.5" />
            <p>GPS tracking will activate upon starting shift</p>
          </div>
        </div>
      </div>
    </div>
  );
}
