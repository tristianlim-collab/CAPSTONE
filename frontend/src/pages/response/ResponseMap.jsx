import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { incidentAPI } from '../../api';
import { useSocketContext } from '../../context/SocketContext';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { Clock, AlertTriangle, Map as MapIcon, Loader2, MapPin, User } from 'lucide-react';

// Fix leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom colored marker icons
const createColoredIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 24px; height: 24px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
};

const ICONS = {
  REPORTED: createColoredIcon('#f97316'),  // orange
  VERIFIED: createColoredIcon('#eab308'),  // yellow
  RESPONDING: createColoredIcon('#3b82f6'), // blue
};

const ResponseMap = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { on } = useSocketContext();

  // Default center: Negros Island Region, Philippines
  const defaultCenter = [10.0000, 122.9000];

  useEffect(() => {
    fetchIncidents();
  }, []);

  // Listen for new incidents in real-time
  useEffect(() => {
    const unsub1 = on('new_incident', (incident) => {
      if (incident.latitude && incident.longitude) {
        setIncidents(prev => {
          if (prev.find(i => i.incident_id === incident.incident_id)) return prev;
          return [...prev, incident];
        });
        toast('📍 New incident on map!', { style: { fontWeight: 'bold' } });
      }
    });

    const unsub2 = on('incident_status_updated', (data) => {
      setIncidents(prev => {
        return prev
          .map(inc => inc.incident_id === data.incident_id
            ? { ...inc, status: data.status }
            : inc
          )
          // Remove resolved/closed from the active map view
          .filter(inc => ['REPORTED', 'VERIFIED', 'RESPONDING'].includes(inc.status));
      });
    });

    return () => { unsub1(); unsub2(); };
  }, [on]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await incidentAPI.getAll({ limit: 100 });
      if (res.data?.data) {
        setIncidents(
          res.data.data.filter(inc =>
            inc.latitude && inc.longitude &&
            ['REPORTED', 'VERIFIED', 'RESPONDING'].includes(inc.status)
          )
        );
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

  // Component to safely set bounds without crashing MapContainer initialization
  const MapBounds = () => {
    const map = useMap();
    useEffect(() => {
      // Create a proper Leaflet LatLngBounds object
      const bounds = L.latLngBounds(L.latLng(8.8000, 122.1500), L.latLng(11.1000, 123.6500));
      map.setMaxBounds(bounds);
      map.options.minZoom = 8;
    }, [map]);
    return null;
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
            <p className="text-sm text-slate-500 mt-1">
              Real-time tracking • {incidents.length} active incident{incidents.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]"></span> 
              Reported ({incidents.filter(i => i.status === 'REPORTED').length})
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]"></span> 
              Verified ({incidents.filter(i => i.status === 'VERIFIED').length})
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></span> 
              Responding ({incidents.filter(i => i.status === 'RESPONDING').length})
            </div>
          </div>
        </div>
      
        <div className="flex-1 relative z-0 h-[600px] sm:h-[calc(100vh-16rem)] min-h-[500px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {loading && (
            <div className="absolute inset-0 bg-white/60 z-[500] flex flex-col items-center justify-center backdrop-blur-sm">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
              <p className="text-sm font-medium text-slate-600">Loading map data...</p>
            </div>
          )}
          <div className="flex-1 w-full h-full relative z-0">
            <MapContainer 
              center={defaultCenter} 
              zoom={9} 
              style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
            >
              <MapBounds />
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            
            {incidents.map((incident) => (
              <Marker 
                key={incident.incident_id} 
                position={[incident.latitude, incident.longitude]}
                icon={ICONS[incident.status] || ICONS.REPORTED}
              >
                <Popup className="incident-popup !p-0 overflow-hidden rounded-xl border-none shadow-lg">
                  <div className="p-4 min-w-[240px] bg-white">
                    <div className="flex items-start justify-between mb-3 border-b border-slate-100 pb-3">
                      <div>
                        <span className="font-bold text-slate-800 text-sm block">{incident.incident_code}</span>
                        <span className="text-xs text-slate-400 block mt-0.5">{incident.incident_type?.name || 'Unknown Type'}</span>
                      </div>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full text-white ${getStatusColor(incident.status)} shadow-sm`}>
                        {incident.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2 leading-relaxed">{incident.description}</p>
                    <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                        <span>{incident.severity || 'Normal'} Severity</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <User className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span>{incident.reporter?.name || 'Anonymous'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span>{new Date(incident.reported_at).toLocaleString()}</span>
                      </div>
                      {incident.map_pin_address && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span className="truncate">{incident.map_pin_address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseMap;
