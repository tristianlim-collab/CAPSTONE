import { useState, useEffect } from 'react';
import { incidentAPI } from '../../api';
import { toast } from 'react-toastify';
import { Search, Filter, AlertCircle, Clock, MapPin, CheckCircle2, FileText } from 'lucide-react';

const ResponseIncidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchIncidents();
  }, []);

  useEffect(() => {
    filterIncidents();
  }, [filterStatus, searchQuery, incidents]);

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

  const filterIncidents = () => {
    let filtered = incidents;

    // Filter by status
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((i) => i.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (i) =>
          i.incident_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredIncidents(filtered);
  };

  const getStatusColor = (status) => {
    const colors = {
      REPORTED: 'bg-rose-100 text-rose-700 border border-rose-200',
      VERIFIED: 'bg-amber-100 text-amber-700 border border-amber-200',
      RESPONDING: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
      RESOLVED: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      CLOSED: 'bg-slate-100 text-slate-700 border border-slate-200',
    };
    return colors[status] || colors.REPORTED;
  };

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in max-w-6xl mx-auto w-full p-4 md:p-0">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 border-4 border-white shadow-sm">
            <FileText size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">All Incidents</h1>
            <p className="text-sm text-slate-500 font-medium">View and manage incident history</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 relative z-10">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by code or description..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
              <Filter size={18} />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-700"
            >
              <option value="ALL">All Status</option>
              <option value="REPORTED">Reported</option>
              <option value="VERIFIED">Verified</option>
              <option value="RESPONDING">Responding</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>
            Showing <strong className="text-slate-700">{filteredIncidents.length}</strong> of <strong className="text-slate-700">{incidents.length}</strong> incidents
          </span>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative z-10 flex-1">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium text-sm">Loading incident records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                        {incident.incident_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={14} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-700 capitalize">
                          {incident.type.replace('_', ' ').toLowerCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-sm text-slate-600 line-clamp-2 font-medium">
                        {incident.description}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                        <MapPin size={14} className="text-slate-400" />
                        {incident.barangay?.name || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 inline-flex text-[11px] uppercase tracking-wider font-bold rounded-lg ${getStatusColor(
                          incident.status
                        )}`}
                      >
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                        <Clock size={14} className="text-slate-400" />
                        {new Date(incident.created_at).toLocaleString('en-PH', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredIncidents.length === 0 && (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="text-slate-400" size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">No incidents found</h3>
                <p className="text-slate-500 text-sm font-medium">Try adjusting your filters or search query.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseIncidents;
