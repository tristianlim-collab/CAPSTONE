import React from 'react';
import { Activity, Server, Cpu, Database, Gauge, SignalHigh, Globe, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';

const SystemMonitoring = () => {
  const metrics = [
    { title: 'API Response Time', value: '42ms', alert: false, icon: <Zap className="text-amber-500" size={24} /> },
    { title: 'Server CPU Load', value: '18%', alert: false, icon: <Cpu className="text-indigo-500" size={24} /> },
    { title: 'Database Connections', value: '841', alert: true, icon: <Database className="text-rose-500" size={24} /> },
    { title: 'Active Sockets', value: '4,102', alert: false, icon: <SignalHigh className="text-emerald-500" size={24} /> },
  ];

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Activity size={24} className="text-indigo-600" />
            System Health
          </h2>
          <p className="text-sm text-slate-500 mt-1">Real-time status of services and infrastructure.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className={`bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group`}>
            {m.alert && (
              <div className="absolute top-0 right-0 w-12 h-12 bg-rose-100 rounded-bl-full flex justify-end items-start p-2 z-0 animate-pulse">
                <AlertTriangle size={14} className="text-rose-600 mr-1 mt-1" />
              </div>
            )}
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform">
                {m.icon}
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{m.title}</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h4 className={`text-2xl font-black ${m.alert ? 'text-rose-600' : 'text-slate-800'}`}>
                    {m.value}
                  </h4>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Services Status */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Server size={18} className="text-indigo-500" /> Core Services
            </h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1.5">
              <CheckCircle2 size={14} /> All Operational
            </span>
          </div>

          <div className="space-y-4">
            {[
              { name: 'Node.js Backend', uptime: '99.9%', ping: '12ms', status: 'operational' },
              { name: 'PostgreSQL Database', uptime: '100%', ping: '4ms', status: 'operational' },
              { name: 'Redis Cache', uptime: '99.9%', ping: '1ms', status: 'operational' },
              { name: 'Socket.IO Server', uptime: '99.8%', ping: '24ms', status: 'operational' },
              { name: 'SMS Gateway API', uptime: '98.5%', ping: '142ms', status: 'degraded' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all group">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${s.status === 'operational' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'}`} />
                  <span className="font-semibold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors">{s.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ping</p>
                    <p className={`text-sm font-bold ${s.ping.length > 4 ? 'text-amber-600' : 'text-slate-600'}`}>{s.ping}</p>
                  </div>
                  <div className="text-right w-16">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Uptime</p>
                    <p className="text-sm font-bold text-emerald-600">{s.uptime}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Network Traffic */}
        <div className="bg-slate-900 rounded-2xl p-5 shadow-sm text-white flex flex-col relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h3 className="font-bold flex items-center gap-2 text-indigo-100">
              <Globe size={18} className="text-indigo-400" /> Live Network
            </h3>
            <span className="flex items-center h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 relative z-10 py-8">
            <Gauge size={64} strokeWidth={1} className="text-indigo-400/50" />
            <div>
              <p className="text-4xl font-black font-mono tracking-tight text-white mb-2">1.2<span className="text-lg text-slate-400 font-sans ml-1">GB/s</span></p>
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Inbound Traffic</p>
            </div>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl relative z-10 border border-slate-700/50">
            <div className="flex justify-between items-center text-xs font-bold text-slate-300">
              <span>Peak Today</span>
              <span className="text-amber-400">2.1 GB/s</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-indigo-500 h-full w-[60%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitoring;
