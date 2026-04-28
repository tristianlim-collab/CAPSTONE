import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { incidentAPI } from '../../api';
import { useSocketContext } from '../../context/SocketContext';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { Clock, AlertTriangle, Map as MapIcon, Loader2, MapPin, User, Image, ChevronLeft, ChevronRight, X } from 'lucide-react';

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

// Green icon for response units
const UNIT_ICON = createColoredIcon('#22c55e'); // green

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

const ResponseMap = () => {
  const [incidents, setIncidents] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullscreenPhoto, setFullscreenPhoto] = useState(null);
  const { on, connected } = useSocketContext();

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

    // Also listen for incidents awaiting verification (new reports)
    const unsub1b = on('incident_awaiting_verification', (data) => {
      if (data.incident?.latitude && data.incident?.longitude) {
        setIncidents(prev => {
          if (prev.find(i => i.incident_id === data.incident.incident_id)) return prev;
          return [data.incident, ...prev];
        });
      }
    });

    const unsub2 = on('incident_status_updated', (data) => {
      // Re-fetch the incident to ensure we have all data
      incidentAPI.getById(data.incident_id, {
        include: 'evidence,reporter,type,barangay'
      }).then(res => {
        setIncidents(prev => {
          return prev
            .map(inc => inc.incident_id === data.incident_id ? res.data : inc)
            .filter(inc => ['REPORTED', 'VERIFIED', 'RESPONDING'].includes(inc.status));
        });
      }).catch(err => {
        // Fallback to local update
        setIncidents(prev => {
          return prev
            .map(inc => inc.incident_id === data.incident_id
              ? { ...inc, status: data.status, ...(data.incident || {}) }
              : inc
            )
            .filter(inc => ['REPORTED', 'VERIFIED', 'RESPONDING'].includes(inc.status));
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

    return () => { unsub1(); unsub1b(); unsub2(); unsub3(); unsub4(); unsub5(); };
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

  const fetchActiveUnits = async () => {
    try {
      const res = await incidentAPI.request.get('/response-units/positions/active');
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
              minZoom={5}
              style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <AutoZoomToLatestIncident incidents={incidents} enabled={true} />
            
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
                icon={UNIT_ICON}
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
