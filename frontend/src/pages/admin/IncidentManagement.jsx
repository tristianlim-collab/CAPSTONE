import React, { useState, useEffect } from 'react';
import { Layers, Plus, Filter, Search, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { incidentTypeAPI } from '../../api';
import toast from 'react-hot-toast';

const IncidentManagement = () => {
  const defaultSeverityTemplate = {
    LOW: '',
    HIGH: '',
    CRITICAL: ''
  };

  const parseSeverityConfig = (rawDescription) => {
    if (!rawDescription) {
      return { summary: '', severityDescriptions: { ...defaultSeverityTemplate } };
    }

    try {
      const parsed = JSON.parse(rawDescription);
      return {
        summary: parsed.summary || '',
        severityDescriptions: {
          LOW: parsed.severityDescriptions?.LOW || '',
          HIGH: parsed.severityDescriptions?.HIGH || '',
          CRITICAL: parsed.severityDescriptions?.CRITICAL || ''
        }
      };
    } catch {
      // Backward compatibility with existing plain-text descriptions
      return { summary: rawDescription, severityDescriptions: { ...defaultSeverityTemplate } };
    }
  };

  const buildSeverityConfig = (data) => {
    return JSON.stringify({
      summary: data.summary?.trim() || '',
      severityDescriptions: {
        LOW: data.severity_low?.trim() || '',
        HIGH: data.severity_high?.trim() || '',
        CRITICAL: data.severity_critical?.trim() || ''
      }
    });
  };

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    color_code: 'blue',
    icon_label: 'Layers',
    summary: '',
    severity_low: '',
    severity_high: '',
    severity_critical: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await incidentTypeAPI.getAll();
      if (Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (category = null) => {
    if (category) {
      const parsedConfig = parseSeverityConfig(category.description);
      setEditingId(category.type_id);
      setFormData({ 
        name: category.name, 
        color_code: category.color_code || 'blue', 
        icon_label: category.icon_label || 'Layers', 
        summary: parsedConfig.summary,
        severity_low: parsedConfig.severityDescriptions.LOW,
        severity_high: parsedConfig.severityDescriptions.HIGH,
        severity_critical: parsedConfig.severityDescriptions.CRITICAL
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        color_code: 'blue',
        icon_label: 'Layers',
        summary: '',
        severity_low: '',
        severity_high: '',
        severity_critical: ''
      });
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
        name: formData.name,
        color_code: formData.color_code,
        icon_label: formData.icon_label,
        description: buildSeverityConfig(formData)
      };
      if (editingId) {
        await incidentTypeAPI.update(editingId, payload);
        toast.success('Category updated successfully');
      } else {
        await incidentTypeAPI.create(payload);
        toast.success('Category created successfully');
      }
      closeModal();
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await incidentTypeAPI.delete(id);
        toast.success('Category deleted successfully');
        fetchCategories();
      } catch (err) {
        toast.error('Failed to delete category (Ensure no incidents are assigned to it)');
      }
    }
  };

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Incident Categories</h2>
          <p className="text-sm text-slate-500 mt-1">Manage emergency classifications and type settings.</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-sm shadow-indigo-600/20 active:scale-95">
          <Plus size={18} />
          New Category
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
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
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest">
                <th className="px-6 py-4 font-bold">Category Name</th>
                <th className="px-6 py-4 font-bold">Color Theme</th>
                <th className="px-6 py-4 font-bold">Description</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                 <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></td></tr>
              ) : filteredCategories.length === 0 ? (
                 <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400 font-medium">No categories found.</td></tr>
              ) : filteredCategories.map((c) => (
                <tr key={c.type_id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-${c.color_code || 'blue'}-100 text-${c.color_code || 'blue'}-600 flex items-center justify-center shrink-0`}>
                        <Layers size={18} />
                      </div>
                      <p className="font-bold text-slate-800 text-[15px]">{c.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest border border-slate-200 uppercase bg-${c.color_code}-50 text-${c.color_code}-600 border-${c.color_code}-200`}>
                        {c.color_code || 'None'}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600 max-w-xs truncate">
                    {parseSeverityConfig(c.description).summary || 'Severity templates configured'}
                  </td>
                  <td className="px-6 py-4 text-right">
                     <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(c)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(c.type_id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
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
                <h3 className="font-bold text-slate-800 text-lg">{editingId ? 'Edit Category' : 'New Category'}</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-1 rounded-md transition-colors border border-slate-200">
                   <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Category Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none" placeholder="e.g. Fire Emergency" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Color Theme</label>
                    <div className="grid grid-cols-4 gap-2">
                       {['orange', 'rose', 'blue', 'indigo', 'emerald', 'yellow', 'purple', 'slate'].map(color => (
                          <div key={color} onClick={() => setFormData({...formData, color_code: color})} className={`cursor-pointer h-10 rounded-lg bg-${color}-100 flex items-center justify-center border-2 ${formData.color_code === color ? `border-${color}-500 shadow-sm shadow-${color}-500/20` : 'border-transparent'}`}>
                             <div className={`w-4 h-4 rounded-full bg-${color}-500`}></div>
                          </div>
                       ))}
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Category Summary</label>
                    <textarea value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none h-20 resize-none" placeholder="Brief details about this classification..."></textarea>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Severity Description - LOW</label>
                    <textarea required value={formData.severity_low} onChange={e => setFormData({...formData, severity_low: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none h-16 resize-none" placeholder="Guidance shown when LOW is selected"></textarea>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Severity Description - HIGH</label>
                    <textarea required value={formData.severity_high} onChange={e => setFormData({...formData, severity_high: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none h-16 resize-none" placeholder="Guidance shown when HIGH is selected"></textarea>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Severity Description - CRITICAL</label>
                    <textarea required value={formData.severity_critical} onChange={e => setFormData({...formData, severity_critical: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none h-16 resize-none" placeholder="Guidance shown when CRITICAL is selected"></textarea>
                 </div>
                 <div className="pt-2">
                    <button disabled={saving} type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm shadow-indigo-600/30 flex justify-center items-center gap-2 transition-all disabled:opacity-50">
                       {saving ? <Loader2 size={18} className="animate-spin" /> : null} {editingId ? 'Save Changes' : 'Create Category'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default IncidentManagement;
