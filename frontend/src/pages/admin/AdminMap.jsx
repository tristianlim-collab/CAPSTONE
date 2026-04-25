import React, { useState } from 'react';
import LiveMap from '../../components/map/LiveMap';
import { Map, Filter } from 'lucide-react';

const AdminMap = () => {
  return (
    <div className="flex flex-col h-full space-y-4 animate-fade-in relative">
      {/* Header overlay */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-sm border border-slate-200 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Map size={20} className="text-indigo-600" />
            Live Dispatch Map
          </h2>
          <p className="text-sm text-slate-500 mt-1">Real-time geospatial tracking of all active emergencies.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium">
            <Filter size={16} />
            Filter Incidents
          </button>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 min-h-[600px] w-full rounded-2xl overflow-hidden shadow-md border border-slate-200 relative">
        <LiveMap zoom={13} center={[14.6760, 121.0437]} autoZoomOnNewIncident markerColorMode="lgu" />
      </div>
    </div>
  );
};

export default AdminMap;
