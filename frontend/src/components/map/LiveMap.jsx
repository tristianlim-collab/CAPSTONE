import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker as LeafletMarker, Popup, useMap } from 'react-leaflet';
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
      map.flyTo([lat, lng], 16, {
        duration: 2.0,
        easeLinearity: 0.25,
        noMoveStart: true
      });
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

function FlyToSelectedIncident({ selectedIncident }) {
  const map = useMap();
  useEffect(() => {
    if (selectedIncident?.latitude && selectedIncident?.longitude) {
      map.flyTo([Number(selectedIncident.latitude), Number(selectedIncident.longitude)], 17, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
    }
  }, [selectedIncident, map]);
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



export default function LiveMap({
  center = [10.0000, 122.9000],
  zoom = 9.5,
  autoZoomOnNewIncident = true,
  markerColorMode = 'severity',
  onVerify,
  filters = {}
}) {
  const [incidents, setIncidents] = useState([]);
  const [boundaries, setBoundaries] = useState([]);
  const [units, setUnits] = useState([]);
  const [mode, setMode] = useState('markers'); // 'markers' | 'heatmap' | 'lgu_zones'
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);


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
        <div style="display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
          <div style="
            width: 20px; height: 20px;
            background: white;
            border: 4px solid ${color};
            border-radius: 50%;
            box-shadow: 0 4px 8px rgba(0,0,0,0.25);
            transition: all 0.2s ease-in-out;
          ">
          </div>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [0, 0],
      popupAnchor: [0, -10],
    });
  };

  useEffect(() => {
    // Fetch initial active incidents with full data
    const params = {
      limit: 100,
      include: 'evidence,reporter,type,barangay'
    };

    // Add filters to params if they exist
    if (filters.status) params.status = filters.status;
    if (filters.type_id) params.type_id = filters.type_id;
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;

    incidentAPI.getAll(params).then(async (res) => {
      // No need to filter out resolved incidents since API handles it
      const activeIncidents = res.data?.data || [];
      setIncidents(activeIncidents);


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



    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
    };
  }, [on]);

  // Refetch incidents when filters change
  useEffect(() => {
    const params = {
      limit: 100,
      include: 'evidence,reporter,type,barangay'
    };

    // Add filters to params if they exist
    if (filters.status) params.status = filters.status;
    if (filters.type_id) params.type_id = filters.type_id;
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;

    incidentAPI.getAll(params).then(async (res) => {
      const activeIncidents = res.data?.data || [];
      setIncidents(activeIncidents);


    }).catch(err => console.error("Map filter fetch error:", err));
  }, [filters]);



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
          Markers
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold ${mode === 'lgu_zones' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          onClick={() => setMode('lgu_zones')}
        >
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold ${mode === 'heatmap' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          onClick={() => setMode('heatmap')}
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
        <FlyToSelectedIncident selectedIncident={selectedIncident} />

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
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full text-white ${unit.availability_status === 'AVAILABLE' ? 'bg-green-500' : 'bg-orange-500'
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
            <span className="font-medium">Critical</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm shadow-blue-500/30" />
            <span className="font-medium">High</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-500/30" />
            <span className="font-medium">Low </span>
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
