import React, { useState } from 'react';
import { User, Shield, Phone, Mail, Award, Key, Edit2, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api';
import toast from 'react-hot-toast';

export default function ResponseProfile() {
  const { user, checkAuth } = useAuth();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', email: '', contact_number: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const openEditModal = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      contact_number: user?.contact_number || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await authAPI.updateProfile(formData);
      toast.success('Profile updated successfully');
      setIsEditModalOpen(false);
      await checkAuth(); // refresh user context
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    
    try {
      setSaving(true);
      await authAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password updated successfully');
      setIsPasswordModalOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in max-w-4xl mx-auto w-full p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 h-32 relative"></div>
        <div className="px-6 pb-6 relative">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center absolute -top-12 shadow-md text-3xl font-bold text-slate-500">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : <User size={40} className="text-slate-400" />}
          </div>
          
          <div className="mt-14 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{user?.name || 'Unit Officer'}</h2>
              <p className="text-emerald-600 font-bold text-sm tracking-wide uppercase mt-1 flex items-center gap-1.5 border border-emerald-200 bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                On Duty
              </p>
            </div>
            <button onClick={openEditModal} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
              <Edit2 size={16} /> Edit Profile
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider border-b border-slate-100 pb-2">Unit Information</h3>
              <div className="flex items-center gap-3">
                <Shield className="text-blue-500 w-5 h-5" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Assignment</p>
                  <p className="text-sm font-semibold text-slate-800">{user?.unit?.unit_name || 'Unassigned'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Award className="text-orange-500 w-5 h-5" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Role</p>
                  <p className="text-sm font-semibold text-slate-800">{user?.role === 'RESPONSE_UNIT' ? 'Response Unit Officer' : user?.role}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider border-b border-slate-100 pb-2">Contact Details</h3>
              <div className="flex items-center gap-3">
                <Phone className="text-emerald-500 w-5 h-5" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Phone</p>
                  <p className="text-sm font-semibold text-slate-800">{user?.contact_number || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="text-indigo-500 w-5 h-5" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Email</p>
                  <p className="text-sm font-semibold text-slate-800">{user?.email || 'officer@example.com'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 mt-6">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><Key className="w-5 h-5 text-slate-400" /> Account Security</h3>
        <p className="text-sm text-slate-500 mb-4">Update your password to keep your account secure.</p>
        <button onClick={() => setIsPasswordModalOpen(true)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
          Change Password
        </button>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden animate-fade-in text-left">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-lg">Edit Profile</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-1 rounded-md transition-colors border border-slate-200">
                   <X size={18} />
                </button>
              </div>
              <form onSubmit={handleUpdateProfile} className="p-5 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Full Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none" placeholder="Your Name" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Email Address</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none bg-slate-50" placeholder="you@example.com" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Contact Number</label>
                    <input type="text" value={formData.contact_number} onChange={e => setFormData({...formData, contact_number: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none" placeholder="+63 900 000 0000" />
                 </div>
                 <div className="pt-2">
                    <button disabled={saving} type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm shadow-indigo-600/30 flex justify-center items-center gap-2 transition-all disabled:opacity-50">
                       {saving ? <Loader2 size={18} className="animate-spin" /> : null} Save Changes
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsPasswordModalOpen(false)}></div>
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden animate-fade-in text-left">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-lg">Change Password</h3>
                <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-1 rounded-md transition-colors border border-slate-200">
                   <X size={18} />
                </button>
              </div>
              <form onSubmit={handleUpdatePassword} className="p-5 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Current Password</label>
                    <input required type="password" value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">New Password</label>
                    <input required minLength={6} type="password" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Confirm New Password</label>
                    <input required type="password" value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none" />
                 </div>
                 <div className="pt-2">
                    <button disabled={saving} type="submit" className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-sm shadow-slate-800/30 flex justify-center items-center gap-2 transition-all disabled:opacity-50">
                       {saving ? <Loader2 size={18} className="animate-spin" /> : <Key size={18} />} Update Password
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
