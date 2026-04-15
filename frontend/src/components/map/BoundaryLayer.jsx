import React from 'react';
import { GeoJSON } from 'react-leaflet';

export default function BoundaryLayer({ boundaries }) {
  if (!boundaries || boundaries.length === 0) return null;

  const style = {
    fillColor: '#3b82f6',
    weight: 2,
    opacity: 1,
    color: '#2563eb',
    dashArray: '3',
    fillOpacity: 0.1
  };

  const onEachFeature = (feature, layer) => {
    if (feature.properties && feature.properties.name) {
      layer.bindTooltip(feature.properties.name, {
        permanent: false,
        direction: 'center',
        className: 'bg-transparent border-0 shadow-none text-blue-800 font-bold text-shadow'
      });
    }
  };

  return (
    <>
      {boundaries.map((barangay) => (
        <GeoJSON 
          key={barangay.barangay_id} 
          data={barangay.boundary_geojson} 
          style={style} 
          onEachFeature={(feature, layer) => {
             // Inject barangay name into feature properties if not present
             if (!feature.properties) feature.properties = {};
             feature.properties.name = barangay.name;
             onEachFeature(feature, layer);
          }}
        />
      ))}
    </>
  );
}
