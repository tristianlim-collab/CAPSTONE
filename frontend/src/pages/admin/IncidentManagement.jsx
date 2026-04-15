import React, { useState } from 'react';
import { Layers, Plus, Filter, Search, Tag, EyeOff, CheckCircle } from 'lucide-react';

const IncidentManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 1, code: 'FIRE', name: 'Fire / Explosion', severity: 'HIGH', count: 124, status: 'Active', color: 'orange' },
    { id: 2, code: 'MED', name: 'Medical Emergency', severity: 'HIGH', count: 489, status: 'Active', color: 'blue' },
    { id: 3, code: 'POL', name: 'Crime / Police', severity: 'CRITICAL', count: 56, status: 'Active', color: 'indigo' },
    { id: 4, code: 'RESCUE', name: 'Rescue / Disaster', severity: 'HIGH', count: 21, status: 'Active', color: 'emerald' },
    { id: 5, code: 'TRF', name: 'Traffic / Accident', severity: 'MEDIUM', count: 320, status: 'Active', color: 'yellow' },
    { id: 6, code: 'ANML', name: 'Animal Control', severity: 'LOW', count: 8, status: 'Disabled', color: 'slate' },
  ];

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Incident Categories</h2>
          <p className="text-sm text-slate-500 mt-1">Manage emergency classifications, routing, and severity defaults.</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-sm shadow-indigo-600/20 active:scale-95">
          <Plus size={18} />
          New Category
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:max-w-xs group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search categories..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium">
              <Filter size={16} />
              Filter
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest">
                <th className="px-6 py-4 font-bold">Category Code & Name</th>
                <th className="px-6 py-4 font-bold">Default Severity</th>
                <th className="px-6 py-4 font-bold">Total Reports</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-${c.color}-100 text-${c.color}-600 flex items-center justify-center shrink-0`}>
                        <Layers size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-[15px]">{c.name}</p>
                        <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mt-0.5 flex items-center gap-1">
                          <Tag size={10} /> CODE: {c.code}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md border
                      ${c.severity === 'CRITICAL' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                        c.severity === 'HIGH' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                        c.severity === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {c.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                    {c.count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {c.status === 'Active' ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                        <CheckCircle size={14} className="text-emerald-500" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <EyeOff size={14} /> Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[13px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
                      Edit Routing
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default IncidentManagement;
