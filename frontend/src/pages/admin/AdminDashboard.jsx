import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LiveMap from '../../components/map/LiveMap';
import { Activity, ShieldAlert, Users, TrendingUp, AlertTriangle, Loader2, Filter, FileText, Siren, CheckCircle2 } from 'lucide-react';
import { analyticsAPI, incidentAPI } from '../../api';
import MapFilterModal from '../../components/map/MapFilterModal';
import api from '../../api';
import { useSocketContext } from '../../context/SocketContext';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0, users: 0, units: 0 });
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { on, connected } = useSocketContext();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchDashboardData();
    // Reconcile stats every 30 seconds to catch any missed events
    const reconcileInterval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(reconcileInterval);
  }, [filters]);

  useEffect(() => {
    const unsub1 = on('new_incident', (inc) => {
      // Deduplication: don't add if already exists
      setRecentIncidents(prev => {
        if (prev.find(i => i.incident_id === inc.incident_id)) return prev;
        return [inc, ...prev.slice(0, 9)];
      });
      setStats(s => ({ ...s, total: s.total + 1, active: s.active + 1 }));
    });

    const unsub2 = on('incident_status_updated', (data) => {
      const fullIncident = data.incident || {};
      setRecentIncidents(prev => prev.map(inc =>
        inc.incident_id === data.incident_id ? { ...inc, ...fullIncident, status: data.status } : inc
      ));
      if (data.status === 'RESOLVED' || data.status === 'CLOSED') {
        setStats(s => ({ ...s, active: Math.max(0, s.active - 1), resolved: s.resolved + 1 }));
      }
    });

    const unsub3 = on('incident_deleted', (data) => {
      setRecentIncidents(prev => prev.filter(inc => inc.incident_id !== data.incident_id));
      setStats(s => ({ ...s, total: Math.max(0, s.total - 1), active: Math.max(0, s.active - 1) }));
      toast('ℹ️ Incident deleted', { duration: 5000 });
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [on]);

  const fetchDashboardData = async () => {
    try {
      const params = { limit: 10, ...filters };
      const [statsRes, incRes] = await Promise.all([
        analyticsAPI.getSummary(filters),
        incidentAPI.getAll(params)
      ]);
      if (statsRes.data?.data) setStats(statsRes.data.data);
      if (incRes.data?.data) setRecentIncidents(incRes.data.data);
    } catch (err) {
      console.error('Failed to fetch admin dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  // Quick verify handler for map marker popups
  const handleVerifyFromMap = async (incidentId, action, message) => {
    try {
      const payload = { action };
      if (message) payload.message = message;
      await api.post(`/incidents/${incidentId}/verify`, payload);
      toast.success(action === 'APPROVE' ? 'Incident approved & dispatched!' : 'Incident rejected');
    } catch (err) {
      console.error('Verify error:', err);
      toast.error(err.response?.data?.message || 'Failed to verify incident');
      throw err;
    }
  };

  return (
    <div className="flex flex-col h-screen w-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-6 pt-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Live monitoring and real-time statistics active.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilterModal(true)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl transition-all text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95 ${Object.keys(filters).length > 0
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
          >
            <Filter size={14} className={Object.keys(filters).length > 0 ? 'text-indigo-700' : 'text-indigo-600'} />
            Filter Map {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6">
        {[
          { label: 'Active Incidents', value: loading ? <Loader2 className="animate-spin w-6 h-6" /> : stats.active, icon: <Activity size={24} />, color: 'orange' },
          { label: 'Registered Users', value: loading ? <Loader2 className="animate-spin w-6 h-6" /> : (stats.users || 0), icon: <Users size={24} />, color: 'indigo' },
          { label: 'Resolved Overall', value: loading ? <Loader2 className="animate-spin w-6 h-6" /> : stats.resolved, icon: <TrendingUp size={24} />, color: 'emerald' },
          { label: 'Total Incidents', value: loading ? <Loader2 className="animate-spin w-6 h-6" /> : stats.total, icon: <AlertTriangle size={24} />, color: 'rose' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between group hover:border-slate-300 transition-all">
            <div>
              <p className={`text-[11px] font-bold text-${stat.color}-500 uppercase tracking-widest mb-1`}>{stat.label}</p>
              <h3 className="text-3xl font-black text-slate-800">{stat.value}</h3>
            </div>
            <div className={`w-14 h-14 rounded-full bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center shrink-0`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Area */}
      <div className="flex-1 px-6 pb-6 min-h-[600px] flex gap-4">
        {/* Map Area */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-2 flex flex-col relative overflow-hidden">
          <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm border border-slate-200 pointer-events-none">
            <h3 className="font-bold text-slate-800 text-sm">Live Dispatch Map</h3>
            <p className="text-xs text-slate-500 font-medium">Click a marker to verify incidents directly</p>
          </div>
          <div className="flex-1 rounded-[20px] overflow-hidden bg-slate-100 relative">
            <LiveMap zoom={13} center={[10.7421, 122.9688]} autoZoomOnNewIncident={true} markerColorMode="lgu" onVerify={handleVerifyFromMap} filters={filters} />
          </div>
        </div>

        {/* Right Sidebar — Incident Feed */}
        <div className="w-80 flex flex-col gap-3 overflow-y-auto">

          {/* New Reports */}
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border-b border-amber-100">
              <FileText size={16} className="text-amber-600 shrink-0" />
              <span className="font-bold text-amber-800 text-sm">New Reports</span>
              <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {recentIncidents.filter(i => i.status === 'REPORTED').length}
              </span>
            </div>
            <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
              {recentIncidents.filter(i => i.status === 'REPORTED').length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No new reports</p>
              ) : recentIncidents.filter(i => i.status === 'REPORTED').map(inc => (
                <div key={inc.incident_id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <code className="text-xs font-bold text-amber-600">{inc.incident_code}</code>
                    <span className="text-[10px] text-slate-400">{inc.reported_at ? new Date(inc.reported_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 truncate">{inc.incident_type?.name || 'Unknown Type'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{inc.map_pin_address || inc.barangay?.name || 'No location'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Responding */}
          <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 border-b border-indigo-100">
              <Siren size={16} className="text-indigo-600 shrink-0" />
              <span className="font-bold text-indigo-800 text-sm">Responding</span>
              <span className="ml-auto bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {recentIncidents.filter(i => ['VERIFIED', 'RESPONDING', 'ON_SCENE'].includes(i.status)).length}
              </span>
            </div>
            <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
              {recentIncidents.filter(i => ['VERIFIED', 'RESPONDING', 'ON_SCENE'].includes(i.status)).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No active responses</p>
              ) : recentIncidents.filter(i => ['VERIFIED', 'RESPONDING', 'ON_SCENE'].includes(i.status)).map(inc => (
                <div key={inc.incident_id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <code className="text-xs font-bold text-indigo-600">{inc.incident_code}</code>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      inc.status === 'ON_SCENE' ? 'bg-pink-100 text-pink-600' :
                      inc.status === 'RESPONDING' ? 'bg-indigo-100 text-indigo-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>{inc.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 truncate">{inc.incident_type?.name || 'Unknown Type'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{inc.map_pin_address || inc.barangay?.name || 'No location'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Resolved */}
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border-b border-emerald-100">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span className="font-bold text-emerald-800 text-sm">Resolved</span>
              <span className="ml-auto bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {recentIncidents.filter(i => ['RESOLVED', 'CLOSED'].includes(i.status)).length}
              </span>
            </div>
            <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
              {recentIncidents.filter(i => ['RESOLVED', 'CLOSED'].includes(i.status)).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No resolved incidents</p>
              ) : recentIncidents.filter(i => ['RESOLVED', 'CLOSED'].includes(i.status)).map(inc => (
                <div key={inc.incident_id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <code className="text-xs font-bold text-emerald-600">{inc.incident_code}</code>
                    <span className="text-[10px] text-slate-400">{inc.updated_at ? new Date(inc.updated_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 truncate">{inc.incident_type?.name || 'Unknown Type'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{inc.map_pin_address || inc.barangay?.name || 'No location'}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Filter Modal */}
      <MapFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onFiltersChange={setFilters}
        initialFilters={filters}
        defaultPreset="active"
      />
    </div>
  );
}
