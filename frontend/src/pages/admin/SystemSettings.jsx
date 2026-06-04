import React, { useMemo, useState, useEffect } from 'react';
import { Settings, Save, Globe, Database, ShieldCheck, Mail, Key, Bell, MessageSquare, Smartphone, Shield, ShieldAlert, Users, Copy, Check, ToggleLeft, ToggleRight, Loader2, Eye, EyeOff, BookOpen, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { systemConfigAPI } from '../../api';
import toast from 'react-hot-toast';

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState('general');

  // ─── System Configurations State ───
  const [configs, setConfigs] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Show/Hide password toggle
  const [showSecrets, setShowSecrets] = useState({});

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      const res = await systemConfigAPI.getAll();
      if (res.data?.data) {
        setConfigs(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load system configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigChange = (key, value, isEncrypted = false, description = '') => {
    setConfigs(prev => ({
      ...prev,
      [key]: {
        value: value === '********' ? prev[key]?.value || '********' : value,
        is_encrypted: isEncrypted,
        description
      }
    }));
  };

  const handleSaveConfigs = async () => {
    try {
      setIsSaving(true);
      const toastId = toast.loading('Saving configurations...');
      await systemConfigAPI.update(configs);
      toast.success('Configurations saved successfully!', { id: toastId });
      fetchConfigs(); // Refresh to update '********' masks
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save configurations');
    } finally {
      setIsSaving(false);
    }
  };

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
    { id: 'support', label: 'Help & Documentation', icon: <HelpCircle size={18} /> },
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
        <button
          onClick={handleSaveConfigs}
          disabled={isSaving || isLoading}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-medium transition-all shadow-sm shadow-indigo-600/20 active:scale-95"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {isSaving ? 'Saving...' : 'Save Changes'}
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
              {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8 text-slate-400" /></div>
              ) : (
                <form className="space-y-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-700">Organization Name</label>
                    <input type="text" value={configs.SYSTEM_NAME?.value || configs.SYSTEM_NAME || ''} onChange={(e) => handleConfigChange('SYSTEM_NAME', e.target.value)} placeholder="City Disaster Risk Reduction Council" className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-slate-700">Support Email</label>
                      <input type="email" value={configs.SUPPORT_EMAIL?.value || configs.SUPPORT_EMAIL || ''} onChange={(e) => handleConfigChange('SUPPORT_EMAIL', e.target.value)} placeholder="support@gaoirs.gov.ph" className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white" />
                    </div>
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-slate-700">Hotline Number</label>
                      <input type="tel" value={configs.HOTLINE_NUMBER?.value || configs.HOTLINE_NUMBER || ''} onChange={(e) => handleConfigChange('HOTLINE_NUMBER', e.target.value)} placeholder="+63 2 XXXX XXXX" className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-700">Primary Timezone</label>
                    <select value={configs.TIMEZONE?.value || configs.TIMEZONE || 'Asia/Manila'} onChange={(e) => handleConfigChange('TIMEZONE', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white text-slate-700">
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
              )}
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
                  <button
                    onClick={() => toast.info('Advanced role creation is locked for system stability. Use the User Management module to assign fixed roles.')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm active:scale-95"
                  >
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

          {/* ─── SMTP Server Tab ─── */}
          {activeTab === 'mail' && (
            <>
              <div className="mb-6 pb-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-2 flex items-center gap-2">
                  <Mail size={20} className="text-indigo-600" />
                  SMTP Email Server
                </h3>
                <p className="text-sm text-slate-500">Configure outgoing mail server for alerts and notifications.</p>
              </div>
              {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8 text-slate-400" /></div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-slate-700">SMTP Host</label>
                      <input type="text" value={configs.SMTP_HOST?.value || configs.SMTP_HOST || ''} onChange={(e) => handleConfigChange('SMTP_HOST', e.target.value)} placeholder="smtp.example.com" className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white" />
                    </div>
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-slate-700">SMTP Port</label>
                      <input type="number" value={configs.SMTP_PORT?.value || configs.SMTP_PORT || ''} onChange={(e) => handleConfigChange('SMTP_PORT', e.target.value)} placeholder="587" className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-700">SMTP User</label>
                    <input type="text" value={configs.SMTP_USER?.value || configs.SMTP_USER || ''} onChange={(e) => handleConfigChange('SMTP_USER', e.target.value)} placeholder="api_user" className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white" />
                  </div>
                  <div className="space-y-3 relative">
                    <label className="block text-sm font-bold text-slate-700">SMTP Password</label>
                    <div className="relative">
                      <input type={showSecrets['SMTP_PASS'] ? 'text' : 'password'} value={configs.SMTP_PASS?.value === '********' ? '********' : (configs.SMTP_PASS?.value || configs.SMTP_PASS || '')} onChange={(e) => handleConfigChange('SMTP_PASS', e.target.value, true)} placeholder="••••••••" className="w-full px-4 py-2 pr-10 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white" />
                      <button type="button" onClick={() => setShowSecrets(p => ({ ...p, SMTP_PASS: !p.SMTP_PASS }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                        {showSecrets['SMTP_PASS'] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">This value is encrypted at rest. Enter a new password to change it.</p>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-700">From Address</label>
                    <input type="email" value={configs.SMTP_FROM?.value || configs.SMTP_FROM || ''} onChange={(e) => handleConfigChange('SMTP_FROM', e.target.value)} placeholder="noreply@gaoirs.gov.ph" className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white" />
                  </div>
                </div>
              )}
            </>
          )}



          {activeTab === 'support' && (
            <div className="space-y-6">
              <div className="mb-6 pb-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-2 flex items-center gap-2">
                  <HelpCircle size={20} className="text-indigo-600" />
                  Support & Documentation
                </h3>
                <p className="text-sm text-slate-500">Access the full system operational manual and user guides.</p>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                  <BookOpen size={32} />
                </div>
                <h4 className="text-xl font-black text-slate-800 tracking-tight mb-2">GAOIRS Operational Manual</h4>
                <p className="text-sm text-slate-600 max-w-sm mb-6 leading-relaxed">
                  Need help navigating the system? Our comprehensive user guide covers everything from incident reporting to advanced geospatial analytics.
                </p>
                <Link 
                  to="/admin/guide"
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Eye size={18} />
                  Open User Guide
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <h5 className="font-bold text-slate-800 mb-2">Project Defense?</h5>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Show the panelists our Objective 4 alignment by demonstrating the built-in documentation module. It covers all 5 required system features.
                  </p>
                </div>
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <h5 className="font-bold text-slate-800 mb-2">Technical Support</h5>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Questions about the ML forecasting or geofencing logic can be found in the "Advanced Analysis" section of the guide.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ─── Placeholder for other tabs ─── */}
          {!['general', 'roles', 'notifications', 'mail', 'secrets', 'support'].includes(activeTab) && (
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
