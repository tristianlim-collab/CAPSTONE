import React, { useState } from 'react';
import { User, Shield, Phone, Mail, Award, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ResponseProfile() {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in max-w-4xl mx-auto w-full p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 h-32 relative"></div>
        <div className="px-6 pb-6 relative">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center absolute -top-12 shadow-md">
            <User size={40} className="text-slate-400" />
          </div>
          
          <div className="mt-14 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{user?.name || 'Unit Officer'}</h2>
              <p className="text-emerald-600 font-bold text-sm tracking-wide uppercase mt-1 flex items-center gap-1.5 border border-emerald-200 bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                On Duty
              </p>
            </div>
            <button className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
              Edit Profile
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider border-b border-slate-100 pb-2">Unit Information</h3>
              <div className="flex items-center gap-3">
                <Shield className="text-blue-500 w-5 h-5" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Assignment</p>
                  <p className="text-sm font-semibold text-slate-800">Medical Unit 01</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Award className="text-orange-500 w-5 h-5" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Role</p>
                  <p className="text-sm font-semibold text-slate-800">Response Unit Officer</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider border-b border-slate-100 pb-2">Contact Details</h3>
              <div className="flex items-center gap-3">
                <Phone className="text-emerald-500 w-5 h-5" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Phone</p>
                  <p className="text-sm font-semibold text-slate-800">{user?.contact_number || '+63 912 345 6789'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="text-indigo-500 w-5 h-5" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Email</p>
                  <p className="text-sm font-semibold text-slate-800">{user?.email || 'officer@gaoirs.local'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 mt-6">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><Key className="w-5 h-5 text-slate-400" /> Account Security</h3>
        <p className="text-sm text-slate-500 mb-4">Update your password to keep your account secure.</p>
        <button className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
          Change Password
        </button>
      </div>
    </div>
  );
}
