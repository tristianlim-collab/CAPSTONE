import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api, { incidentAPI } from '../../api';
import { useSocketContext } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { Clock, AlertTriangle, Map as MapIcon, Loader2, MapPin, User, Image, ChevronLeft, ChevronRight, X, Navigation } from 'lucide-react';

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

// Auto-zoom to latest incident when one arrives
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
      toast('🚨 New incident! Auto-zooming to location...', {
        icon: '📍',
        style: { fontWeight: 'bold', borderLeft: '4px solid #f97316' },
        duration: 4000
      });
    }
  }, [enabled, incidents, map]);

  return null;
}

// Helper: fetch route from OSRM
async function fetchRouteFromOSRM(fromLat, fromLng, toLat, toLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      // OSRM returns [lng, lat], we need [lat, lng] for Leaflet
      const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      const duration = data.routes[0].duration; // seconds
      const distance = data.routes[0].distance; // meters
      return { coords, duration, distance };
    }
  } catch (err) {
    console.error('OSRM route fetch error:', err);
  }
  return null;
}

// Component to fly map to show entire route
function FlyToRouteBounds({ routeCoords }) {
  const map = useMap();
  useEffect(() => {
    if (routeCoords && routeCoords.length > 1) {
      const bounds = L.latLngBounds(routeCoords);
      map.flyToBounds(bounds, { padding: [60, 60], duration: 1.0 });
    }
  }, [routeCoords, map]);
  return null;
}

const ResponseMap = () => {
  const [incidents, setIncidents] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullscreenPhoto, setFullscreenPhoto] = useState(null);
  const { user } = useAuth();
  const { on, connected } = useSocketContext();

  // Dispatch route state: { incident_id, coords, unit_name, duration, distance, unit_lat, unit_lng, incident_lat, incident_lng }
  const [activeRoute, setActiveRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Default center: Negros Island Region, Philippines
  const defaultCenter = [10.0000, 122.9000];

  useEffect(() => {
    fetchIncidents();
    fetchActiveUnits();
  }, []);

  // Listen for new incidents in real-time
  useEffect(() => {
    const unsub1 = on('new_incident', (incident) => {
      if (incident.latitude && incident.longitude) {
        // Fetch full incident data with reporter and evidence
        const fetchFullIncident = async () => {
          try {
            const res = await incidentAPI.getById(incident.incident_id, {
              include: 'evidence,reporter,type,barangay'
            });
            if (res.data) {
              setIncidents(prev => {
                if (prev.find(i => i.incident_id === res.data.incident_id)) return prev;
                return [res.data, ...prev];
              });
            }
          } catch (error) {
            console.error('Failed to fetch full incident data', error);
            // Fallback to socket data if it has complete information
            if (incident.reporter && incident.evidence !== undefined) {
              setIncidents(prev => {
                if (prev.find(i => i.incident_id === incident.incident_id)) return prev;
                return [incident, ...prev];
              });
            }
          }
        };
        fetchFullIncident();
      }
    });

    // (Removed incident_awaiting_verification listener: Response units shouldn't see unverified reports)

    const unsub2 = on('incident_status_updated', (data) => {
      // Re-fetch the incident to ensure we have all data
      incidentAPI.getById(data.incident_id, {
        include: 'evidence,reporter,type,barangay'
      }).then(res => {
        setIncidents(prev => {
          return prev
            .map(inc => inc.incident_id === data.incident_id ? res.data : inc)
            .filter(inc => ['VERIFIED', 'RESPONDING'].includes(inc.status));
        });
      }).catch(err => {
        // Fallback to local update
        setIncidents(prev => {
          return prev
            .map(inc => inc.incident_id === data.incident_id
              ? { ...inc, status: data.status, ...(data.incident || {}) }
              : inc
            )
            .filter(inc => ['VERIFIED', 'RESPONDING'].includes(inc.status));
        });
      });
    });

    const unsub3 = on('unit_location_updated', (data) => {
      setUnits(prev => {
        return prev.map(unit =>
          unit.unit_id === data.unitId
            ? { ...unit, latitude: data.lat, longitude: data.lng }
            : unit
        );
      });
    });

    const unsub4 = on('incident_deleted', (data) => {
      setIncidents(prev => prev.filter(inc => inc.incident_id !== data.incident_id));
    });

    // Listen for verified incidents (admin approved)
    const unsub5 = on('incident_verified', (data) => {
      if (data.incident?.latitude && data.incident?.longitude) {
        setIncidents(prev => {
          const existing = prev.find(i => i.incident_id === data.incident.incident_id);
          if (existing) {
            return prev.map(inc => inc.incident_id === data.incident.incident_id ? data.incident : inc);
          }
          return [data.incident, ...prev];
        });
      }
    });

    // Listen for dispatch with directions (auto-route)
    const unsub6 = on('unit_dispatch_with_directions', async (data) => {
      console.log('[ResponseMap] Received dispatch directions:', data);
      setRouteLoading(true);
      
      // Show toast notification
      toast(
        `🚨 Dispatched to ${data.incident_code}!\n${data.incident_type || 'Incident'} • ${data.severity || 'HIGH'} severity`,
        {
          icon: '🗺️',
          duration: 8000,
          style: {
            fontWeight: 'bold',
            borderLeft: '4px solid #3b82f6',
            background: '#eff6ff',
          },
        }
      );

      // Fetch route from OSRM
      const route = await fetchRouteFromOSRM(
        Number(data.unit_lat), Number(data.unit_lng),
        Number(data.incident_lat), Number(data.incident_lng)
      );

      const routeData = {
        incident_id: data.incident_id,
        incident_code: data.incident_code,
        unit_name: data.unit_name,
        unit_lat: Number(data.unit_lat),
        unit_lng: Number(data.unit_lng),
        incident_lat: Number(data.incident_lat),
        incident_lng: Number(data.incident_lng),
      };

      if (route) {
        setActiveRoute({ ...routeData, coords: route.coords, duration: route.duration, distance: route.distance });
      } else {
        // Fallback: draw a straight line
        setActiveRoute({
          ...routeData,
          coords: [
            [Number(data.unit_lat), Number(data.unit_lng)],
            [Number(data.incident_lat), Number(data.incident_lng)]
          ],
          duration: null,
          distance: null,
        });
      }
      setRouteLoading(false);
    });

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); };
  }, [on]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      // Fetch with evidence and reporter data included
      const res = await incidentAPI.getAll({
        limit: 100,
        include: 'evidence,reporter,type,barangay'
      });
      if (res.data?.data) {
        const relevantIncidents = res.data.data.filter(inc =>
          inc.latitude && inc.longitude &&
          ['VERIFIED', 'RESPONDING'].includes(inc.status)
        );
        setIncidents(relevantIncidents);

        // Auto-load route if already verified/responding
        const dispatchedIncident = relevantIncidents.find(inc =>
          ['VERIFIED', 'RESPONDING'].includes(inc.status)
        );
        if (dispatchedIncident && !activeRoute) {
          // Try to get unit coordinates from the assignment
          const assignedUnit = dispatchedIncident.assignments && dispatchedIncident.assignments.length > 0 ? dispatchedIncident.assignments[0]?.unit : null;
          let unitLat = assignedUnit?.latitude;
          let unitLng = assignedUnit?.longitude;

          // Fallback: use user object's unit coordinates, or fetch active positions
          if (!unitLat || !unitLng) {
             if (user?.unit?.latitude && user?.unit?.longitude) {
               unitLat = user.unit.latitude;
               unitLng = user.unit.longitude;
             } else {
               try {
                 const positionsRes = await api.get('/response-units/positions/active');
                 // Try to find the user's linked unit, otherwise just grab the first available unit on the map
                 const myUnit = positionsRes.data.find(u => u.unit_id === (assignedUnit?.unit_id || user?.unit_id)) || positionsRes.data[0];
                 if (myUnit) {
                   unitLat = Number(myUnit.latitude);
                   unitLng = Number(myUnit.longitude);
                 }
               } catch (e) {
                 console.error('Failed to fetch unit locations fallback', e);
               }
             }
          }

          if (unitLat && unitLng) {
            setRouteLoading(true);
            const route = await fetchRouteFromOSRM(
              unitLat, unitLng,
              Number(dispatchedIncident.latitude), Number(dispatchedIncident.longitude)
            );

            const routeData = {
              incident_id: dispatchedIncident.incident_id,
              incident_code: dispatchedIncident.incident_code,
              unit_name: assignedUnit?.unit_name || 'Response Unit',
              unit_lat: unitLat,
              unit_lng: unitLng,
              incident_lat: Number(dispatchedIncident.latitude),
              incident_lng: Number(dispatchedIncident.longitude),
            };

            if (route) {
              setActiveRoute({ ...routeData, coords: route.coords, duration: route.duration, distance: route.distance });
            } else {
              // Fallback: straight line
              setActiveRoute({ ...routeData, coords: [[unitLat, unitLng], [Number(dispatchedIncident.latitude), Number(dispatchedIncident.longitude)]], duration: null, distance: null });
            }
            setRouteLoading(false);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load incidents for map', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveUnits = async () => {
    try {
      const res = await api.get('/response-units/positions/active');
      if (res.data && Array.isArray(res.data)) {
        setUnits(res.data.filter(unit => unit.latitude && unit.longitude));
      }
    } catch (error) {
      console.error('Failed to load active units for map', error);
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

  // Map is freely draggable across the whole Philippines, centered on NIR

  // Image Gallery Component for Photos
  const EvidenceGallery = ({ evidence }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!evidence || evidence.length === 0) {
      return null;
    }

    const goToPrevious = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((prevIndex) => (prevIndex === 0 ? evidence.length - 1 : prevIndex - 1));
    };

    const goToNext = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((prevIndex) => (prevIndex === evidence.length - 1 ? 0 : prevIndex + 1));
    };

    const currentEvidence = evidence[currentIndex];
    const isImage = currentEvidence.file_type.startsWith('image/');

    return (
      <div className="mt-3 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mb-2">
          <Image className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
          <span>Evidence Photos ({evidence.length})</span>
        </div>
        {isImage && (
          <div
            className="relative w-full rounded-lg overflow-hidden bg-slate-100 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setFullscreenPhoto(currentEvidence.file_path)}
          >
            <img
              src={currentEvidence.file_path}
              alt="Evidence"
              className="w-full h-[200px] object-cover"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/200?text=Photo+Unavailable';
              }}
            />
            {evidence.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 hover:opacity-100 transition-opacity bg-black/20">
                <button
                  onClick={goToPrevious}
                  className="p-1.5 bg-white/80 hover:bg-white rounded-full transition"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-800" />
                </button>
                <button
                  onClick={goToNext}
                  className="p-1.5 bg-white/80 hover:bg-white rounded-full transition"
                >
                  <ChevronRight className="w-4 h-4 text-slate-800" />
                </button>
              </div>
            )}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-xs">
              {currentIndex + 1} / {evidence.length}
            </div>
          </div>
        )}
      </div>
    );
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
              Real-time tracking • {incidents.length} active incident{incidents.length !== 1 ? 's' : ''} • {units.length} unit{units.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex flex-wrap gap-4">

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
              minZoom={5}
              style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
            >
              <TileLayer
                attribution='&copy; Google Maps'
                url="http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}"
                maxZoom={20}
              />
              <AutoZoomToLatestIncident incidents={incidents} enabled={!activeRoute} />
              {activeRoute && <FlyToRouteBounds routeCoords={activeRoute.coords} />}

              {/* Dispatch Route Polyline */}
              {activeRoute && activeRoute.coords && (
                <Polyline
                  positions={activeRoute.coords}
                  pathOptions={{
                    color: '#3b82f6',
                    weight: 5,
                    opacity: 0.85,
                    dashArray: '12, 8',
                    lineCap: 'round',
                    lineJoin: 'round'
                  }}
                />
              )}
            
            {incidents.map((incident) => (
              <Marker
                key={incident.incident_id}
                position={[incident.latitude, incident.longitude]}
                icon={ICONS[incident.status] || ICONS.REPORTED}
              >
                <Popup className="incident-popup !p-0 overflow-hidden rounded-xl border-none shadow-lg">
                  <div className="p-4 min-w-[240px] max-w-[300px] bg-white max-h-[500px] overflow-y-auto">
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

                    {/* Evidence Gallery - Top Priority */}
                    <EvidenceGallery evidence={incident.evidence} />

                    <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-3">
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                        <span>{incident.severity || 'Normal'} Severity</span>
                      </div>
                      {incident.barangay && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span>{incident.barangay.barangay_name || 'Unknown Barangay'}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <User className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span>{incident.reporter?.name || 'Anonymous Reporter'}</span>
                      </div>
                      {incident.reporter?.contact_number && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <span>📞 {incident.reporter.contact_number}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span>{new Date(incident.reported_at).toLocaleString()}</span>
                      </div>
                      {incident.map_pin_address && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span className="truncate">
                            {incident.map_pin_address}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {units.map((unit) => (
              <Marker
                key={unit.unit_id}
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
              </Marker>
            ))}
          </MapContainer>
          </div>

           {/* Active Route Info Bar */}
           {activeRoute && (
             <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-blue-500 text-white p-4 z-[400] flex items-center justify-between shadow-lg">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                   <Navigation className="w-5 h-5 text-white" />
                 </div>
                 <div>
                   <p className="font-bold text-sm">Route to {activeRoute.incident_code}</p>
                   <p className="text-xs text-blue-100">
                     {activeRoute.unit_name}
                     {activeRoute.distance && ` • ${(activeRoute.distance / 1000).toFixed(1)} km`}
                     {activeRoute.duration && ` • ~${Math.ceil(activeRoute.duration / 60)} min`}
                   </p>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <a
                   href={`https://www.google.com/maps/dir/?api=1&origin=${activeRoute.unit_lat},${activeRoute.unit_lng}&destination=${activeRoute.incident_lat},${activeRoute.incident_lng}&travelmode=driving`}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="px-3 py-1.5 bg-white text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors"
                 >
                   Open Google Maps
                 </a>
                 <button
                   onClick={() => setActiveRoute(null)}
                   className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                 >
                   <X size={16} />
                 </button>
               </div>
             </div>
           )}
         </div>

        {/* Fullscreen Photo Modal */}
        {fullscreenPhoto && (
          <div
            onClick={() => setFullscreenPhoto(null)}
            className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img
                src={fullscreenPhoto}
                alt="Fullscreen evidence"
                className="w-full h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setFullscreenPhoto(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseMap;
