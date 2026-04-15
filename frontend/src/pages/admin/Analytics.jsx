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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Incidents</p>
              <h3 className="text-3xl font-black text-slate-800">0</h3>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <Activity size={24} />
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg px-2 py-1 w-fit">
            <TrendingUp size={16} className="mr-1" />
            +0% from last month
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Avg. Response Time</p>
              <h3 className="text-3xl font-black text-slate-800">0m 0s</h3>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
              <Clock size={24} />
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-rose-600 bg-rose-50 rounded-lg px-2 py-1 w-fit">
            <TrendingUp size={16} className="mr-1" />
            +0m from last month
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Resolution Rate</p>
              <h3 className="text-3xl font-black text-slate-800">0%</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg px-2 py-1 w-fit">
            <TrendingUp size={16} className="mr-1" />
            +0% from last month
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
            {[
              { label: 'Medical Emergency', value: 0, color: 'bg-blue-500' },
              { label: 'Fire', value: 0, color: 'bg-orange-500' },
              { label: 'Crime / Security', value: 0, color: 'bg-rose-500' },
              { label: 'Traffic Accident', value: 0, color: 'bg-yellow-500' }
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
