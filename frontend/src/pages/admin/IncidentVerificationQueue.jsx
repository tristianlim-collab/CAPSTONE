import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api';
import { useSocketContext } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, AlertTriangle, MessageSquare, MapPin,
  Clock, User, FileText, Loader2, X, Send, Flame, Stethoscope, Car, ShieldAlert, Filter,
  ExternalLink, ChevronRight, Download, ChevronDown, Phone, Navigation, PlusCircle, CheckCheck, Check, ShieldCheck
} from 'lucide-react';
import { reportAPI, assignmentAPI } from '../../api';
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
  { key: 'REPORTED', label: 'Pending Queue' },
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
  const [activeTab, setActiveTab] = useState('REPORTED'); // Default to Pending Queue
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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Revision 2 & 3: Verification & Dispatch Modal States
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifyDestination, setVerifyDestination] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [extraUnitId, setExtraUnitId] = useState('');

  // Track new incident IDs for pulse effect
  const [newIncidentIds, setNewIncidentIds] = useState(new Set());

  const fetchIncidents = useCallback(async (filters = {}, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params = { limit: 500, ...filters };
      const [incRes, typesRes] = await Promise.all([
        api.get('/incidents', { params }),
        api.get('/incident-types')
      ]);
      setIncidents(incRes.data.data || []);
      setIncidentTypes(typesRes.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      if (!silent) toast.error('Failed to load incidents');
    } finally {
      if (!silent) setLoading(false);
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

    // Silent background auto-sync every 30 seconds (real-time updates are handled instantly via WebSockets)
    const autoSyncInterval = setInterval(() => fetchIncidents(searchFilters, true), 30000);
    return () => clearInterval(autoSyncInterval);
  }, [fetchIncidents, searchFilters]);

  const handleFiltersChange = useCallback((filters) => {
    setSearchFilters(filters);
    fetchIncidents(filters);
  }, [fetchIncidents]);

  useEffect(() => {
    const handleIncomingReport = (data) => {
      const inc = data.incident || data;
      if (!inc || !inc.incident_id) return;
      setIncidents(prev => {
        if (prev.find(i => i.incident_id === inc.incident_id)) return prev;
        return [inc, ...prev];
      });
      setNewIncidentIds(prev => new Set(prev).add(inc.incident_id));
      setTimeout(() => {
        setNewIncidentIds(prev => {
          const next = new Set(prev);
          next.delete(inc.incident_id);
          return next;
        });
      }, 10000);
      toast('🚨 New Incident Report Received!', {
        icon: '⚠️',
        style: { borderRadius: '12px', background: '#0F172A', color: '#fff' }
      });
    };

    const unsub0 = on('new_incident', handleIncomingReport);
    const unsub1 = on('incident_awaiting_verification', handleIncomingReport);
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
    return () => { unsub0?.(); unsub1?.(); unsub2?.(); unsub3?.(); unsub4?.(); };
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

      // 1. Trigger export download
      const response = await reportAPI.export(format, {
        status: activeTab === 'ALL' ? undefined : activeTab,
        ...searchFilters
      });

      // Handle JSON error response returned inside blob
      if (response.data?.type === 'application/json') {
        const text = await response.data.text();
        const errObj = JSON.parse(text);
        throw new Error(errObj.message || 'Export failed');
      }

      // 2. Automatically log to GENERATED_REPORTS database table
      try {
        await reportAPI.generate({
          report_type: 'INCIDENT_SUMMARY',
          file_format: format === 'pdf' ? 'PDF' : 'EXCEL',
          report_title: `Incident Queue Export (${activeTab})`,
          filters_applied: JSON.stringify({ status: activeTab, ...searchFilters })
        });
      } catch (logErr) {
        console.warn('Could not save to GENERATED_REPORTS history:', logErr);
      }

      const mimeType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const url = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `GAOIRS_Incidents_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${format.toUpperCase()} export downloaded successfully`);
    } catch (error) {
      console.error('Export failed', error);
      toast.error(error.message || `Failed to export ${format.toUpperCase()}`);
    } finally {
      setExporting(false);
      setShowExportDropdown(false);
    }
  };

  const filteredIncidents = activeTab === 'ALL' ? incidents : incidents.filter(i => i.status === activeTab);
  const totalPages = Math.ceil(filteredIncidents.length / ITEMS_PER_PAGE) || 1;
  const paginatedIncidents = filteredIncidents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setCurrentPage(1);
  };

  const handleFiltersChangeWithReset = (filters) => {
    setCurrentPage(1);
    handleFiltersChange(filters);
  };

  const handleSelectIncident = async (incident) => {
    setSelectedIncident(incident);
    setLoadingDetails(true);
    setVerifyNotes('');
    setVerifyDestination(incident.map_pin_address || incident.landmark || 'Incident Location');

    // Pre-select matching unit immediately for fast dispatch
    try {
      const defaultType = Array.isArray(incidentTypes)
        ? incidentTypes.find(t => t.type_id === incident.incident_type_id)?.default_unit_type
        : null;
      const matchingUnit = (Array.isArray(responseUnits) && defaultType)
        ? responseUnits.find(u => u.unit_type === defaultType && u.availability_status === 'AVAILABLE')
        : (Array.isArray(responseUnits) ? responseUnits.find(u => u.availability_status === 'AVAILABLE') : null);
      setSelectedUnitIds(matchingUnit ? [matchingUnit.unit_id] : []);
    } catch {
      setSelectedUnitIds([]);
    }

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

  const handleOpenVerifyModal = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedIncident) return;
    setVerifyDestination(selectedIncident.map_pin_address || selectedIncident.landmark || 'Incident Location');
    try {
      if (selectedUnitIds.length === 0) {
        const defaultType = Array.isArray(incidentTypes)
          ? incidentTypes.find(t => t.type_id === selectedIncident.incident_type_id)?.default_unit_type
          : null;
        const matchingUnit = (Array.isArray(responseUnits) && defaultType)
          ? responseUnits.find(u => u.unit_type === defaultType && u.availability_status === 'AVAILABLE')
          : (Array.isArray(responseUnits) ? responseUnits.find(u => u.availability_status === 'AVAILABLE') : null);
        if (matchingUnit) setSelectedUnitIds([matchingUnit.unit_id]);
      }
    } catch {
      // safe fallback
    }
    setVerifyModalOpen(true);
  };

  const handleConfirmVerifyAndDispatch = async () => {
    if (!selectedIncident) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/incidents/${selectedIncident.incident_id}/verify`, {
        action: 'APPROVE',
        message: verifyNotes?.trim() || 'Verified and responder assigned by dispatcher',
        manual_unit_ids: selectedUnitIds.length > 0 ? selectedUnitIds : undefined
      });
      const updatedIncident = res.data?.incident || { ...selectedIncident, status: 'RESPONDING' };
      const newAssignments = res.data?.assignments || [];

      toast.success('Incident verified & responder dispatched successfully!');
      setIncidents(prev => prev.map(i => i.incident_id === selectedIncident.incident_id ? { ...i, ...updatedIncident, assignments: newAssignments } : i));
      setSelectedIncident(prev => ({ ...prev, ...updatedIncident, assignments: newAssignments }));
      setVerifyModalOpen(false);
      setVerifyNotes('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve incident');
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleUpdateDispatchStatus = async (assignmentId, newStatus) => {
    try {
      const res = await assignmentAPI.updateStatus(assignmentId, { status: newStatus });
      const updatedAsgn = res.data;
      toast.success(`Dispatch status updated to ${newStatus.replace('_', ' ')}`);
      setSelectedIncident(prev => {
        if (!prev) return prev;
        const updatedAssignments = (prev.assignments || []).map(a => 
          a.assignment_id === assignmentId ? { ...a, ...updatedAsgn, status: newStatus, dispatch_status: newStatus } : a
        );
        return { ...prev, assignments: updatedAssignments };
      });
      fetchIncidents(searchFilters, true);
    } catch (err) {
      toast.error('Failed to update dispatch status');
    }
  };

  const handleAssignAdditionalUnit = async () => {
    if (!selectedIncident || !extraUnitId) return;
    setSubmitting(true);
    try {
      const res = await assignmentAPI.assignUnit({
        incident_id: selectedIncident.incident_id,
        unit_id: extraUnitId
      });
      toast.success('Additional responder deployed!');
      const newAsgn = res.data;
      setSelectedIncident(prev => ({
        ...prev,
        assignments: [...(prev.assignments || []), newAsgn]
      }));
      setAssignModalOpen(false);
      setExtraUnitId('');
      fetchIncidents(searchFilters, true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch additional responder');
    } finally {
      setSubmitting(false);
    }
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

  const handleMergeDuplicates = async () => {
    if (!selectedIncident || !selectedIncident.same_report_tag?.related_incidents) return;
    setSubmitting(true);
    try {
      const duplicateIds = selectedIncident.same_report_tag.related_incidents.map(r => r.incident_id);
      await api.post('/incidents/merge', {
        primary_incident_id: selectedIncident.incident_id,
        duplicate_incident_ids: duplicateIds
      });
      toast.success('Duplicate reports merged successfully');
      fetchIncidents(searchFilters);
      setSelectedIncident(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to merge duplicate incidents');
    } finally {
      setSubmitting(false);
    }
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
              Export
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

      {/* Revision 1: Dedicated Queue for Pending Reports Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border-2 border-amber-300 dark:border-amber-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-500/30 shrink-0">
            {incidents.filter(i => i.status === 'REPORTED').length}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Emergency Pending Reports Queue</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-sm">
                Priority Triage
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
              {incidents.filter(i => i.status === 'REPORTED').length === 0
                ? "Pending Queue is clear — all incoming reports have been verified & deployed."
                : `${incidents.filter(i => i.status === 'REPORTED').length} incoming report${incidents.filter(i => i.status === 'REPORTED').length > 1 ? 's' : ''} awaiting dispatcher verification, validation, & responder assignment.`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => handleTabChange('REPORTED')}
            className={`w-full md:w-auto px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'REPORTED'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25 ring-2 ring-amber-400'
                : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 hover:bg-amber-50'
            }`}
          >
            <Clock size={16} /> Pending Queue [{incidents.filter(i => i.status === 'REPORTED').length}]
          </button>
          <button
            onClick={() => handleTabChange('ALL')}
            className={`w-full md:w-auto px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'ALL'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            All Reports [{incidents.length}]
          </button>
        </div>
      </motion.div>

      {/* Search & Tabs */}
      <div className="space-y-3">
        {/* Row 1: Search bar */}
        <IncidentSearch
          onFiltersChange={handleFiltersChange}
          incidentTypes={incidentTypes}
          responseUnits={responseUnits}
          showStatusFilter={false}
          compact
        />

        {/* Row 2: Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {STATUS_TABS.map((tab, idx) => {
            const count = tab.key === 'ALL' ? incidents.length : incidents.filter(i => i.status === tab.key).length;
            const isActive = activeTab === tab.key;
            return (
              <motion.button
                key={tab.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleTabChange(tab.key)}
                className={`flex-none px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2
                  ${isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800'
                  }`}
              >
                {tab.key === 'REPORTED' && <Clock size={14} className={isActive ? 'text-white' : 'text-amber-500'} />}
                {tab.label} <span className={`ml-1 text-[11px] font-bold ${isActive ? 'text-white opacity-80' : 'text-slate-400'}`}>[{count}]</span>
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
              <>
                {paginatedIncidents.map((incident) => {
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
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-black text-slate-900 dark:text-white truncate">#{incident.incident_code}</h3>
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-transparent ${getStatusBadge(incident.status)}`}>
                                {incident.status.replace('_', ' ')}
                              </span>
                              {incident.same_report_tag?.is_same_report && (
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 shadow-sm">
                                  🔗 Same Report ({incident.same_report_tag.group_count})
                                </span>
                              )}
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
                            {incident.verified_by?.name && (
                              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-black">
                                <CheckCircle size={14} className="text-indigo-500" /> Verified: {incident.verified_by.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`self-center ${isSelected ? 'text-indigo-500' : 'text-slate-300'} transition-all group-hover:translate-x-1`}>
                          <ChevronRight size={24} />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mt-4">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Page {currentPage} of {totalPages} ({filteredIncidents.length} items)
                    </span>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
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

                  {/* Tagged Same Report Group Warning / Intelligence */}
                  {selectedIncident.same_report_tag?.is_same_report && (
                    <div className="p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2">
                          🔗 Tagged Same Report ({selectedIncident.same_report_tag.group_count} Reports Linked)
                        </p>
                        {selectedIncident.same_report_tag.is_primary ? (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                            Primary Main Report
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-2.5 py-0.5 rounded-full">
                            Linked Report (#{selectedIncident.same_report_tag.primary_code})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                        Multiple reports detected for the same event based on matching incident type, geographic location, and time window.
                      </p>
                      {selectedIncident.same_report_tag.related_incidents?.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-amber-500/20">
                          {selectedIncident.same_report_tag.related_incidents.map((rel, idx) => (
                            <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/40 flex items-center justify-between">
                              <div>
                                <p className="text-xs font-black text-slate-900 dark:text-white">#{rel.incident_code}</p>
                                <p className="text-[10px] text-slate-500 font-medium">Reporter: {rel.reporter_name}</p>
                              </div>
                              <span className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {rel.status}
                              </span>
                            </div>
                          ))}
                          {selectedIncident.same_report_tag.is_primary && (
                            <button
                              onClick={handleMergeDuplicates}
                              disabled={submitting}
                              className="w-full mt-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {submitting ? <Loader2 size={14} className="animate-spin" /> : '🔗 Merge & Close Duplicates'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

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
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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



                  {/* Revision 2: Verification & Confirmation Record */}
                  {(selectedIncident.verified_by || selectedIncident.verified_at || selectedIncident.status !== 'REPORTED') && (
                    <div className="p-5 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/30 border-2 border-indigo-200/80 dark:border-indigo-800/60 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                            <CheckCircle size={16} />
                          </div>
                          <p className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                            Verification & Confirmation Record
                          </p>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm ${
                          selectedIncident.status === 'FALSE_ALARM'
                            ? 'bg-red-500 text-white'
                            : 'bg-indigo-600 text-white'
                        }`}>
                          {selectedIncident.status === 'FALSE_ALARM' ? 'Marked False Alarm' : 'Verified & Confirmed'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <User size={12} className="text-indigo-500" /> Confirmed / Verified By
                          </p>
                          <p className="font-extrabold text-slate-800 dark:text-slate-200 truncate">
                            {selectedIncident.verified_by?.name || 'Authorized Dispatcher'}
                          </p>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            {selectedIncident.verified_by?.role || 'ADMIN'}
                          </span>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Clock size={12} className="text-indigo-500" /> Verification Time
                          </p>
                          <p className="font-extrabold text-slate-800 dark:text-slate-200">
                            {selectedIncident.verified_at
                              ? new Date(selectedIncident.verified_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                              : selectedIncident.updated_at
                                ? new Date(selectedIncident.updated_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                : 'Recorded'}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400">
                            {selectedIncident.verified_at
                              ? new Date(selectedIncident.verified_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                              : selectedIncident.updated_at
                                ? new Date(selectedIncident.updated_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                                : ''}
                          </p>
                        </div>
                      </div>
                      {selectedIncident.verification_notes && (
                        <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5">Verification Remarks:</span>
                          "{selectedIncident.verification_notes}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Revision 3: Dispatch Details Section (Assigned Responder, Dispatch Time, Destination, Dispatch Status) */}
                  <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                          <Navigation size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Dispatch Details</p>
                          <p className="text-[10px] text-slate-400 font-medium">Assigned responders, time, destination & status</p>
                        </div>
                      </div>
                      {selectedIncident.status !== 'REPORTED' && selectedIncident.status !== 'FALSE_ALARM' && (
                        <button
                          onClick={() => setAssignModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          <PlusCircle size={14} /> Dispatch Unit
                        </button>
                      )}
                    </div>

                    {(!selectedIncident.assignments || selectedIncident.assignments.length === 0) ? (
                      <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/40 dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-800/40 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/60 space-y-3.5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                            <Car size={15} className="text-indigo-600 dark:text-indigo-400" />
                            Dispatch Details Setup
                          </span>
                          <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            Awaiting Dispatch
                          </span>
                        </div>

                        {/* Revision 3: Choose Unit / Assigned Responder */}
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Car size={12} className="text-indigo-500" />
                              1. Choose Response Unit to Deploy:
                            </span>
                            {selectedUnitIds.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setSelectedUnitIds([])}
                                className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                              >
                                Reset to Auto
                              </button>
                            )}
                          </label>
                          <select
                            value={selectedUnitIds[0] || ''}
                            onChange={(e) => setSelectedUnitIds(e.target.value ? [e.target.value] : [])}
                            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-black text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                          >
                            <option value="">⚡ Auto-Assign Nearest Available Responder</option>
                            {Array.isArray(responseUnits) && responseUnits.map(unit => (
                              <option key={unit.unit_id} value={unit.unit_id}>
                                {unit.unit_name} ({unit.unit_type}) — {unit.availability_status}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Revision 3: Destination */}
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1 flex items-center gap-1">
                            <MapPin size={11} className="text-rose-500" /> 2. Target Destination:
                          </label>
                          <p className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title={selectedIncident.map_pin_address || selectedIncident.landmark}>
                            {selectedIncident.map_pin_address || selectedIncident.landmark || 'Incident Location Coordinates'}
                          </p>
                        </div>

                        {/* Revision 2: Verification Remarks */}
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1 flex items-center gap-1">
                            <CheckCircle size={11} className="text-emerald-500" /> 3. Verification Remarks (Audit Trail):
                          </label>
                          <input
                            type="text"
                            value={verifyNotes}
                            onChange={(e) => setVerifyNotes(e.target.value)}
                            placeholder="e.g. Caller verified via phone call; responder dispatched"
                            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                          />
                        </div>

                        <p className="text-[10px] text-slate-400 font-medium">
                          💡 Verifying will permanently record your dispatcher name, time, chosen unit, and destination in the audit log.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedIncident.assignments.map((asgn, idx) => {
                          const responderName = asgn.responder_name || asgn.unit?.unit_name || 'Emergency Responder';
                          const responderType = asgn.responder_type || asgn.unit?.unit_type || 'BARANGAY';
                          const responderContact = asgn.responder_contact || asgn.unit?.contact_number || 'N/A';
                          const dispatchTime = asgn.dispatch_time || asgn.assigned_at;
                          const destination = asgn.destination || selectedIncident.map_pin_address || selectedIncident.landmark || 'Incident Location';
                          const dispatchStatus = asgn.dispatch_status || asgn.status || 'PENDING';

                          return (
                            <div
                              key={asgn.assignment_id || idx}
                              className="p-5 bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-500/20 dark:border-emerald-500/30 shadow-sm space-y-3"
                            >
                              {/* 1. Assigned Responder Header */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shrink-0">
                                    <Car size={18} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{responderName}</p>
                                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                        {responderType}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                      <Phone size={10} className="text-slate-400" /> {responderContact}
                                    </p>
                                  </div>
                                </div>
                                {/* 4. Dispatch Status Badge */}
                                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 ${
                                  dispatchStatus === 'ON_SCENE' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' :
                                  dispatchStatus === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                                  dispatchStatus === 'RESPONDING' || dispatchStatus === 'ACCEPTED' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' :
                                  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                }`}>
                                  {dispatchStatus.replace('_', ' ')}
                                </span>
                              </div>

                              {/* 2 & 3: Dispatch Time & Destination Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                                {/* Item 2: Dispatch Time */}
                                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5 flex items-center gap-1">
                                    <Clock size={11} className="text-indigo-500" /> Dispatch Time
                                  </span>
                                  <p className="font-extrabold text-slate-800 dark:text-slate-200">
                                    {dispatchTime ? new Date(dispatchTime).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A'}
                                  </p>
                                  <p className="text-[9px] text-slate-400">
                                    {dispatchTime ? new Date(dispatchTime).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                                  </p>
                                </div>

                                {/* Item 3: Destination */}
                                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5 flex items-center gap-1">
                                    <MapPin size={11} className="text-rose-500" /> Destination
                                  </span>
                                  <p className="font-extrabold text-slate-800 dark:text-slate-200 truncate" title={destination}>
                                    {destination}
                                  </p>
                                  {selectedIncident.landmark && (
                                    <p className="text-[9px] text-indigo-600 dark:text-indigo-400 truncate">
                                      Near: {selectedIncident.landmark}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Dispatch Status Action Controls */}
                              {dispatchStatus !== 'RESOLVED' && (
                                <div className="flex items-center gap-2 pt-1">
                                  {dispatchStatus === 'PENDING' && (
                                    <button
                                      onClick={() => handleUpdateDispatchStatus(asgn.assignment_id, 'RESPONDING')}
                                      className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                    >
                                      Mark En Route
                                    </button>
                                  )}
                                  {(dispatchStatus === 'PENDING' || dispatchStatus === 'RESPONDING' || dispatchStatus === 'ACCEPTED') && (
                                    <button
                                      onClick={() => handleUpdateDispatchStatus(asgn.assignment_id, 'ON_SCENE')}
                                      className="flex-1 py-1.5 px-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                    >
                                      Mark On Scene
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleUpdateDispatchStatus(asgn.assignment_id, 'RESOLVED')}
                                    className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                  >
                                    Mark Resolved
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Foot Action Area */}
                <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  {canVerify ? (
                    <div className="space-y-2.5">
                      {/* Button 1: Immediate Verify & Dispatch with Chosen Responder */}
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handleConfirmVerifyAndDispatch}
                        className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-indigo-500/25 disabled:opacity-50 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98"
                      >
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                        Verify Report & Dispatch Responder
                      </button>

                      {/* Button 2: Choose Unit Modal & False Alarm */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOpenVerifyModal(e);
                          }}
                          disabled={submitting}
                          className="py-3 px-3 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] uppercase tracking-wider rounded-xl hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                        >
                          <Car size={14} className="text-indigo-500" />
                          Choose Unit Modal
                        </button>
                        <button
                          type="button"
                          onClick={handleReject}
                          disabled={submitting}
                          className="py-3 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-red-600 hover:text-red-700 font-bold text-[11px] uppercase tracking-wider rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
                        >
                          {submitting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                          False Alarm
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700">
                      <CheckCircle size={16} className="text-emerald-500" /> Report Already Verified & Dispatched
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

      {/* Verification Modals Wrapper mounted via createPortal directly into document.body */}
      {/* Revision 2 & 3: Verification & Dispatch Modal */}
        {verifyModalOpen && selectedIncident && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
              onClick={() => !submitting && setVerifyModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl p-6 sm:p-8 overflow-hidden z-10 my-auto border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold shadow-sm">
                    <ShieldCheck size={26} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Verify Report & Dispatch</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">#{selectedIncident.incident_code}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !submitting && setVerifyModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="py-5 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Destination Confirmation */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <MapPin size={12} className="text-rose-500" /> Target Destination
                  </span>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-snug">
                    {verifyDestination || selectedIncident.map_pin_address || selectedIncident.landmark || 'Incident Location'}
                  </p>
                  {selectedIncident.landmark && (
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                      Landmark: {selectedIncident.landmark}
                    </p>
                  )}
                </div>

                {/* Revision 2: Verification Remarks / Confirmation Notes */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-emerald-500" /> Verification Remarks / Confirmation Notes
                  </label>
                  <textarea
                    rows={2}
                    value={verifyNotes}
                    onChange={(e) => setVerifyNotes(e.target.value)}
                    placeholder="e.g. Caller identity confirmed via callback; reported fire is active..."
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none resize-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">
                    This will be recorded with your account name and exact timestamp for the official audit trail.
                  </p>
                </div>

                {/* Revision 3: Assigned Responder Selection */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Car size={14} className="text-indigo-500" /> Assign Responder / Unit
                    </label>
                    {selectedUnitIds.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setSelectedUnitIds([])}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black hover:underline"
                      >
                        Reset to Auto-Assign
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Smart Proximity Active
                      </span>
                    )}
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 bg-slate-50/50 dark:bg-slate-800/30">
                    {!Array.isArray(responseUnits) || responseUnits.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No units registered.</p>
                    ) : (
                      responseUnits.map(unit => {
                        const isSelected = selectedUnitIds.includes(unit.unit_id);
                        return (
                          <button
                            type="button"
                            key={unit.unit_id}
                            onClick={() => {
                              setSelectedUnitIds(isSelected ? [] : [unit.unit_id]);
                            }}
                            className={`w-full text-left p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-sm ring-1 ring-indigo-500'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                              }`}>
                                {isSelected && <Check size={12} />}
                              </div>
                              <div>
                                <p className="font-black text-slate-800 dark:text-slate-200">{unit.unit_name}</p>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                  {unit.unit_type}
                                </span>
                              </div>
                            </div>
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                              unit.availability_status === 'AVAILABLE'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            }`}>
                              {unit.availability_status}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                  {selectedUnitIds.length === 0 && (
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                      💡 Nearest available response unit will be automatically dispatched based on incident location.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setVerifyModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-xs rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmVerifyAndDispatch}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-xs rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCheck size={16} />}
                  Verify & Dispatch Now
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}

        {/* Modal: Dispatch Additional Unit via createPortal */}
        {assignModalOpen && selectedIncident && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
              onClick={() => !submitting && setAssignModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 0 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl p-6 sm:p-8 overflow-hidden space-y-5 z-10 my-auto border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    <PlusCircle size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Dispatch Additional Responder</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Incident #{selectedIncident.incident_code}</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => !submitting && setAssignModalOpen(false)} 
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Destination
                  </label>
                  <p className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-300">
                    {selectedIncident.map_pin_address || selectedIncident.landmark || 'Incident Location'}
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Select Response Unit
                  </label>
                  <select
                    value={extraUnitId}
                    onChange={(e) => setExtraUnitId(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- Choose Unit to Deploy --</option>
                    {responseUnits.map(unit => (
                      <option key={unit.unit_id} value={unit.unit_id}>
                        {unit.unit_name} ({unit.unit_type}) - {unit.availability_status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setAssignModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting || !extraUnitId}
                  onClick={handleAssignAdditionalUnit}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                  Deploy Unit
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}

        {/* Intelligence Request Modal via createPortal */}
        {actionModal.open && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-md" 
              onClick={() => setActionModal({ open: false, action: null, message: '' })}
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 overflow-hidden z-10 my-auto border border-slate-100 dark:border-slate-800"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-blue-50 dark:bg-blue-500/10 text-blue-600">
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
          </div>,
          document.body
        )}
    </div>
  );
}
