import React, { useState, useEffect } from 'react';
import {
  BarChart3, Calendar, Activity,
  Clock, CheckCircle, Loader2, PieChart as PieIcon, MapPin
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { analyticsAPI, incidentTypeAPI } from '../../api';
import KDEHeatmap from '../../components/admin/KDEHeatmap';

const COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6'];

const Analytics = () => {
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0 });
  const [responseTime, setResponseTime] = useState(0);
  const [byTypeData, setByTypeData] = useState([]);
  const [byBarangayData, setByBarangayData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [incidentTypes, setIncidentTypes] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [sumRes, timeRes, typeRes, bgyRes, typesRes] = await Promise.all([
          analyticsAPI.getSummary(),
          analyticsAPI.getResponseTime(),
          analyticsAPI.getByType(),
          analyticsAPI.getByBarangay(),
          incidentTypeAPI.getAll()
        ]);

        if (sumRes.data?.data) setStats(sumRes.data.data);
        if (timeRes.data?.data) setResponseTime(timeRes.data.data.average_minutes || 0);

        setByTypeData(typeRes.data?.data || []);
        setByBarangayData(bgyRes.data?.data || []);
        const typesList = Array.isArray(typesRes.data) ? typesRes.data : (typesRes.data?.data || []);
        setIncidentTypes(typesList);
      } catch (err) {
        console.error("Error fetching analytics", err);
        setByTypeData([]);
        setByBarangayData([]);
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

      let filename = `GAOIRS_Incidents_${new Date().toISOString().slice(0, 10)}.${format}`;
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
          <button 
            onClick={() => toast.info('Custom date filtering is available in the detailed Reports module.')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors shadow-sm text-sm active:scale-95"
          >
            <Calendar size={16} />
            This Month
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Incidents</p>
            <h3 className="text-3xl font-black text-slate-800">{loading ? <Loader2 className="animate-spin w-6 h-6 text-indigo-600" /> : (stats.total || 0)}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BarChart3 size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-sky-600 uppercase tracking-widest mb-1">Avg Response</p>
            <h3 className="text-3xl font-black text-slate-800">{loading ? <Loader2 className="animate-spin w-6 h-6 text-sky-600" /> : `${responseTime} mins`}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest mb-1">Active Incidents</p>
            <h3 className="text-3xl font-black text-slate-800">{loading ? <Loader2 className="animate-spin w-6 h-6 text-amber-600" /> : (stats.active || 0)}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Activity size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Resolved Incidents</p>
            <h3 className="text-3xl font-black text-slate-800">{loading ? <Loader2 className="animate-spin w-6 h-6 text-emerald-600" /> : (stats.resolved || 0)}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Charts Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Type Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 mb-4">
            <PieIcon size={18} className="text-indigo-600" />
            Incident Type Distribution
          </h3>
          <p className="text-xs text-slate-500 mb-4">Breakdown of reported emergency incidents by category</p>
          <div className="h-[280px] w-full">
            {byTypeData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No incident data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={byTypeData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={75}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {byTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} incidents`, name]} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Barangay Ranking Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 mb-4">
            <MapPin size={18} className="text-emerald-600" />
            Barangay Incident Ranking
          </h3>
          <p className="text-xs text-slate-500 mb-4">Incident volume ranking across local Barangays</p>
          <div className="h-[280px] w-full">
            {byBarangayData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No barangay data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byBarangayData.slice(0, 8)} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '11px' }} interval={0} angle={-25} textAnchor="end" />
                  <YAxis stroke="#64748b" style={{ fontSize: '11px' }} allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value} incidents`, 'Total']} />
                  <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* KDE Heatmap Density */}
        <div className="lg:col-span-2">
          <KDEHeatmap incidentTypes={incidentTypes} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
