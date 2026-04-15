import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiGrid, FiPieChart, FiShield, FiLayers, FiMap, FiFileText, FiSettings, FiLogOut } from 'react-icons/fi';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: FiGrid, label: 'Dashboard' },
    { path: '/admin/analytics', icon: FiPieChart, label: 'Analytics' },
    { path: '/admin/operations', icon: FiShield, label: 'Operations' },
    { path: '/admin/resources', icon: FiLayers, label: 'Resources' },
    { path: '/admin/map', icon: FiMap, label: 'Map View' },
    { path: '/admin/reports', icon: FiFileText, label: 'Reports' },
    { path: '/admin/settings', icon: FiSettings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar - Dark Purple/Indigo from Figma */}
      <aside className="w-64 bg-[#2D2A70] text-gray-300 flex flex-col hidden md:flex shrink-0">
        {/* Profile / Logo Area */}
        <div className="p-6 border-b border-white/10 flex flex-col h-24 justify-center">
          <h1 className="text-xl font-bold tracking-tight text-white">GIRS Admin</h1>
          <p className="text-xs text-[#a5b4fc] mt-1">System Administrator</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-6 py-3 transition-colors text-sm font-medium ${
                      isActive
                        ? 'bg-[#4338CA] text-white border-l-4 border-white'
                        : 'text-[#c7d2fe] hover:bg-[#3730A3] hover:text-white border-l-4 border-transparent'
                    }`}
                  >
                    <Icon className="w-5 h-5 opacity-90" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile / Logout */}
        <div className="p-4 border-t border-white/10 bg-[#252261]">
          <div className="flex flex-col gap-3">
             <div className="flex items-center gap-3 px-2 py-2 bg-[#312E81] rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                  SA
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">System Admin</p>
                  <p className="text-xs text-[#a5b4fc] truncate">admin@girs.com</p>
                </div>
             </div>
             <button
               onClick={handleLogout}
               className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#c7d2fe] hover:text-white hover:bg-white/5 rounded-lg transition-colors"
             >
               <FiLogOut className="w-4 h-4" />
               <span>Logout</span>
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col w-full h-screen overflow-hidden bg-[#F9FAFB]">
        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;