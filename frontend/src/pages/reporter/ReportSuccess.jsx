import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowRight, UserCheck, AlertTriangle, Truck, Camera, CheckCircle2, Clock, Check, Image as ImageIcon, X } from 'lucide-react';
import { useSocketContext } from '../../context/SocketContext';
import { incidentAPI } from '../../api';

export default function ReportSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { on } = useSocketContext();
  
  const incidentData = location.state?.incident || location.state || {};
  const targetIncidentId = incidentData.incident_id || localStorage.getItem('last_reported_incident_id');
  const [incident, setIncident] = useState({
    incident_id: targetIncidentId,
    incident_code: incidentData.incident_code || (targetIncidentId ? `INC-${targetIncidentId}` : 'INC-ACTIVE'),
    status: 'REPORTED',
    resolution_photo: null,
    resolution_notes: ''
  });

  useEffect(() => {
    sessionStorage.removeItem('incidentLocation');
    sessionStorage.removeItem('incidentType');

    // Fetch initial status if ID exists
    if (targetIncidentId) {
      incidentAPI.getById(targetIncidentId)
        .then(res => {
          if (res.data) {
            setIncident(prev => ({
              ...prev,
              incident_code: res.data.incident_code || prev.incident_code,
              status: res.data.status || 'REPORTED',
              resolution_photo: res.data.resolution_photo || res.data.resolved_photo_url || null,
              resolution_notes: res.data.resolution_notes || ''
            }));
          }
        })
        .catch(err => console.log('Could not load status:', err));
    }
  }, [targetIncidentId]);

  // Real-time socket updates for this active report
  useEffect(() => {
    if (!on || !targetIncidentId) return;

    const unsub1 = on('incident_status_updated', (data) => {
      if (String(data.incident_id) === String(targetIncidentId)) {
        setIncident(prev => ({
          ...prev,
          status: data.status,
          resolution_photo: data.resolution_photo || data.incident?.resolution_photo || prev.resolution_photo
        }));
      }
    });

    const unsub2 = on('incident_resolved', (data) => {
      if (String(data.incident_id) === String(targetIncidentId)) {
        setIncident(prev => ({
          ...prev,
          status: 'RESOLVED',
          resolution_photo: data.resolution_photo || data.photo_url || prev.resolution_photo
        }));
      }
    });

    return () => { unsub1(); unsub2(); };
  }, [on, targetIncidentId]);

  const getStatusBadge = () => {
    switch (incident.status) {
      case 'VERIFIED':
      case 'ACKNOWLEDGED':
        return { label: 'ACKNOWLEDGED & VERIFIED', cls: 'bg-blue-500 text-white' };
      case 'RESPONDING':
        return { label: 'RESPONDING (UNIT EN ROUTE)', cls: 'bg-amber-500 text-white' };
      case 'ON_SCENE':
        return { label: 'UNIT ON SCENE', cls: 'bg-purple-600 text-white' };
      case 'RESOLVED':
        return { label: 'INCIDENT RESOLVED', cls: 'bg-emerald-600 text-white' };
      case 'CANCELLED':
      case 'FALSE_ALARM':
      case 'FALSE_REPORT':
        return { label: '⚠️ FALSE REPORT DETECTED', cls: 'bg-rose-600 text-white' };
      default:
        return { label: 'SIGNAL RECEIVED (PENDING REVIEW)', cls: 'bg-emerald-500 text-white' };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
      {/* Top Exit Button */}
      <button 
        onClick={() => navigate('/reporter/home')}
        className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-white/80 backdrop-blur border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white flex items-center justify-center shadow-sm transition-all active:scale-95"
        title="Exit"
      >
        <X size={20} />
      </button>

      {/* Background Graphic */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 -translate-y-1/2 translate-x-1/3"></div>
      
      <div className="max-w-[440px] w-full flex flex-col items-center relative z-10">
        
        {/* Success Header Icon */}
        <div className="relative mb-6 mt-6">
          <div className="absolute inset-0 bg-emerald-500 rounded-full blur-[20px] opacity-30 animate-pulse"></div>
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center relative shadow-[0_15px_30px_rgba(16,185,129,0.3)] border-4 border-emerald-400/50">
            <ShieldCheck size={48} className="text-white drop-shadow-md" />
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Report Submitted!</h1>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-4">
          Report ID: <span className="text-slate-800">{incident.incident_code}</span>
        </p>

        {/* Live Status Header Badge */}
        <div className={`px-4 py-2 rounded-full font-black text-[11px] tracking-widest uppercase mb-6 shadow-md ${badge.cls}`}>
          {badge.label}
        </div>

        {/* Live Progress Tracker Card */}
        <div className="w-full bg-white rounded-3xl p-6 shadow-sm border border-slate-200 mb-6 text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Live Emergency Status</h3>
          
          <div className="space-y-4">
            {/* Step 1: Received */}
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">1. Signal Received</h4>
                <p className="text-xs text-slate-500">Your GPS location & report logged at Command Center.</p>
              </div>
            </div>

            {/* Step 2: Admin Verified */}
            <div className="flex items-start gap-3.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                incident.status === 'FALSE_ALARM' || incident.status === 'FALSE_REPORT'
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : ['VERIFIED','ACKNOWLEDGED','RESPONDING','ON_SCENE','RESOLVED'].includes(incident.status)
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-slate-50 text-slate-300 border-slate-200'
              }`}>
                {incident.status === 'FALSE_ALARM' || incident.status === 'FALSE_REPORT' ? <AlertTriangle size={16} /> : <UserCheck size={16} />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">2. Admin Verification</h4>
                <p className="text-xs text-slate-500">
                  {incident.status === 'FALSE_ALARM' || incident.status === 'FALSE_REPORT' ? (
                    <span className="text-rose-600 font-bold block mt-0.5">
                      ⚠️ False Report Flagged: Warning — Submitting fraudulent emergency alerts carries legal penalties under Philippine Penal Law.
                    </span>
                  ) : incident.status === 'VERIFIED' || incident.status === 'ACKNOWLEDGED' ? (
                    <span className="text-blue-600 font-bold">Report Acknowledged & Verified by Admin</span>
                  ) : (
                    'Operators verify report details.'
                  )}
                </p>
              </div>
            </div>

            {/* Step 3: Responding */}
            <div className="flex items-start gap-3.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                ['RESPONDING','ON_SCENE','RESOLVED'].includes(incident.status)
                  ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse'
                  : 'bg-slate-50 text-slate-300 border-slate-200'
              }`}>
                <Truck size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">3. Unit Dispatched ("Responding")</h4>
                <p className="text-xs text-slate-500">
                  {['RESPONDING','ON_SCENE','RESOLVED'].includes(incident.status) ? (
                    <span className="text-amber-600 font-bold">Response Unit is en route to your location.</span>
                  ) : (
                    'Nearest Police/Fire/Medical unit assigned.'
                  )}
                </p>
              </div>
            </div>

            {/* Step 4: Resolved with Photo */}
            <div className="flex items-start gap-3.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                incident.status === 'RESOLVED'
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-slate-50 text-slate-300 border-slate-200'
              }`}>
                <Camera size={16} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800">4. Incident Resolved & Proof</h4>
                <p className="text-xs text-slate-500">
                  {incident.status === 'RESOLVED' ? (
                    <span className="text-emerald-600 font-bold">Emergency resolved by response unit.</span>
                  ) : (
                    'Response team uploads photo proof upon resolution.'
                  )}
                </p>

                {/* Show Resolution Photo if available */}
                {incident.resolution_photo && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <img 
                      src={incident.resolution_photo} 
                      alt="Resolution Photo Proof" 
                      className="w-full h-40 object-cover"
                    />
                    <div className="bg-slate-900 text-white p-2 flex items-center gap-1.5 text-[11px] font-bold">
                      <ImageIcon size={14} className="text-emerald-400" /> Resolution Photo Evidence
                    </div>
                  </div>
                )}
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
