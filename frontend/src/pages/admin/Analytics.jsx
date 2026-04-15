import React from 'react';
import { BarChart3, TrendingUp, Download, Calendar, PieChart, Activity, Clock } from 'lucide-react';

const Analytics = () => {
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
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-indigo-600/20 shadow-sm text-sm active:scale-95">
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Avg. Response Time', value: '4m 12s', change: '-12%', trend: 'down', icon: <Clock size={20} className="text-emerald-500" /> },
          { title: 'Incidents Resolved', value: '1,204', change: '+5.4%', trend: 'up', icon: <Activity size={20} className="text-indigo-500" /> },
          { title: 'Unit Utilization', value: '78%', change: '+2.1%', trend: 'up', icon: <PieChart size={20} className="text-orange-500" /> },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform">
                {kpi.icon}
              </div>
              <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${kpi.trend === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-emerald-600 bg-emerald-50'}`}>
                <TrendingUp size={12} className={kpi.trend === 'down' ? 'rotate-180' : ''} />
                {kpi.change}
              </span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{kpi.title}</p>
              <h4 className="text-3xl font-black text-slate-800 tracking-tight mt-1">{kpi.value}</h4>
            </div>
          </div>
        ))}
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
              {[40, 60, 45, 80, 55, 90, 75, 60, 85, 40, 50, 70].map((h, i) => (
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
            {[
              { label: 'Medical Emergency', value: 45, color: 'bg-blue-500' },
              { label: 'Fire & Rescue', value: 25, color: 'bg-orange-500' },
              { label: 'Crime / Security', value: 20, color: 'bg-rose-500' },
              { label: 'Traffic Accident', value: 10, color: 'bg-yellow-500' }
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm font-semibold mb-1.5">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="text-slate-800">{item.value}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${item.value}%` }} />
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
