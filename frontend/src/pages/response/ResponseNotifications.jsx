import React from 'react';
import { Bell, Info, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ResponseNotifications() {
  const notifications = [
    { id: 1, text: "New emergency assigned: INC-102 Fire in Villamonte", time: "2 mins ago", type: "alert", icon: <AlertTriangle size={18} className="text-orange-500" /> },
    { id: 2, text: "Incident resolved: INC-098 Medical Emergency", time: "1 hour ago", type: "success", icon: <CheckCircle size={18} className="text-emerald-500" /> },
    { id: 3, text: "System maintenance scheduled for tonight at 2AM", time: "1 day ago", type: "info", icon: <Info size={18} className="text-blue-500" /> },
  ];

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in max-w-4xl mx-auto w-full p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
             Notifications
          </h2>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Mark all as read</button>
        </div>
        <div className="divide-y divide-slate-100">
          {notifications.map((n) => (
            <div key={n.id} className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="mt-0.5 p-2 bg-slate-100/50 rounded-full">
                {n.icon}
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-slate-800">{n.text}</p>
                <span className="text-xs font-medium text-slate-400 mt-1 block">{n.time}</span>
              </div>
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
