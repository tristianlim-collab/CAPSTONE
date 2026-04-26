import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Users, ShieldAlert, AlertTriangle, 
  Activity, BarChart3, Bell, Settings, LogOut, Search,
  Menu, X, FileText
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Incident Reports', path: '/admin/verification', icon: <FileText size={20} /> },
    { name: 'User Management', path: '/admin/users', icon: <Users size={20} /> },
    { name: 'Roles & Permissions', path: '/admin/roles', icon: <ShieldAlert size={20} /> },
    { name: 'Incident Categories', path: '/admin/categories', icon: <AlertTriangle size={20} /> },
    { name: 'Analytics & Reports', path: '/admin/analytics', icon: <BarChart3 size={20} /> },
    { name: 'Notification Settings', path: '/admin/notifications', icon: <Bell size={20} /> },
    { name: 'System Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  const currentPage = navItems.find(item => location.pathname.startsWith(item.path))?.name || 'Overview';

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
      {/* Sidebar Overlay for mobile */}
      {!sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(true)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? '-translate-x-full lg:translate-x-0 w-0 lg:w-72' : 'translate-x-0 w-72'
        } fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out shadow-sm`}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200">
              <ShieldAlert className="text-white" size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">GAOIRS</h2>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Administration</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-6 overflow-y-auto px-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Main Menu</p>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={`group flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className={`${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`}>
                    {item.icon}
                  </div>
                  <span className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 shadow-sm" />
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Profile / Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center font-bold text-white shadow-inner flex-shrink-0">
              {user?.name?.substring(0, 2)?.toUpperCase() || 'SA'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'System Admin'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || 'admin@gaoirs.systems'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900">{currentPage}</h1>
              <p className="text-sm text-slate-500 hidden sm:block">Manage your system settings and monitor activities.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* Search (Mock UI) */}
            <div className="hidden md:flex relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 bg-slate-100 hover:bg-slate-200/60 focus:bg-white border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-100 border-transparent focus:border-indigo-300 rounded-lg w-64"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-white"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-[#F8FAFC] p-6 lg:p-10 hide-scrollbar">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;