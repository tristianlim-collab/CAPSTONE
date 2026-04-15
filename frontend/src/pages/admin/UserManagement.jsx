import React, { useState } from 'react';
import { Users, Search, Filter, Plus, MoreVertical, Edit2, Trash2, ShieldAlert } from 'lucide-react';

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for UI presentation
  const users = [
    { id: 1, name: 'Juan Dela Cruz', email: 'juan@example.com', role: 'REPORTER', status: 'Active', date: 'Oct 15, 2026' },
    { id: 2, name: 'Maria Santos', email: 'maria.santos@police.gov.ph', role: 'RESPONSE_UNIT', status: 'Active', date: 'Oct 14, 2026' },
    { id: 3, name: 'Ernesto Padilla', email: 'admin@gaoirs.systems', role: 'ADMIN', status: 'Active', date: 'Oct 10, 2026' },
    { id: 4, name: 'Luisa Gomez', email: 'luisa.g@hospital.org', role: 'RESPONSE_UNIT', status: 'Inactive', date: 'Oct 08, 2026' },
    { id: 5, name: 'Carlos Ray', email: 'carlos@example.com', role: 'REPORTER', status: 'Suspended', date: 'Oct 02, 2026' },
  ];

  const getRoleBadge = (role) => {
    const badges = {
      ADMIN: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      RESPONSE_UNIT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      REPORTER: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return badges[role] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Active': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active</span>;
      case 'Inactive': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Inactive</span>;
      case 'Suspended': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-600 border border-red-200"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Suspended</span>;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in">
      
      {/* Page Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Users</h2>
          <p className="text-sm text-slate-500 mt-1">Manage user accounts, roles, and access credentials.</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-sm shadow-indigo-600/20 active:scale-95">
          <Plus size={18} />
          Create User
        </button>
      </div>

      {/* Analytics / Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Users</p>
            <h3 className="text-2xl font-black text-slate-800">1,248</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Response Units</p>
            <h3 className="text-2xl font-black text-slate-800">84</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:max-w-xs group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
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
                <th className="px-6 py-4 font-bold">User Details</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Role</th>
                <th className="px-6 py-4 font-bold">Date Joined</th>
                <th className="px-6 py-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-200 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0 border border-white shadow-sm">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(u.status)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest border ${getRoleBadge(u.role)}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                    {u.date}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-slate-50 overflow-hidden rounded-b-2xl">
          <span>Showing 1 to 5 of 1,248 users</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-slate-200 rounded-md bg-white text-slate-400 cursor-not-allowed">Prevent</button>
            <button className="px-3 py-1 border border-slate-200 rounded-md bg-white hover:bg-slate-50 text-slate-700 font-medium transition-colors">Next</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserManagement;
