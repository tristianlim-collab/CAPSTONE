import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { incidentAPI } from '../../api';
import L from 'leaflet';
import { Clock, AlertTriangle, Map as MapIcon, Loader2 } from 'lucide-react';

// Fix leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ResponseMap = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // default center somewhere around central Negros (or exact base)
  const defaultCenter = [10.0000, 122.9000];

  // Bounds strictly for Negros Island Region (NIR)
  const NIR_BOUNDS = [
    [8.8000, 122.1500], // Southwest
    [11.1000, 123.6500] // Northeast
  ];

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await incidentAPI.getAssignedIncidents();
      if (res.data?.success) {
        setIncidents(res.data.data.filter(inc => inc.latitude && inc.longitude && ['REPORTED', 'VERIFIED', 'RESPONDING'].includes(inc.status)));
      }
    } catch (error) {
      console.error('Failed to load incidents for map', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      REPORTED: 'bg-orange-500',
      VERIFIED: 'bg-yellow-500',
      RESPONDING: 'bg-blue-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 bg-slate-50">
      <div className="max-w-7xl mx-auto flex flex-col h-full gap-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative z-[400]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <MapIcon className="w-6 h-6" />
              </div>
              Live Response Map
              <span className="relative flex h-3 w-3 ml-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">Real-time tracking of active incidents</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]"></span> 
              Reported
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]"></span> 
              Verified
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></span> 
              Responding
            </div>
          </div>
        </div>
      
        <div className="flex-1 relative z-0 h-[600px] sm:h-[calc(100vh-16rem)] min-h-[500px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-white/60 z-[500] flex flex-col items-center justify-center backdrop-blur-sm">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
              <p className="text-sm font-medium text-slate-600">Loading map data...</p>
            </div>
          )}
          <MapContainer 
            center={defaultCenter} 
            zoom={9} 
            maxBounds={NIR_BOUNDS}
            maxBoundsViscosity={1.0}
            minZoom={8}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {incidents.map((incident) => (
              <Marker 
                key={incident.incident_id} 
                position={[incident.latitude, incident.longitude]}
              >
                <Popup className="incident-popup !p-0 overflow-hidden rounded-xl border-none shadow-lg">
                  <div className="p-4 min-w-[240px] bg-white">
                    <div className="flex items-start justify-between mb-3 border-b border-slate-100 pb-3">
                      <div>
                        <span className="font-bold text-slate-800 text-sm block">{incident.incident_code}</span>
                        <span className="text-xs text-slate-400 block mt-0.5">{incident.type || 'Unknown Type'}</span>
                      </div>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full text-white ${getStatusColor(incident.status)} shadow-sm`}>
                        {incident.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">{incident.description}</p>
                    <div className="flex flex-col gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                        <span>{incident.severity || 'Normal'} Severity</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span>{new Date(incident.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default ResponseMap;
