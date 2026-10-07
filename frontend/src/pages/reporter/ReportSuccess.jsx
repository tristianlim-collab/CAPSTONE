import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Info, MapPin, Camera, AlertTriangle, UserCheck, 
  Truck, CheckCircle2, ShieldCheck, Image as ImageIcon, Navigation, ArrowRight
} from 'lucide-react';
import { useSocketContext } from '../../context/SocketContext';
import { incidentAPI } from '../../api';

export default function ReportSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { on } = useSocketContext();

  const passedIncident = location.state?.incident || location.state || {};
  const targetIncidentId = passedIncident.incident_id || localStorage.getItem('last_reported_incident_id');

  const [incident, setIncident] = useState({
    ...passedIncident,
    incident_id: targetIncidentId,
    incident_code: passedIncident.incident_code || (targetIncidentId ? `INC-${targetIncidentId}` : 'INC-ACTIVE'),
    status: passedIncident.status || 'REPORTED',
    severity: passedIncident.severity || 'HIGH',
    map_pin_address: passedIncident.map_pin_address || 'Detecting address...',
    landmark: passedIncident.landmark || '',
    description: passedIncident.description || '',
    reported_at: passedIncident.reported_at || new Date().toISOString(),
    incident_type: passedIncident.incident_type || { name: 'Emergency Incident' },
    evidence: passedIncident.evidence || [],
    resolution_photo: passedIncident.resolution_photo || null,
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return `Reported ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } catch {
      return dateStr;
    }
  };

  const formatEvidenceDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } catch {
      return dateStr;
    }
  };

  // Fetch initial status & poll every 3s
  useEffect(() => {
    sessionStorage.removeItem('incidentLocation');
    sessionStorage.removeItem('incidentType');

    if (!targetIncidentId) return;

    const fetchLatest = () => {
      incidentAPI.getById(targetIncidentId)
        .then(res => {
          const data = res.data?.data || res.data;
          if (data) {
            setIncident(prev => ({
              ...prev,
              ...data,
              incident_code: data.incident_code || prev.incident_code,
              status: data.status || prev.status,
              severity: data.severity || prev.severity,
              map_pin_address: data.map_pin_address || prev.map_pin_address,
              landmark: data.landmark || prev.landmark,
              description: data.description || prev.description,
              reported_at: data.reported_at || prev.reported_at,
              incident_type: data.incident_type || prev.incident_type,
              evidence: (data.evidence && data.evidence.length > 0) ? data.evidence : prev.evidence,
              resolution_photo: data.resolution_photo || data.resolved_photo_url || prev.resolution_photo,
            }));
          }
        })
        .catch(err => console.log('Could not load status:', err));
    };

    fetchLatest();
    const timer = setInterval(fetchLatest, 3000);
    return () => clearInterval(timer);
  }, [targetIncidentId]);

  // Real-time socket updates
  useEffect(() => {
    if (!on || !targetIncidentId) return;

    const handleUpdate = (data) => {
      const incId = data.incident_id || data.incident?.incident_id;
      if (String(incId) === String(targetIncidentId)) {
        setIncident(prev => ({
          ...prev,
          ...(data.incident || {}),
          status: data.status || data.incident?.status || prev.status,
          resolution_photo: data.resolution_photo || data.incident?.resolution_photo || data.photo_url || prev.resolution_photo
        }));
      }
    };

    const unsub1 = on('incident_status_updated', handleUpdate);
    const unsub2 = on('incident_resolved', handleUpdate);
    const unsub3 = on('incident_verified', handleUpdate);
    const unsub4 = on('incident_updated', handleUpdate);
    const unsub5 = on('incident_status_anonymous_update', handleUpdate);

    return () => {
      unsub1(); unsub2(); unsub3(); unsub4(); unsub5();
    };
  }, [on, targetIncidentId]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REPORTED':
        return { label: 'AWAITING VERIFICATION', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'VERIFIED':
      case 'ACKNOWLEDGED':
        return { label: 'VERIFIED BY ADMIN', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'RESPONDING':
        return { label: 'UNIT RESPONDING', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'ON_SCENE':
        return { label: 'UNIT ON SCENE', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'RESOLVED':
        return { label: 'INCIDENT RESOLVED', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'FALSE_ALARM':
      case 'FALSE_REPORT':
        return { label: 'FALSE REPORT DETECTED', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
      default:
        return { label: status || 'REPORTED', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
  };

  const getSeverityClass = (sev) => {
    switch (sev) {
      case 'HIGH':
        return 'text-amber-600 font-bold';
      case 'CRITICAL':
        return 'text-red-600 font-bold';
      default:
        return 'text-emerald-600 font-bold';
    }
  };

  const statusBadge = getStatusBadge(incident.status);
  const typeName = incident.incident_type?.name || 'Emergency Incident';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans pb-12">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center h-16 px-4 max-w-[430px] mx-auto relative">
          <button
            onClick={() => navigate('/reporter/home')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors z-10"
            title="Back to Home"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 flex flex-col items-center justify-center absolute inset-0 pointer-events-none">
            <h1 className="text-lg font-bold text-slate-900">Case Details</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[430px] mx-auto w-full p-4 flex flex-col gap-4">
        {/* Top Status & Code Card */}
        <div className="bg-sky-50/60 border border-sky-100/80 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm">
          <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border mb-3 ${statusBadge.bg}`}>
            {statusBadge.label}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1">
            {incident.incident_code}
          </h2>
          <p className="text-xs font-semibold text-slate-400">
            {formatDate(incident.reported_at)}
          </p>
        </div>

        {/* INFORMATION Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 text-slate-400 border-b border-slate-100 pb-3">
            <Info size={16} className="text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              INFORMATION
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">TYPE</p>
              <p className="text-sm font-bold text-slate-800">{typeName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SEVERITY</p>
              <p className={`text-sm ${getSeverityClass(incident.severity)}`}>{incident.severity}</p>
            </div>
          </div>

          {/* Location details */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-start gap-3 text-xs text-slate-600 font-medium">
              <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
              <span>{incident.map_pin_address || 'Address not available'}</span>
            </div>

            {incident.landmark && (
              <div className="flex items-start gap-3 text-xs text-slate-600 font-medium">
                <Navigation size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                <span>Near Landmark: <span className="font-bold text-slate-800">{incident.landmark}</span></span>
              </div>
            )}
          </div>

          {/* Incident description summary quote */}
          {incident.description && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 italic text-xs text-slate-600 font-medium leading-relaxed mt-1">
              "{incident.description}"
            </div>
          )}
        </div>

        {/* YOUR EVIDENCE Card */}
        {((incident.evidence && incident.evidence.length > 0) || incident.photo_url || incident.file_path) && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 text-slate-400 border-b border-slate-100 pb-3">
              <Camera size={16} className="text-slate-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                YOUR EVIDENCE
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {(incident.evidence || [{ file_path: incident.file_path || incident.photo_url, created_at: incident.reported_at }]).map((ev, idx) => {
                const imgUrl = typeof ev === 'string' ? ev : (ev.file_path || ev.file_url || ev.url || ev.path || '');
                return (
                  <div key={ev.evidence_id || idx} className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/60 p-2 shadow-inner">
                    <img
                      src={imgUrl}
                      alt={`Evidence ${idx + 1}`}
                      className="w-full aspect-[4/3] object-cover rounded-xl mb-2 bg-slate-200"
                    />
                    <p className="text-[11px] text-slate-400 font-medium px-2 pb-1">
                      {formatEvidenceDate(ev.created_at || incident.reported_at)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Progress Tracker Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 text-left relative overflow-hidden">
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
                      ⚠️ False Report Flagged
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
                    'Nearest Fire/DRRMO/Medical unit assigned.'
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

        {/* Return to Home Button */}
        <button
          onClick={() => navigate('/reporter/home')}
          className="w-full py-4 rounded-2xl font-bold text-[15px] tracking-wide uppercase transition-all duration-300 flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 shadow-lg active:scale-[0.98] mt-2"
        >
          Return to Home
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
