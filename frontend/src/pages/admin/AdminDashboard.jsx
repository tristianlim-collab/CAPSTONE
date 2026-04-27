import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LiveMap from '../../components/map/LiveMap';
import { Activity, ShieldAlert, Users, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { analyticsAPI, incidentAPI } from '../../api';
import api from '../../api';
import { useSocketContext } from '../../context/SocketContext';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0, users: 0, units: 0 });
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { on, connected } = useSocketContext();

  useEffect(() => {
    fetchDashboardData();
    // Reconcile stats every 30 seconds to catch any missed events
    const reconcileInterval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(reconcileInterval);
  }, []);

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
      setRecentIncidents(prev => prev.map(inc =>
        inc.incident_id === data.incident_id ? { ...inc, status: data.status } : inc
      ));
      if (data.status === 'RESOLVED' || data.status === 'CLOSED') {
        setStats(s => ({ ...s, active: Math.max(0, s.active - 1), resolved: s.resolved + 1 }));
      }
    });

    const unsub3 = on('incident_deleted', (data) => {
      setRecentIncidents(prev => prev.filter(inc => inc.incident_id !== data.incident_id));
      setStats(s => ({ ...s, total: Math.max(0, s.total - 1), active: Math.max(0, s.active - 1) }));
      toast('ℹ️ Incident deleted', { duration: 3000 });
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [on]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, incRes] = await Promise.all([
        analyticsAPI.getSummary(),
        incidentAPI.getAll({ limit: 10 })
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
        <div className="text-xs bg-white px-4 py-2.5 rounded-xl shadow-sm border border-emerald-100 font-bold text-emerald-600 flex items-center gap-2 uppercase tracking-widest">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          Real-time Sync Active
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
      <div className="flex-1 px-6 pb-6 min-h-0">
        {/* Map Area */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-2 flex flex-col relative overflow-hidden h-full">
          <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm border border-slate-200 pointer-events-none">
            <h3 className="font-bold text-slate-800 text-sm">Live Dispatch Map</h3>
            <p className="text-xs text-slate-500 font-medium">Click a marker to verify incidents directly</p>
          </div>
          <div className="flex-1 rounded-[20px] overflow-hidden bg-slate-100 relative">
            <LiveMap zoom={13} center={[14.6760, 121.0437]} autoZoomOnNewIncident={true} markerColorMode="lgu" onVerify={handleVerifyFromMap} />
          </div>
        </div>
      </div>
    </div>
  );
}
