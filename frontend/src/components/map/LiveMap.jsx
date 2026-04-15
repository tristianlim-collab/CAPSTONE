import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import IncidentMarker from './IncidentMarker';
import BoundaryLayer from './BoundaryLayer';
import HeatmapLayer from './HeatmapLayer';
import MapLegend from './MapLegend';
import toast from 'react-hot-toast';

// To be imported from context/api later when fully wired
// import { useSocket } from '../../context/SocketContext';
// import { incidentAPI, barangayAPI } from '../../api';

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

  // Placeholder for socket context connection
  // const { socket } = useSocket();

  useEffect(() => {
    // 1. Fetch initial incidents
    // incidentAPI.getAll({ status: 'REPORTED,VERIFIED,RESPONDING' }).then(res => setIncidents(res.data.data));
    
    // 2. Fetch barangay boundaries
    // barangayAPI.getAll().then(res => setBoundaries(res.data.data));

    // Clear out fallback mock incidents to have an empty map initially
    setIncidents([]);

    // 3. Socket.io Subscriptions
    /*
    if (socket) {
      socket.on('new_incident', (incident) => {
        toast.error('NEW INCIDENT REPORTED');
        setIncidents(prev => [incident, ...prev]);
      });
      
      socket.on('incident_status_updated', (updatedData) => {
        setIncidents(prev => prev.map(inc => inc.incident_id === updatedData.incident_id ? { ...inc, ...updatedData } : inc));
      });
    }

    return () => {
      if (socket) {
        socket.off('new_incident');
        socket.off('incident_status_updated');
      }
    };
    */
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
