import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Clock, Info, ShieldAlert, AlertTriangle, ExternalLink } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    if (notification.delivery_status !== 'READ') {
      markAsRead(notification.notification_id);
    }
    
    // Navigate based on incident or message content
    if (notification.incident_id) {
       // Check if we are admin or response to route correctly
       const currentPath = window.location.pathname;
       if (currentPath.startsWith('/admin')) {
         navigate(`/admin/verification?id=${notification.incident_id}`);
       } else if (currentPath.startsWith('/response')) {
         navigate(`/response/dashboard?id=${notification.incident_id}`);
       }
    }
    setIsOpen(false);
  };

  const getIcon = (notification) => {
    const severity = notification.incident?.severity || 'info';
    if (severity === 'CRITICAL') return <ShieldAlert className="text-red-500" size={18} />;
    if (severity === 'HIGH') return <AlertTriangle className="text-orange-500" size={18} />;
    return <Info className="text-blue-500" size={18} />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-all duration-200 ${
          isOpen ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
        }`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-900">Notifications</h3>
            <div className="flex gap-3">
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Mark all as read
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[440px] overflow-y-auto overflow-x-hidden hide-scrollbar">
            {loading && notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-sm font-medium text-slate-500">Synchronizing alerts...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5">
                  <Bell className="text-slate-300" size={32} />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No new notifications</h4>
                <p className="text-xs text-slate-400 mt-2 px-6">You're all caught up! New alerts will appear here as they arrive.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-5 py-3.5 flex gap-4 cursor-pointer hover:bg-slate-50 transition-all duration-200 relative group ${
                      notification.delivery_status !== 'READ' ? 'bg-indigo-50/20' : ''
                    }`}
                  >
                    {notification.delivery_status !== 'READ' && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-r-full"></div>
                    )}
                    
                    <div className="flex-shrink-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                        notification.delivery_status !== 'READ' ? 'bg-white ring-2 ring-indigo-100' : 'bg-slate-50 ring-1 ring-slate-100'
                      }`}>
                        {getIcon(notification)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className={`text-[13px] leading-[1.5] mb-1.5 break-words line-clamp-2 ${
                        notification.delivery_status !== 'READ' ? 'font-bold text-slate-900' : 'font-medium text-slate-500'
                      }`}>
                        {notification.message_body}
                      </p>
                      
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tight">
                          <Clock size={10} className="shrink-0" />
                          {formatDistanceToNow(new Date(notification.sent_at), { addSuffix: true })}
                        </span>
                        
                        {notification.incident?.incident_code && (
                           <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md uppercase border border-indigo-100 transition-colors group-hover:bg-indigo-100/50">
                              {notification.incident.incident_code}
                           </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex items-center">
                      {notification.delivery_status !== 'READ' ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.notification_id);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-indigo-500 opacity-0 group-hover:opacity-100 shadow-sm hover:border-indigo-200 transition-all duration-200 translate-x-2 group-hover:translate-x-0"
                          title="Mark as read"
                        >
                          <Check size={16} strokeWidth={3} />
                        </button>
                      ) : (
                        <Check size={14} className="text-slate-300 opacity-40 shrink-0" strokeWidth={3} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 bg-white text-center">
            <button 
              onClick={() => {
                setIsOpen(false);
                const currentPath = window.location.pathname;
                if (currentPath.startsWith('/admin')) navigate('/admin/audit-logs');
                else navigate('/response/notifications');
              }}
              className="px-4 py-1.5 text-[11px] font-extrabold text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all uppercase tracking-widest"
            >
              System Activity Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
