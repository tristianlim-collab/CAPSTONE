import React from 'react';
import { Settings, Save, Globe, Database, ShieldCheck, Mail, Key } from 'lucide-react';

const SystemSettings = () => {
  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Settings size={24} className="text-indigo-600" />
            Global Setup
          </h2>
          <p className="text-sm text-slate-500 mt-1">Configure foundational system identifiers and environment hooks.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-sm shadow-indigo-600/20 active:scale-95">
          <Save size={18} />
          Save Global Config
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Navigation/Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'general', label: 'General Info', icon: <Globe size={18} />, active: true },
            { id: 'database', label: 'Database Sync', icon: <Database size={18} />, active: false },
            { id: 'security', label: 'Security Policies', icon: <ShieldCheck size={18} />, active: false },
            { id: 'mail', label: 'SMTP Server', icon: <Mail size={18} />, active: false },
            { id: 'secrets', label: 'API Keys', icon: <Key size={18} />, active: false },
          ].map(item => (
            <button 
              key={item.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-left transition-colors text-sm ${
                item.active 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' 
                  : 'bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'
              }`}
            >
              <div className={item.active ? 'text-indigo-600' : 'text-slate-400'}>{item.icon}</div>
              {item.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
          
          <div className="mb-6 pb-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-2">General Info</h3>
            <p className="text-sm text-slate-500">Core system identity details. Appears on all citizen-facing interfaces.</p>
          </div>

          <form className="space-y-6">
            
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700">Organization Name</label>
              <input 
                type="text" 
                defaultValue="City Disaster Risk Reduction Council"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700">Support Email</label>
                <input 
                  type="email" 
                  defaultValue="support@cityresponse.gov.ph"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700">Hotline Number</label>
                <input 
                  type="tel" 
                  defaultValue="911"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700">Primary Timezone</label>
              <select className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white text-slate-700">
                <option value="Asia/Manila">Asia/Manila (PHT)</option>
                <option value="UTC">Coordinated Universal Time (UTC)</option>
              </select>
            </div>

            <div className="pt-4 pb-2">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-800">
                <div className="mt-0.5"><Save size={18} className="text-amber-600" /></div>
                <div>
                  <h4 className="font-bold text-sm">System Maintenance Window</h4>
                  <p className="text-xs mt-1 text-amber-700/80">Changing core settings may cause temporary disruption. Schedule updates during off-peak hours.</p>
                </div>
              </div>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default SystemSettings;
