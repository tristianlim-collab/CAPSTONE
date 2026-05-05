import React, { useState, useEffect } from 'react';
import { Megaphone, Send, Loader2, Users, MapPin, Shield, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import api, { barangayAPI } from '../../api';
import toast from 'react-hot-toast';

const CHANNELS = [
  { value: 'DASHBOARD', label: 'In-App Dashboard', icon: <Shield size={16} /> },
  { value: 'SMS', label: 'SMS', icon: <Send size={16} /> },
  { value: 'EMAIL', label: 'Email', icon: <Send size={16} /> },
  { value: 'PUSH', label: 'Push Notification', icon: <Megaphone size={16} /> },
];

const SEVERITY_LEVELS = [
  { value: 'INFO', label: 'Informational', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'WARNING', label: 'Warning', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'CRITICAL', label: 'Critical / Emergency', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

const BroadcastAlerts = () => {
  const [barangays, setBarangays] = useState([]);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [form, setForm] = useState({
    title: '',
    message_body: '',
    channel: 'DASHBOARD',
    severity: 'INFO',
    target_type: 'ALL',
    target_role: '',
    target_barangay_id: '',
  });

  useEffect(() => {
    barangayAPI.getAll().then(r => {
      const d = r.data?.data || r.data || [];
      setBarangays(Array.isArray(d) ? d : []);
    }).catch(() => {});
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/audit', { params: { action: 'BROADCAST_ALERT', limit: 20 } });
      setHistory(res.data?.data?.logs || []);
    } catch { setHistory([]); }
    finally { setLoadingHistory(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message_body.trim()) { toast.error('Message body is required'); return; }
    if (form.target_type === 'ROLE' && !form.target_role) { toast.error('Select a target role'); return; }
    if (form.target_type === 'BARANGAY' && !form.target_barangay_id) { toast.error('Select a target barangay'); return; }
    try {
      setSending(true);
      const payload = {
        title: form.title || `${form.severity} Alert`,
        message_body: form.message_body,
        channel: form.channel,
        target_type: form.target_type,
        target_role: form.target_type === 'ROLE' ? form.target_role : undefined,
        target_barangay_id: form.target_type === 'BARANGAY' ? form.target_barangay_id : undefined,
      };
      const res = await api.post('/notifications/broadcast', payload);
      toast.success(res.data?.message || 'Broadcast sent!');
      setForm({ title: '', message_body: '', channel: 'DASHBOARD', severity: 'INFO', target_type: 'ALL', target_role: '', target_barangay_id: '' });
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send broadcast');
    } finally { setSending(false); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const parseDetails = (d) => { try { return JSON.parse(d); } catch { return {}; } };

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Emergency Broadcasts</h2>
        <p className="text-sm text-slate-500 mt-1">Send mass notifications and emergency alerts to system users.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Compose Form */}
        <div className="lg:col-span-2 border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Megaphone size={18} className="text-indigo-600" /> Compose Alert</h3>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Alert Title</label>
              <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Typhoon Warning" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Message Body *</label>
              <textarea required rows={4} value={form.message_body} onChange={e => setForm({...form, message_body: e.target.value})} placeholder="Enter your broadcast message here…" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Severity</label>
              <div className="flex gap-2">
                {SEVERITY_LEVELS.map(s => (
                  <button type="button" key={s.value} onClick={() => setForm({...form, severity: s.value})}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${form.severity === s.value ? s.color : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Channel</label>
              <select value={form.channel} onChange={e => setForm({...form, channel: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Target Audience</label>
              <select value={form.target_type} onChange={e => setForm({...form, target_type: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none mb-2">
                <option value="ALL">All Users</option>
                <option value="ROLE">By Role</option>
                <option value="BARANGAY">By Barangay</option>
              </select>
              {form.target_type === 'ROLE' && (
                <select value={form.target_role} onChange={e => setForm({...form, target_role: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                  <option value="">-- Select Role --</option>
                  <option value="REPORTER">Reporters</option>
                  <option value="RESPONSE_UNIT">Response Units</option>
                  <option value="ADMIN">Admins</option>
                </select>
              )}
              {form.target_type === 'BARANGAY' && (
                <select value={form.target_barangay_id} onChange={e => setForm({...form, target_barangay_id: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                  <option value="">-- Select Barangay --</option>
                  {barangays.map(b => <option key={b.barangay_id || b.id} value={b.barangay_id || b.id}>{b.name}</option>)}
                </select>
              )}
            </div>
            <div className="pt-2">
              <button disabled={sending} type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm shadow-indigo-600/30 flex justify-center items-center gap-2 transition-all disabled:opacity-50 active:scale-95">
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Send Broadcast
              </button>
            </div>
          </form>
        </div>

        {/* History */}
        <div className="lg:col-span-3 border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Clock size={18} className="text-slate-400" /> Broadcast History</h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4 font-bold">Title</th><th className="px-6 py-4 font-bold">Target</th><th className="px-6 py-4 font-bold">Recipients</th><th className="px-6 py-4 font-bold">Sent By</th><th className="px-6 py-4 font-bold">Date</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {loadingHistory ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></td></tr>
                ) : history.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">No broadcasts sent yet.</td></tr>
                ) : history.map(log => {
                  const d = parseDetails(log.details);
                  return (
                    <tr key={log.log_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4"><div className="font-bold text-slate-800 text-sm">{d.title || 'Alert'}</div><div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">{d.message_body}</div></td>
                      <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest border border-slate-200 bg-slate-100 text-slate-700">{d.target_type}{d.target_role ? ` • ${d.target_role}` : ''}</span></td>
                      <td className="px-6 py-4 text-sm font-semibold text-indigo-600">{d.recipients_count || '—'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{log.user?.name || 'System'}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{fmt(log.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BroadcastAlerts;
