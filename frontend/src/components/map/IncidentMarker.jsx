import React from 'react';
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
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
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
            <strong className="text-lg">{`INC-${incident.incident_id?.slice(0, 5) || 'UNKNOWN'}`}</strong>
            <span className={`px-2 py-1 text-xs font-bold rounded-full ${color === 'red' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
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
