import React, { useState, useEffect } from 'react';
import { FileText, Download, FileSpreadsheet, Plus, AlertCircle, Loader2, Calendar } from 'lucide-react';
import { reportAPI } from '../../api';
import toast from 'react-hot-toast';

const Reports = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await reportAPI.getHistory();
      if (res.data?.data) {
        setHistory(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch report history', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (type, format) => {
    try {
      setGenerating(true);
      const res = await reportAPI.generate({ report_type: type, file_format: format, report_title: `${type.replace('_',' ')} - Q4` });
      if (res.data?.data) {
        toast.success(`${format} Report Generated Successfully`);
        fetchHistory();
      }
    } catch (err) {
      toast.error('Failed to generate report');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const format = doc.file_format.toLowerCase();
      // Use the filters applied during generation if any
      const params = doc.filters_applied || {};
      
      const response = await reportAPI.export(format, params);
      
      // Create blob link to download
      const blob = new Blob([response.data], { 
        type: format === 'pdf' ? 'application/pdf' : 
              format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
              'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${doc.report_title}.${format === 'excel' ? 'xlsx' : format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to download report');
      console.error(err);
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'PDF': return <FileText size={20} className="text-rose-500" />;
      case 'EXCEL': return <FileSpreadsheet size={20} className="text-emerald-500" />;
      case 'CSV': return <FileText size={20} className="text-slate-500" />;
      default: return <FileText size={20} className="text-slate-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Reports</h2>
          <p className="text-sm text-slate-500 mt-1">Generate and export system data for audit and analysis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Plus size={18} className="text-indigo-600"/> Generate New Report</h3>
          </div>
          <div className="p-5 space-y-6 flex-1 text-sm bg-white">
             <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Report Type</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                  <option value="INCIDENT_SUMMARY">Incident Summary</option>
                  <option value="AREA_REPORT">Area Breakdown</option>
                  <option value="RESPONSE_TIME">Response Time KPIs</option>
                  <option value="FULL_EXPORT">Complete Database Export</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Time Range</label>
                <div className="flex gap-2">
                   <button className="flex-1 py-2 bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 rounded-lg rounded-r-none">YTD</button>
                   <button className="flex-1 py-2 bg-white text-slate-600 font-medium border border-slate-200 border-l-0 border-r-0">Q3</button>
                   <button className="flex-1 py-2 bg-white text-slate-600 font-medium border border-slate-200 rounded-lg rounded-l-none">Q4</button>
                </div>
             </div>
             <div className="pt-4 grid grid-cols-2 gap-3 border-t border-slate-100">
                <button 
                  disabled={generating}
                  onClick={() => handleGenerate('INCIDENT_SUMMARY', 'PDF')}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold active:scale-95 transition-all shadow-sm disabled:opacity-50"
                >
                  <FileText size={16}/> PDF PDF
                </button>
                <button 
                  disabled={generating}
                  onClick={() => handleGenerate('INCIDENT_SUMMARY', 'EXCEL')}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 border border-emerald-600 text-white hover:bg-emerald-700 font-bold active:scale-95 transition-all shadow-sm shadow-emerald-600/30 disabled:opacity-50"
                >
                  {generating ? <Loader2 className="animate-spin" size={16}/> : <FileSpreadsheet size={16}/>}
                  EXCEL
                </button>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2 border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Download size={18} className="text-slate-400"/> Generated History</h3>
          </div>
          <div className="overflow-x-auto flex-1 bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4 font-bold">Report Name</th>
                  <th className="px-6 py-4 font-bold">Generated By</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                   <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></td></tr>
                ) : history.length === 0 ? (
                   <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-medium">No reports generated yet.</td></tr>
                ) : history.map((doc) => (
                  <tr key={doc.report_id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0">{getFormatIcon(doc.file_format)}</div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{doc.report_title}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">{doc.report_type.replace('_', ' ')} • {(Math.random() * 4 + 1).toFixed(1)} MB</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-700">{doc.generator?.name || 'System Admin'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-500 font-medium">{new Date(doc.generated_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDownload(doc)}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 text-indigo-600 rounded-lg text-xs font-bold transition-colors active:scale-95 shadow-sm"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
