const fs = require('fs');
const path = require('path');

const mapFiles = {
  'frontend/src/components/map/IncidentMarker.jsx': `import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import moment from 'moment';

const getColor = (status, severity) => {
  if (status === 'RESOLVED' || status === 'CLOSED') return 'grey';
  if (severity === 'CRITICAL') return 'red';
  if (severity === 'HIGH') return 'orange';
  if (severity === 'MEDIUM') return 'gold';
  return 'green';
};

const createColoredIcon = (color) => {
  return new L.Icon({
    iconUrl: \`https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-\${color}.png\`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

export default function IncidentMarker({ incident }) {
  const color = getColor(incident.status, incident.severity);
  const icon = createColoredIcon(color);

  return (
    <Marker position={[incident.latitude, incident.longitude]} icon={icon}>
      <Popup className="min-w-[200px]">
        <div className="font-sans">
          <div className="flex items-center justify-between border-b pb-2 mb-2">
            <strong className="text-lg">{\`INC-\${incident.incident_id?.slice(0, 5) || 'UNKNOWN'}\`}</strong>
            <span className={\`px-2 py-1 text-xs font-bold rounded-full \${color === 'red' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}\`}>
              {incident.status}
            </span>
          </div>
          <p className="text-sm mb-1"><strong>Severity:</strong> {incident.severity}</p>
          <p className="text-sm mb-1"><strong>Type:</strong> {incident.incident_type?.name || 'Emergency'}</p>
          <p className="text-sm mb-2 text-gray-600 line-clamp-2">{incident.description}</p>
          <div className="text-xs text-gray-400 mt-2">
            Reported: {moment(incident.reported_at).format('MMM D, YYYY h:mm A')}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
`,
  'frontend/src/components/map/BoundaryLayer.jsx': `import React from 'react';
import { GeoJSON } from 'react-leaflet';

export default function BoundaryLayer({ boundaries }) {
  if (!boundaries || boundaries.length === 0) return null;

  const style = {
    fillColor: '#3b82f6',
    weight: 2,
    opacity: 1,
    color: '#2563eb',
    dashArray: '3',
    fillOpacity: 0.1
  };

  const onEachFeature = (feature, layer) => {
    if (feature.properties && feature.properties.name) {
      layer.bindTooltip(feature.properties.name, {
        permanent: false,
        direction: 'center',
        className: 'bg-transparent border-0 shadow-none text-blue-800 font-bold text-shadow'
      });
    }
  };

  return (
    <>
      {boundaries.map((barangay) => (
        <GeoJSON 
          key={barangay.barangay_id} 
          data={barangay.boundary_geojson} 
          style={style} 
          onEachFeature={(feature, layer) => {
             // Inject barangay name into feature properties if not present
             if (!feature.properties) feature.properties = {};
             feature.properties.name = barangay.name;
             onEachFeature(feature, layer);
          }}
        />
      ))}
    </>
  );
}
`,
  'frontend/src/components/map/HeatmapLayer.jsx': `import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

export default function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    // Convert points to [lat, lng, intensity]
    // Map severity to intensity (low: 0.2, medium: 0.5, high: 0.8, critical: 1.0)
    const getIntensity = (severity) => {
      switch(severity) {
        case 'CRITICAL': return 1.0;
        case 'HIGH': return 0.8;
        case 'MEDIUM': return 0.5;
        default: return 0.2;
      }
    };

    const heatArray = points.map(p => [p.latitude, p.longitude, getIntensity(p.severity)]);

    const heatLayer = L.heatLayer(heatArray, {
      radius: 35,
      blur: 20,
      maxZoom: 17,
      gradient: {
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1.0: 'red'
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}
`,
  'frontend/src/components/map/MapLegend.jsx': `import React from 'react';

export default function MapLegend() {
  const legendItems = [
    { color: 'bg-red-600', label: 'Critical' },
    { color: 'bg-orange-500', label: 'High' },
    { color: 'bg-yellow-400', label: 'Medium' },
    { color: 'bg-green-500', label: 'Low' },
    { color: 'bg-gray-400', label: 'Resolved/Closed' },
  ];

  return (
    <div className="absolute bottom-6 right-6 z-[1000] bg-white p-4 rounded-xl shadow-lg border border-slate-200">
      <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">Incident Severity</h4>
      <div className="space-y-2">
        {legendItems.map(item => (
          <div key={item.label} className="flex items-center gap-3">
            <span className={\`w-4 h-4 rounded-full \${item.color} shadow-sm\`}></span>
            <span className="text-sm font-medium text-slate-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
`,
  'frontend/src/components/map/LiveMap.jsx': `import React, { useState, useEffect } from 'react';
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

export default function LiveMap({ center = [14.6760, 121.0437], zoom = 13 }) {
  const [incidents, setIncidents] = useState([]);
  const [boundaries, setBoundaries] = useState([]);
  const [mode, setMode] = useState('markers'); // 'markers' | 'heatmap'

  // Placeholder for socket context connection
  // const { socket } = useSocket();

  useEffect(() => {
    // 1. Fetch initial incidents
    // incidentAPI.getAll({ status: 'REPORTED,VERIFIED,RESPONDING' }).then(res => setIncidents(res.data.data));
    
    // 2. Fetch barangay boundaries
    // barangayAPI.getAll().then(res => setBoundaries(res.data.data));

    // Mock data for display
    setIncidents([
      { incident_id: '1', latitude: 14.6760, longitude: 121.0437, severity: 'CRITICAL', status: 'REPORTED', description: 'Fire at street X' },
      { incident_id: '2', latitude: 14.6790, longitude: 121.0410, severity: 'MEDIUM', status: 'RESPONDING', description: 'Medical emergency' }
    ]);

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
          className={\`px-4 py-2 text-sm font-semibold \${mode === 'markers' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}\`}
          onClick={() => setMode('markers')}
        >
          Live Markers
        </button>
        <button 
          className={\`px-4 py-2 text-sm font-semibold \${mode === 'heatmap' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}\`}
          onClick={() => setMode('heatmap')}
        >
          Heatmap
        </button>
      </div>

      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="w-full h-full z-0">
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
`
};

for (const [filePath, content] of Object.entries(mapFiles)) {
  const fullPath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}
console.log('Frontend Live Map Components Generated Successfully');
