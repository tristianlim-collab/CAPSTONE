import React from 'react';
import { Bell, Info, AlertTriangle, CheckCircle, Loader2, Clock } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

export default function ResponseNotifications() {
  const { notifications, loading, unreadCount, markAllAsRead, markAsRead } = useNotifications();

  const getIcon = (notification) => {
    const severity = notification.incident?.severity || 'info';
    if (severity === 'CRITICAL') return <AlertTriangle size={18} className="text-red-500" />;
    if (severity === 'HIGH') return <AlertTriangle size={18} className="text-orange-500" />;
    return <Info size={18} className="text-blue-500" />;
  };

  const getBannerColor = (notification) => {
    if (notification.delivery_status !== 'READ') return 'bg-indigo-50/50';
    return '';
  };

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in max-w-4xl mx-auto w-full p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                <Bell size={24} />
             </div>
             <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h2>
                <p className="text-sm text-slate-500 font-medium">Manage and view your recent system activities</p>
             </div>
          </div>
          <button 
            onClick={markAllAsRead}
            className="px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
          >
            Mark all as read
          </button>
        </div>

        {loading && notifications.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center">
            <Loader2 size={32} className="animate-spin text-indigo-500 mb-4" />
            <p className="text-slate-500 font-medium tracking-wide">Retrieving notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Bell size={32} className="text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">All quiet for now</h3>
            <p className="text-slate-500 max-w-xs">You'll see alerts here when incidents are reported or assigned to your unit.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div 
                key={n.notification_id} 
                className={`p-6 flex items-start gap-5 hover:bg-slate-50 transition-colors cursor-pointer group relative ${getBannerColor(n)}`}
                onClick={() => markAsRead(n.notification_id)}
              >
                {n.delivery_status !== 'READ' && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500"></div>
                )}
                
                <div className={`mt-1 p-3 rounded-2xl ${n.delivery_status !== 'READ' ? 'bg-white shadow-sm' : 'bg-slate-100/50'}`}>
                  {getIcon(n)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                     <p className={`text-[15px] leading-relaxed ${n.delivery_status !== 'READ' ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'}`}>
                        {n.message_body}
                     </p>
                     <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 whitespace-nowrap ml-4 uppercase tracking-wider">
                        <Clock size={12} />
                        {formatDistanceToNow(new Date(n.sent_at), { addSuffix: true })}
                     </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2">
                     {n.incident?.incident_code && (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg uppercase tracking-wide">
                           {n.incident.incident_code}
                        </span>
                     )}
                     {n.delivery_status !== 'READ' && (
                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                     )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
