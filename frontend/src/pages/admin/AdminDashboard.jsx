import React, { useEffect, useState } from 'react';
import LiveMap from '../../components/map/LiveMap';
import { Activity, ShieldAlert, Users, TrendingUp, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Incidents', value: '12', icon: <Activity size={24} />, color: 'orange' },
          { label: 'Units Deployed', value: '8', icon: <ShieldAlert size={24} />, color: 'indigo' },
          { label: 'Resolved Today', value: '45', icon: <TrendingUp size={24} />, color: 'emerald' },
          { label: 'Pending Alerts', value: '3', icon: <AlertTriangle size={24} />, color: 'red' },
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">
        
        {/* Map Area */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 p-2 flex flex-col relative overflow-hidden">
          <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm border border-slate-200 pointer-events-none">
            <h3 className="font-bold text-slate-800 text-sm">Live Dispatch Map</h3>
            <p className="text-xs text-slate-500 font-medium">Tracking {Math.floor(Math.random() * 20) + 5} active units</p>
          </div>
          <div className="flex-1 rounded-[20px] overflow-hidden bg-slate-100 relative">
            <LiveMap zoom={13} center={[14.6760, 121.0437]} />
          </div>
        </div>

        {/* Live Feed / Sidebar */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-[15px]">Recent Dispatches</h3>
            <span className="text-[10px] font-bold tracking-widest bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md uppercase">Live Feed</span>
          </div>
          
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div className="group p-4 border border-rose-100 bg-rose-50/30 rounded-2xl relative overflow-hidden transition-all hover:bg-rose-50 hover:shadow-sm cursor-pointer">
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
              <div className="flex items-center justify-between mb-1 text-xs font-bold uppercase tracking-wider text-rose-500">
                <span>Alert</span>
                <span>Just now</span>
              </div>
              <h4 className="font-bold text-slate-800 text-[15px] mb-1">INC-102: Structure Fire</h4>
              <p className="text-sm font-medium text-slate-600">Assigned <span className="font-bold text-rose-700">Engine 04</span> en route</p>
            </div>
            
            <div className="text-center text-slate-400 py-4 text-sm font-medium">
              No recent dispatches.
            </div>

            <button className="w-full py-3 text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors mt-2">
              View All Dispatches
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
