import React, { useMemo } from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';
import { getAllNirCities, getProximityLevel } from '../../config/nirLgus';

/**
 * Proximity color config
 */
const PROXIMITY_CONFIG = {
  nearby: {
    color: '#1D4ED8',      // darker blue outline
    fillColor: '#3B82F6',  // blue fill
    fillOpacity: 0.8,
    weight: 2,
    radius: 10,            // Increased size to be a 'little big'
  },
  far: {
    color: '#15803D',      // darker green outline
    fillColor: '#22C55E',  // green fill
    fillOpacity: 0.8,
    weight: 2,
    radius: 10,            // Increased size to be a 'little big'
  },
};

/**
 * LguProximityLayer
 *
 * Renders colored circle overlays on each city/municipality in the
 * Negros Island Region based on proximity to the selected incident.
 *
 * - Incident city gets NO circle (just the marker)
 * - Blue dot → nearby cities (direct neighbors)
 * - Green dot → far cities (others)
 *
 * @param {{ incidentCity: string|null }} props
 */
export default function LguProximityLayer({ incidentCity }) {
  const cities = useMemo(() => getAllNirCities(), []);

  const cityOverlays = useMemo(() => {
    if (!incidentCity) return [];

    return cities.map(city => {
      const level = getProximityLevel(incidentCity, city.name);
      const config = PROXIMITY_CONFIG[level];
      // Only return if it has a valid config (incident will be undefined/skipped)
      if (!config) return null;
      return { ...city, level, config };
    }).filter(Boolean);
  }, [incidentCity, cities]);

  if (!incidentCity || cityOverlays.length === 0) return null;

  return (
    <>
      {/* Render far cities first, then nearby */}
      {['far', 'nearby'].map(level =>
        cityOverlays
          .filter(c => c.level === level)
          .map(city => (
            <CircleMarker
              key={`proximity-${city.name}`}
              center={[city.lat, city.lng]}
              radius={city.config.radius}
              pathOptions={{
                color: city.config.color,
                fillColor: city.config.fillColor,
                fillOpacity: city.config.fillOpacity,
                weight: city.config.weight,
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -10]}
                className="!bg-white/95 !border !border-slate-200 !shadow-sm !px-2 !py-1 !rounded-lg"
              >
                <div className={`font-bold ${city.level === 'nearby' ? 'text-blue-700' : 'text-green-700'
                  } text-xs`}>
                  {city.name} {city.level === 'nearby' ? '(Neighbor)' : ''}
                </div>
              </Tooltip>
            </CircleMarker>
          ))
      )}
    </>
  );
}
