import React, { useState } from 'react';
import { ChevronLeft, User, Phone, LogOut, Shield, Key, Edit2, X, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api';
import toast from 'react-hot-toast';

const ReporterProfile = () => {
  const navigate = useNavigate();
  const { user, logout, checkAuth } = useAuth();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', email: '', contact_number: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans max-w-[430px] mx-auto shadow-xl relative overflow-hidden">
      {/* Header */}
      <header className="pt-12 pb-4 px-6 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-10 flex items-center justify-between">
        <button 
          onClick={() => navigate('/reporter/home')}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="font-semibold text-slate-800 text-lg">My Profile</span>
        <button onClick={openEditModal} className="p-2 -mr-2 rounded-full hover:bg-slate-100 text-blue-600 transition-colors">
          <Edit2 className="w-5 h-5" />
        </button>
      </header>

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto pb-8">
        
        {/* Profile Card */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-4 border-4 border-white shadow-lg text-3xl font-bold">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : <User />}
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{user?.name || 'Citizen User'}</h2>
          <p className="text-slate-500 text-sm mt-1">{user?.email}</p>
        </div>

        {/* Info Categories */}
        <div className="space-y-4">
          
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-4 flex items-center gap-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                <span className="text-slate-700 mt-0.5 block font-medium">{user?.contact_number || 'Not provided'}</span>
              </div>
            </div>
            <div className="p-4 flex items-center gap-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Role</span>
                <span className="text-slate-700 mt-0.5 block font-medium">{user?.role === 'REPORTER' ? 'Verified Reporter' : user?.role}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden divide-y divide-slate-100">
            <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left" onClick={() => navigate('/reporter/reports')}>
              <div className="flex flex-row items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500"><FileText className="w-4 h-4"/></div>
                 <span className="text-slate-700 font-medium">My Incident Reports</span>
              </div>
              <ChevronLeft className="w-5 h-5 text-slate-400 rotate-180" />
            </button>
            <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left" onClick={() => setIsPasswordModalOpen(true)}>
              <div className="flex flex-row items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Key className="w-4 h-4"/></div>
                 <span className="text-slate-700 font-medium">Change Password</span>
              </div>
              <ChevronLeft className="w-5 h-5 text-slate-400 rotate-180" />
            </button>
          </div>

        </div>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="mt-8 w-full p-4 bg-red-50 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors active:scale-95"
        >
          <LogOut className="w-5 h-5" />
          <span>Log Out</span>
        </button>

      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
           <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden animate-slide-up sm:animate-fade-in text-left">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg">Edit Profile</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-full transition-colors">
                   <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdateProfile} className="p-5 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Full Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none" placeholder="Your Name" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Email Address</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none bg-slate-50" placeholder="you@example.com" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Contact Number</label>
                    <input type="text" value={formData.contact_number} onChange={e => setFormData({...formData, contact_number: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none" placeholder="+63 900 000 0000" />
                 </div>
                 <div className="pt-2">
                    <button disabled={saving} type="submit" className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 flex justify-center items-center gap-2 transition-all disabled:opacity-50 active:scale-95">
                       {saving ? <Loader2 size={18} className="animate-spin" /> : null} Save Changes
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
           <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden animate-slide-up sm:animate-fade-in text-left">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg">Change Password</h3>
                <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-full transition-colors">
                   <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdatePassword} className="p-5 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Current Password</label>
                    <input required type="password" value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">New Password</label>
                    <input required minLength={6} type="password" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Confirm New Password</label>
                    <input required type="password" value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none" />
                 </div>
                 <div className="pt-2">
                    <button disabled={saving} type="submit" className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 transition-all disabled:opacity-50 active:scale-95">
                       {saving ? <Loader2 size={18} className="animate-spin" /> : <Key size={18} />} Update Password
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};

export default ReporterProfile;
