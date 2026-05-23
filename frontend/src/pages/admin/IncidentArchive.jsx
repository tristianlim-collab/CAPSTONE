import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Archive, Search, Loader2, Eye, ChevronLeft, ChevronRight, MapPin, CheckCircle2, XCircle, X, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { incidentAPI, incidentTypeAPI, reportAPI } from '../../api';
import toast from 'react-hot-toast';

const STATUS_CFG = {
  RESOLVED:    { label: 'Resolved',    bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  CLOSED:      { label: 'Closed',      bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200',   dot: 'bg-slate-400' },
  FALSE_ALARM: { label: 'False Alarm', bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-200',    dot: 'bg-rose-500' },
};

const IncidentArchive = () => {
  const [incidents, setIncidents] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);
  const PER_PAGE = 15;

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [incRes, tRes] = await Promise.all([incidentAPI.getAll(), incidentTypeAPI.getAll()]);
      const raw = incRes.data?.data || incRes.data || [];
      setIncidents(Array.isArray(raw) ? raw.filter(i => ['RESOLVED','CLOSED','FALSE_ALARM'].includes(i.status)) : []);
      const tRaw = tRes.data?.data || tRes.data || [];
      setTypes(Array.isArray(tRaw) ? tRaw : []);
    } catch { toast.error('Failed to load archive'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format) => {
    try {
      setIsExporting(true);
      setShowExportMenu(false);
      const toastId = toast.loading(`Generating ${format.toUpperCase()} export...`);
      
      const response = await reportAPI.export(format, {
        status: statusFilter,
        type_id: typeFilter
      });
      
      // Create a blob from the response
      let blobType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (format === 'csv') blobType = 'text/csv';
      if (format === 'pdf') blobType = 'application/pdf';
      
      const blob = new Blob([response.data], { type: blobType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from header if possible, else generate one
      let filename = `GAOIRS_Incidents_${new Date().toISOString().slice(0,10)}.${format}`;
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = /filename="([^"]*)"/.exec(disposition);
        if (matches != null && matches[1]) filename = matches[1];
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Export downloaded successfully', { id: toastId });
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to generate export');
    } finally {
      setIsExporting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return incidents.filter(i => {
      if (statusFilter !== 'ALL' && i.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && i.incident_type_id !== typeFilter) return false;
      if (q && !i.incident_code?.toLowerCase().includes(q) && !i.description?.toLowerCase().includes(q) && !i.map_pin_address?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [incidents, statusFilter, typeFilter, search]);

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const typeName = (id) => types.find(t => t.type_id === id)?.name || 'Unknown';
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const counts = useMemo(() => ({
    total: incidents.length,
    resolved: incidents.filter(i => i.status === 'RESOLVED').length,
    closed: incidents.filter(i => i.status === 'CLOSED').length,
    false_alarm: incidents.filter(i => i.status === 'FALSE_ALARM').length,
  }), [incidents]);

  const Badge = ({ status }) => {
    const c = STATUS_CFG[status] || STATUS_CFG.CLOSED;
    return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${c.bg} ${c.text} border ${c.border}`}><span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{c.label}</span>;
  };

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Incident Archive</h2>
          <p className="text-sm text-slate-500 mt-1">Browse and review resolved, closed, and false-alarm incidents.</p>
        </div>
        <div className="relative" ref={exportMenuRef}>
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-medium transition-colors shadow-indigo-600/20 shadow-sm text-sm"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50 animate-fade-in">
              <button onClick={() => handleExport('xlsx')} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left border-b border-slate-50">
                <FileSpreadsheet size={16} className="text-emerald-600" /> Export as Excel
              </button>
              <button onClick={() => handleExport('csv')} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left border-b border-slate-50">
                <FileText size={16} className="text-sky-600" /> Export as CSV
              </button>
              <button onClick={() => handleExport('pdf')} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left">
                <FileText size={16} className="text-rose-600" /> Export as PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[{ label: 'Total Archived', val: counts.total, color: 'text-slate-800' }, { label: 'Resolved', val: counts.resolved, color: 'text-emerald-600' }, { label: 'Closed', val: counts.closed, color: 'text-slate-600' }, { label: 'False Alarms', val: counts.false_alarm, color: 'text-rose-600' }].map(s => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <h3 className={`text-2xl font-black ${s.color}`}>{loading ? <Loader2 className="animate-spin w-5 h-5" /> : s.val}</h3>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 bg-slate-50/50">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input type="text" placeholder="Search by code, description, address…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
            <option value="ALL">All Statuses</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option><option value="FALSE_ALARM">False Alarm</option>
          </select>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
            <option value="ALL">All Types</option>
            {types.map(t => <option key={t.type_id} value={t.type_id}>{t.name}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest">
              <th className="px-6 py-4 font-bold">Incident Code</th><th className="px-6 py-4 font-bold">Type</th><th className="px-6 py-4 font-bold">Status</th><th className="px-6 py-4 font-bold">Location</th><th className="px-6 py-4 font-bold">Reported At</th><th className="px-6 py-4 font-bold text-center">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium">No archived incidents found.</td></tr>
              ) : paginated.map(inc => (
                <tr key={inc.incident_id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4"><div className="font-bold text-slate-800 text-sm">{inc.incident_code}</div><div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">{inc.description}</div></td>
                  <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest border border-slate-200 bg-slate-100 text-slate-700">{typeName(inc.incident_type_id)}</span></td>
                  <td className="px-6 py-4"><Badge status={inc.status} /></td>
                  <td className="px-6 py-4"><div className="flex items-center gap-1.5 text-sm text-slate-600"><MapPin size={14} className="text-slate-400 shrink-0" /><span className="truncate max-w-[180px]">{inc.map_pin_address || 'N/A'}</span></div></td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium whitespace-nowrap">{fmt(inc.reported_at)}</td>
                  <td className="px-6 py-4 text-center"><button onClick={() => setSelected(inc)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="View"><Eye size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-sm text-slate-500">Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronLeft size={18}/></button>
              {Array.from({length: Math.min(totalPages,5)},(_,i)=>i+1).map(n=><button key={n} onClick={()=>setPage(n)} className={`w-8 h-8 rounded-lg text-sm font-medium ${page===n?'bg-indigo-600 text-white':'hover:bg-slate-100 text-slate-600'}`}>{n}</button>)}
              <button disabled={page>=totalPages} onClick={() => setPage(p=>p+1)} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronRight size={18}/></button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg">Incident Details</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-1 rounded-md border border-slate-200"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Code</label><p className="text-sm font-semibold text-slate-800">{selected.incident_code}</p></div>
                <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Status</label><Badge status={selected.status}/></div>
                <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Type</label><p className="text-sm text-slate-700">{typeName(selected.incident_type_id)}</p></div>
                <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Severity</label><p className="text-sm text-slate-700">{selected.severity}</p></div>
                <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Priority</label><p className="text-sm text-slate-700">{selected.priority}</p></div>
                <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Reported At</label><p className="text-sm text-slate-700">{fmt(selected.reported_at)}</p></div>
              </div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Location</label><p className="text-sm text-slate-700 flex items-center gap-1.5"><MapPin size={14} className="text-slate-400"/>{selected.map_pin_address || `${selected.latitude}, ${selected.longitude}`}</p></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description</label><p className="text-sm text-slate-700 leading-relaxed">{selected.description}</p></div>
              {selected.reporter_name && <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Reporter</label><p className="text-sm text-slate-700">{selected.reporter_name}{selected.reporter_phone ? ` • ${selected.reporter_phone}` : ''}</p></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentArchive;
