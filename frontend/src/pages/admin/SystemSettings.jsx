import React, { useMemo, useState } from 'react';
import { Settings, Save, Globe, Database, ShieldCheck, Mail, Key, Bell, MessageSquare, Smartphone, Shield, ShieldAlert, Users, Copy, Check, ToggleLeft, ToggleRight } from 'lucide-react';

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState('general');

  // ─── Notification Settings State ───
  const [notifSettings, setNotifSettings] = useState({
    email_critical: true,
    email_daily: false,
    sms_dispatch: true,
    sms_alerts: true,
    push_new: true,
    push_updates: false,
  });
  const toggleNotif = (key) => setNotifSettings({ ...notifSettings, [key]: !notifSettings[key] });

  // ─── Roles Data ───
  const roles = [
    { name: 'Super Admin', users: 2, icon: <ShieldAlert size={20} className="text-rose-500" />, permissions: ['All Access', 'System Settings', 'API Keys'], color: 'rose' },
    { name: 'Dispatcher', users: 15, icon: <Shield size={20} className="text-indigo-500" />, permissions: ['Assign Units', 'Update Incidents', 'View Analytics'], color: 'indigo' },
    { name: 'Responder Admin', users: 8, icon: <Shield size={20} className="text-emerald-500" />, permissions: ['Manage Units', 'View Own Incidents', 'Shift Planning'], color: 'emerald' },
    { name: 'Analyst', users: 4, icon: <Shield size={20} className="text-blue-500" />, permissions: ['View Analytics', 'Export Reports'], color: 'blue' },
  ];

  const navItems = useMemo(() => ([
    { id: 'general', label: 'General Info', icon: <Globe size={18} /> },
    { id: 'roles', label: 'Roles & Permissions', icon: <ShieldCheck size={18} /> },
    { id: 'notifications', label: 'Notification Rules', icon: <Bell size={18} /> },
    { id: 'mail', label: 'SMTP Server', icon: <Mail size={18} /> },
    { id: 'secrets', label: 'API Keys', icon: <Key size={18} /> },
  ]), []);

  const renderToggle = (key, label, description) => (
    <div className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-colors cursor-pointer" onClick={() => toggleNotif(key)}>
      <div className="pr-4">
        <p className="font-semibold text-slate-800 text-[15px]">{label}</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
      </div>
      <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:ring-offset-2 ${notifSettings[key] ? 'bg-indigo-600' : 'bg-slate-200'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifSettings[key] ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Settings size={24} className="text-indigo-600" />
            System Settings
          </h2>
          <p className="text-sm text-slate-500 mt-1">Configure system settings, roles, notifications, and environment hooks.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-sm shadow-indigo-600/20 active:scale-95">
          <Save size={18} />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Navigation/Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-left transition-colors text-sm ${isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                    : 'bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'
                  }`}
              >
                <div className={isActive ? 'text-indigo-600' : 'text-slate-400'}>{item.icon}</div>
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 min-h-[520px]">

          {/* ─── General Info Tab ─── */}
          {activeTab === 'general' && (
            <>
              <div className="mb-6 pb-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-2">General Info</h3>
                <p className="text-sm text-slate-500">Core system identity details. Appears on all citizen-facing interfaces.</p>
              </div>
              <form className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-700">Organization Name</label>
                  <input type="text" defaultValue="City Disaster Risk Reduction Council" className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-700">Support Email</label>
                    <input type="email" defaultValue="support@cityresponse.gov.ph" className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white" />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-700">Hotline Number</label>
                    <input type="tel" defaultValue="911" className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white" />
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
            </>
          )}

          {/* ─── Roles & Permissions Tab ─── */}
          {activeTab === 'roles' && (
            <>
              <div className="mb-6 pb-6 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-2 flex items-center gap-2">
                      <Key size={20} className="text-indigo-600" />
                      Roles & Permissions
                    </h3>
                    <p className="text-sm text-slate-500">Control access levels across the system modules.</p>
                  </div>
                  <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm active:scale-95">
                    New Role
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map((r, i) => (
                  <div key={i} className={`bg-white rounded-2xl p-5 border-t-4 border-${r.color}-500 shadow-sm border-x border-b border-x-slate-200 border-b-slate-200 hover:shadow-md transition-shadow cursor-pointer group`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2.5 rounded-xl bg-${r.color}-50 shrink-0 group-hover:scale-110 transition-transform`}>
                        {r.icon}
                      </div>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                        <Users size={12} /> {r.users} users
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1">{r.name}</h3>
                    <div className="mt-4 flex flex-col gap-2">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Key Permissions</p>
                      {r.permissions.map((p, j) => (
                        <div key={j} className="flex items-center gap-2 text-sm text-slate-600">
                          <Check size={14} className={`text-${r.color}-500 shrink-0`} />
                          <span className="truncate">{p}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                      <button className={`text-sm font-semibold text-${r.color}-600 hover:text-${r.color}-700`}>Edit Role</button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Duplicate Role">
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ─── Notification Rules Tab ─── */}
          {activeTab === 'notifications' && (
            <>
              <div className="mb-6 pb-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-2 flex items-center gap-2">
                  <Bell size={20} className="text-indigo-600" />
                  Notification Rules
                </h3>
                <p className="text-sm text-slate-500">Configure global and role-specific alerting methodologies.</p>
              </div>
              <div className="space-y-6">
                {/* Email */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                    <div className="p-2.5 bg-white text-indigo-600 rounded-lg shadow-sm"><Mail size={18} /></div>
                    <div>
                      <h4 className="font-bold text-slate-800">Email Notifications</h4>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">SMTP Provider: SendGrid (Active)</p>
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    {renderToggle('email_critical', 'Critical Incident Summaries', 'Send immediate email blasts to all admins for CRITICAL priority events.')}
                    <div className="h-px bg-slate-100 mx-4" />
                    {renderToggle('email_daily', 'Daily Digest Reports', 'Send automated 24-hour summary logs every night at midnight.')}
                  </div>
                </div>
                {/* SMS */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                    <div className="p-2.5 bg-white text-emerald-600 rounded-lg shadow-sm"><MessageSquare size={18} /></div>
                    <div>
                      <h4 className="font-bold text-slate-800">SMS Dispatch</h4>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Gateway: Twilio (Operational)</p>
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    {renderToggle('sms_dispatch', 'Unit Dispatch Alerts', 'Send automated SMS to field responder units when they are assigned a ticket.')}
                    <div className="h-px bg-slate-100 mx-4" />
                    {renderToggle('sms_alerts', 'Citizen Status Updates', 'Send SMS updates to the reporting citizen when units are dispatched or arrive.')}
                  </div>
                </div>
                {/* Push */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                    <div className="p-2.5 bg-white text-rose-600 rounded-lg shadow-sm"><Smartphone size={18} /></div>
                    <div>
                      <h4 className="font-bold text-slate-800">WebSocket & Push</h4>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Live Browser Updates</p>
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    {renderToggle('push_new', 'New Incident Audio Alerts', 'Play a siren/chime in the browser when a new high-priority incident is reported.')}
                    <div className="h-px bg-slate-100 mx-4" />
                    {renderToggle('push_updates', 'Silent Status Toasts', 'Show visual toast notifications when units change their operational status.')}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ─── Placeholder for other tabs ─── */}
          {!['general', 'roles', 'notifications'].includes(activeTab) && (
            <div className="text-sm text-slate-500">
              This section is not yet connected. (Tab: <span className="font-semibold text-slate-700">{activeTab}</span>)
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SystemSettings;
