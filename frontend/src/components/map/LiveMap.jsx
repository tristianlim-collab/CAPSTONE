import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker as LeafletMarker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import IncidentMarker from './IncidentMarker';
import BoundaryLayer from './BoundaryLayer';
import HeatmapLayer from './HeatmapLayer';
import MapLegend from './MapLegend';
import LguProximityLayer from './LguProximityLayer';
import toast from 'react-hot-toast';

import { useSocketContext } from '../../context/SocketContext';
import api, { incidentAPI } from '../../api';
import { getAllNirCities, getProximityLevel, getNearestCity } from '../../config/nirLgus';

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

/**
 * Extract the city name from an incident object.
 * Prefers barangay.city, then barangay.municipality.
 * If missing, falls back to calculating the nearest city from coordinates.
 */
function getIncidentCity(incident) {
  if (!incident) return null;
  const city = incident.barangay?.city || incident.barangay?.municipality;
  if (city) return city.toString().trim();

  // Fallback to coordinates
  if (incident.latitude && incident.longitude) {
    const nearest = getNearestCity(Number(incident.latitude), Number(incident.longitude));
    if (nearest) return nearest.name;
  }
  return null;
}

// Helper: fetch route from OSRM
async function fetchRouteFromOSRM(fromLat, fromLng, toLat, toLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      return coords;
    }
  } catch (err) {
    console.error('OSRM route fetch error:', err);
  }
  return null;
}

export default function LiveMap({
  center = [10.0000, 122.9000],
  zoom = 9.5,
  autoZoomOnNewIncident = true,
  markerColorMode = 'severity',
  onVerify
}) {
  const [incidents, setIncidents] = useState([]);
  const [boundaries, setBoundaries] = useState([]);
  const [units, setUnits] = useState([]);
  const [mode, setMode] = useState('markers'); // 'markers' | 'heatmap' | 'lgu_zones'
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [routes, setRoutes] = useState({});

  // Bounds for Negros Island Region
  const NIR_BOUNDS = [
    [8.8000, 122.1500], // Southwest
    [11.1000, 123.6500] // Northeast
  ];

  const { on } = useSocketContext();

  // Custom rich colored marker icons for response units
  const createUnitIcon = (unit) => {
    const status = unit.availability_status;
    const color = status === 'AVAILABLE' ? '#22c55e' : status === 'BUSY' ? '#f59e0b' : '#94a3b8';
    
    let iconContent = '🛡️';
    if (unit.unit_type === 'FIRE') iconContent = '🚒';
    else if (unit.unit_type === 'MEDICAL') iconContent = '🚑';
    else if (unit.unit_type === 'POLICE') iconContent = '🚓';
    else if (unit.unit_type === 'BARANGAY') iconContent = '🏛️';
    else if (unit.unit_type === 'DRRMO') iconContent = '🚨';

    return L.divIcon({
      className: 'custom-unit-marker-rich',
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translate(-50%, -100%); width: max-content;">
          <div style="
            background: white; 
            padding: 4px 8px; 
            border-radius: 8px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
            font-weight: bold; 
            font-size: 11px; 
            color: #1e293b; 
            margin-bottom: 4px;
            border: 2px solid ${color};
            white-space: nowrap;
          ">
            ${iconContent} ${unit.unit_name}
          </div>
          <div style="
            width: 14px; height: 14px;
            background: ${color};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
      popupAnchor: [0, -40],
    });
  };

  useEffect(() => {
    // Fetch initial active incidents with full data
    incidentAPI.getAll({
      limit: 100,
      include: 'evidence,reporter,type,barangay'
    }).then(async (res) => {
      // Filter out resolved incidents for the map
      const activeIncidents = res.data?.data?.filter(inc => inc.status !== 'RESOLVED' && inc.status !== 'CLOSED' && inc.status !== 'FALSE_ALARM') || [];
      setIncidents(activeIncidents);

      // Auto-load routes for VERIFIED/RESPONDING incidents with assignments
      const initialRoutes = {};
      for (const inc of activeIncidents) {
        if (['VERIFIED', 'RESPONDING'].includes(inc.status) && inc.assignments && inc.assignments.length > 0) {
          for (const assignment of inc.assignments) {
            const unit = assignment.unit;
            if (unit && unit.latitude && unit.longitude && inc.latitude && inc.longitude) {
              const coords = await fetchRouteFromOSRM(unit.latitude, unit.longitude, inc.latitude, inc.longitude);
              if (coords) {
                initialRoutes[`${inc.incident_id}_${unit.unit_id}`] = coords;
              }
            }
          }
        }
      }
      if (Object.keys(initialRoutes).length > 0) {
        setRoutes(prev => ({ ...prev, ...initialRoutes }));
      }
    }).catch(err => console.error("Map fetch error:", err));

    // Fetch active response unit positions
    api.get('/response-units/positions/active')
      .then(res => {
        if (res.data && Array.isArray(res.data)) {
          setUnits(res.data.filter(unit => unit.latitude && unit.longitude));
        }
      })
      .catch(err => console.error("Unit position fetch error:", err));

    // Socket.io Subscriptions
    const unsub1 = on('new_incident', (incident) => {
      setIncidents(prev => {
        if (prev.some(i => i.incident_id === incident.incident_id)) return prev;
        return [incident, ...prev];
      });
      // Auto-select new incident for LGU zones
      setSelectedIncidentId(incident.incident_id);
    });

    // Listen for new reports awaiting verification (this is what the backend actually emits)
    const unsub3 = on('incident_awaiting_verification', (data) => {
      const incident = data.incident || data;
      if (incident?.latitude && incident?.longitude) {
        setIncidents(prev => {
          if (prev.some(i => i.incident_id === incident.incident_id)) return prev;
          return [incident, ...prev];
        });
        // Auto-select new incident for LGU zones
        setSelectedIncidentId(incident.incident_id);
      }
    });

    const unsub2 = on('incident_status_updated', (updatedData) => {
      setIncidents(prev => {
        if (updatedData.status === 'RESOLVED' || updatedData.status === 'CLOSED' || updatedData.status === 'FALSE_ALARM') {
          return prev.filter(inc => inc.incident_id !== updatedData.incident_id);
        }
        // Merge the full incident object if provided (e.g. after evidence upload)
        const fullIncident = updatedData.incident || {};
        return prev.map(inc =>
          inc.incident_id === updatedData.incident_id
            ? { ...inc, ...fullIncident, status: updatedData.status }
            : inc
        );
      });
    });

    const unsub4 = on('incident_deleted', (data) => {
      setIncidents(prev => prev.filter(inc => inc.incident_id !== data.incident_id));
      // Clear selection if deleted
      setSelectedIncidentId(prev => prev === data.incident_id ? null : prev);
    });

    // Listen for verified incidents
    const unsub5 = on('incident_verified', (data) => {
      if (data.incident?.latitude && data.incident?.longitude) {
        setIncidents(prev => {
          const existing = prev.find(i => i.incident_id === data.incident.incident_id);
          if (existing) {
            // Merge instead of replace to preserve evidence and other data
            return prev.map(inc => inc.incident_id === data.incident.incident_id
              ? { ...inc, ...data.incident }
              : inc
            );
          }
          return [data.incident, ...prev];
        });
      }
    });

    // Listen for unit location updates
    const unsub6 = on('unit_location_updated', (data) => {
      setUnits(prev => {
        const exists = prev.find(u => u.unit_id === data.unitId);
        if (exists) {
          return prev.map(u =>
            u.unit_id === data.unitId
              ? { ...u, latitude: data.lat, longitude: data.lng }
              : u
          );
        }
        // If a new unit appears, add it
        return [...prev, { unit_id: data.unitId, unit_name: data.unitName, latitude: data.lat, longitude: data.lng, availability_status: 'AVAILABLE' }];
      });
    });

    // Listen for dispatch directions — immediately draw route on approval
    const unsub7 = on('unit_dispatch_with_directions', async (data) => {
      console.log('[LiveMap] Received dispatch directions:', data);
      if (data.unit_lat && data.unit_lng && data.incident_lat && data.incident_lng) {
        const coords = await fetchRouteFromOSRM(
          Number(data.unit_lat), Number(data.unit_lng), 
          Number(data.incident_lat), Number(data.incident_lng)
        );
        if (coords) {
          const routeKey = `${data.incident_id}_${data.unit_id}`;
          setRoutes(prev => ({ ...prev, [routeKey]: coords }));
        }
      }
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
      unsub7();
    };
  }, [on]);

  // Route cleanup effect — remove routes when incident is resolved/closed
  useEffect(() => {
    setRoutes(prev => {
      const activeIncidentIds = new Set(
        incidents
          .filter(inc => ['VERIFIED', 'RESPONDING', 'DISPATCHED'].includes(inc.status))
          .map(inc => inc.incident_id)
      );

      const cleaned = {};
      for (const [key, coords] of Object.entries(prev)) {
        const incidentId = key.split('_')[0];
        if (activeIncidentIds.has(incidentId)) {
          cleaned[key] = coords;
        }
      }

      // Only update state if something actually changed
      if (Object.keys(cleaned).length !== Object.keys(prev).length) {
        return cleaned;
      }
      return prev;
    });
  }, [incidents]);

  // Determine the city for the LGU proximity layer
  const selectedIncident = selectedIncidentId
    ? incidents.find(i => i.incident_id === selectedIncidentId)
    : incidents[0]; // Default to latest
  const incidentCity = getIncidentCity(selectedIncident);

  // Handler for when a marker is clicked — update the LGU zones focus
  const handleMarkerSelect = useCallback((incidentId) => {
    setSelectedIncidentId(incidentId);
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
          className={`px-4 py-2 text-sm font-semibold ${mode === 'lgu_zones' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          onClick={() => setMode('lgu_zones')}
        >
          Heatmap
        </button>
      </div>


      <MapContainer
        bounds={NIR_BOUNDS}
        minZoom={5}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; Google Maps'
          url="http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}"
          maxZoom={20}
        />

        <BoundaryLayer boundaries={boundaries} />
        <AutoZoomToLatestIncident incidents={incidents} enabled={autoZoomOnNewIncident} />

        {/* LGU Proximity Zones — visible in both markers and lgu_zones modes when markerColorMode is lgu */}
        {(mode === 'lgu_zones' || (mode === 'markers' && markerColorMode === 'lgu')) && (
          <LguProximityLayer incidentCity={incidentCity} />
        )}

        {(mode === 'markers' || mode === 'lgu_zones') && incidents.map(incident => (
          <IncidentMarker
            key={incident.incident_id}
            incident={incident}
            colorMode={mode === 'lgu_zones' ? 'lgu' : markerColorMode}
            focusedIncidentCity={incidentCity}
            onVerify={onVerify}
            onSelect={handleMarkerSelect}
            isSelected={selectedIncident?.incident_id === incident.incident_id}
          />
        ))}

        {/* Dispatch Routes Polyline */}
        {(mode === 'markers' || mode === 'lgu_zones') && Object.values(routes).map((routeCoords, idx) => (
          <Polyline
            key={`route-${idx}`}
            positions={routeCoords}
            pathOptions={{
              color: '#3b82f6',
              weight: 5,
              opacity: 0.85,
              dashArray: '10, 10',
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        ))}

        {/* Response Unit Markers */}
        {(mode === 'markers' || mode === 'lgu_zones') && units.map(unit => (
          <LeafletMarker
            key={`unit-${unit.unit_id}`}
            position={[unit.latitude, unit.longitude]}
            icon={createUnitIcon(unit)}
          >
            <Popup className="unit-popup !p-0 overflow-hidden rounded-xl border-none shadow-lg">
              <div className="p-3 min-w-[200px] bg-white">
                <div className="flex items-start justify-between mb-2 border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-bold text-slate-800 text-sm block">{unit.unit_name}</span>
                    <span className="text-xs text-slate-400 block mt-0.5">{unit.unit_type}</span>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full text-white ${
                    unit.availability_status === 'AVAILABLE' ? 'bg-green-500' : 'bg-orange-500'
                  } shadow-sm`}>
                    {unit.availability_status}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  <span className="block">📍 {unit.latitude.toFixed(4)}, {unit.longitude.toFixed(4)}</span>
                </div>
              </div>
            </Popup>
          </LeafletMarker>
        ))}

        {mode === 'heatmap' && <HeatmapLayer points={incidents} />}
      </MapContainer>

      {mode === 'markers' && markerColorMode !== 'lgu' && <MapLegend />}

      {/* LGU Zone Legend */}
      {(mode === 'lgu_zones' || (mode === 'markers' && markerColorMode === 'lgu')) && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 shadow-lg text-xs text-slate-700 space-y-1.5">
          <div className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1">LGU Proximity</div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/30" />
            <span className="font-medium">Incident City</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/30" />
            <span className="font-medium">Nearby City </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-500/30" />
            <span className="font-medium">Far City </span>
          </div>
        </div>
      )}

      {/* Response Unit Legend */}
      {units.length > 0 && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 shadow-lg text-xs text-slate-700 space-y-1.5">
          <div className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1">Response Units ({units.length})</div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-500/30" />
            <span className="font-medium">Available</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/30" />
            <span className="font-medium">Busy</span>
          </div>
        </div>
      )}
    </div>
  );
}
