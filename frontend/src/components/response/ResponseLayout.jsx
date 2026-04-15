import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiMapPin, FiList, FiLogOut, FiPower } from 'react-icons/fi';

const ResponseLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [onShift, setOnShift] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleShift = () => {
    setOnShift(!onShift);
    // TODO: Update backend with shift status
  };

  const menuItems = [
    { path: '/response/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: '/response/incidents', icon: FiList, label: 'Incidents' },
    { path: '/response/map', icon: FiMapPin, label: 'Live Map' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1E1B4B] text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold">GAOIRS</h1>
          <p className="text-sm text-gray-300 mt-1">Response Unit</p>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-white/10">
          <p className="text-sm text-gray-300">Logged in as</p>
          <p className="font-semibold text-white mt-1">{user?.name}</p>

          {/* Shift Toggle */}
          <button
            onClick={toggleShift}
            className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              onShift
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            <FiPower className="w-4 h-4" />
            <span className="text-sm font-medium">
              {onShift ? 'On Shift' : 'Off Shift'}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
          >
            <FiLogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default ResponseLayout;
