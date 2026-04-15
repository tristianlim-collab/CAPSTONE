import React, { useState } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Sliders, ToggleLeft, ToggleRight, Save } from 'lucide-react';

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    email_critical: true,
    email_daily: false,
    sms_dispatch: true,
    sms_alerts: true,
    push_new: true,
    push_updates: false,
  });

  const toggle = (key) => setSettings({ ...settings, [key]: !settings[key] });

  const renderToggle = (key, label, description) => (
    <div className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-colors cursor-pointer" onClick={() => toggle(key)}>
      <div className="pr-4">
        <p className="font-semibold text-slate-800 text-[15px]">{label}</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
      </div>
      <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:ring-offset-2 ${settings[key] ? 'bg-indigo-600' : 'bg-slate-200'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[key] ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Bell size={24} className="text-indigo-600" />
            Notification Rules
          </h2>
          <p className="text-sm text-slate-500 mt-1">Configure global and role-specific alerting methodologies.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-sm shadow-indigo-600/20 active:scale-95">
          <Save size={18} />
          Save Changes
        </button>
      </div>

      <div className="space-y-8">
        
        {/* Email Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-white text-indigo-600 rounded-lg shadow-sm">
              <Mail size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">Email Notifications</h3>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">SMTP Provider: SendGrid (Active)</p>
            </div>
          </div>
          <div className="p-2 space-y-1">
            {renderToggle('email_critical', 'Critical Incident Summaries', 'Send immediate email blasts to all admins for CRITICAL priority events.')}
            <div className="h-px bg-slate-100 mx-4" />
            {renderToggle('email_daily', 'Daily Digest Reports', 'Send automated 24-hour summary logs every night at midnight.')}
          </div>
        </div>

        {/* SMS Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-white text-emerald-600 rounded-lg shadow-sm">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">SMS dispatch</h3>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Gateway: Twilio (Operational)</p>
            </div>
          </div>
          <div className="p-2 space-y-1">
            {renderToggle('sms_dispatch', 'Unit Dispatch Alerts', 'Send automated SMS to field responder units when they are assigned a ticket.')}
            <div className="h-px bg-slate-100 mx-4" />
            {renderToggle('sms_alerts', 'Citizen Status Updates', 'Send SMS updates to the reporting citizen when units are dispatched or arrive.')}
          </div>
        </div>

        {/* Push Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-white text-rose-600 rounded-lg shadow-sm">
              <Smartphone size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">WebSocket & Push</h3>
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
    </div>
  );
};

export default NotificationSettings;
