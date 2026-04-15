import { useEffect } from 'react';
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
