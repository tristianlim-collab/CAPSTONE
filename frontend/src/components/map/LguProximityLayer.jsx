import React, { useMemo } from 'react';
import { Circle, Tooltip } from 'react-leaflet';
import { getAllNirCities, getProximityLevel } from '../../config/nirLgus';

/**
 * Proximity color config
 */
const PROXIMITY_CONFIG = {
  incident: {
    color: '#EF4444',      // red-500
    fillColor: '#EF4444',
    fillOpacity: 0.25,
    weight: 2,
    dashArray: null,
    label: 'INCIDENT ZONE',
    radius: 5000,          // 5km radius for incident city
  },
  nearby: {
    color: '#3B82F6',      // blue-500
    fillColor: '#3B82F6',
    fillOpacity: 0.12,
    weight: 1.5,
    dashArray: '6 4',
    label: 'NEARBY',
    radius: 4000,          // 4km radius for nearby cities
  },
  far: {
    color: '#22C55E',      // green-500
    fillColor: '#22C55E',
    fillOpacity: 0.07,
    weight: 1,
    dashArray: '4 6',
    label: 'FAR',
    radius: 3500,          // 3.5km radius for far cities
  },
};

/**
 * LguProximityLayer
 *
 * Renders colored circle overlays on each city/municipality in the
 * Negros Island Region based on proximity to the selected incident.
 *
 * - Red circle  → city where the incident happened
 * - Blue circle → nearby cities (same province)
 * - Green circle → far cities (different province)
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
      return { ...city, level, config };
    });
  }, [incidentCity, cities]);

  if (!incidentCity || cityOverlays.length === 0) return null;

  return (
    <>
      {/* Render far cities first, then nearby, then incident — so incident is on top */}
      {['far', 'nearby', 'incident'].map(level =>
        cityOverlays
          .filter(c => c.level === level)
          .map(city => (
            <Circle
              key={`proximity-${city.name}`}
              center={[city.lat, city.lng]}
              radius={city.config.radius}
              pathOptions={{
                color: city.config.color,
                fillColor: city.config.fillColor,
                fillOpacity: city.config.fillOpacity,
                weight: city.config.weight,
                dashArray: city.config.dashArray,
              }}
            >
              <Tooltip
                direction="center"
                permanent={city.level === 'incident'}
                className={`
                  !bg-transparent !border-0 !shadow-none !p-0
                  ${city.level === 'incident' ? '!font-bold !text-red-700 !text-xs' : '!text-[10px] !text-slate-600'}
                `}
              >
                <div className="text-center">
                  <div className={`font-bold ${
                    city.level === 'incident' ? 'text-red-700 text-xs' :
                    city.level === 'nearby' ? 'text-blue-700 text-[10px]' :
                    'text-green-700 text-[10px]'
                  }`}>
                    {city.name}
                  </div>
                  {city.level === 'incident' && (
                    <div className="text-[9px] text-red-500 font-semibold tracking-wider uppercase mt-0.5 animate-pulse">
                      ⚠ INCIDENT ZONE
                    </div>
                  )}
                </div>
              </Tooltip>
            </Circle>
          ))
      )}
    </>
  );
}
