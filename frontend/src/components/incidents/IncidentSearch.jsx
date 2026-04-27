import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, X, Calendar, ChevronDown } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'REPORTED', label: 'Reported' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'RESPONDING', label: 'Responding' },
  { value: 'ON_SCENE', label: 'On Scene' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'FALSE_ALARM', label: 'False Alarm' },
  { value: 'CLOSED', label: 'Closed' },
];

const SEVERITY_OPTIONS = [
  { value: '', label: 'All Severity' },
  { value: 'LOW', label: 'Low', color: 'bg-green-100 text-green-700' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'CRITICAL', label: 'Critical', color: 'bg-red-100 text-red-700' },
];

/**
 * IncidentSearch - Reusable search & filter bar for incident lists
 * @param {Function} onFiltersChange - Called with { search, status, severity, type_id, from_date, to_date }
 * @param {Array} incidentTypes - Array of incident type objects for the type filter dropdown
 * @param {boolean} showStatusFilter - Whether to show the status filter (default: true)
 * @param {boolean} compact - Whether to use compact layout (default: false)
 */
export default function IncidentSearch({ onFiltersChange, incidentTypes = [], showStatusFilter = true, compact = false }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [typeId, setTypeId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const debounceRef = useRef(null);

  const emitFilters = useCallback((overrides = {}) => {
    const filters = {
      search: overrides.search ?? search,
      status: overrides.status ?? status,
      severity: overrides.severity ?? severity,
      type_id: overrides.type_id ?? typeId,
      from_date: overrides.from_date ?? fromDate,
      to_date: overrides.to_date ?? toDate,
    };
    // Remove empty values
    const cleaned = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== '' && v != null)
    );
    onFiltersChange?.(cleaned);
  }, [search, status, severity, typeId, fromDate, toDate, onFiltersChange]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      emitFilters({ search });
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Immediate filters (dropdowns)
  const handleStatusChange = (val) => { setStatus(val); emitFilters({ status: val }); };
  const handleSeverityChange = (val) => { setSeverity(val); emitFilters({ severity: val }); };
  const handleTypeChange = (val) => { setTypeId(val); emitFilters({ type_id: val }); };
  const handleFromDate = (val) => { setFromDate(val); emitFilters({ from_date: val }); };
  const handleToDate = (val) => { setToDate(val); emitFilters({ to_date: val }); };

  const hasActiveFilters = status || severity || typeId || fromDate || toDate || search;

  const handleClearAll = () => {
    setSearch('');
    setStatus('');
    setSeverity('');
    setTypeId('');
    setFromDate('');
    setToDate('');
    onFiltersChange?.({});
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${compact ? 'p-3' : 'p-4'}`}>
      {/* Search Bar Row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            id="incident-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, description, reporter, or address..."
            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700 placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); emitFilters({ search: '' }); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Quick Filters */}
        {showStatusFilter && (
          <select
            id="incident-status-filter"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}

        <select
          id="incident-severity-filter"
          value={severity}
          onChange={(e) => handleSeverityChange(e.target.value)}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
        >
          {SEVERITY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Advanced Toggle */}
        <button
          id="incident-advanced-filter-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all border ${
            showAdvanced ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-200'
          }`}
        >
          <Filter size={14} />
          <span className="hidden sm:inline">More</span>
          <ChevronDown size={12} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            id="incident-clear-filters"
            onClick={handleClearAll}
            className="flex items-center gap-1 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-all"
          >
            <X size={14} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-3">
          {/* Type Filter */}
          {incidentTypes.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Type</label>
              <select
                id="incident-type-filter"
                value={typeId}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="">All Types</option>
                {incidentTypes.map(type => (
                  <option key={type.type_id} value={type.type_id}>{type.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">From</label>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                id="incident-from-date"
                type="date"
                value={fromDate}
                onChange={(e) => handleFromDate(e.target.value)}
                className="pl-7 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">To</label>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                id="incident-to-date"
                type="date"
                value={toDate}
                onChange={(e) => handleToDate(e.target.value)}
                className="pl-7 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
