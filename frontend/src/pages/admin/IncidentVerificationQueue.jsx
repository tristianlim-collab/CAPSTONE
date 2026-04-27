import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { useSocketContext } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import {
  CheckCircle, XCircle, AlertTriangle, MessageSquare, Edit2, MapPin,
  Clock, User, FileText, Loader2, X, Send, Flame, Stethoscope, Car, ShieldAlert, Filter
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import IncidentSearch from '../../components/incidents/IncidentSearch';

const INCIDENT_TYPE_ICONS = {
  FIRE: Flame, MEDICAL_EMERGENCY: Stethoscope, ACCIDENT: Car,
  'CRIME-RELATED': ShieldAlert, OTHER: FileText
};

const STATUS_TABS = [
  { key: 'ALL', label: 'All Reports' },
  { key: 'REPORTED', label: 'Pending' },
  { key: 'VERIFIED', label: 'Verified' },
  { key: 'DISPATCHED', label: 'Dispatched' },
  { key: 'RESPONDING', label: 'Responding' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'FALSE_ALARM', label: 'False Alarm' },
];

const STATUS_COLORS = {
  REPORTED: 'bg-amber-100 text-amber-700 border-amber-200',
  VERIFIED: 'bg-blue-100 text-blue-700 border-blue-200',
  DISPATCHED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  RESPONDING: 'bg-purple-100 text-purple-700 border-purple-200',
  RESOLVED: 'bg-green-100 text-green-700 border-green-200',
  CLOSED: 'bg-slate-100 text-slate-700 border-slate-200',
  FALSE_ALARM: 'bg-red-100 text-red-700 border-red-200',
};

export default function IncidentVerificationQueue() {
  const { on, connected } = useSocketContext();
  const [activeTab, setActiveTab] = useState('ALL');
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [actionModal, setActionModal] = useState({ open: false, action: null, message: '' });
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [fullscreenPhoto, setFullscreenPhoto] = useState(null);
  const [searchFilters, setSearchFilters] = useState({});

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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const handleFiltersChange = useCallback((filters) => {
    setSearchFilters(filters);
    fetchIncidents(filters);
  }, [fetchIncidents]);

  useEffect(() => {
    const unsub1 = on('incident_awaiting_verification', (data) => {
      setIncidents(prev => {
        // Deduplication: don't add if already exists
        if (prev.find(i => i.incident_id === data.incident.incident_id)) return prev;
        return [data.incident || data, ...prev];
      });
    });
    const unsub2 = on('incident_verified', (data) => {
      setIncidents(prev => prev.map(i => i.incident_id === data.incident_id ? { ...i, status: 'VERIFIED' } : i));
      // Clear selection if the verified incident was selected
      setSelectedIncident(prev => prev?.incident_id === data.incident_id ? null : prev);
    });
    const unsub3 = on('incident_rejected', (data) => {
      setIncidents(prev => prev.map(i => i.incident_id === data.incident_id ? { ...i, status: 'FALSE_ALARM' } : i));
      // Clear selection if the rejected incident was selected
      setSelectedIncident(prev => prev?.incident_id === data.incident_id ? null : prev);
    });
    const unsub4 = on('incident_status_updated', (data) => {
      setIncidents(prev => prev.map(i => i.incident_id === data.incident_id ? { ...i, status: data.status, ...(data.incident || {}) } : i));
    });
    return () => { unsub1?.(); unsub2?.(); unsub3?.(); unsub4?.(); };
  }, [on]);

  const filteredIncidents = activeTab === 'ALL' ? incidents : incidents.filter(i => i.status === activeTab);

  const handleSelectIncident = async (incident) => {
    setSelectedIncident(incident);
    setLoadingDetails(true);
    setEditData({
      incident_type_id: incident.incident_type_id,
      severity: incident.severity,
      description: incident.description,
      map_pin_address: incident.map_pin_address
    });
    setEditMode(false);

    // Fetch complete incident details including evidence and reporter
    try {
      const res = await api.get(`/incidents/${incident.incident_id}`);
      if (res.data?.data) {
        setSelectedIncident(prev => ({
          ...prev,
          ...res.data.data,
          evidence: res.data.data.evidence || [],
          reporter: res.data.data.reporter || incident.reporter
        }));
      }
    } catch (err) {
      console.error('Failed to fetch incident details:', err);
      // Keep the incident even if full details failed
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedIncident) return;
    setSubmitting(true);
    try {
      const payload = { action: 'APPROVE', edited_data: editMode ? editData : undefined };
      await api.post(`/incidents/${selectedIncident.incident_id}/verify`, payload);
      toast.success('Incident approved and dispatched!');
      setIncidents(prev => prev.map(i => i.incident_id === selectedIncident.incident_id ? { ...i, status: 'VERIFIED' } : i));
      setSelectedIncident(null);
      setActionModal({ open: false, action: null, message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve incident');
    } finally { setSubmitting(false); }
  };

  const handleReject = async () => {
    if (!selectedIncident) return;
    setSubmitting(true);
    try {
      await api.post(`/incidents/${selectedIncident.incident_id}/verify`, { action: 'REJECT', message: actionModal.message });
      toast.success('Incident rejected');
      setIncidents(prev => prev.map(i => i.incident_id === selectedIncident.incident_id ? { ...i, status: 'FALSE_ALARM' } : i));
      setSelectedIncident(null);
      setActionModal({ open: false, action: null, message: '' });
    } catch (err) { toast.error('Failed to reject incident'); }
    finally { setSubmitting(false); }
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
    const colorMap = { FIRE: '#F97316', MEDICAL_EMERGENCY: '#EF4444', ACCIDENT: '#F59E0B', 'CRIME-RELATED': '#8B5CF6', OTHER: '#6B7280' };
    return colorMap[type?.name] || '#6B7280';
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
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Incident Reports</h1>
          <p className="text-slate-600">View all incident reports and manage verification</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-4">
          <IncidentSearch
            onFiltersChange={handleFiltersChange}
            incidentTypes={incidentTypes}
            showStatusFilter={false}
            compact
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {STATUS_TABS.map(tab => {
            const count = tab.key === 'ALL' ? incidents.length : incidents.filter(i => i.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {tab.label} <span className="ml-1 opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="grid grid-cols-3 gap-8">
          {/* Incidents List */}
          <div className="col-span-2">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-slate-400" size={32} /></div>
            ) : filteredIncidents.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <Filter className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-600 font-semibold">No incidents found for this filter</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIncidents.map((incident) => (
                  <div
                    key={incident.incident_id}
                    onClick={() => handleSelectIncident(incident)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedIncident?.incident_id === incident.incident_id
                        ? 'bg-blue-50 border-blue-300 shadow-md'
                        : 'bg-white border-slate-200 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: getTypeColor(incident.incident_type_id) }}>
                        {React.createElement(getTypeIcon(incident.incident_type_id), { size: 24 })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-slate-900 truncate">{incident.incident_code}</h3>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusBadge(incident.status)}`}>{incident.status}</span>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(incident.severity)}`}>{incident.severity}</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{incident.description?.substring(0, 100)}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Clock size={14} /> {getTimeAgo(incident.reported_at)}</span>
                          <span className="flex items-center gap-1"><User size={14} /> {incident.reporter?.name || 'Unknown'}</span>
                          <span className="flex items-center gap-1"><MapPin size={14} /> {incident.map_pin_address?.substring(0, 40)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Panel */}
          <div>
            {selectedIncident ? (
              <div className="bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden sticky top-8">
                <div className="bg-slate-50 p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-bold text-slate-900">{selectedIncident.incident_code}</h2>
                    <button onClick={() => setSelectedIncident(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusBadge(selectedIncident.status)}`}>{selectedIncident.status}</span>
                    <span className="text-xs text-slate-500">{getTimeAgo(selectedIncident.reported_at)}</span>
                  </div>
                </div>

                <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                  {loadingDetails && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                  )}
                  {!loadingDetails && (
                    <>
                  {/* Type */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase">Type</label>
                    {editMode ? (
                      <select value={editData.incident_type_id} onChange={(e) => setEditData({ ...editData, incident_type_id: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm">
                        {incidentTypes.map((type) => (<option key={type.type_id} value={type.type_id}>{type.name}</option>))}
                      </select>
                    ) : (
                      <p className="mt-1 font-semibold text-slate-800">{incidentTypes.find(t => t.type_id === selectedIncident.incident_type_id)?.name}</p>
                    )}
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase">Severity</label>
                    {editMode ? (
                      <div className="flex gap-2 mt-1">
                        {['LOW', 'HIGH', 'CRITICAL'].map((level) => (
                          <button key={level} onClick={() => setEditData({ ...editData, severity: level })}
                            className={`px-3 py-1 rounded text-xs font-bold transition-all ${editData.severity === level ? (level === 'LOW' ? 'bg-green-500 text-white' : level === 'HIGH' ? 'bg-orange-500 text-white' : 'bg-red-500 text-white') : 'bg-slate-200 text-slate-700'}`}
                          >{level}</button>
                        ))}
                      </div>
                    ) : (
                      <p className={`mt-1 font-semibold px-2 py-1 rounded inline-block text-xs ${getSeverityColor(selectedIncident.severity)}`}>{selectedIncident.severity}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase">Description</label>
                    {editMode ? (
                      <textarea value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} maxLength={500} rows="3" className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none" />
                    ) : (
                      <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{selectedIncident.description}</p>
                    )}
                  </div>

                  {/* Photo Evidence */}
                  {selectedIncident.evidence && selectedIncident.evidence.length > 0 && (
                    <div>
                      <label className="text-xs font-semibold text-slate-600 uppercase">Photo Evidence ({selectedIncident.evidence.length})</label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {selectedIncident.evidence.map((photo, idx) => (
                          <div key={idx} onClick={() => setFullscreenPhoto(photo.file_path)} className="aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-50 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all">
                            <img src={photo.file_path} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase">Location</label>
                    <p className="mt-1 text-sm text-slate-700 flex items-center gap-1"><MapPin size={14} /><span>{selectedIncident.map_pin_address || 'Unknown'}</span></p>
                    {selectedIncident.latitude && selectedIncident.longitude && (
                      <div className="mt-2 h-32 rounded-lg border border-slate-200 overflow-hidden">
                        <MapContainer center={[selectedIncident.latitude, selectedIncident.longitude]} zoom={14} style={{ height: '100%', width: '100%' }}>
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker position={[selectedIncident.latitude, selectedIncident.longitude]} />
                        </MapContainer>
                      </div>
                    )}
                  </div>

                  {/* Reporter */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase">Reporter</label>
                    <p className="mt-1 text-sm text-slate-700">{selectedIncident.reporter?.name}</p>
                    {selectedIncident.reporter?.contact_number && (<p className="text-xs text-slate-500">{selectedIncident.reporter.contact_number}</p>)}
                  </div>
                    </>
                  )}
                </div>

                {/* Action Buttons — only for REPORTED status */}
                {canVerify && (
                  <div className="border-t border-slate-200 p-4 space-y-2">
                    {!editMode ? (
                      <>
                        <button onClick={handleApprove} disabled={submitting} className="w-full py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                          {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />} Approve & Dispatch
                        </button>
                        <button onClick={() => setActionModal({ open: true, action: 'reject', message: '' })} className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                          <XCircle size={16} /> Reject
                        </button>
                        <button onClick={() => setActionModal({ open: true, action: 'request_info', message: '' })} className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                          <MessageSquare size={16} /> Request Info
                        </button>
                        <button onClick={() => setEditMode(true)} className="w-full py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors flex items-center justify-center gap-2">
                          <Edit2 size={16} /> Edit Details
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={handleApprove} disabled={submitting} className="w-full py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                          {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />} Apply & Dispatch
                        </button>
                        <button onClick={() => setEditMode(false)} className="w-full py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors">Cancel Edit</button>
                      </>
                    )}
                  </div>
                )}

                {/* Read-only label for non-REPORTED */}
                {!canVerify && (
                  <div className="border-t border-slate-200 p-4">
                    <p className="text-xs text-slate-500 text-center font-medium">This incident has already been processed</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                <p className="text-slate-500">Select an incident to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="font-bold text-lg text-slate-900 mb-4">
              {actionModal.action === 'reject' ? 'Reject Incident' : 'Request More Information'}
            </h3>
            <textarea value={actionModal.message} onChange={(e) => setActionModal({ ...actionModal, message: e.target.value })}
              placeholder={actionModal.action === 'reject' ? 'Optional: Reason for rejection...' : 'What additional information do you need?'}
              maxLength={500} rows="4" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-4 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setActionModal({ open: false, action: null, message: '' })} className="flex-1 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300">Cancel</button>
              <button onClick={actionModal.action === 'reject' ? handleReject : handleRequestInfo} disabled={submitting}
                className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Modal */}
      {fullscreenPhoto && (
        <div onClick={() => setFullscreenPhoto(null)} className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={fullscreenPhoto} alt="Fullscreen evidence" className="w-full h-full object-contain" onClick={(e) => e.stopPropagation()} />
            <button onClick={() => setFullscreenPhoto(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all"><X size={24} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
