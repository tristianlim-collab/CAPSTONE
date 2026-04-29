import React, { useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import moment from 'moment';
import { Image, ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getProvinceForNirLguName, getNearestCity, getProximityLevel } from '../../config/nirLgus';

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

const createColoredIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

// Image Gallery Component for Photos
const EvidenceGallery = ({ evidence }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!evidence || evidence.length === 0) {
    return null;
  }

  const goToPrevious = (e) => {
    e.preventDefault();
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? evidence.length - 1 : prevIndex - 1));
  };

  const goToNext = (e) => {
    e.preventDefault();
    setCurrentIndex((prevIndex) => (prevIndex === evidence.length - 1 ? 0 : prevIndex + 1));
  };

  const currentEvidence = evidence[currentIndex];
  const isImage = currentEvidence.file_type.startsWith('image/');

  return (
    <div className="mt-3 border-t pt-2">
      <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium mb-2">
        <Image className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Evidence Photos ({evidence.length})</span>
      </div>
      {isImage && (
        <div className="relative w-full rounded overflow-hidden bg-gray-100">
          <img
            src={currentEvidence.file_path}
            alt="Evidence"
            className="w-full h-[150px] object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/150?text=Photo+Unavailable';
            }}
          />
          {evidence.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 hover:opacity-100 transition-opacity bg-black/20">
              <button
                onClick={goToPrevious}
                className="p-1 bg-white/80 hover:bg-white rounded-full transition"
              >
                <ChevronLeft className="w-3 h-3 text-gray-800" />
              </button>
              <button
                onClick={goToNext}
                className="p-1 bg-white/80 hover:bg-white rounded-full transition"
              >
                <ChevronRight className="w-3 h-3 text-gray-800" />
              </button>
            </div>
          )}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-0.5 rounded text-xs">
            {currentIndex + 1} / {evidence.length}
          </div>
        </div>
      )}
    </div>
  );
};

// Quick Verify Buttons for REPORTED incidents (shown inside map popup)
const QuickVerifyActions = ({ incident, onVerify }) => {
  const [submitting, setSubmitting] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (!onVerify || incident.status !== 'REPORTED') return null;

  const handleApprove = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSubmitting(true);
    try {
      await onVerify(incident.incident_id, 'APPROVE');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    setSubmitting(true);
    try {
      await onVerify(incident.incident_id, 'REJECT', rejectReason);
    } finally {
      setSubmitting(false);
      setShowRejectInput(false);
      setRejectReason('');
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">⚠ Awaiting Verification</p>
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={submitting}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 text-white text-xs font-bold rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
          Approve & Dispatch
        </button>
        <button
          onClick={handleReject}
          disabled={submitting}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-600 text-white text-xs font-bold rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
          Reject
        </button>
      </div>
      {showRejectInput && (
        <div className="mt-2">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (optional)..."
            rows="2"
            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs resize-none focus:outline-none focus:ring-1 focus:ring-red-400"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex gap-2 mt-1">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowRejectInput(false); }}
              className="flex-1 px-2 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={submitting}
              className="flex-1 px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Confirm Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function IncidentMarker({ incident, colorMode = 'severity', onVerify, onSelect, isSelected, focusedIncidentCity }) {
  const { user } = useAuth();
  const lguIndicator = getLguIndicator(incident, user, focusedIncidentCity);
  const color =
    colorMode === 'lgu'
      ? lguIndicator.color
      : getColor(incident.status, incident.severity);
  const icon = createColoredIcon(color);

  const handleClick = () => {
    if (onSelect) {
      onSelect(incident.incident_id);
    }
  };

  return (
    <Marker position={[incident.latitude, incident.longitude]} icon={icon} eventHandlers={{ click: handleClick }}>
      <Popup className="min-w-[280px] max-w-[350px]">
        <div className="font-sans pr-1 pb-1">
          <div className="flex items-center justify-between border-b pb-2 mb-2">
            <strong className="text-lg">{incident.incident_code || `INC-${incident.incident_id?.slice(0, 5) || 'UNKNOWN'}`}</strong>
            <span className={`px-2 py-1 text-xs font-bold rounded-full ${color === 'red' ? 'bg-red-100 text-red-800' : color === 'orange' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
              {incident.status}
            </span>
          </div>

          <p className="text-sm mb-1"><strong>Severity:</strong> {incident.severity}</p>

          {/* Location/Barangay Display */}
          {incident.barangay ? (
            <p className="text-sm mb-1"><strong>Location:</strong> Barangay {incident.barangay.name || 'Unknown'}, {incident.barangay.city || incident.barangay.municipality || 'Unknown'}</p>
          ) : incident.map_pin_address ? (
            <p className="text-sm mb-1"><strong>Location:</strong> {incident.map_pin_address}</p>
          ) : (
            <p className="text-sm mb-1 text-gray-400"><strong>Location:</strong> {Number(incident.latitude).toFixed(4)}°N, {Number(incident.longitude).toFixed(4)}°E</p>
          )}

          <p className="text-sm mb-1"><strong>Type:</strong> {incident.incident_type?.name || 'Emergency'}</p>
          <p className="text-sm mb-2 text-gray-600 line-clamp-2">{incident.description}</p>

          {/* Reporter Personal Info - Priority: form fields > auth user fields */}
          {(incident.reporter_name || incident.reporter_phone || incident.reporter || incident.reported_by) && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-1">Reporter Info:</p>
              <p className="text-xs text-gray-600">
                <strong>Name:</strong> {incident.reporter_name || incident.reporter?.name || 'Not provided'}
              </p>
              <p className="text-xs text-gray-600">
                <strong>Phone:</strong> {incident.reporter_phone ? `${incident.reporter_phone}` : incident.reporter?.contact_number || 'Not provided'}
              </p>
              <p className="text-xs text-gray-600">
                <strong>Email:</strong> {incident.reporter?.email || 'Not provided'}
              </p>
            </div>
          )}

          {/* Evidence Gallery - PROMINENT DISPLAY */}
          {incident.evidence && incident.evidence.length > 0 ? (
            <EvidenceGallery evidence={incident.evidence} />
          ) : (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-400 italic">📸 No photos attached</p>
            </div>
          )}

          <div className="text-xs text-gray-400 mt-2">
            Reported: {moment(incident.reported_at).format('MMM D, YYYY h:mm A')}
          </div>
          <QuickVerifyActions incident={incident} onVerify={onVerify} />
        </div>
      </Popup>
    </Marker>
  );
}
