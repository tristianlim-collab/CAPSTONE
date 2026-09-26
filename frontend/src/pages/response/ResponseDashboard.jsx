import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { incidentAPI, responseUnitAPI, postReportAPI } from '../../api';
import api from '../../api';
import { useSocketContext } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Radio, User, Clock, CheckCircle2,
  ShieldAlert, MapPin, Navigation, Navigation2, Loader2, AlertTriangle, Send, X, PlusCircle,
  TrendingUp, Activity, Smartphone, ChevronRight, Camera, Image as ImageIcon, XCircle
} from 'lucide-react';
import Skeleton from 'react-loading-skeleton';

export default function ResponseDashboard() {
  const { user } = useAuth();
  const { on, connected } = useSocketContext();
  const [isAvailable, setIsAvailable] = useState(true);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);

  // Modals state
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupUnitType, setBackupUnitType] = useState('FIRE');
  const [reportData, setReportData] = useState({
    actions_taken: '',
    casualties: 0,
    damages_estimate: '',
    remarks: '',
    response_time_minutes: ''
  });
  const [proofPhotos, setProofPhotos] = useState([]); // [{ file, previewUrl }]
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  useEffect(() => {
    fetchIncidents(true);
    const interval = setInterval(() => fetchIncidents(false), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleVerified = async (data) => {
      let verifiedInc = data.incident || data;
      const incId = verifiedInc.incident_id || data.incident_id;

      if (!verifiedInc.map_pin_address || !verifiedInc.incident_type) {
        try {
          const res = await incidentAPI.getById(incId, { include: 'evidence,reporter,type,barangay,assignments' });
          if (res.data) verifiedInc = res.data?.data || res.data;
        } catch (err) {
          console.error('Failed to fetch verified incident details:', err);
        }
      }

      setIncidents(prev => {
        const exists = prev.some(i => i.incident_id === incId);
        if (exists) {
          const updated = prev.map(inc =>
            inc.incident_id === incId
              ? { ...inc, ...verifiedInc, status: 'VERIFIED' }
              : inc
          );
          const target = updated.find(i => i.incident_id === incId);
          const others = updated.filter(i => i.incident_id !== incId);
          return target ? [target, ...others] : updated;
        }
        return [{ ...verifiedInc, status: 'VERIFIED' }, ...prev];
      });

      toast('🚨 New verified incident assigned!', {
        icon: '📍',
        style: {
          fontWeight: 'bold',
          borderRadius: '16px',
          background: '#0F172A',
          color: '#fff',
          border: '1px solid #334155'
        }
      });
    };

    const unsub1 = on('incident_verified', handleVerified);
    const unsub1b = on('incident_approved', handleVerified);

    const unsub2 = on('incident_status_updated', (data) => {
      setIncidents(prev => prev.map(inc =>
        inc.incident_id === data.incident_id
          ? { ...inc, status: data.status, ...(data.incident || {}) }
          : inc
      ));
    });

    const unsub3 = on('new_assignment', (data) => {
      if (data.incident_id) {
        setIncidents(prev => prev.map(inc => {
          if (inc.incident_id === data.incident_id) {
            const assignmentExists = inc.assignments?.some(a => a.assignment_id === data.assignment_id);
            if (assignmentExists) return inc;
            return {
              ...inc,
              assignments: [...(inc.assignments || []), {
                assignment_id: data.assignment_id,
                unit_id: data.unit_id,
                unit: data.unit,
                status: data.status
              }]
            };
          }
          return inc;
        }));
      }
    });

    const unsub4 = on('new_incident', (incident) => {
      setIncidents(prev => {
        if (prev.find(i => i.incident_id === incident.incident_id)) return prev;
        return [incident, ...prev];
      });
      toast('🔔 New incoming report detected!', { icon: '📡' });
    });

    return () => { unsub1(); unsub1b(); unsub2(); unsub3(); unsub4(); };
  }, [on]);

  const fetchIncidents = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await incidentAPI.getAll({ limit: 50 });
      setIncidents(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const activeIncidents = incidents.filter(i => ['REPORTED', 'VERIFIED', 'RESPONDING', 'ON_SCENE'].includes(i.status));
  const resolvedToday = incidents.filter(i => {
    if (i.status !== 'RESOLVED' && i.status !== 'CLOSED') return false;
    const today = new Date().toDateString();
    return new Date(i.updated_at || i.reported_at).toDateString() === today;
  });

  const priorityIncident = activeIncidents[0];

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleUpdateStatus = async (incidentId, status) => {
    try {
      setAcceptingId(incidentId);
      await incidentAPI.updateStatus(incidentId, { status });
      setIncidents(prev => prev.map(inc =>
        inc.incident_id === incidentId ? { ...inc, status } : inc
      ));
      toast.success(`Status updated to ${status.replace('_', ' ')}`);
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setAcceptingId(null);
    }
  };

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));
    setProofPhotos(prev => [...prev, ...newPhotos].slice(0, 5)); // max 5
  };

  const removePhoto = (idx) => {
    setProofPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleRequestBackup = async () => {
    try {
      await incidentAPI.requestBackup(priorityIncident.incident_id, backupUnitType);
      toast.success(`${backupUnitType} Backup dispatched!`);
      setShowBackupModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request backup');
    }
  };

  const handleSubmitReport = async () => {
    if (!reportData.actions_taken) return toast.error('Actions taken description is required');
    if (proofPhotos.length === 0) return toast.error('At least one proof photo is required before resolving.');

    try {
      setAcceptingId('report');
      setUploadingPhotos(true);

      // Upload photos to Cloudinary
      const uploadedUrls = [];
      for (const { file } of proofPhotos) {
        const formData = new FormData();
        formData.append('photo', file);
        const uploadRes = await api.post('/upload/incident-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data?.data?.url) uploadedUrls.push(uploadRes.data.data.url);
      }
      setUploadingPhotos(false);

      await postReportAPI.submit({
        incident_id: priorityIncident.incident_id,
        ...reportData,
        casualties: reportData.casualties ? parseInt(reportData.casualties) : 0,
        response_time_minutes: reportData.response_time_minutes ? parseInt(reportData.response_time_minutes) : null,
        photos: uploadedUrls
      });

      setIncidents(prev => prev.map(inc =>
        inc.incident_id === priorityIncident.incident_id ? { ...inc, status: 'RESOLVED' } : inc
      ));

      toast.success('Incident resolved. Reporter notified.');
      setShowReportModal(false);
      setReportData({ actions_taken: '', casualties: 0, damages_estimate: '', remarks: '', response_time_minutes: '' });
      setProofPhotos([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setAcceptingId(null);
      setUploadingPhotos(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
            <Radio size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Terminal</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
                {connected ? 'Tactical Feed Active' : 'Offline Mode'}
              </p>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex flex-col md:items-end gap-3">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Presence Status</p>
          <button
            onClick={async () => {
              const newStatus = !isAvailable;
              setIsAvailable(newStatus);
              if (user?.unit_id) {
                try {
                  await responseUnitAPI.updateStatus(user.unit_id, newStatus ? 'AVAILABLE' : 'OFFLINE');
                  toast.success(`Marked as ${newStatus ? 'AVAILABLE' : 'OFFLINE'}`);
                } catch (e) {
                  toast.error('Failed to sync status');
                  setIsAvailable(!newStatus);
                }
              }
            }}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95
              ${isAvailable
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
            {isAvailable ? 'Available for Dispatch' : 'On Standby'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* KPI & Sidebar Stats */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-800 relative overflow-hidden group"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/20 blur-3xl rounded-full" />
            <div className="relative z-10 flex justify-between items-start mb-8">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Assigned Emergencies</p>
                <div className="text-5xl font-black text-rose-500">
                  {loading ? <Skeleton width={60} /> : activeIncidents.length}
                </div>
              </div>
              <div className="p-4 bg-rose-500/10 rounded-2xl text-rose-500">
                <ShieldAlert size={28} />
              </div>
            </div>
            <Link to="/response/incidents" className="relative z-10 flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group/link">
              <span className="text-xs font-black text-white uppercase tracking-widest">Open Ops Center</span>
              <ChevronRight size={18} className="text-rose-500 group-hover/link:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5">Resolved (24h)</p>
                <div className="text-4xl font-black text-emerald-600 dark:text-emerald-500">
                  {loading ? <Skeleton width={50} /> : resolvedToday.length}
                </div>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-2xl">
                <CheckCircle2 size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/10 text-orange-600 flex items-center justify-center">
                <Activity size={20} />
              </div>
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Tactical Context</h4>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Comm Status</span>
                <span className="text-xs font-black text-emerald-500">ENCRYPTED</span>
              </div>
              <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Position Tracking</span>
                <span className="text-xs font-black text-indigo-500 uppercase">GPS-ACTIVE</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Live Feed / Active Job */}
        <div className="md:col-span-8 flex flex-col">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex-1 bg-white dark:bg-slate-900 rounded-[3rem] border-2 shadow-2xl overflow-hidden flex flex-col transition-all duration-500
               ${activeIncidents.length > 0 ? 'border-rose-500 shadow-rose-500/10' : 'border-slate-100 dark:border-slate-800 shadow-slate-200/50'}`}
          >
            <div className={`p-6 flex justify-between items-center ${activeIncidents.length > 0 ? 'bg-rose-500 text-white' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500'}`}>
              <h2 className="font-black uppercase tracking-[0.2em] text-xs flex items-center gap-3">
                {activeIncidents.length > 0 && <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 rounded-full bg-white" />}
                {activeIncidents.length > 0 ? 'Active Emergency Dispatch Feed' : 'System Standby'}
              </h2>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${activeIncidents.length > 0 ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                {activeIncidents.length > 0 ? `${activeIncidents.length} Needing Response` : 'All Clear'}
              </span>
            </div>

            <div className="p-8 flex-1 flex flex-col space-y-6 overflow-y-auto max-h-[650px]">
              {loading ? (
                <div className="space-y-4 py-4">
                  <Skeleton height={30} width="60%" />
                  <Skeleton count={3} />
                </div>
              ) : activeIncidents.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [0.8, 1, 0.8] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-8"
                  >
                    <CheckCircle2 size={48} className="text-emerald-500" />
                  </motion.div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Operations Clear</h3>
                  <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto">Maintain grid status. Next tactical update will trigger an immediate alert.</p>
                </div>
              ) : (
                activeIncidents.map((incident, idx) => {
                  const isPrimary = idx === 0;
                  return (
                    <motion.div 
                      key={incident.incident_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-6 rounded-3xl border-2 transition-all ${
                        isPrimary ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 shadow-md' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                              {incident.incident_type?.name || 'Emergency'}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500 text-xs font-black font-mono tracking-tighter">
                              #{incident.incident_code}
                            </span>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                              incident.status === 'RESPONDING' ? 'bg-blue-500 text-white' : incident.status === 'ON_SCENE' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                            }`}>
                              {incident.status}
                            </span>
                          </div>
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                            {incident.incident_type?.name || 'Emergency Incident'}
                          </h3>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Time</p>
                          <div className="text-sm font-black text-slate-800 dark:text-white flex items-center justify-end gap-1.5">
                            <Clock size={14} className="text-rose-500" />
                            {getTimeAgo(incident.reported_at)}
                          </div>
                        </div>
                      </div>

                      {incident.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-4 italic line-clamp-2">
                          "{incident.description}"
                        </p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 text-xs">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                          <MapPin size={16} className="text-rose-500 shrink-0" />
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {incident.map_pin_address || incident.barangay?.barangay_name || 'Location pending'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                          <User size={16} className="text-emerald-500 shrink-0" />
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {incident.reporter?.name || incident.reporter_name || 'Citizen Report'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons for Incident */}
                      <div className="flex flex-wrap items-center gap-3">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${incident.latitude},${incident.longitude}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-95"
                        >
                          <Navigation2 size={16} /> GPS HUD
                        </a>

                        {(incident.status === 'VERIFIED' || incident.status === 'REPORTED') && (
                          <button
                            onClick={() => handleUpdateStatus(incident.incident_id, 'RESPONDING')}
                            disabled={acceptingId === incident.incident_id}
                            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                          >
                            {acceptingId === incident.incident_id ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                            Respond Now
                          </button>
                        )}

                        {incident.status === 'RESPONDING' && (
                          <button
                            onClick={() => handleUpdateStatus(incident.incident_id, 'ON_SCENE')}
                            disabled={acceptingId === incident.incident_id}
                            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                          >
                            {acceptingId === incident.incident_id ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                            Confirm Arrival
                          </button>
                        )}

                        {incident.status === 'ON_SCENE' && (
                          <button
                            onClick={() => { setSelectedIncidentForAction(incident); setShowReportModal(true); }}
                            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md shadow-emerald-500/30"
                          >
                            <CheckCircle2 size={16} /> Resolve Incident
                          </button>
                        )}

                        <button
                          onClick={() => { setSelectedIncidentForAction(incident); setShowBackupModal(true); }}
                          className="px-4 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest"
                        >
                          + Backup
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Navigation Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: 'Operations Feed', sub: 'Historical data & logs', link: '/response/incidents', icon: LayoutDashboard, color: 'emerald' },
          { title: 'Geospatial HUD', sub: 'Live position tracking', link: '/response/map', icon: MapPin, color: 'blue' }
        ].map((item, idx) => (
          <Link key={idx} to={item.link} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none flex items-center justify-between hover:border-indigo-500 transition-all group">
            <div className="flex items-center gap-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shadow-inner
                  ${item.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600'}`}>
                <item.icon size={28} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.title}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{item.sub}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>

      {/* Backup Modal */}
      <AnimatePresence>
        {showBackupModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
              onClick={() => setShowBackupModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
            >
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 leading-none uppercase tracking-tighter">Request Backup</h3>
              <p className="text-sm font-medium text-slate-400 mb-8 border-l-2 border-orange-500 pl-4 uppercase tracking-[0.1em] text-[10px]">Select tactical unit reinforcement</p>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {['FIRE', 'POLICE', 'DRRMO'].map(type => (
                  <button
                    key={type}
                    onClick={() => setBackupUnitType(type)}
                    className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all
                      ${backupUnitType === type
                        ? 'border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                        : 'border-slate-100 dark:border-slate-800 text-slate-400 bg-slate-50 dark:bg-slate-800/50 hover:border-orange-200'
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <button
                onClick={handleRequestBackup}
                className="w-full py-4 font-black uppercase tracking-widest text-xs text-white bg-orange-600 hover:bg-orange-700 rounded-2xl shadow-xl shadow-orange-500/30 transition-all active:scale-95"
              >
                Dispatch Units
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Post-Incident Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-[2000] flex items-start justify-center p-6 overflow-y-auto pt-16">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-lg"
              onClick={() => setShowReportModal(false)}
            />
            <motion.div
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl p-12 my-auto"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none mb-2">Final Report</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tactical resolution & log</p>
                </div>
                <button onClick={() => setShowReportModal(false)} className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400"><X size={24} /></button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 pl-4">Actions Performed</label>
                  <textarea
                    value={reportData.actions_taken}
                    onChange={e => setReportData({ ...reportData, actions_taken: e.target.value })}
                    placeholder="Provide details on treatment, containment, etc..."
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[2rem] p-6 text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none resize-none"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 pl-4">Casualties</label>
                    <input
                      type="number"
                      value={reportData.casualties}
                      onChange={e => setReportData({ ...reportData, casualties: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 pl-4">Response Min.</label>
                    <input
                      type="number"
                      value={reportData.response_time_minutes}
                      onChange={e => setReportData({ ...reportData, response_time_minutes: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 pl-4">Final Remarks</label>
                  <input
                    type="text"
                    value={reportData.remarks}
                    onChange={e => setReportData({ ...reportData, remarks: e.target.value })}
                    placeholder="Site cleared, handing over to..."
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-medium"
                  />
                </div>

                {/* Proof Photo Upload */}
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-3 pl-4 pr-2">
                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <Camera size={14} /> Proof Photo <span className="text-rose-400">(required)</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-black">{proofPhotos.length}/5</span>
                  </div>

                  {proofPhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {proofPhotos.map((p, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-emerald-400/30 bg-slate-100 shadow-md">
                          <img src={p.previewUrl} alt="proof" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={() => removePhoto(idx)}
                              className="bg-rose-500 text-white rounded-full p-1.5 hover:scale-110 transition-transform"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {proofPhotos.length < 5 && (
                    <label className="flex flex-col items-center justify-center gap-3 w-full py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] cursor-pointer hover:border-rose-400 hover:bg-rose-50/30 dark:hover:bg-rose-500/5 transition-all group">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                        <ImageIcon size={24} />
                      </div>
                      <div className="text-center">
                        <span className="block text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Attach Proof Photo</span>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Upload scene resolution</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handlePhotoSelect}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="mt-12">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSubmitReport}
                  disabled={acceptingId === 'report' || !reportData.actions_taken || proofPhotos.length === 0 || uploadingPhotos}
                  className="w-full flex items-center justify-center gap-3 py-5 font-black uppercase tracking-widest text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-[2rem] shadow-2xl shadow-emerald-500/30 disabled:opacity-40 transition-all"
                >
                  {(acceptingId === 'report' || uploadingPhotos) ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                  {uploadingPhotos ? 'Uploading Photos...' : 'Archive & Resolve Incident'}
                </motion.button>
                {proofPhotos.length === 0 && (
                  <p className="text-center text-xs text-rose-500 font-bold mt-3 animate-pulse">⚠ Add 1 proof photo to resolve</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
