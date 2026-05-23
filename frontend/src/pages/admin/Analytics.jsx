import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Download, Calendar, Activity, Clock, CheckCircle, Loader2, PlayCircle } from 'lucide-react';
import { analyticsAPI } from '../../api';
import TrendForecast from '../../components/admin/TrendForecast';
import KDEHeatmap from '../../components/admin/KDEHeatmap';
import { toast } from 'react-hot-toast';

const Analytics = () => {
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0 });
  const [responseTime, setResponseTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);

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

  const handleExportCSV = () => {
    const resolutionRate = stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0;

    const csvData = [
      ['Metric', 'Value'],
      ['Total Incidents', stats.total],
      ['Active Incidents', stats.active],
      ['Resolved Incidents', stats.resolved],
      ['Average Response Time (minutes)', responseTime],
      ['Resolution Rate (%)', resolutionRate]
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `analytics-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-indigo-600/20 shadow-sm text-sm active:scale-95" onClick={handleExportCSV}>
            <Download size={16} />
            Export CSV
          </button>
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
