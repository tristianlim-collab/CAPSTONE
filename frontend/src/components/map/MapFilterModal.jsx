import React, { useState, useEffect } from 'react';
import { X, Calendar, Filter } from 'lucide-react';
import { incidentTypeAPI } from '../../api';

const STATUS_OPTIONS = [
  { value: 'REPORTED', label: 'Reported' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'RESPONDING', label: 'Responding' },
  { value: 'ON_SCENE', label: 'On Scene' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'FALSE_ALARM', label: 'False Alarm' },
  { value: 'CLOSED', label: 'Closed' },
];

export default function MapFilterModal({
  isOpen,
  onClose,
  onFiltersChange,
  initialFilters = {},
  defaultPreset = 'active' // 'all' or 'active'
}) {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [selectedStatuses, setSelectedStatuses] = useState(
    initialFilters.status ? initialFilters.status.split(',') :
    (defaultPreset === 'active' ? ['REPORTED', 'VERIFIED', 'RESPONDING', 'ON_SCENE', 'DISPATCHED'] : [])
  );
  const [selectedType, setSelectedType] = useState(initialFilters.type_id || '');
  const [fromDate, setFromDate] = useState(initialFilters.from_date || '');
  const [toDate, setToDate] = useState(initialFilters.to_date || '');
  const [typesLoading, setTypesLoading] = useState(true);

  // Fetch incident types on mount
  useEffect(() => {
    const fetchTypes = async () => {
      setTypesLoading(true);
      try {
        const res = await incidentTypeAPI.getAll();
        setTypes(res.data || []);
      } catch (err) {
        console.error('Failed to fetch incident types:', err);
      } finally {
        setTypesLoading(false);
      }
    };
    fetchTypes();
  }, []);

  const handleStatusToggle = (status) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleApplyFilters = () => {
    const filters = {};
    if (selectedStatuses.length > 0) {
      filters.status = selectedStatuses.join(',');
    }
    if (selectedType) {
      filters.type_id = selectedType;
    }
    if (fromDate) {
      filters.from_date = fromDate;
    }
    if (toDate) {
      filters.to_date = toDate;
    }
    onFiltersChange(filters);
    onClose();
  };

  const handleClearAll = () => {
    setSelectedStatuses(defaultPreset === 'active' ? ['REPORTED', 'VERIFIED', 'RESPONDING', 'ON_SCENE', 'DISPATCHED'] : []);
    setSelectedType('');
    setFromDate('');
    setToDate('');
    onFiltersChange({});
    onClose();
  };

  const hasActiveFilters = selectedStatuses.length > 0 || selectedType || fromDate || toDate;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-start justify-center p-4 pt-20">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter size={20} className="text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Filter Incidents</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wider">
              Status
            </label>
            <div className="space-y-2">
              {STATUS_OPTIONS.map(status => (
                <label key={status.value} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status.value)}
                    onChange={() => handleStatusToggle(status.value)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20 accent-indigo-600"
                  />
                  <span className="text-sm font-medium text-slate-700">{status.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label htmlFor="type-filter" className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wider">
              Incident Type
            </label>
            <select
              id="type-filter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              disabled={typesLoading}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50"
            >
              <option value="">All Types</option>
              {types.map(type => (
                <option key={type.type_id} value={type.type_id}>
                  {type.name}
                </option>
              ))}
            </select>
            {typesLoading && <p className="text-xs text-slate-400 mt-1">Loading types...</p>}
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wider">
              Date Range
            </label>
            <div className="space-y-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  placeholder="From date"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  placeholder="To date"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 flex gap-3">
          <button
            onClick={handleClearAll}
            className="flex-1 px-4 py-3 text-slate-700 font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm"
          >
            Clear All
          </button>
          <button
            onClick={handleApplyFilters}
            disabled={loading}
            className="flex-1 px-4 py-3 text-white font-bold bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50 active:scale-95"
          >
            {loading ? 'Applying...' : 'Apply Filters'}
          </button>
        </div>
      </div>
    </div>
  );
}
