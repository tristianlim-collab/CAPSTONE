import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { incidentAPI } from '../api';
import { toast } from 'react-toastify';
import { FiPlus, FiLogOut, FiAlertCircle, FiMapPin, FiClock } from 'react-icons/fi';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const response = await incidentAPI.getAll();
      setIncidents(response.data.data.incidents);
    } catch (error) {
      toast.error('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      REPORTED: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      VERIFIED: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
      RESPONDING: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
      RESOLVED: 'bg-green-500/20 text-green-500 border-green-500/30',
      CLOSED: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
    };
    return colors[status] || colors.REPORTED;
  };

  const getIncidentIcon = (type) => {
    return <FiAlertCircle className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-dark-card border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">GAOIRS Reporter</h1>
            <p className="text-sm text-gray-400">Welcome, {user?.name}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            <FiLogOut />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Report Button */}
        <Link
          to="/report"
          className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-white font-medium py-4 rounded-lg transition-colors mb-6"
        >
          <FiPlus className="w-5 h-5" />
          Report New Incident
        </Link>

        {/* Incidents List */}
        <div className="bg-dark-card border border-dark-border rounded-lg">
          <div className="p-4 border-b border-dark-border">
            <h2 className="text-lg font-semibold text-white">My Incidents</h2>
            <p className="text-sm text-gray-400 mt-1">
              {incidents.length} {incidents.length === 1 ? 'report' : 'reports'}
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading incidents...</div>
          ) : incidents.length === 0 ? (
            <div className="p-8 text-center">
              <FiAlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No incidents reported yet</p>
              <Link
                to="/report"
                className="inline-block mt-4 text-primary hover:underline"
              >
                Report your first incident
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-dark-border">
              {incidents.map((incident) => (
                <div key={incident.id} className="p-4 hover:bg-dark-bg/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Incident Code & Type */}
                      <div className="flex items-center gap-2 mb-2">
                        {getIncidentIcon(incident.type)}
                        <span className="font-mono text-sm text-primary">
                          {incident.incident_code}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-dark-bg text-gray-400">
                          {incident.type.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-gray-300 text-sm mb-3">{incident.description}</p>

                      {/* Location & Time */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <FiMapPin className="w-3 h-3" />
                          <span>
                            {incident.barangay?.name || 'Unknown Location'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          <span>
                            {new Date(incident.created_at).toLocaleDateString('en-PH', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          incident.status
                        )}`}
                      >
                        {incident.status}
                      </span>
                    </div>
                  </div>

                  {/* Photo */}
                  {incident.photo_url && (
                    <div className="mt-3">
                      <img
                        src={incident.photo_url}
                        alt="Incident"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
