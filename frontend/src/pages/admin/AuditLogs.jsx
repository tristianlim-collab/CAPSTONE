import React, { useState, useEffect } from 'react';
import { ScrollText, Search, Loader2, ChevronLeft, ChevronRight, Filter, User, Clock } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';

const ACTION_COLORS = {
  BROADCAST_ALERT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  UPDATED_USER: 'bg-amber-50 text-amber-700 border-amber-200',
  DELETED_UNIT: 'bg-rose-50 text-rose-700 border-rose-200',
  VERIFIED_INCIDENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CREATED_UNIT: 'bg-blue-50 text-blue-700 border-blue-200',
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [distinctActions, setDistinctActions] = useState([]);
  const limit = 20;

  useEffect(() => { fetchActions(); }, []);
  useEffect(() => { fetchLogs(); }, [page, actionFilter]);

  const fetchActions = async () => {
    try {
      const res = await api.get('/audit/actions');
      setDistinctActions(res.data?.data || []);
    } catch { /* ignore */ }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (actionFilter) params.action = actionFilter;
      const res = await api.get('/audit', { params });
      const d = res.data?.data || {};
      setLogs(d.logs || []);
      setTotal(d.total || 0);
    } catch {
      toast.error('Failed to load audit logs');
    } finally { setLoading(false); }
  };

  const totalPages = Math.ceil(total / limit);
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

  const getActionBadge = (action) => {
    const color = ACTION_COLORS[action] || 'bg-slate-100 text-slate-700 border-slate-200';
    return <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest border ${color}`}>{action}</span>;
  };

  const filteredLogs = search
    ? logs.filter(l => l.user?.name?.toLowerCase().includes(search.toLowerCase()) || l.action?.toLowerCase().includes(search.toLowerCase()) || l.resource?.toLowerCase().includes(search.toLowerCase()) || l.details?.toLowerCase().includes(search.toLowerCase()))
    : logs;

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Audit Logs</h2>
          <p className="text-sm text-slate-500 mt-1">Track all system actions for accountability and compliance.</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <ScrollText size={18} className="text-slate-400" />
          <span className="font-semibold">{total}</span> total entries
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 bg-slate-50/50">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input type="text" placeholder="Search by user, action, resource…" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white" />
          </div>
          <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
            <option value="">All Actions</option>
            {distinctActions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest">
              <th className="px-6 py-4 font-bold">Timestamp</th>
              <th className="px-6 py-4 font-bold">User</th>
              <th className="px-6 py-4 font-bold">Action</th>
              <th className="px-6 py-4 font-bold">Resource</th>
              <th className="px-6 py-4 font-bold">Details</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">No audit log entries found.</td></tr>
              ) : filteredLogs.map(log => (
                <tr key={log.log_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600"><Clock size={14} className="text-slate-400" />{fmt(log.created_at)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-[10px] font-bold text-white shrink-0">{log.user?.name?.substring(0,2)?.toUpperCase() || '??'}</div>
                      <div><div className="text-sm font-semibold text-slate-800">{log.user?.name || 'Unknown'}</div><div className="text-[11px] text-slate-400">{log.user?.role}</div></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getActionBadge(log.action)}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700 font-medium">{log.resource}</div>
                    {log.resource_id && <div className="text-[11px] text-slate-400 font-mono truncate max-w-[120px]">{log.resource_id}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-slate-500 truncate max-w-[250px]" title={log.details || ''}>{log.details ? (log.details.length > 80 ? log.details.substring(0,80) + '…' : log.details) : '—'}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-sm text-slate-500">Page {page} of {totalPages} ({total} entries)</span>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronLeft size={18} /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} className={`w-8 h-8 rounded-lg text-sm font-medium ${page === n ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>{n}</button>
              ))}
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronRight size={18} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
