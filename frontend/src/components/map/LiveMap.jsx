import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import IncidentMarker from './IncidentMarker';
import BoundaryLayer from './BoundaryLayer';
import HeatmapLayer from './HeatmapLayer';
import MapLegend from './MapLegend';
import toast from 'react-hot-toast';

import { useSocketContext } from '../../context/SocketContext';
import { incidentAPI } from '../../api';

// Fix for default Leaflet icon paths in React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow });
L.Marker.prototype.options.icon = DefaultIcon;

function AutoZoomToLatestIncident({ incidents, enabled }) {
  const map = useMap();
  const hasHydrated = useRef(false);
  const previousLatestId = useRef(null);

  useEffect(() => {
    if (!enabled || incidents.length === 0) return;

    const latestIncident = incidents[0];
    const latestId = latestIncident?.incident_id;
    const lat = Number(latestIncident?.latitude);
    const lng = Number(latestIncident?.longitude);
    const hasValidCoordinates = Number.isFinite(lat) && Number.isFinite(lng);

    if (!hasValidCoordinates) return;

    if (!hasHydrated.current) {
      hasHydrated.current = true;
      previousLatestId.current = latestId;
      return;
    }

    if (previousLatestId.current !== latestId) {
      map.flyTo([lat, lng], 16, { duration: 0.8 });
      previousLatestId.current = latestId;
      toast('🔴 New incident reported! Map zoomed to location.', {
        icon: '🚨',
        style: { fontWeight: 'bold', borderLeft: '4px solid #EF4444' },
        duration: 5000
      });
    }
  }, [enabled, incidents, map]);

  return null;
}

export default function LiveMap({
  center = [10.0000, 122.9000],
  zoom = 9,
  autoZoomOnNewIncident = false,
  markerColorMode = 'severity',
  onVerify
}) {
  const [incidents, setIncidents] = useState([]);
  const [boundaries, setBoundaries] = useState([]);
  const [mode, setMode] = useState('markers'); // 'markers' | 'heatmap'

  // Bounds for Negros Island Region
  const NIR_BOUNDS = [
    [8.8000, 122.1500], // Southwest
    [11.1000, 123.6500] // Northeast
  ];

  const { on } = useSocketContext();

  useEffect(() => {
    // Fetch initial active incidents
    incidentAPI.getAll({ limit: 100 }).then(res => {
      // Filter out resolved incidents for the map
      const activeIncidents = res.data?.data?.filter(inc => inc.status !== 'RESOLVED' && inc.status !== 'CLOSED' && inc.status !== 'FALSE_ALARM') || [];
      setIncidents(activeIncidents);
    }).catch(err => console.error("Map fetch error:", err));

    // Socket.io Subscriptions
    const unsub1 = on('new_incident', (incident) => {
      setIncidents(prev => {
        if (prev.some(i => i.incident_id === incident.incident_id)) return prev;
        return [incident, ...prev];
      });
    });

    // Listen for new reports awaiting verification (this is what the backend actually emits)
    const unsub3 = on('incident_awaiting_verification', (data) => {
      const incident = data.incident || data;
      if (incident?.latitude && incident?.longitude) {
        setIncidents(prev => {
          if (prev.some(i => i.incident_id === incident.incident_id)) return prev;
          return [incident, ...prev];
        });
      }
    });
    
    const unsub2 = on('incident_status_updated', (updatedData) => {
      setIncidents(prev => {
        if (updatedData.status === 'RESOLVED' || updatedData.status === 'CLOSED' || updatedData.status === 'FALSE_ALARM') {
          return prev.filter(inc => inc.incident_id !== updatedData.incident_id);
        }
        return prev.map(inc => inc.incident_id === updatedData.incident_id ? { ...inc, ...updatedData } : inc);
      });
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-sm border border-slate-200">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex bg-white rounded-lg shadow-md overflow-hidden">
        <button 
          className={`px-4 py-2 text-sm font-semibold ${mode === 'markers' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          onClick={() => setMode('markers')}
        >
          Live Markers
        </button>
        <button 
          className={`px-4 py-2 text-sm font-semibold ${mode === 'heatmap' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          onClick={() => setMode('heatmap')}
        >
          Heatmap
        </button>
      </div>

      <MapContainer 
        center={center} 
        zoom={zoom} 
        minZoom={5}
        scrollWheelZoom={true} 
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <BoundaryLayer boundaries={boundaries} />
        <AutoZoomToLatestIncident incidents={incidents} enabled={autoZoomOnNewIncident} />

        {mode === 'markers' && incidents.map(incident => (
          <IncidentMarker key={incident.incident_id} incident={incident} colorMode={markerColorMode} onVerify={onVerify} />
        ))}

        {mode === 'heatmap' && <HeatmapLayer points={incidents} />}
      </MapContainer>

      {mode === 'markers' && <MapLegend />}
      {mode === 'markers' && markerColorMode === 'lgu' && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 border border-slate-200 rounded-lg px-3 py-2 shadow-md text-xs text-slate-700 space-y-1">
          <div className="font-bold text-slate-800">LGU Indicator</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Own LGU</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Neighbor LGU</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> LFAR</div>
        </div>
      )}
    </div>
  );
}
