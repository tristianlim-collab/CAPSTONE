import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, TrendingUp, Download, Calendar, Activity, 
  Clock, CheckCircle, Loader2, PlayCircle, FileText, FileSpreadsheet 
} from 'lucide-react';
import { analyticsAPI, reportAPI } from '../../api';
import TrendForecast from '../../components/admin/TrendForecast';
import KDEHeatmap from '../../components/admin/KDEHeatmap';
import { toast } from 'react-hot-toast';

const Analytics = () => {
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0 });
  const [responseTime, setResponseTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [sumRes, timeRes] = await Promise.all([
          analyticsAPI.getSummary(),
          analyticsAPI.getResponseTime(),
        ]);

        if (sumRes.data?.data) setStats(sumRes.data.data);
        if (timeRes.data?.data) setResponseTime(timeRes.data.data.average_minutes || 0);
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

  const handleRetrain = async () => {
    try {
      setTraining(true);
      await analyticsAPI.train({});
      toast.success('Models retrained with latest data');
    } catch (err) {
      toast.error('Failed to retrain models');
    } finally {
      setTraining(false);
    }
  };

  const handleExport = async (format) => {
    try {
      setIsExporting(true);
      setShowExportMenu(false);
      const toastId = toast.loading(`Generating ${format.toUpperCase()} export...`);
      
      const response = await reportAPI.export(format, {});
      
      let blobType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (format === 'csv') blobType = 'text/csv';
      if (format === 'pdf') blobType = 'application/pdf';
      
      const blob = new Blob([response.data], { type: blobType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
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
          {/* Retrain Button */}
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-all shadow-sm text-sm active:scale-95 disabled:opacity-50"
            onClick={handleRetrain}
            disabled={training}
          >
            {training ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
            Retrain Models
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors shadow-sm text-sm active:scale-95">
            <Calendar size={16} />
            This Month
          </button>

          {/* Export Dropdown Menu */}
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

      {/* KPI Cards (Optional - can be restored if needed) */}
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
        {/* Trend Forecast */}
        <div className="lg:col-span-2">
          <TrendForecast days={7} />
        </div>

        {/* KDE Heatmap Density */}
        <div className="lg:col-span-2 h-[500px]">
          <KDEHeatmap />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
