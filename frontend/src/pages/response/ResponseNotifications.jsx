import React, { useState, useEffect } from 'react';
import { Bell, Info, AlertTriangle, CheckCircle, Loader2, Radio } from 'lucide-react';
import { useSocketContext } from '../../context/SocketContext';
import api from '../../api';
import toast from 'react-hot-toast';

export default function ResponseNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { on, connected } = useSocketContext();

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    const unsub1 = on('new_incident', (incident) => {
      const newNotif = {
        id: `rt-${Date.now()}`,
        text: `New emergency reported: ${incident.incident_code} - ${incident.incident_type?.name || 'Emergency'}`,
        time: 'Just now',
        type: 'alert',
        isNew: true,
        timestamp: new Date(),
      };
      setNotifications(prev => [newNotif, ...prev]);
    });

    const unsub2 = on('incident_status_updated', (data) => {
      const newNotif = {
        id: `rt-status-${Date.now()}`,
        text: `Incident ${data.incident_code || ''} status changed to ${data.status}`,
        time: 'Just now',
        type: data.status === 'RESOLVED' ? 'success' : 'info',
        isNew: true,
        timestamp: new Date(),
      };
      setNotifications(prev => [newNotif, ...prev]);
    });

    const unsub3 = on('new_assignment', (data) => {
      const newNotif = {
        id: `rt-assign-${Date.now()}`,
        text: `New dispatch assigned: ${data.incident?.incident_code || 'Unknown'} → ${data.unit?.unit_name || 'Unit'}`,
        time: 'Just now',
        type: 'alert',
        isNew: true,
        timestamp: new Date(),
      };
      setNotifications(prev => [newNotif, ...prev]);
    });

    const unsub4 = on('backup_requested', (data) => {
      const newNotif = {
        id: `rt-backup-${Date.now()}`,
        text: `🆘 Backup requested for incident ${data.incident_code || 'Unknown'}`,
        time: 'Just now',
        type: 'alert',
        isNew: true,
        timestamp: new Date(),
      };
      setNotifications(prev => [newNotif, ...prev]);
    });

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, [on]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      const data = res.data?.data || res.data || [];
      const mapped = (Array.isArray(data) ? data : []).map(n => ({
        id: n.notification_id,
        text: n.message_body,
        time: getTimeAgo(n.sent_at),
        type: n.delivery_status === 'SENT' ? 'info' : 'alert',
        isNew: false,
        timestamp: new Date(n.sent_at),
      }));
      setNotifications(mapped);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      // If endpoint doesn't exist yet, just show empty
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getIcon = (type) => {
    switch (type) {
      case 'alert': return <AlertTriangle size={18} className="text-orange-500" />;
      case 'success': return <CheckCircle size={18} className="text-emerald-500" />;
      default: return <Info size={18} className="text-blue-500" />;
    }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isNew: false })));
    toast.success('All notifications marked as read');
  };

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in max-w-4xl mx-auto w-full p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Bell size={24} className="text-slate-600" />
            Notifications
            {notifications.filter(n => n.isNew).length > 0 && (
              <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {notifications.filter(n => n.isNew).length}
              </span>
            )}
          </h2>
          <button 
            onClick={markAllRead}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Mark all as read
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <Loader2 size={28} className="animate-spin text-slate-400 mb-3" />
            <p className="text-sm text-slate-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Bell size={28} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No notifications</h3>
            <p className="text-sm text-slate-500">You'll see alerts here when incidents are reported or updated.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-pointer ${n.isNew ? 'bg-blue-50/30' : ''}`}
              >
                <div className="mt-0.5 p-2 bg-slate-100/50 rounded-full">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1">
                  <p className={`text-[15px] text-slate-800 ${n.isNew ? 'font-bold' : 'font-semibold'}`}>{n.text}</p>
                  <span className="text-xs font-medium text-slate-400 mt-1 block">{n.time}</span>
                </div>
                {n.isNew && (
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
