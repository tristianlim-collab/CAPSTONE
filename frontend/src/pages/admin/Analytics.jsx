import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, TrendingUp, Download, Calendar, Activity, Clock, CheckCircle, Loader2, FileText, FileSpreadsheet } from 'lucide-react';
import { analyticsAPI, reportAPI } from '../../api';
import toast from 'react-hot-toast';

const Analytics = () => {
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0 });
  const [responseTime, setResponseTime] = useState(0);
  const [byType, setByType] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [sumRes, timeRes, typeRes] = await Promise.all([
          analyticsAPI.getSummary(),
          analyticsAPI.getResponseTime(),
          analyticsAPI.getByType()
        ]);
        
        if (sumRes.data?.data) setStats(sumRes.data.data);
        if (timeRes.data?.data) setResponseTime(timeRes.data.data.average_minutes || 0);
        if (typeRes.data?.data) {
          // Format types for progress bars
          const totalIncidents = typeRes.data.data.reduce((acc, curr) => acc + curr._count._all, 0);
          const formattedTypes = typeRes.data.data.map(t => {
            const pct = totalIncidents === 0 ? 0 : Math.round((t._count._all / totalIncidents) * 100);
            return {
               label: `Type ID: ${t.incident_type_id || 'Unknown'}`, 
               value: pct,
               count: t._count._all
            };
          });
          setByType(formattedTypes.sort((a,b) => b.count - a.count).slice(0,4));
        }
      } catch (err) {
        console.error("Error fetching analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format) => {
    try {
      setIsExporting(true);
      setShowExportMenu(false);
      const toastId = toast.loading(`Generating ${format.toUpperCase()} export...`);
      
      const response = await reportAPI.export(format, {}); // export all for analytics
      
      // Create a blob from the response
      let blobType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (format === 'csv') blobType = 'text/csv';
      if (format === 'pdf') blobType = 'application/pdf';
      
      const blob = new Blob([response.data], { type: blobType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from header if possible, else generate one
      let filename = `GAOIRS_Incidents_${new Date().toISOString().slice(0,10)}.${format}`;
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = /filename="([^"]*)"/.exec(disposition);
        if (matches != null && matches[1]) filename = matches[1];
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Export downloaded successfully', { id: toastId });
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to generate export');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart3 size={24} className="text-indigo-600" />
            Performance Analytics
          </h2>
          <p className="text-sm text-slate-500 mt-1">Deep dive into response times, incident volumes, and unit efficiency.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors shadow-sm text-sm active:scale-95">
            <Calendar size={16} />
            This Month
          </button>
          <div className="relative" ref={exportMenuRef}>
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-medium transition-colors shadow-indigo-600/20 shadow-sm text-sm active:scale-95"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50 animate-fade-in">
                <button onClick={() => handleExport('xlsx')} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left border-b border-slate-50">
                  <FileSpreadsheet size={16} className="text-emerald-600" /> Export as Excel
                </button>
                <button onClick={() => handleExport('csv')} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left border-b border-slate-50">
                  <FileText size={16} className="text-sky-600" /> Export as CSV
                </button>
                <button onClick={() => handleExport('pdf')} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left">
                  <FileText size={16} className="text-rose-600" /> Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Incidents</p>
              <h3 className="text-3xl font-black text-slate-800">{loading ? <Loader2 className="animate-spin w-6 h-6"/> : stats.total}</h3>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <Activity size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Avg. Response Time</p>
              <h3 className="text-3xl font-black text-slate-800">{loading ? <Loader2 className="animate-spin w-6 h-6"/> : `${responseTime}m`}</h3>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Resolution Rate</p>
              <h3 className="text-3xl font-black text-slate-800">
                {loading ? <Loader2 className="animate-spin w-6 h-6"/> : 
                 stats.total ? `${Math.round((stats.resolved / stats.total) * 100)}%` : '0%'}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
        {/* Incident Frequency Chart Placeholder */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">Incident Volume Trends</h3>
            <select className="bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500/20">
              <option>Oct - Nov 2023</option>
              <option>Sep - Oct 2023</option>
            </select>
          </div>
          <div className="flex-1 rounded-xl bg-slate-50/50 border border-slate-100 flex items-center justify-center relative overflow-hidden">
            {/* Mock Chart Area */}
            <div className="absolute inset-0 flex items-end px-4 pt-10 pb-4 gap-2">
              {[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map((h, i) => (
                <div key={i} className="flex-1 bg-indigo-500/10 rounded-t-md hover:bg-indigo-500/30 transition-colors relative group">
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    Day {i + 1}: {h}
                  </div>
                  <div className="w-full bg-indigo-500 rounded-t-sm transition-all duration-1000 ease-out absolute bottom-0" style={{ height: `${h}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Heatmap/Breakdown Placeholder */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">Incidents by Category</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center space-y-5">
            {loading ? (
               <div className="flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-slate-400" /></div>
            ) : byType.length === 0 ? (
               <div className="text-center text-slate-400 font-medium text-sm">Not enough data to calculate categories.</div>
            ) : byType.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm font-semibold mb-1.5">
                  <span className="text-slate-600">{item.label} <span className="font-normal text-slate-400 ml-1">({item.count} total)</span></span>
                  <span className="text-slate-800">{item.value}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className={`h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Analytics;
