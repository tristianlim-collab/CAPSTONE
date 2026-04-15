import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, UserCheck, Smartphone } from 'lucide-react';

export default function ReportSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Optional: Auto-redirect or perform cleanup
    sessionStorage.removeItem('incidentLocation');
    sessionStorage.removeItem('incidentType');
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 -translate-y-1/2 translate-x-1/3"></div>
      
      <div className="max-w-[430px] w-full flex flex-col items-center relative z-10 z-10">
        
        {/* Success Icon */}
        <div className="relative mb-8 mt-10">
          <div className="absolute inset-0 bg-emerald-500 rounded-full blur-[20px] opacity-30 animate-pulse"></div>
          <div className="w-28 h-28 bg-emerald-500 rounded-full flex items-center justify-center relative shadow-[0_15px_30px_rgba(16,185,129,0.3)] border-4 border-emerald-400/50">
            <ShieldCheck size={56} className="text-white drop-shadow-md" />
          </div>
          
          <div className="absolute -top-4 -right-2 w-12 h-12 bg-white rounded-full flex flex-col items-center justify-center shadow-lg border border-slate-100 animate-bounce" style={{ animationDuration: '3s' }}>
            <span className="text-xl">🙌</span>
          </div>
        </div>
        
        {/* Texts */}
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Report Sent!</h1>
        <p className="text-[15px] text-slate-500 leading-relaxed font-medium mb-10 max-w-[300px]">
          Authorities have been strictly notified. Stay calm, units are being dispatched to your exact location.
        </p>

        {/* Steps/Info Card */}
        <div className="w-full bg-white rounded-3xl p-6 shadow-sm border border-slate-200 mb-10 text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">What happens next?</h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                <UserCheck size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Command Center Review</h4>
                <p className="text-xs text-slate-500">Your details are instantly verified by operators.</p>
              </div>
            </div>
            
            <div className="w-0.5 h-4 bg-slate-100 ml-4"></div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                <Smartphone size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Keep Your Phone Nearby</h4>
                <p className="text-xs text-slate-500">Responders may call you on this device for further information.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action */}
        <button 
          onClick={() => navigate('/reporter/home')}
          className="w-full py-4 rounded-2xl font-bold text-[15px] tracking-wide uppercase transition-all duration-300 flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 shadow-[0_15px_30px_rgba(15,23,42,0.2)] active:scale-[0.98]"
        >
          Return to Home
          <ArrowRight size={18} />
        </button>

      </div>
    </div>
  );
}
