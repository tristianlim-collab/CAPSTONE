import React, { useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import moment from 'moment';
import { Image, ChevronLeft, ChevronRight } from 'lucide-react';

const getColor = (status, severity) => {
  if (status === 'RESOLVED' || status === 'CLOSED') return 'grey';
  if (severity === 'CRITICAL') return 'red';
  if (severity === 'HIGH') return 'orange';
  if (severity === 'MEDIUM') return 'gold';
  return 'green';
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

export default function IncidentMarker({ incident }) {
  const color = getColor(incident.status, incident.severity);
  const icon = createColoredIcon(color);

  return (
    <Marker position={[incident.latitude, incident.longitude]} icon={icon}>
      <Popup className="min-w-[250px] max-w-[320px]">
        <div className="font-sans">
          <div className="flex items-center justify-between border-b pb-2 mb-2">
            <strong className="text-lg">{`INC-${incident.incident_id?.slice(0, 5) || 'UNKNOWN'}`}</strong>
            <span className={`px-2 py-1 text-xs font-bold rounded-full ${color === 'red' ? 'bg-red-100 text-red-800' : color === 'orange' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
              {incident.status}
            </span>
          </div>
          <p className="text-sm mb-1"><strong>Severity:</strong> {incident.severity}</p>
          <p className="text-sm mb-1"><strong>Type:</strong> {incident.incident_type?.name || 'Emergency'}</p>
          <p className="text-sm mb-2 text-gray-600 line-clamp-2">{incident.description}</p>
          <div className="text-xs text-gray-400 mt-2">
            Reported: {moment(incident.reported_at).format('MMM D, YYYY h:mm A')}
          </div>
          <EvidenceGallery evidence={incident.evidence} />
        </div>
      </Popup>
    </Marker>
  );
}
