import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, Plus, Truck, AlertCircle, Loader2, Edit2, Trash2, X } from 'lucide-react';
import { responseUnitAPI, barangayAPI } from '../../api';
import toast from 'react-hot-toast';

const ResponseUnitManagement = () => {
  const [units, setUnits] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ unit_name: '', unit_type: 'POLICE', contact_number: '', barangay_id: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [unitsRes, brgyRes] = await Promise.all([
         responseUnitAPI.getAll(),
         barangayAPI.getAll()
      ]);
      if (unitsRes.data?.data) setUnits(unitsRes.data.data);
      if (brgyRes.data) setBarangays(brgyRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
      toast.error('Failed to load response units');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (unit = null) => {
    if (unit) {
      setEditingId(unit.unit_id);
      setFormData({
        unit_name: unit.unit_name,
        unit_type: unit.unit_type,
        contact_number: unit.contact_number || '',
        barangay_id: unit.barangay_id || ''
      });
    } else {
      setEditingId(null);
      setFormData({ unit_name: '', unit_type: 'POLICE', contact_number: '', barangay_id: '' });
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
      const payload = {
         ...formData,
         barangay_id: formData.barangay_id === '' ? null : formData.barangay_id
      };
      
      if (editingId) {
        await responseUnitAPI.update(editingId, payload);
        toast.success('Unit updated successfully');
      } else {
        await responseUnitAPI.create(payload);
        toast.success('Unit registered successfully');
      }
      closeModal();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save unit');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this unit?")) {
      try {
        await responseUnitAPI.delete(id);
        toast.success('Unit deleted successfully');
        fetchData();
      } catch (err) {
        toast.error('Failed to delete unit');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'AVAILABLE': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Available</span>;
      case 'BUSY': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Busy</span>;
      case 'OFFLINE': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Offline</span>;
      case 'ON_BREAK': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> On Break</span>;
      default: return null;
    }
  };

  const filteredUnits = units.filter(u => u.unit_name.toLowerCase().includes(searchQuery.toLowerCase()) || u.unit_type.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Response Units</h2>
          <p className="text-sm text-slate-500 mt-1">Manage and track all connected dispatch units in the field.</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-sm shadow-indigo-600/20 active:scale-95">
          <Plus size={18} />
          Register Unit
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Units</p>
            <h3 className="text-2xl font-black text-slate-800">{loading ? <Loader2 className="animate-spin w-5 h-5"/> : units.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Truck size={24} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Available</p>
            <h3 className="text-2xl font-black text-emerald-600">{loading ? <Loader2 className="animate-spin w-5 h-5 text-emerald-500"/> : units.filter(u => u.availability_status === 'AVAILABLE').length}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:max-w-xs group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search units..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest">
                <th className="px-6 py-4 font-bold">Unit Identifier</th>
                <th className="px-6 py-4 font-bold">Type</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Base Location</th>
                <th className="px-6 py-4 font-bold">Contact</th>
                <th className="px-6 py-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></td></tr>
              ) : filteredUnits.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400 font-medium">No units found.</td></tr>
              ) : filteredUnits.map((u) => (
                <tr key={u.unit_id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{u.unit_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest border border-slate-200 bg-slate-100 text-slate-700">
                      {u.unit_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(u.availability_status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {u.barangay?.name || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">
                    {u.contact_number || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(u)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(u.unit_id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
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
                <h3 className="font-bold text-slate-800 text-lg">{editingId ? 'Edit Unit Details' : 'Register New Unit'}</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-1 rounded-md transition-colors border border-slate-200">
                   <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Unit Name / Callsign</label>
                    <input required type="text" value={formData.unit_name} onChange={e => setFormData({...formData, unit_name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none" placeholder="e.g. Engine 54" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Unit Type</label>
                    <select value={formData.unit_type} onChange={e => setFormData({...formData, unit_type: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none bg-slate-50">
                       <option value="POLICE">Police Unit</option>
                       <option value="FIRE">Fire Engine</option>
                       <option value="AMBULANCE">Ambulance / EMS</option>
                       <option value="RESCUE">Rescue Team</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Base Station (Barangay)</label>
                    <select value={formData.barangay_id} onChange={e => setFormData({...formData, barangay_id: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none bg-slate-50">
                       <option value="">-- Unassigned (System-Wide) --</option>
                       {barangays.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                       ))}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Contact Number</label>
                    <input type="text" value={formData.contact_number} onChange={e => setFormData({...formData, contact_number: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none" placeholder="+63 900 000 0000" />
                 </div>
                 <div className="pt-2">
                    <button disabled={saving} type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm shadow-indigo-600/30 flex justify-center items-center gap-2 transition-all disabled:opacity-50">
                       {saving ? <Loader2 size={18} className="animate-spin" /> : null} {editingId ? 'Save Changes' : 'Register Unit'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default ResponseUnitManagement;
