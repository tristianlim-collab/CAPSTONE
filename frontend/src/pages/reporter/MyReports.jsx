import React, { useState, useEffect } from 'react';
import { ChevronLeft, FileText, MapPin, Clock, Loader2, AlertTriangle, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { incidentAPI } from '../../api';
import { useSocketContext } from '../../context/SocketContext';

const MyReports = () => {
  const navigate = useNavigate();
  const { on } = useSocketContext();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        // Fetch saved local report IDs created by this user session/device
        const stored = localStorage.getItem('my_report_ids');
        const ids = stored ? JSON.parse(stored) : [];

        if (ids.length > 0) {
          const results = await Promise.allSettled(ids.map(id => incidentAPI.getById(id)));
          const fetched = results
            .filter(r => r.status === 'fulfilled' && (r.value?.data?.data || r.value?.data))
            .map(r => r.value.data?.data || r.value.data);
          
          // Also fetch associated post reports for photos if resolved
          const enrichedReports = await Promise.all(
            fetched.map(async (rep) => {
              if (rep.status === 'RESOLVED') {
                try {
                  const pRes = await postReportAPI.getByIncident(rep.incident_id);
                  const pData = pRes.data?.data || pRes.data;
                  return { ...rep, post_report: pData };
                } catch {
                  return rep;
                }
              }
              return rep;
            })
          );

          setReports(enrichedReports);
        } else {
          setReports([]);
        }
      } catch (err) {
        console.error('Failed to fetch reports:', err);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // Listen for real-time status updates and new reports
  useEffect(() => {
    const unsub1 = on('incident_status_updated', async (data) => {
      setReports(prev => prev.map(r => {
        if (r.incident_id === data.incident_id) {
          return { ...r, status: data.status, ...(data.incident || {}) };
        }
        return r;
      }));

      // Fetch photos if resolved
      if (data.status === 'RESOLVED') {
        try {
          const pRes = await postReportAPI.getByIncident(data.incident_id);
          const pData = pRes.data?.data || pRes.data;
          setReports(prev => prev.map(r => 
            r.incident_id === data.incident_id ? { ...r, post_report: pData } : r
          ));
        } catch (e) {
          console.error(e);
        }
      }
    });

    const unsub2 = on('incident_verified', (data) => {
      const incident = data.incident || data;
      setReports(prev => prev.map(r =>
        r.incident_id === incident.incident_id
          ? { ...r, status: 'VERIFIED' }
          : r
      ));
    });

    const unsub3 = on('incident_deleted', (data) => {
      setReports(prev => prev.filter(r => r.incident_id !== data.incident_id));
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [on]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'REPORTED': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'VERIFIED': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'RESPONDING': return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      case 'ON_SCENE': return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'RESOLVED': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'FALSE_ALARM': return 'bg-red-100 text-red-700 border border-red-200';
      case 'CLOSED': return 'bg-slate-100 text-slate-700 border border-slate-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'REPORTED': return '⏳ Awaiting Review';
      case 'VERIFIED': return '✓ Verified';
      case 'RESPONDING': return '🚗 Responding';
      case 'ON_SCENE': return '📍 On Scene';
      case 'RESOLVED': return '✓ Resolved';
      case 'FALSE_ALARM': return '✗ False Alarm';
      case 'CLOSED': return '📋 Closed';
      default: return status;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans max-w-[430px] mx-auto shadow-xl relative overflow-hidden">
      {/* Header */}
      <header className="pt-12 pb-4 px-6 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-10 flex items-center justify-between">
        <button 
          onClick={() => navigate('/reporter/home')}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="font-semibold text-slate-800 text-lg">My Reports</span>
        <div className="w-10"></div>
      </header>

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto space-y-4 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
            <p className="text-sm text-slate-500 font-medium">Loading your reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 border-dashed">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">You haven't submitted any reports yet.</p>
          </div>
        ) : (
          reports.map(report => {
            const photos = report.post_report?.photos || [];

            return (
              <div key={report.incident_id} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{report.incident_type?.name || 'Incident'}</h3>
                      <span className="text-xs text-slate-500">{report.incident_code}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(report.status)}`}>
                    {getStatusLabel(report.status)}
                  </span>
                </div>

                {report.description && (
                  <p className="text-sm text-slate-600 line-clamp-2">{report.description}</p>
                )}

                {/* Real-time Incident Progress Tracker */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-[11px] font-bold">
                  <div className={`flex flex-col items-center gap-1 ${['REPORTED','VERIFIED','RESPONDING','ON_SCENE','RESOLVED'].includes(report.status) ? 'text-indigo-600' : 'text-slate-300'}`}>
                    <span>1. Reported</span>
                  </div>
                  <div className="h-0.5 w-6 bg-slate-200"></div>
                  <div className={`flex flex-col items-center gap-1 ${['RESPONDING','ON_SCENE','RESOLVED'].includes(report.status) ? 'text-indigo-600' : 'text-slate-300'}`}>
                    <span>2. Responding</span>
                  </div>
                  <div className="h-0.5 w-6 bg-slate-200"></div>
                  <div className={`flex flex-col items-center gap-1 ${['ON_SCENE','RESOLVED'].includes(report.status) ? 'text-purple-600' : 'text-slate-300'}`}>
                    <span>3. On Scene</span>
                  </div>
                  <div className="h-0.5 w-6 bg-slate-200"></div>
                  <div className={`flex flex-col items-center gap-1 ${report.status === 'RESOLVED' ? 'text-emerald-600 font-extrabold' : 'text-slate-300'}`}>
                    <span>4. Resolved</span>
                  </div>
                </div>

                {/* Display Response Unit Photo when Resolved */}
                {report.status === 'RESOLVED' && photos.length > 0 && (
                  <div className="mt-1 pt-3 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Response Unit Confirmation Photo:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {photos.map((photoUrl, pIdx) => (
                        <img 
                          key={pIdx} 
                          src={photoUrl} 
                          alt="Response Unit Evidence" 
                          className="w-full h-28 object-cover rounded-xl border border-slate-200 shadow-sm"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {report.landmark && (
                  <div className="bg-blue-50/80 border border-blue-100 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-800 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Landmark: <span className="font-bold">{report.landmark}</span></span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 text-xs text-left">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDate(report.reported_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs text-right justify-end truncate">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{report.map_pin_address || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-[430px] mx-auto flex justify-around items-center pt-4 pb-6 px-6">
          <button onClick={() => navigate('/reporter/home')} className="flex flex-col items-center gap-1.5 group w-20">
            <div className="w-10 h-10 rounded-full text-slate-400 group-hover:bg-slate-50 group-hover:text-slate-600 flex items-center justify-center transition-colors">
              <Home size={22} className="stroke-[2px]" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 uppercase tracking-widest transition-colors">Home</span>
          </button>
          
          <button onClick={() => navigate('/reporter/reports')} className="flex flex-col items-center gap-1.5 group w-20">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText size={22} className="stroke-[2.5px]" />
            </div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyReports;
