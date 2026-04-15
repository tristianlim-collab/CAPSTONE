import React from 'react';
import { Shield, ShieldAlert, Key, Users, Copy, Check } from 'lucide-react';

const RolesPermissions = () => {
  const roles = [
    { name: 'Super Admin', users: 2, icon: <ShieldAlert size={20} className="text-rose-500" />, permissions: ['All Access', 'System Settings', 'API Keys'], color: 'rose' },
    { name: 'Dispatcher', users: 15, icon: <Shield size={20} className="text-indigo-500" />, permissions: ['Assign Units', 'Update Incidents', 'View Analytics'], color: 'indigo' },
    { name: 'Responder Admin', users: 8, icon: <Shield size={20} className="text-emerald-500" />, permissions: ['Manage Units', 'View Own Incidents', 'Shift Planning'], color: 'emerald' },
    { name: 'Analyst', users: 4, icon: <Shield size={20} className="text-blue-500" />, permissions: ['View Analytics', 'Export Reports'], color: 'blue' },
  ];

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Key size={24} className="text-indigo-600" />
            Roles & Permissions
          </h2>
          <p className="text-sm text-slate-500 mt-1">Control access levels across the system modules.</p>
        </div>
        <button className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-sm active:scale-95">
          New Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <button className={`text-sm font-semibold text-${r.color}-600 hover:text-${r.color}-700`}>
                Edit Role
              </button>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Duplicate Role">
                <Copy size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default RolesPermissions;
