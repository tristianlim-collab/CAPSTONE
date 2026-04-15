import React from 'react';
import { ChevronLeft, User, Phone, LogOut, Settings, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ReporterProfile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
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
        <span className="font-semibold text-slate-800 text-lg">Profile</span>
        <div className="w-10"></div> {/* Spacer for centering */}
      </header>

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto pb-8">
        
        {/* Profile Card */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4 border-4 border-white shadow-sm">
            <User className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">{user?.name || 'Citizen User'}</h2>
          <p className="text-slate-500 text-sm mt-1">{user?.email || 'user@example.com'}</p>
        </div>

        {/* Info Categories */}
        <div className="space-y-4">
          
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-4 flex items-center gap-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                <span className="text-slate-700 mt-0.5 block">{user?.phone || '+63 (000) 000-0000'}</span>
              </div>
            </div>
            <div className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Role</span>
                <span className="text-slate-700 mt-0.5 block">Verified Reporter</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden divide-y divide-slate-100">
            <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left" onClick={() => navigate('/reporter/my-reports')}>
              <span className="text-slate-700 font-medium">My Incident Reports</span>
              <ChevronLeft className="w-5 h-5 text-slate-400 rotate-180" />
            </button>
            <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left">
              <span className="text-slate-700 font-medium">Emergency Contacts</span>
              <ChevronLeft className="w-5 h-5 text-slate-400 rotate-180" />
            </button>
            <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left">
              <span className="text-slate-700 font-medium">App Settings</span>
              <ChevronLeft className="w-5 h-5 text-slate-400 rotate-180" />
            </button>
          </div>

        </div>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="mt-8 w-full p-4 bg-red-50 text-red-600 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Log Out</span>
        </button>

      </div>
    </div>
  );
};

export default ReporterProfile;
