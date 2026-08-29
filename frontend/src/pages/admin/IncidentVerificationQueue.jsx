import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api';
import { useSocketContext } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, AlertTriangle, MessageSquare, MapPin,
  Clock, User, FileText, Loader2, X, Send, Flame, Stethoscope, Car, ShieldAlert, Filter,
  ExternalLink, ChevronRight, Download, ChevronDown
} from 'lucide-react';
import { reportAPI } from '../../api';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import IncidentSearch from '../../components/incidents/IncidentSearch';
import { IncidentListSkeleton, IncidentDetailSkeleton } from '../../components/incidents/IncidentSkeletons';

const INCIDENT_TYPE_ICONS = {
  FIRE: Flame, MEDICAL_EMERGENCY: Stethoscope, ACCIDENT: Car,
  'CRIME-RELATED': ShieldAlert, OTHER: FileText
};

const STATUS_TABS = [
  { key: 'ALL', label: 'All Reports' },
  { key: 'RESPONDING', label: 'Responding' },
  { key: 'ON_SCENE', label: 'On Scene' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'FALSE_ALARM', label: 'False Alarm' },
];

const STATUS_COLORS = {
  REPORTED: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  VERIFIED: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
  DISPATCHED: 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
  RESPONDING: 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
  RESOLVED: 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20',
  CLOSED: 'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-500/20',
  FALSE_ALARM: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20',
};

// Map flyTo helper
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

export default function IncidentVerificationQueue() {
  const { on, connected } = useSocketContext();
  const [activeTab, setActiveTab] = useState('ALL');
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionModal, setActionModal] = useState({ open: false, action: null, message: '' });
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [fullscreenPhoto, setFullscreenPhoto] = useState(null);
  const [searchFilters, setSearchFilters] = useState({});
  const [responseUnits, setResponseUnits] = useState([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Track new incident IDs for pulse effect
  const [newIncidentIds, setNewIncidentIds] = useState(new Set());

  const fetchIncidents = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const params = { limit: 200, ...filters };
      const [incRes, typesRes] = await Promise.all([
        api.get('/incidents', { params }),
        api.get('/incident-types')
      ]);
      setIncidents(incRes.data.data || []);
      setIncidentTypes(typesRes.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      toast.error('Failed to load incidents');
    } finally {
      setTimeout(() => setLoading(false), 500); // Add slight delay for smoother transition
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
    const fetchUnits = async () => {
      try {
        const res = await api.get('/response-units');
        setResponseUnits(res.data?.data || res.data || []);
      } catch (err) { console.error('Failed to fetch units:', err); }
    };
    fetchUnits();

    // Fast 5-second background auto-sync to ensure queue updates without manual refresh
    const autoSyncInterval = setInterval(() => fetchIncidents(searchFilters), 5000);
    return () => clearInterval(autoSyncInterval);
  }, [fetchIncidents, searchFilters]);

  const handleFiltersChange = useCallback((filters) => {
    setSearchFilters(filters);
    fetchIncidents(filters);
  }, [fetchIncidents]);

  useEffect(() => {
    const unsub1 = on('incident_awaiting_verification', (data) => {
      const inc = data.incident || data;
      setIncidents(prev => {
        if (prev.find(i => i.incident_id === inc.incident_id)) return prev;
        return [inc, ...prev];
      });
      // Add to new incident pulse set
      setNewIncidentIds(prev => new Set(prev).add(inc.incident_id));
      // Remove pulse after 10 seconds
      setTimeout(() => {
        setNewIncidentIds(prev => {
          const next = new Set(prev);
          next.delete(inc.incident_id);
          return next;
        });
      }, 10000);
    });
    const unsub2 = on('incident_verified', (data) => {
      setIncidents(prev => prev.map(i => i.incident_id === (data.incident?.incident_id || data.incident_id) ? { ...i, status: 'RESPONDING', assignments: data.assignments } : i));
      setSelectedIncident(prev => prev?.incident_id === (data.incident?.incident_id || data.incident_id) ? { ...prev, status: 'RESPONDING', assignments: data.assignments } : prev);
    });
    const unsub3 = on('incident_rejected', (data) => {
      setIncidents(prev => prev.map(i => i.incident_id === data.incident_id ? { ...i, status: 'FALSE_ALARM' } : i));
      setSelectedIncident(prev => prev?.incident_id === data.incident_id ? null : prev);
    });
    const unsub4 = on('incident_status_updated', (data) => {
      setIncidents(prev => prev.map(i => i.incident_id === data.incident_id ? { ...i, status: data.status, ...(data.incident || {}) } : i));
    });
    return () => { unsub1?.(); unsub2?.(); unsub3?.(); unsub4?.(); };
  }, [on]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('.relative')) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportDropdown]);

  const handleExport = async (format = 'xlsx') => {
    try {
      setExporting(true);
      const response = await reportAPI.export(format, {
        status: activeTab === 'ALL' ? undefined : activeTab,
        ...searchFilters
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Incidents_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${format.toUpperCase()} export complete`);
    } catch (error) {
      console.error('Export failed', error);
      toast.error(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setExporting(false);
      setShowExportDropdown(false);
    }
  };

  const filteredIncidents = activeTab === 'ALL' ? incidents : incidents.filter(i => i.status === activeTab);

  const handleSelectIncident = async (incident) => {
    setSelectedIncident(incident);
    setLoadingDetails(true);
    setSelectedUnitIds([]);

    try {
      const res = await api.get(`/incidents/${incident.incident_id}`);
      if (res.data?.data || res.data) {
        const fullData = res.data?.data || res.data;
        setSelectedIncident(prev => ({
          ...prev,
          ...fullData,
          evidence: fullData.evidence || [],
          reporter: fullData.reporter || incident.reporter
        }));
      }
    } catch (err) {
      console.error('Failed to fetch incident details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedIncident) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/incidents/${selectedIncident.incident_id}/verify`, {
        action: 'APPROVE',
        manual_unit_ids: selectedUnitIds.length > 0 ? selectedUnitIds : undefined
      });
      const updatedIncident = res.data?.incident || { ...selectedIncident, status: 'RESPONDING' };
      const newAssignments = res.data?.assignments || [];

      toast.success('Incident verified and dispatched successfully');
      setIncidents(prev => prev.map(i => i.incident_id === selectedIncident.incident_id ? { ...i, ...updatedIncident, assignments: newAssignments } : i));
      setSelectedIncident(prev => ({ ...prev, ...updatedIncident, assignments: newAssignments }));
      setActionModal({ open: false, action: null, message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve incident');
    } finally { setSubmitting(false); }
  };

  const handleReject = async () => {
    if (!selectedIncident) return;
    setSubmitting(true);
    try {
      await api.post(`/incidents/${selectedIncident.incident_id}/verify`, { action: 'REJECT', message: 'Marked as False Alarm' });
      toast.success('Incident marked as False Alarm');
      setIncidents(prev => prev.map(i => i.incident_id === selectedIncident.incident_id ? { ...i, status: 'FALSE_ALARM' } : i));
      setSelectedIncident(null);
    } catch (err) {
      toast.error('Failed to reject incident');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!selectedIncident) return;
    setSubmitting(true);
    try {
      await api.post(`/incidents/${selectedIncident.incident_id}/verify`, { action: 'REQUEST_INFO', message: actionModal.message });
      toast.success('Request for more info sent to reporter');
      setActionModal({ open: false, action: null, message: '' });
    } catch (err) { toast.error('Failed to send request'); }
    finally { setSubmitting(false); }
  };

  const getTypeIcon = (type_id) => {
    const type = incidentTypes.find(t => t.type_id === type_id);
    if (!type) return FileText;
    const iconName = type.name.toUpperCase();
    for (const [key, Icon] of Object.entries(INCIDENT_TYPE_ICONS)) {
      if (iconName.includes(key)) return Icon;
    }
    return FileText;
  };

  const getTypeColor = (type_id) => {
    const type = incidentTypes.find(t => t.type_id === type_id);
    if (!type) return '#6B7280';
    const name = type.name.toUpperCase();
    if (name.includes('FIRE')) return '#F97316';
    if (name.includes('MEDICAL') || name.includes('ACCIDENT')) return '#EF4444';
    if (name.includes('CRIME')) return '#8B5CF6';
    if (name.includes('INFRASTRUCTURE')) return '#F59E0B';
    if (name.includes('DISTURBANCE')) return '#3B82F6';
    return '#6B7280';
  };

  const getSeverityColor = (severity) => {
    const map = { LOW: 'bg-green-100 text-green-700 border-green-200', HIGH: 'bg-orange-100 text-orange-700 border-orange-200', CRITICAL: 'bg-red-100 text-red-700 border-red-200' };
    return map[severity] || 'bg-gray-100 text-gray-700';
  };

  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getStatusBadge = (status) => STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';

  const canVerify = selectedIncident?.status === 'REPORTED';

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Incident Queue</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Verify incoming reports and dispatch units in real-time.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-white/5 px-4 py-1.5 rounded-full border border-slate-100 dark:border-white/5">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={exporting || incidents.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 font-bold text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Export Data
              <ChevronDown size={14} className={`transition-transform duration-300 ${showExportDropdown ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showExportDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 py-2 z-[2000] overflow-hidden"
                >
                  <button
                    onClick={() => handleExport('xlsx')}
                    className="w-full text-left px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-3 transition-colors"
                  >
                    <Download size={14} className="text-emerald-500" />
                    Excel Format
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full text-left px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-400 flex items-center gap-3 transition-colors"
                  >
                    <FileText size={14} className="text-rose-500" />
                    PDF Document
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Search & Tabs */}
      <div className="space-y-3">
        {/* Row 1: Search bar with ALL REPORTS embedded before severity */}
        <IncidentSearch
          onFiltersChange={handleFiltersChange}
          incidentTypes={incidentTypes}
          responseUnits={responseUnits}
          showStatusFilter={false}
          compact
          leadingActions={(() => {
            const tab = STATUS_TABS[0];
            const count = incidents.length;
            const isActive = activeTab === tab.key;
            return (
              <motion.button
                key={tab.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-none px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap
                  ${isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-800'
                  }`}
              >
                {tab.label} <span className={`ml-1.5 opacity-60 ${isActive ? 'text-white' : ''}`}>[{count}]</span>
              </motion.button>
            );
          })()}
        />

        {/* Row 2: Remaining status tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {STATUS_TABS.slice(1).map((tab, idx) => {
            const count = incidents.filter(i => i.status === tab.key).length;
            const isActive = activeTab === tab.key;
            return (
              <motion.button
                key={tab.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-none px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all
                  ${isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800'
                  }`}
              >
                {tab.label} <span className={`ml-1.5 opacity-60 ${isActive ? 'text-white' : ''}`}>[{count}]</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Incidents List */}
        <div className="xl:col-span-7 space-y-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {[1, 2, 3].map(n => (
                  <div key={n} className="p-6 bg-slate-100 dark:bg-slate-800/60 rounded-3xl animate-pulse flex items-center gap-5 border border-slate-200/50 dark:border-slate-800">
                    <div className="w-14 h-14 rounded-2xl bg-slate-300 dark:bg-slate-700 shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded-lg w-1/3" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700/60 rounded-lg w-3/4" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700/40 rounded-lg w-1/2" />
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : filteredIncidents.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Filter className="text-slate-300 dark:text-slate-600" size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">No active reports found</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Try adjusting your filters or status tabs.</p>
              </motion.div>
            ) : (
              filteredIncidents.map((incident) => {
                const isSelected = selectedIncident?.incident_id === incident.incident_id;
                const isNew = newIncidentIds.has(incident.incident_id);
                return (
                  <motion.div
                    layout
                    key={incident.incident_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleSelectIncident(incident)}
                    className={`group p-5 rounded-3xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden
                      ${isSelected
                        ? 'bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-500 shadow-xl shadow-indigo-500/10'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:shadow-md'
                      } ${isNew ? 'pulse-primary ring-2 ring-orange-500 dark:ring-orange-600 border-transparent' : ''}`}
                  >
                    {isNew && (
                      <div className="absolute top-0 right-0 px-3 py-1 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-xl shadow-sm">
                        New Alert
                      </div>
                    )}
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg" style={{ backgroundColor: getTypeColor(incident.incident_type_id) }}>
                        {React.createElement(getTypeIcon(incident.incident_type_id), { size: 28 })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h3 className="font-black text-slate-900 dark:text-white truncate">#{incident.incident_code}</h3>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-transparent ${getStatusBadge(incident.status)}`}>
                              {incident.status.replace('_', ' ')}
                            </span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getSeverityColor(incident.severity)} shadow-sm`}>
                            {incident.severity}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                          {incident.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><Clock size={14} className="text-indigo-400" /> {getTimeAgo(incident.reported_at)}</span>
                          <span className="flex items-center gap-1.5"><User size={14} className="text-emerald-400" /> {incident.reporter?.name || incident.reporter_name || 'Local Resident'}</span>
                          <span className="flex items-center gap-1.5"><MapPin size={14} className="text-rose-400" /> {incident.landmark ? `${incident.barangay?.name || 'Area'} (${incident.landmark})` : (incident.barangay?.name || 'Area Known')}</span>
                        </div>
                      </div>
                      <div className={`self-center ${isSelected ? 'text-indigo-500' : 'text-slate-300'} transition-all group-hover:translate-x-1`}>
                        <ChevronRight size={24} />
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Details Panel */}
        <div className="xl:col-span-5 sticky top-28">
          <AnimatePresence mode="wait">
            {!selectedIncident ? (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center"
              >
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-600">
                  <ShieldAlert size={32} />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">Select an incident to view full intelligence data</p>
              </motion.div>
            ) : loadingDetails ? (
              <motion.div key="details-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <IncidentDetailSkeleton />
              </motion.div>
            ) : (
              <motion.div
                key={selectedIncident.incident_id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-indigo-500/10 overflow-hidden flex flex-col"
              >
                {/* Panel Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight">#{selectedIncident.incident_code}</h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Incident Investigation</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedIncident(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all"><X size={20} /></button>
                </div>

                {/* Panel Body */}
                <div className="p-8 space-y-8 max-h-[calc(100vh-28rem)] overflow-y-auto hide-scrollbar">
                  {/* Top Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Incident Type</p>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200">{incidentTypes.find(t => t.type_id === selectedIncident.incident_type_id)?.name}</p>
                    </div>
                    <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Severity Level</p>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{selectedIncident.severity}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <FileText size={14} className="text-indigo-400" /> Intelligence Brief
                      </p>
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed bg-indigo-50/20 dark:bg-indigo-500/5 border border-indigo-100/50 dark:border-indigo-500/10 p-5 rounded-3xl italic">
                      "{selectedIncident.description}"
                    </p>
                  </div>

                  {/* Maps & Evidence Grid */}
                  <div className="space-y-6">
                    {/* Map */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <MapPin size={14} className="text-rose-400" /> Precise Location
                      </p>
                      <div className="relative group overflow-hidden rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 h-48 shadow-lg">
                        {selectedIncident.latitude && (
                          <MapContainer center={[selectedIncident.latitude, selectedIncident.longitude]} zoom={16} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}" />
                            <Marker
                              position={[selectedIncident.latitude, selectedIncident.longitude]}
                              icon={L.divIcon({
                                className: 'custom-pulse-marker',
                                html: `<div class="pulse-ring" style="border-color: ${getTypeColor(selectedIncident.incident_type_id)}"></div><div class="pulse-dot" style="background-color: ${getTypeColor(selectedIncident.incident_type_id)}"></div>`,
                                iconSize: [20, 20],
                                iconAnchor: [10, 10]
                              })}
                            />
                            <ChangeView center={[selectedIncident.latitude, selectedIncident.longitude]} zoom={16} />
                          </MapContainer>
                        )}
                        <div className="absolute bottom-4 left-4 z-[1000] right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl">
                          <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{selectedIncident.map_pin_address}</p>
                          {selectedIncident.landmark && (
                            <p className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 line-clamp-1 mt-0.5">Landmark: {selectedIncident.landmark}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Evidence Photos */}
                    {selectedIncident.evidence?.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <ExternalLink size={14} className="text-emerald-400" /> Photographic Evidence
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {selectedIncident.evidence.map((photo, idx) => (
                            <motion.div
                              key={idx}
                              whileHover={{ scale: 1.02 }}
                              onClick={() => setFullscreenPhoto(photo.file_path)}
                              className="aspect-[4/3] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer shadow-sm group"
                            >
                              <img src={photo.file_path} alt="Evidence" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Assignment Controls if canVerify */}
                  {canVerify && (
                    <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manual Dispatch override</p>
                        <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">Optional</span>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {responseUnits.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-4 text-center">Scanning for available units...</p>
                        ) : (
                          responseUnits.map(unit => {
                            const isSelected = selectedUnitIds.includes(unit.unit_id);
                            return (
                              <label key={unit.unit_id} className={`flex items-center gap-4 p-4 rounded-3xl border-2 transition-all cursor-pointer group
                                  ${isSelected
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}>
                                <input type="checkbox" checked={isSelected} className="hidden"
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedUnitIds([...selectedUnitIds, unit.unit_id]);
                                    else setSelectedUnitIds(selectedUnitIds.filter(id => id !== unit.unit_id));
                                  }}
                                />
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors
                                    ${isSelected ? 'bg-white/20' : 'bg-white dark:bg-slate-700 text-slate-600'}`}>
                                  <Car size={18} />
                                </div>
                                <div className="flex-1">
                                  <p className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{unit.unit_name}</p>
                                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>{unit.unit_type} • {unit.availability_status}</p>
                                </div>
                                {isSelected && <CheckCircle size={18} />}
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Assigned Units List (For already verified) */}
                  {selectedIncident.assignments?.length > 0 && (
                    <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Dispatches</p>
                      <div className="space-y-2">
                        {selectedIncident.assignments.map((asgn, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-3xl">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                              <Car size={18} />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{asgn.unit?.unit_name}</p>
                              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none mt-1">{asgn.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Foot Action Area */}
                <div className="p-8 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                  {canVerify ? (
                    <div className="grid grid-cols-2 gap-4">
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleApprove} disabled={submitting}
                        className="col-span-2 py-4 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-black uppercase tracking-widest text-xs rounded-3xl shadow-xl shadow-indigo-500/30 disabled:opacity-50 flex items-center justify-center gap-3">
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />} Verify & Initiate Response
                      </motion.button>
                      <button
                        onClick={handleReject}
                        disabled={submitting}
                        className="col-span-2 py-3 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-red-600 font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                        Mark as False Alarm
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-2 px-4 rounded-2xl bg-slate-200 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Response Strategy Finalized
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Fullscreen Photo Modal via Portal */}
      {fullscreenPhoto && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setFullscreenPhoto(null)}
          className="fixed inset-0 bg-slate-950/98 backdrop-blur-md flex items-center justify-center z-[9999] p-4 sm:p-8"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative max-w-5xl w-full h-full flex items-center justify-center"
          >
            <img 
              src={fullscreenPhoto} 
              alt="Evidence Full" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-500 scale-in-95" 
              onClick={(e) => e.stopPropagation()} 
            />
            <button 
              onClick={() => setFullscreenPhoto(null)} 
              className="absolute top-0 right-0 sm:-top-12 sm:right-0 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition-all active:scale-90 border border-white/20"
              title="Close Preview"
            >
              <X size={28} />
            </button>
          </motion.div>
        </motion.div>,
        document.body
      )}

      {/* Verification Modals Wrapper */}
      <AnimatePresence>
        {actionModal.open && (
          <div className="fixed inset-0 z-[1500] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setActionModal({ open: false, action: null, message: '' })}
            />
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-blue-50 dark:bg-blue-500/10 text-blue-600">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-xl font-black tracking-tight mb-2">Intelligence Request</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6 leading-relaxed">
                Request additional tactical data from the reporter to clarify the situation.
              </p>
              <textarea
                autoFocus
                value={actionModal.message}
                onChange={(e) => setActionModal({ ...actionModal, message: e.target.value })}
                placeholder="Describe what additional info is needed..."
                rows="4"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 mb-6 transition-all resize-none outline-none"
              />
              <div className="flex gap-3">
                <button onClick={() => setActionModal({ open: false, action: null, message: '' })} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs rounded-2xl">Cancel</button>
                <button onClick={handleRequestInfo} disabled={submitting}
                  className="flex-1 py-4 font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 bg-indigo-600 text-white shadow-indigo-500/20">
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  Send Request
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
