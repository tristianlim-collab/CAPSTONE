import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Plus, MoreVertical, Edit2, Trash2, ShieldAlert, Loader2, X, Power } from 'lucide-react';
import { userAPI, authAPI } from '../../api';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'REPORTER', contact_number: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userAPI.getAll();
      if (res.data?.data) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingId(user.user_id);
      setFormData({
        name: user.name,
        email: user.email,
        password: '', // Leave blank when editing to not change unless typed
        role: user.role,
        contact_number: user.contact_number || ''
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', email: '', password: '', role: 'REPORTER', contact_number: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingId) {
        // We do update
        await userAPI.update(editingId, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          contact_number: formData.contact_number
        });
        toast.success('User updated successfully');
      } else {
        // Create via auth register (which backend accepts)
        if (!formData.password) {
           toast.error('Password is required for new users');
           setSaving(false);
           return;
        }
        await authAPI.register(formData);
        toast.success('User account created');
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this user?")) {
      try {
        await userAPI.delete(id);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (err) {
        toast.error('Failed to delete user');
      }
    }
  };

  const handleToggleStatus = async (id) => {
     try {
        await userAPI.toggleStatus(id);
        toast.success('User status updated');
        fetchUsers();
     } catch (err) {
        toast.error('Failed to toggle status');
     }
  };

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
      default: return null;
    }
  };

  const filteredUsers = users.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in relative">
      
      {/* Page Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Users</h2>
          <p className="text-sm text-slate-500 mt-1">Manage user accounts, roles, and access credentials.</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-sm shadow-indigo-600/20 active:scale-95">
          <Plus size={18} />
          Create User
        </button>
      </div>

      {/* Analytics / Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Users</p>
            <h3 className="text-2xl font-black text-slate-800">{loading ? <Loader2 className="animate-spin w-5 h-5"/> : users.length.toLocaleString()}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Response Units</p>
            <h3 className="text-2xl font-black text-slate-800">{loading ? <Loader2 className="animate-spin w-5 h-5"/> : users.filter(u => u.role === 'RESPONSE_UNIT').length.toLocaleString()}</h3>
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
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400 font-medium">No users found.</td></tr>
              ) : filteredUsers.map((u) => (
                <tr key={u.user_id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-200 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0 border border-white shadow-sm uppercase">
                        {(u.name?.[0] || 'U')}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(u.is_active !== false ? 'Active' : 'Inactive')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest border uppercase ${getRoleBadge(u.role)}`}>
                      {(u.role || 'USER').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(u)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleToggleStatus(u.user_id)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors" title="Toggle Access">
                        <Power size={16} />
                      </button>
                      <button onClick={() => handleDelete(u.user_id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal}></div>
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-fade-in">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-lg">{editingId ? 'Edit User Details' : 'Register User Account'}</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-1 rounded-md transition-colors border border-slate-200">
                   <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Full Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Email Address</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none" />
                 </div>
                 {!editingId && (
                   <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Account Password</label>
                      <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none" placeholder="Required for new accounts" />
                   </div>
                 )}
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Phone Number</label>
                    <input type="text" value={formData.contact_number} onChange={e => setFormData({...formData, contact_number: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none" placeholder="+63 900 000 0000" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">System Role</label>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none bg-slate-50">
                       <option value="REPORTER">Reporter (Citizen)</option>
                       <option value="RESPONSE_UNIT">Response Unit</option>
                       <option value="ADMIN">System Administrator</option>
                    </select>
                 </div>
                 
                 <div className="pt-2">
                    <button disabled={saving} type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm shadow-indigo-600/30 flex justify-center items-center gap-2 transition-all disabled:opacity-50">
                       {saving ? <Loader2 size={18} className="animate-spin" /> : null} {editingId ? 'Save Changes' : 'Create Account'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;
