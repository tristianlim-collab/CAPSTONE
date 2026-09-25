import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import moment from 'moment';
import { Image, ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader2, Car, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getProvinceForNirLguName, getNearestCity, getProximityLevel } from '../../config/nirLgus';
import api from '../../api';

const getColor = (status, severity) => {
  if (status === 'RESOLVED' || status === 'CLOSED') return 'grey';
  if (severity === 'CRITICAL') return 'red';
  if (severity === 'HIGH') return 'orange';
  if (severity === 'MEDIUM') return 'gold';
  return 'green';
};

const normalize = (value) => (value || '').toString().trim().toLowerCase();

const getLguName = (objWithBarangay) => {
  const city = objWithBarangay?.barangay?.city;
  const municipality = objWithBarangay?.barangay?.municipality;
  return (city || municipality || '').toString().trim();
};

const getLguIndicator = (incident, user, focusedIncidentCity) => {
  let incidentLguName = getLguName(incident);
  
  if (!incidentLguName && incident.latitude && incident.longitude) {
    const nearest = getNearestCity(Number(incident.latitude), Number(incident.longitude));
    if (nearest) incidentLguName = nearest.name;
  }

  const incidentLgu = normalize(incidentLguName);

  if (!incidentLgu) {
    return { color: 'orange', label: 'Unknown LGU', lguName: '' };
  }

  // If focusedIncidentCity is provided (Admin Map mode), compare against that
  if (focusedIncidentCity) {
    const level = getProximityLevel(focusedIncidentCity, incidentLguName);
    if (level === 'incident') return { color: 'red', label: 'Incident City', lguName: incidentLguName };
    if (level === 'nearby') return { color: 'blue', label: 'Nearby City', lguName: incidentLguName };
    return { color: 'green', label: 'Far City', lguName: incidentLguName };
  }

  // Otherwise fallback to user comparison (Reporter/Response App mode)
  const userLguName = getLguName(user);
  const userLgu = normalize(userLguName);

  if (userLgu && incidentLgu && userLgu === incidentLgu) {
    return { color: 'red', label: 'Own LGU', lguName: incidentLguName };
  }

  const userProvince = getProvinceForNirLguName(userLguName);
  const incidentProvince = getProvinceForNirLguName(incidentLguName);

  if (userProvince && incidentProvince && userProvince === incidentProvince) {
    return { color: 'blue', label: 'Neighbor LGU', lguName: incidentLguName };
  }

  return { color: 'green', label: 'Far LGU', lguName: incidentLguName };
};

const createColoredIcon = (color, isNew) => {
  const markerHtml = `
    <div class="marker-container ${isNew ? 'marker-pulse' : ''}">
      <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png" 
           style="width: 25px; height: 41px;" />
    </div>
    <style>
      @keyframes marker-pulse {
        0% { transform: scale(1); filter: drop-shadow(0 0 0px ${color}); }
        50% { transform: scale(1.2); filter: drop-shadow(0 0 15px ${color}); }
        100% { transform: scale(1); filter: drop-shadow(0 0 0px ${color}); }
      }
      .marker-pulse {
        animation: marker-pulse 1.2s infinite ease-in-out;
      }
    </style>
  `;

  return L.divIcon({
    className: 'custom-incident-marker',
    html: markerHtml,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

// Image Gallery Component for Photos
const EvidenceGallery = ({ evidence, onExpand }) => {
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
    <div className="mt-1.5 border-t border-gray-100 pt-1">
      <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium mb-1">
        <Image className="w-3 h-3 flex-shrink-0" />
        <span>Photos ({evidence.length})</span>
      </div>
      {isImage && (
        <div 
          className="relative w-full rounded overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => onExpand(currentEvidence.file_path)}
        >
          <img
            src={currentEvidence.file_path}
            alt="Evidence"
            className="w-full h-[90px] object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/90?text=Photo+Unavailable';
            }}
          />
          {evidence.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-between px-1 opacity-0 hover:opacity-100 transition-opacity bg-black/20">
              <button
                onClick={goToPrevious}
                className="p-0.5 bg-white/80 hover:bg-white rounded-full transition"
              >
                <ChevronLeft className="w-2.5 h-2.5 text-gray-800" />
              </button>
              <button
                onClick={goToNext}
                className="p-0.5 bg-white/80 hover:bg-white rounded-full transition"
              >
                <ChevronRight className="w-2.5 h-2.5 text-gray-800" />
              </button>
            </div>
          )}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/50 text-white px-1.5 py-0.2 rounded text-[9px] text-center min-w-[24px]">
            {currentIndex + 1} / {evidence.length}
          </div>
        </div>
      )}
    </div>
  );
};

const QuickVerifyActions = ({ incident, onVerify, onClosePopup }) => {
  const [submitting, setSubmitting] = useState(false);
  const [verifiedAction, setVerifiedAction] = useState(null);

  if (!onVerify || incident.status !== 'REPORTED' || verifiedAction) return null;

  const handleApprove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setVerifiedAction('APPROVED');
    if (onClosePopup) onClosePopup();
    onVerify(incident.incident_id, 'APPROVE').catch(() => {
      setVerifiedAction(null);
    });
  };

  const handleReject = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setVerifiedAction('REJECTED');
    if (onClosePopup) onClosePopup();
    onVerify(incident.incident_id, 'REJECT').catch(() => {
      setVerifiedAction(null);
    });
  };

  const targetUnitName = incident.assignments?.[0]?.unit?.unit_name;

  return (
    <div className="mt-2 pt-2 border-t border-slate-100">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
          Awaiting Verification
        </p>
        {targetUnitName && (
          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[120px]">
            🎯 {targetUnitName}
          </span>
        )}
      </div>

      <div className="flex gap-1.5">
        <button
          onClick={handleApprove}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-600 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <CheckCircle className="w-3 h-3" />
          Approve & Dispatch
        </button>
        <button
          onClick={handleReject}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-rose-500 text-white text-[11px] font-bold rounded-lg hover:bg-rose-600 transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <XCircle className="w-3 h-3" />
          Reject
        </button>
      </div>
    </div>
  );
};

export default function IncidentMarker({ incident, colorMode = 'severity', onVerify, onSelect, isSelected, focusedIncidentCity }) {
  const { user } = useAuth();
  const markerRef = React.useRef(null);
  const [fullscreenPhoto, setFullscreenPhoto] = useState(null);
  
  const lguIndicator = getLguIndicator(incident, user, focusedIncidentCity);
  const color = getColor(incident.status, incident.severity);
  
  const isNew = incident.status === 'REPORTED';
  const icon = createColoredIcon(color, isNew);

  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isSelected]);

  const handleClick = () => {
    if (onSelect) {
      onSelect(incident.incident_id);
    }
  };

  const handleClosePopup = () => {
    if (markerRef.current) {
      markerRef.current.closePopup();
    }
  };

  return (
    <>
      <Marker 
        ref={markerRef}
        position={[incident.latitude, incident.longitude]} 
        icon={icon} 
        eventHandlers={{ click: handleClick }}
      >
        <Popup className="min-w-[220px] max-w-[270px]">
          <div className="font-sans text-xs pr-0.5 pb-0.5 max-h-[360px] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-1.5 mb-1.5">
              <strong className="text-sm font-bold truncate pr-1">{incident.incident_code || `INC-${incident.incident_id?.slice(0, 5) || 'UNKNOWN'}`}</strong>
              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${color === 'red' ? 'bg-red-100 text-red-800' : color === 'orange' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
                {incident.status}
              </span>
            </div>

            <p className="text-[11px] mb-0.5 leading-snug"><strong>Severity:</strong> {incident.severity}</p>

            {/* Location/Barangay Display */}
            {incident.barangay ? (
              <p className="text-[11px] mb-0.5 leading-snug"><strong>Location:</strong> Brgy. {incident.barangay.name || 'Unknown'}, {incident.barangay.city || incident.barangay.municipality || 'Unknown'}</p>
            ) : incident.map_pin_address ? (
              <p className="text-[11px] mb-0.5 leading-snug truncate"><strong>Location:</strong> {incident.map_pin_address}</p>
            ) : (
              <p className="text-[11px] mb-0.5 text-gray-400"><strong>Location:</strong> {Number(incident.latitude).toFixed(4)}°N, {Number(incident.longitude).toFixed(4)}°E</p>
            )}

            {incident.landmark && (
              <p className="text-[11px] mb-0.5 leading-snug"><strong>Landmark:</strong> {incident.landmark}</p>
            )}

            <p className="text-[11px] mb-0.5 leading-snug"><strong>Type:</strong> {incident.incident_type?.name || 'Emergency'}</p>
            <p className="text-[11px] mb-1 text-gray-600 line-clamp-2 leading-tight">{incident.description}</p>

            {/* Reporter Personal Info */}
            {(incident.reporter_name || incident.reporter_phone || incident.reporter || incident.reported_by) && (
              <div className="mt-1.5 pt-1.5 border-t border-gray-100 text-[11px]">
                <p className="font-semibold text-gray-700 text-[10px] uppercase mb-0.5">Reporter Info</p>
                <p className="text-gray-600 leading-tight">
                  <strong>Name:</strong> {incident.reporter_name || incident.reporter?.name || 'Not provided'}
                </p>
                <p className="text-gray-600 leading-tight">
                  <strong>Phone:</strong> {incident.reporter_phone ? `${incident.reporter_phone}` : incident.reporter?.contact_number || 'Not provided'}
                </p>
              </div>
            )}

            {/* Evidence Gallery */}
            {incident.evidence && incident.evidence.length > 0 ? (
              <EvidenceGallery evidence={incident.evidence} onExpand={(url) => setFullscreenPhoto(url)} />
            ) : (
              <div className="mt-1.5 pt-1.5 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 italic">📸 No photos attached</p>
              </div>
            )}

            <div className="text-[10px] text-gray-400 mt-1">
              Reported: {moment(incident.reported_at).format('MMM D, h:mm A')}
            </div>
            <QuickVerifyActions incident={incident} onVerify={onVerify} onClosePopup={handleClosePopup} />
          </div>
        </Popup>
      </Marker>

      {/* Fullscreen Photo Modal via Portal */}
      {fullscreenPhoto && createPortal(
        <div 
          className="fixed inset-0 bg-slate-950/98 backdrop-blur-md flex items-center justify-center z-[9999] p-4 sm:p-8 animate-in fade-in duration-300"
          onClick={() => setFullscreenPhoto(null)}
        >
          <div className="relative max-w-5xl w-full h-full flex items-center justify-center">
            <img 
              src={fullscreenPhoto} 
              alt="Evidence Full" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-500 scale-in-95"
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              onClick={() => setFullscreenPhoto(null)}
              className="absolute top-0 right-0 sm:-top-12 sm:right-0 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition-all active:scale-90 border border-white/20"
              title="Close Preview"
            >
              <X size={28} />
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
