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

function MapNavigationController({ incidents, selectedIncident, autoZoomOnNewIncident }) {
  const map = useMap();
  const previousLatestKeyRef = useRef(null);
  const previousSelectedIdRef = useRef(null);

  useEffect(() => {
    if (!incidents || incidents.length === 0) return;

    const latestIncident = incidents[0];
    const latestId = latestIncident?.incident_id || latestIncident?.id;
    const latestStatus = latestIncident?.status;
    const latestKey = latestId ? `${latestId}_${latestStatus}` : null;
    const latestLat = Number(latestIncident?.latitude);
    const latestLng = Number(latestIncident?.longitude);

    const selectedId = selectedIncident?.incident_id || selectedIncident?.id;
    const selectedLat = Number(selectedIncident?.latitude);
    const selectedLng = Number(selectedIncident?.longitude);

    // 1. Explicit user selection click or selected ID change
    if (selectedId && String(selectedId) !== String(previousSelectedIdRef.current)) {
      previousSelectedIdRef.current = selectedId;
      if (Number.isFinite(selectedLat) && Number.isFinite(selectedLng)) {
        map.invalidateSize();
        map.flyTo([selectedLat, selectedLng], 16, { duration: 1.5 });
        return;
      }
    }

    // 2. New real-time incident or status update arrival
    if (autoZoomOnNewIncident && latestKey && latestKey !== previousLatestKeyRef.current) {
      const isNewArrival = previousLatestKeyRef.current !== null;
      previousLatestKeyRef.current = latestKey;

      if (Number.isFinite(latestLat) && Number.isFinite(latestLng)) {
        map.invalidateSize();
        map.flyTo([latestLat, latestLng], 16, { duration: 1.8, easeLinearity: 0.25 });
        if (isNewArrival) {
          toast(`📍 New incident auto-zoomed: ${latestIncident?.incident_code || ''}`, {
            icon: '🚨',
            style: { fontWeight: 'bold', borderRadius: '12px', background: '#0F172A', color: '#fff' }
          });
        }
      }
    }
  }, [incidents, selectedIncident, autoZoomOnNewIncident, map]);

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
  filters = {},
  externalIncidents = null,
  selectedIncidentId: externalSelectedId = null,
  onSelect: externalOnSelect = null
}) {
  const [internalIncidents, setInternalIncidents] = useState([]);
  const [boundaries, setBoundaries] = useState([]);
  const [units, setUnits] = useState([]);
  const [mode, setMode] = useState('markers'); // 'markers' | 'heatmap' | 'lgu_zones'
  const [internalSelectedId, setInternalSelectedId] = useState(externalSelectedId);

  // Synchronously compute active incidents & selected ID to avoid React state sync lag
  const incidents = externalIncidents && Array.isArray(externalIncidents) ? externalIncidents : internalIncidents;
  const selectedIncidentId = externalSelectedId !== undefined && externalSelectedId !== null ? externalSelectedId : internalSelectedId;

  useEffect(() => {
    if (externalSelectedId !== undefined) {
      setInternalSelectedId(externalSelectedId);
    }
  }, [externalSelectedId]);

  // Sync external incidents
  useEffect(() => {
    if (externalIncidents && Array.isArray(externalIncidents)) {
      setInternalIncidents(externalIncidents);
    }
  }, [externalIncidents]);

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
    if (!externalIncidents) {
      // Fetch initial active incidents with full data
      const params = {
        limit: 100,
        include: 'evidence,reporter,type,barangay'
      };

      if (filters.status) params.status = filters.status;
      if (filters.type_id) params.type_id = filters.type_id;
      if (filters.from_date) params.from_date = filters.from_date;
      if (filters.to_date) params.to_date = filters.to_date;

      incidentAPI.getAll(params).then(async (res) => {
        const activeIncidents = res.data?.data || [];
        setInternalIncidents(activeIncidents);
      }).catch(err => console.error("Map fetch error:", err));
    }

    // Fetch active response unit positions
    api.get('/response-units/positions/active')
      .then(res => {
        if (res.data && Array.isArray(res.data)) {
          setUnits(res.data.filter(unit => unit.latitude && unit.longitude));
        }
      })
      .catch(err => console.error("Unit position fetch error:", err));

    // Socket.io Subscriptions (Only handle incident sockets if externalIncidents is NOT provided)
    let unsub1 = () => {}, unsub2 = () => {}, unsub3 = () => {}, unsub4 = () => {}, unsub5 = () => {};

    if (!externalIncidents) {
      unsub1 = on('new_incident', (data) => {
        const incident = data?.incident || data;
        if (incident?.latitude && incident?.longitude) {
          setInternalIncidents(prev => [incident, ...prev.filter(i => i.incident_id !== incident.incident_id)]);
          setInternalSelectedId(incident.incident_id);
        }
      });

      unsub3 = on('incident_awaiting_verification', (data) => {
        const incident = data?.incident || data;
        if (incident?.latitude && incident?.longitude) {
          setInternalIncidents(prev => [incident, ...prev.filter(i => i.incident_id !== incident.incident_id)]);
          setInternalSelectedId(incident.incident_id);
        }
      });

      unsub2 = on('incident_status_updated', (updatedData) => {
        const targetId = updatedData.incident_id || updatedData.incident?.incident_id;
        setInternalIncidents(prev => {
          if (['RESOLVED', 'CLOSED', 'FALSE_ALARM'].includes(updatedData.status)) {
            return prev.filter(inc => inc.incident_id !== targetId);
          }
          const fullIncident = updatedData.incident || {};
          return prev.map(inc =>
            inc.incident_id === targetId
              ? { ...inc, ...fullIncident, status: updatedData.status || inc.status }
              : inc
          );
        });
      });

      unsub4 = on('incident_deleted', (data) => {
        setInternalIncidents(prev => prev.filter(inc => inc.incident_id !== data.incident_id));
        setInternalSelectedId(prev => prev === data.incident_id ? null : prev);
      });

      unsub5 = on('incident_verified', (data) => {
        const inc = data?.incident || data;
        if (inc?.latitude && inc?.longitude) {
          setInternalIncidents(prev => {
            const existing = prev.find(i => i.incident_id === inc.incident_id);
            if (existing) {
              return prev.map(item => item.incident_id === inc.incident_id ? { ...item, ...inc } : item);
            }
            return [inc, ...prev];
          });
        }
      });
    }

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
  }, [on, externalIncidents]);

  // Refetch incidents when filters change
  useEffect(() => {
    const params = {
      limit: 100,
      include: 'evidence,reporter,type,barangay'
    };

    // Add filters to params if they exist
    if (filters.status) params.status = filters.status;
    if (filters.type_id) params.type_id = filters.type_id;
    if (filters.district) params.district = filters.district;
    if (filters.city) params.city = filters.city;
    if (filters.barangay_id) params.barangay_id = filters.barangay_id;
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;

    incidentAPI.getAll(params).then(async (res) => {
      const activeIncidents = res.data?.data || [];
      setIncidents(activeIncidents);


    }).catch(err => console.error("Map filter fetch error:", err));
  }, [filters]);



  // Determine the selected incident object (or fallback to latest for proximity calculation)
  const selectedIncident = selectedIncidentId
    ? incidents.find(i => String(i.incident_id || i.id) === String(selectedIncidentId))
    : null;
  const incidentCity = getIncidentCity(selectedIncident || incidents[0]);

  // Handler for when a marker is clicked — update the LGU zones focus
  const handleMarkerSelect = useCallback((incidentId) => {
    setSelectedIncidentId(incidentId);
    if (externalOnSelect) {
      externalOnSelect(incidentId);
    }
  }, [externalOnSelect]);

  // Wrapper to immediately update local map state when an incident is verified/rejected
  const handleVerifyWrapper = async (incidentId, action, message) => {
    try {
      if (onVerify) {
        await onVerify(incidentId, action, message);
      }
      setIncidents(prev => {
        if (action === 'REJECT') {
          return prev.filter(inc => inc.incident_id !== incidentId);
        }
        return prev.map(inc =>
          inc.incident_id === incidentId
            ? { ...inc, status: action === 'APPROVE' ? 'RESPONDING' : inc.status }
            : inc
        );
      });
    } catch (err) {
      console.error('Verify error in map:', err);
      throw err;
    }
  };

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
        center={center}
        zoom={zoom}
        bounds={NIR_BOUNDS}
        minZoom={5}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <BoundaryLayer boundaries={boundaries} />
        <MapNavigationController
          incidents={incidents}
          selectedIncident={selectedIncident}
          autoZoomOnNewIncident={autoZoomOnNewIncident}
        />

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
            onVerify={handleVerifyWrapper}
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
