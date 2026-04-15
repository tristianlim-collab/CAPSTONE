import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Radio, User, Clock, CheckCircle2, ShieldAlert, MapPin, Navigation, Navigation2 } from 'lucide-react';

export default function ResponseDashboard() {
  const [isAvailable, setIsAvailable] = useState(true);

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in max-w-6xl mx-auto w-full">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 border-4 border-white shadow-sm">
            <Radio size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Response Dashboard</h1>
            <p className="text-sm text-slate-500 font-medium">Unit: <span className="text-emerald-600">RESCUE-ALPHA-1</span> (Talisay Base)</p>
          </div>
        </div>
        <div className="relative z-10 flex flex-col md:items-end gap-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Status</p>
          <button 
            onClick={() => setIsAvailable(!isAvailable)}
            className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm transition-all shadow-sm active:scale-95 ${
              isAvailable 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-emerald-500/20'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {isAvailable ? 'AVAILABLE FOR DISPATCH' : 'OFF SHIFT / STANDBY'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPI Cards */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/20 blur-2xl rounded-full" />
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Active Incidents</p>
                <p className="text-4xl font-black text-rose-400">2</p>
              </div>
              <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
                <ShieldAlert size={24} />
              </div>
            </div>
            <Link to="/response/incidents" className="relative z-10 mt-6 flex justify-between items-center text-sm font-semibold text-rose-400 hover:text-rose-300 transition-colors group-hover:gap-2">
              View Active Dispatches <Navigation size={16} />
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Resolved Today</p>
                <p className="text-3xl font-black text-emerald-600">5</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Live Feed / Active Job */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-rose-50 border-b border-rose-100 p-4 flex justify-between items-center">
            <h2 className="font-bold text-rose-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Highest Priority Dispatch
            </h2>
            <span className="text-xs font-bold text-rose-600 bg-white px-2 py-1 rounded-md shadow-sm border border-rose-100">
              TIME SENSITIVE
            </span>
          </div>
          
          <div className="p-6 flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">FIRE / RESCUE</span>
                  <span className="text-slate-400 text-sm font-mono font-medium">#FIRE-INC-892</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Severe Structural Fire</h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Reported Time</p>
                <p className="text-sm font-bold text-slate-700 flex items-center gap-1"><Clock size={14} className="text-rose-500"/> 14 mins ago</p>
              </div>
            </div>

            <p className="text-slate-600 mb-6 leading-relaxed">
              Multiple reports of visible flames from the second floor of a commercial building. Possible trapped individuals. Immediate unit response required.
            </p>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <MapPin className="text-slate-400 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Talisay Public Market, Zone 3</p>
                  <p className="text-xs text-slate-500">Est. 4 min drive from your current location</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="text-slate-400 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Reported by: Maria Clara (Verified)</p>
                  <p className="text-xs text-slate-500">+63 912 345 6789</p>
                </div>
              </div>
            </div>
            
            <div className="mt-auto grid grid-cols-2 gap-4">
              <Link to="/response/map" className="flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 py-3 rounded-xl font-bold transition-colors">
                <Navigation2 size={18} /> View on Map
              </Link>
              <button className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 py-3 rounded-xl font-bold transition-colors active:scale-95">
                <CheckCircle2 size={18} /> Accept Dispatch
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Navigation Footer */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <Link to="/response/incidents" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-emerald-300 hover:shadow-md transition-all group">
          <div>
            <h3 className="font-bold text-slate-800">All Dispatches</h3>
            <p className="text-xs text-slate-500 mt-1">View history & pending</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-600 flex items-center justify-center transition-colors">
            <LayoutDashboard size={20} />
          </div>
        </Link>
        <Link to="/response/map" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-300 hover:shadow-md transition-all group">
          <div>
            <h3 className="font-bold text-slate-800">Live Map</h3>
            <p className="text-xs text-slate-500 mt-1">Geospatial overview</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 flex items-center justify-center transition-colors">
            <MapPin size={20} />
          </div>
        </Link>
      </div>

    </div>
  );
}
