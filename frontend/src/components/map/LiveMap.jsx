import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
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

export default function LiveMap({ center = [10.0000, 122.9000], zoom = 9 }) {
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
      setIncidents(prev => [incident, ...prev]);
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
        maxBounds={NIR_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={8}
        scrollWheelZoom={true} 
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <BoundaryLayer boundaries={boundaries} />

        {mode === 'markers' && incidents.map(incident => (
          <IncidentMarker key={incident.incident_id} incident={incident} />
        ))}

        {mode === 'heatmap' && <HeatmapLayer points={incidents} />}
      </MapContainer>

      {mode === 'markers' && <MapLegend />}
    </div>
  );
}
