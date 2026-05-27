import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, X, Calendar, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  { value: 'LOW', label: 'Low' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

export default function IncidentSearch({ onFiltersChange, incidentTypes = [], responseUnits = [], showStatusFilter = true, compact = false }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [typeId, setTypeId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [unitId, setUnitId] = useState('');
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
      unit_id: overrides.unit_id ?? unitId,
    };
    const cleaned = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== '' && v != null)
    );
    onFiltersChange?.(cleaned);
  }, [search, status, severity, typeId, fromDate, toDate, unitId, onFiltersChange]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      emitFilters({ search });
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const handleStatusChange = (val) => { setStatus(val); emitFilters({ status: val }); };
  const handleSeverityChange = (val) => { setSeverity(val); emitFilters({ severity: val }); };
  const handleTypeChange = (val) => { setTypeId(val); emitFilters({ type_id: val }); };
  const handleFromDate = (val) => { setFromDate(val); emitFilters({ from_date: val }); };
  const handleToDate = (val) => { setToDate(val); emitFilters({ to_date: val }); };
  const handleUnitChange = (val) => { setUnitId(val); emitFilters({ unit_id: val }); };

  const hasActiveFilters = status || severity || typeId || fromDate || toDate || search || unitId;

  const handleClearAll = () => {
    setSearch(''); setStatus(''); setSeverity(''); setTypeId('');
    setFromDate(''); setToDate(''); setUnitId('');
    onFiltersChange?.({});
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-all ${compact ? 'p-3' : 'p-4'}`}>
      {/* Search Bar Row */}
      <div className="flex flex-col lg:flex-row items-center gap-3">
        <div className="relative flex-1 w-full lg:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tactical records..."
            className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); emitFilters({ search: '' }); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          {showStatusFilter && (
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="flex-1 lg:flex-none px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}

          <select
            value={severity}
            onChange={(e) => handleSeverityChange(e.target.value)}
            className="flex-1 lg:flex-none px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
          >
            {SEVERITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.1em] transition-all border shrink-0
              ${showAdvanced 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' 
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
              }`}
          >
            <Filter size={16} />
            <ChevronDown size={14} className={`transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {hasActiveFilters && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={handleClearAll}
              className="flex items-center justify-center w-11 h-11 rounded-2xl text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 hover:bg-red-100 transition-all shrink-0"
            >
              <X size={18} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4">
              {incidentTypes.length > 0 && (
                <div className="space-y-1.5 flex-1 min-w-[150px]">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-3">Incident Category</label>
                  <select
                    value={typeId}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    <option value="">All Categories</option>
                    {incidentTypes.map(type => (
                      <option key={type.type_id} value={type.type_id}>{type.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {responseUnits.length > 0 && (
                <div className="space-y-1.5 flex-1 min-w-[150px]">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-3">Response Unit</label>
                  <select
                    value={unitId}
                    onChange={(e) => handleUnitChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    <option value="">All Units</option>
                    {responseUnits.map(unit => (
                      <option key={unit.unit_id} value={unit.unit_id}>{unit.unit_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5 min-w-[140px]">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-3">From Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => handleFromDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-1.5 min-w-[140px]">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-3">To Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => handleToDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
