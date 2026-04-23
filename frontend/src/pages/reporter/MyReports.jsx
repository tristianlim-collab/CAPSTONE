import React, { useState, useEffect } from 'react';
import { ChevronLeft, FileText, MapPin, Clock, Loader2, AlertTriangle } from 'lucide-react';
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
        const res = await incidentAPI.getAll({ limit: 100 });
        setReports(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // Listen for real-time status updates
  useEffect(() => {
    const unsub = on('incident_status_updated', (data) => {
      setReports(prev => prev.map(r =>
        r.incident_id === data.incident_id
          ? { ...r, status: data.status }
          : r
      ));
    });
    return () => unsub();
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
      case 'REPORTED': return '⏳ Awaiting Admin Review';
      case 'VERIFIED': return '✓ Verified & Dispatched';
      case 'RESPONDING': return '🚗 Units Responding';
      case 'ON_SCENE': return '📍 Units On Scene';
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
        <div className="w-10"></div> {/* Spacer for centering */}
      </header>

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto space-y-4">
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
          reports.map(report => (
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
              
              <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 text-xs text-left">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDate(report.reported_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-xs text-right justify-end truncate">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{report.barangay?.name && report.barangay?.city ? `Barangay ${report.barangay.name}, ${report.barangay.city}` : report.map_pin_address || 'Unknown'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyReports;
