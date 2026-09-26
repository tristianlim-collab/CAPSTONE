import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocketContext } from '../../context/SocketContext';
import { incidentAPI } from '../../api';
import {
  Home, FileText, User, Bell, ChevronRight,
  MapPin, Clock, AlertTriangle, ShieldCheck,
  Flame, Activity, Stethoscope, Car, Loader2
} from 'lucide-react';

const TYPE_ICONS = {
  'FIRE': Flame,
  'MEDICAL': Stethoscope,
  'ACCIDENT': Car,
  'CRIME': AlertTriangle,
};

export default function ReporterHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { on, connected } = useSocketContext();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch reporter's own incidents
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const stored = localStorage.getItem('my_report_ids');
        let ids = stored ? JSON.parse(stored) : [];
        const lastId = localStorage.getItem('last_reported_incident_id');
        if (lastId && !ids.includes(lastId)) {
          ids.unshift(lastId);
        }

        if (ids.length > 0) {
          const results = await Promise.allSettled(ids.map(id => incidentAPI.getById(id)));
          const fetched = results
            .filter(r => r.status === 'fulfilled' && (r.value?.data?.data || r.value?.data))
            .map(r => r.value.data?.data || r.value.data);
          setIncidents(fetched);
        } else {
          setIncidents([]);
        }
      } catch (err) {
        console.error('Failed to fetch incidents:', err);
        setIncidents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, [user]);

  // Listen for real-time updates
  useEffect(() => {
    const unsub1 = on('incident_status_updated', (data) => {
      setIncidents(prev => prev.map(inc =>
        inc.incident_id === data.incident_id
          ? { ...inc, status: data.status, ...(data.incident || {}) }
          : inc
      ));
    });

    const unsub2 = on('incident_updated', (data) => {
      setIncidents(prev => prev.map(inc =>
        inc.incident_id === data.incident_id
          ? { ...inc, ...data }
          : inc
      ));
    });

    const unsub3 = on('new_incident', (incident) => {
      // Add newly submitted incident to the top
      setIncidents(prev => {
        if (prev.find(i => i.incident_id === incident.incident_id)) return prev;
        return [incident, ...prev];
      });
    });

    const unsub4 = on('incident_deleted', (data) => {
      // Remove if admin rejects
      setIncidents(prev => prev.filter(inc => inc.incident_id !== data.incident_id));
    });

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, [on]);

  // Extract initials for the avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Compute stats
  const totalReports = incidents.length;
  const activeCount = incidents.filter(i => ['REPORTED', 'VERIFIED', 'RESPONDING'].includes(i.status)).length;
  const recentIncidents = incidents.slice(0, 5);

  // Get time ago text
  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getStatusBadge = (status) => {
    const map = {
      REPORTED: { label: 'Reported', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
      VERIFIED: { label: 'Verified', cls: 'bg-blue-50 text-blue-600 border-blue-100' },
      RESPONDING: { label: 'Responding', cls: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
      RESOLVED: { label: 'Resolved', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      CLOSED: { label: 'Closed', cls: 'bg-slate-50 text-slate-600 border-slate-100' },
    };
    return map[status] || map.REPORTED;
  };

  const getTypeIcon = (incident) => {
    const typeName = (incident.incident_type?.name || '').toUpperCase();
    for (const [key, Icon] of Object.entries(TYPE_ICONS)) {
      if (typeName.includes(key)) return Icon;
    }
    return FileText;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans pb-24">
      {/* Absolute Header Background */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-slate-900 to-slate-800 rounded-b-[40px] shadow-lg overflow-hidden z-0">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent"></div>
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      </div>

      <div className="flex-1 max-w-[430px] mx-auto w-full px-5 pt-10 relative z-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-blue-100 text-sm font-medium mb-1 opacity-90">{getGreeting()},</p>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              {user?.name || 'Citizen'} <span className="text-xl">👋</span>
            </h1>
          </div>
        </div>

        {/* Big Report Button */}
        <button
          onClick={() => navigate('/reporter/report')}
          className="w-full relative overflow-hidden rounded-[28px] bg-gradient-to-br from-red-500 to-rose-600 p-8 flex flex-col items-center justify-center shadow-[0_20px_40px_-15px_rgba(225,29,72,0.5)] active:scale-[0.98] transition-transform mb-10 border border-white/20 group"
        >
          {/* Subtle shine effect on top edge */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-white/20 blur-3xl -translate-y-20 transition-transform duration-700 group-hover:translate-y-full"></div>

          <div className="w-20 h-20 mb-5 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-red-100 drop-shadow-md border border-white/30 shadow-inner">
            <AlertTriangle size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm mb-2">
            Emergency Report
          </h2>
          <p className="text-rose-100 text-sm font-medium flex items-center gap-1.5 opacity-90">
            Tap to request immediate assistance <ChevronRight size={16} />
          </p>
        </button>

        {/* Active Reports List & Direct Tracking */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-bold text-slate-800 tracking-wide uppercase">
            My Report Status Tracking
          </h3>
        </div>

        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={28} className="animate-spin text-slate-400" />
            </div>
          ) : recentIncidents.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText size={24} className="text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm">No reports submitted yet. Tap the button above to submit an emergency report.</p>
            </div>
          ) : (
            recentIncidents.map((incident) => {
              const IconComp = getTypeIcon(incident);
              const badge = getStatusBadge(incident.status);
              const isResolved = incident.status === 'RESOLVED' || incident.status === 'CLOSED';
              return (
                <div
                  key={incident.incident_id}
                  onClick={() => navigate('/reporter/report/success', { state: { incident } })}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99] group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner shrink-0 ${isResolved ? 'bg-slate-50 text-slate-400 border border-slate-100' : 'bg-red-50 text-red-500 border border-red-100'
                      }`}>
                      <IconComp size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-800 text-[15px] truncate">
                          {incident.incident_type?.name || 'Incident'}
                        </h4>
                        <span className={`px-2.5 py-0.5 ${badge.cls} border text-[10px] font-bold tracking-widest rounded-md uppercase shrink-0 flex items-center gap-1`}>
                          {isResolved && <ShieldCheck size={10} />} {badge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1"><Clock size={12} /> {getTimeAgo(incident.reported_at)}</span>
                        <span className="flex items-center gap-1 truncate"><MapPin size={12} /> {incident.map_pin_address || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Direct Progress Tracker */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-[10px] font-bold mt-1">
                    <div className={`flex flex-col items-center gap-1 ${['REPORTED', 'VERIFIED', 'RESPONDING', 'ON_SCENE', 'RESOLVED'].includes(incident.status) ? 'text-indigo-600' : 'text-slate-300'}`}>
                      <span>1. Reported</span>
                    </div>
                    <div className="h-0.5 w-4 bg-slate-200"></div>
                    <div className={`flex flex-col items-center gap-1 ${['RESPONDING', 'ON_SCENE', 'RESOLVED'].includes(incident.status) ? 'text-indigo-600' : 'text-slate-300'}`}>
                      <span>2. Responding</span>
                    </div>
                    <div className="h-0.5 w-4 bg-slate-200"></div>
                    <div className={`flex flex-col items-center gap-1 ${['ON_SCENE', 'RESOLVED'].includes(incident.status) ? 'text-purple-600' : 'text-slate-300'}`}>
                      <span>3. On Scene</span>
                    </div>
                    <div className="h-0.5 w-4 bg-slate-200"></div>
                    <div className={`flex flex-col items-center gap-1 ${incident.status === 'RESOLVED' ? 'text-emerald-600 font-extrabold' : 'text-slate-300'}`}>
                      <span>4. Resolved</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
